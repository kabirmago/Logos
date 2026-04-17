import React, { createContext, useContext, useState, useRef } from 'react';
import { DebateAnalysis, ArgumentNode, analyzeDebate } from '../services/geminiService';
import { useAuth } from './AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { usePostHog } from '@posthog/react';

// NOTE: All Gemini calls go through the backend /api/* routes.
// The API key is never exposed to the browser.

interface VoiceAnalysisResult {
  title: string;
  score: number;
  constructiveness: number;
  fallacies: string[];
  summary: string;
  speakers: { name: string; contribution: string; tone: string }[];
}

interface DiscourseContextType {
  // Text Analyzer State
  inputText: string;
  setInputText: (text: string) => void;
  isAnalyzing: boolean;
  analysis: DebateAnalysis | null;
  selectedNode: ArgumentNode | null;
  setSelectedNode: (node: ArgumentNode | null) => void;
  isPublishing: boolean;
  isPublished: boolean;
  handleAnalyze: () => Promise<void>;
  handlePublish: () => Promise<void>;
  clearAnalysis: () => void;

  // Voice Analyzer State
  isRecording: boolean;
  isVoiceAnalyzing: boolean;
  realtimeStatus: 'green' | 'yellow' | 'red' | null;
  realtimeReason: string;
  voiceResult: VoiceAnalysisResult | null;
  voiceError: string | null;
  recordingTime: number;
  stream: MediaStream | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  clearVoiceAnalysis: () => void;
}

const DiscourseContext = createContext<DiscourseContextType | undefined>(undefined);

export const DiscourseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const posthog = usePostHog();

  // Text Analyzer State
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<DebateAnalysis | null>(null);
  const [selectedNode, setSelectedNode] = useState<ArgumentNode | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPublished, setIsPublished] = useState(false);

  // Voice Analyzer State
  const [isRecording, setIsRecording] = useState(false);
  const [isVoiceAnalyzing, setIsVoiceAnalyzing] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState<'green' | 'yellow' | 'red' | null>(null);
  const [realtimeReason, setRealtimeReason] = useState('');
  const [voiceResult, setVoiceResult] = useState<VoiceAnalysisResult | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const realtimeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleAnalyze = async () => {
    if (!inputText.trim()) return;
    setIsAnalyzing(true);
    setIsPublished(false);
    posthog?.capture('debate_analysis_started', { text_length: inputText.length, is_logged_in: !!user });
    try {
      const distinctId = posthog?.get_distinct_id();
      const result = await analyzeDebate(inputText, distinctId);
      setAnalysis(result);
      setSelectedNode(null);
      posthog?.capture('debate_analysis_completed', {
        toxicity_score: result.overallScores.toxicity,
        constructiveness_score: result.overallScores.constructiveness,
        persuasiveness_score: result.overallScores.persuasiveness,
        node_count: result.nodes.length,
        trajectory_insight: result.trajectoryInsight,
      });

      // Automatically save to private recordings if logged in
      if (user) {
        await addDoc(collection(db, 'recordings'), {
          userId: user.id,
          title: result.summary.substring(0, 50) + '...',
          type: 'text',
          rawData: inputText,
          analysis: result,
          score: result.overallScores.persuasiveness,
          constructiveness: result.overallScores.constructiveness,
          timestamp: serverTimestamp()
        });
      }
    } catch (error) {
      posthog?.captureException(error);
      console.error('Analysis failed:', error);
      alert('Failed to analyze debate. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePublish = async () => {
    if (!analysis || !user) return;
    setIsPublishing(true);
    try {
      await addDoc(collection(db, 'leaderboard'), {
        userId: user.id,
        author: user.username,
        title: analysis.summary.substring(0, 50) + '...',
        score: analysis.overallScores.persuasiveness,
        constructiveness: analysis.overallScores.constructiveness,
        analysis: analysis,
        timestamp: serverTimestamp()
      });
      setIsPublished(true);
      posthog?.capture('debate_published_to_leaderboard', {
        persuasiveness_score: analysis.overallScores.persuasiveness,
        constructiveness_score: analysis.overallScores.constructiveness,
      });
    } catch (err) {
      posthog?.captureException(err);
      console.error('Failed to publish', err);
    } finally {
      setIsPublishing(false);
    }
  };

  const clearAnalysis = () => {
    setInputText('');
    setAnalysis(null);
    setSelectedNode(null);
    setIsPublished(false);
    setIsAnalyzing(false);
  };

  // Voice Logic
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const performRealtimeAnalysis = async (blob: Blob) => {
    try {
      const base64Audio = await blobToBase64(blob);
      const response = await fetch('/api/analyze-realtime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio: base64Audio, mimeType: 'audio/webm' }),
      });
      if (!response.ok) return;
      const data = await response.json();
      setRealtimeStatus(data.status);
      setRealtimeReason(data.reason);
    } catch (err) {
      console.error('Real-time analysis failed', err);
    }
  };

  const analyzeFullAudio = async (blob: Blob) => {
    setIsVoiceAnalyzing(true);
    try {
      const base64Media = await blobToBase64(blob);
      const mimeType = blob.type;
      const distinctId = posthog?.get_distinct_id();
      const voiceHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
      if (distinctId) voiceHeaders['X-POSTHOG-DISTINCT-ID'] = distinctId;

      const response = await fetch('/api/analyze-voice', {
        method: 'POST',
        headers: voiceHeaders,
        body: JSON.stringify({ audio: base64Media, mimeType }),
      });
      if (!response.ok) throw new Error('Voice analysis failed');
      const data = await response.json();

      setVoiceResult(data);
      posthog?.capture('voice_analysis_completed', {
        persuasiveness_score: data.score,
        constructiveness_score: data.constructiveness,
        speaker_count: data.speakers?.length ?? 0,
        fallacy_count: data.fallacies?.length ?? 0,
      });

      // Automatically save to private recordings if logged in
      if (user) {
        await addDoc(collection(db, 'recordings'), {
          userId: user.id,
          title: data.title,
          type: 'voice',
          rawData: `data:${mimeType};base64,${base64Media}`,
          analysis: data,
          score: data.score,
          constructiveness: data.constructiveness,
          timestamp: serverTimestamp()
        });
      }
    } catch (err) {
      posthog?.captureException(err);
      setVoiceError('Analysis failed. The media might be too short or unclear.');
      console.error(err);
    } finally {
      setIsVoiceAnalyzing(false);
    }
  };

  const startRecording = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setStream(mediaStream);
      const mediaRecorder = new MediaRecorder(mediaStream, { mimeType: 'audio/webm;codecs=opus' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const mediaBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        analyzeFullAudio(mediaBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setVoiceResult(null);
      setVoiceError(null);
      posthog?.capture('voice_recording_started');

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      realtimeTimerRef.current = setInterval(() => {
        if (audioChunksRef.current.length > 0) {
          const currentBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          performRealtimeAnalysis(currentBlob);
        }
      }, 10000);

    } catch (err) {
      setVoiceError('Media access denied or not available.');
      console.error(err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsRecording(false);
      posthog?.capture('voice_recording_stopped', { recording_duration_seconds: recordingTime });
      if (timerRef.current) clearInterval(timerRef.current);
      if (realtimeTimerRef.current) clearInterval(realtimeTimerRef.current);
    }
  };

  const clearVoiceAnalysis = () => {
    setVoiceResult(null);
    setVoiceError(null);
    setRecordingTime(0);
    setRealtimeStatus(null);
    setRealtimeReason('');
  };

  return (
    <DiscourseContext.Provider value={{
      inputText, setInputText, isAnalyzing, analysis, selectedNode, setSelectedNode, isPublishing, isPublished, handleAnalyze, handlePublish, clearAnalysis,
      isRecording, isVoiceAnalyzing, realtimeStatus, realtimeReason, voiceResult, voiceError, recordingTime, stream, startRecording, stopRecording, clearVoiceAnalysis
    }}>
      {children}
    </DiscourseContext.Provider>
  );
};

export const useDiscourse = () => {
  const context = useContext(DiscourseContext);
  if (context === undefined) {
    throw new Error('useDiscourse must be used within a DiscourseProvider');
  }
  return context;
};
