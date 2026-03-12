import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2, Info, BarChart3, User, MessageSquare, TrendingUp, ChevronRight, Globe, CheckCircle } from 'lucide-react';
import { ArgumentGraph } from './ArgumentGraph';
import { EscalationTrajectory } from './EscalationTrajectory';
import { DebateAnalysis, ArgumentNode } from '../services/geminiService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const RecordingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [recording, setRecording] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<ArgumentNode | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPublished, setIsPublished] = useState(false);

  useEffect(() => {
    fetchRecording();
  }, [id]);

  const fetchRecording = async () => {
    if (!id) return;
    try {
      const docRef = doc(db, 'recordings', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setRecording({ id: docSnap.id, ...docSnap.data() });
      } else {
        navigate('/profile');
      }
    } catch (err) {
      console.error('Failed to fetch recording', err);
      navigate('/profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!recording || !user) return;
    setIsPublishing(true);
    try {
      await addDoc(collection(db, 'leaderboard'), {
        userId: user.id,
        author: user.username,
        title: recording.title,
        score: recording.score,
        constructiveness: recording.constructiveness,
        analysis: recording.analysis,
        timestamp: serverTimestamp()
      });
      setIsPublished(true);
    } catch (err) {
      console.error('Publish failed', err);
    } finally {
      setIsPublishing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 50) return 'text-amber-600';
    return 'text-rose-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 animate-spin opacity-20" />
      </div>
    );
  }

  if (!recording) return null;

  const analysis: DebateAnalysis = recording.analysis;
  const isVoice = recording.type === 'voice';

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 text-[10px] font-mono uppercase opacity-50 hover:opacity-100 transition-opacity"
        >
          <ArrowLeft className="w-3 h-3" /> Back to Profile
        </button>
        <div className="flex items-center gap-4">
          {isPublished ? (
            <div className="flex items-center gap-2 text-emerald-600 font-mono text-[10px] uppercase">
              <CheckCircle className="w-4 h-4" /> Published to Leaderboard
            </div>
          ) : (
            <button
              onClick={handlePublish}
              disabled={isPublishing}
              className="flex items-center gap-2 bg-[#141414] text-white px-4 py-2 font-mono text-[10px] uppercase tracking-widest hover:bg-[#333] transition-colors disabled:opacity-50"
            >
              {isPublishing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Globe className="w-3 h-3" />}
              Publish to Leaderboard
            </button>
          )}
          <div className="text-right border-l border-black/10 pl-4">
            <p className="text-[10px] font-mono uppercase opacity-40">Private Recording</p>
            <p className="font-bold">{recording.title}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Raw Input & Summary */}
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-white border border-[#141414] p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
            <h2 className="font-serif italic text-lg mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> Raw Input
            </h2>
            {isVoice ? (
              <div className="space-y-4">
                <audio 
                  controls 
                  src={recording.rawData} 
                  className="w-full h-12"
                />
                <p className="text-[10px] font-mono uppercase opacity-50 text-center">Voice Recording</p>
              </div>
            ) : (
              <div className="max-h-[300px] overflow-y-auto p-4 bg-[#f5f5f5] border border-black/5 text-xs font-mono leading-relaxed whitespace-pre-wrap">
                {recording.rawData}
              </div>
            )}
          </section>

          <section className="bg-white border border-[#141414] p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
            <h2 className="font-serif italic text-lg mb-4 flex items-center gap-2">
              <Info className="w-4 h-4" /> AI Analysis Summary
            </h2>
            <p className="text-sm leading-relaxed text-gray-700">
              {analysis.summary}
            </p>
            
            <div className="mt-8 grid grid-cols-3 gap-4 border-t border-black/5 pt-6">
              <div className="text-center">
                <div className="text-[10px] font-mono uppercase opacity-50 mb-1">Toxicity</div>
                <div className={cn("text-xl font-bold", getScoreColor(100 - (analysis.overallScores?.toxicity || 0)))}>
                  {analysis.overallScores?.toxicity || 0}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-[10px] font-mono uppercase opacity-50 mb-1">Constructive</div>
                <div className={cn("text-xl font-bold", getScoreColor(recording.constructiveness))}>
                  {Math.round(recording.constructiveness)}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-[10px] font-mono uppercase opacity-50 mb-1">Persuasion</div>
                <div className={cn("text-xl font-bold", getScoreColor(recording.score))}>
                  {Math.round(recording.score)}%
                </div>
              </div>
            </div>
          </section>

          {isVoice && analysis.speakers && (
            <section className="bg-white border border-[#141414] p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
              <h2 className="font-serif italic text-lg mb-4 flex items-center gap-2">
                <User className="w-4 h-4" /> Speaker Diarization
              </h2>
              <div className="space-y-4">
                {(analysis as any).speakers.map((s: any, i: number) => (
                  <div key={i} className="p-4 bg-[#f5f5f5] border border-black/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">{s.name}</span>
                      <span className="text-[10px] font-mono uppercase opacity-50">{s.tone}</span>
                    </div>
                    <p className="text-[10px] leading-relaxed opacity-70">{s.contribution}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right Column: Visualizations */}
        <div className="lg:col-span-8 space-y-6">
          {analysis.nodes && (
            <>
              <EscalationTrajectory 
                nodes={analysis.nodes} 
                insight={analysis.trajectoryInsight} 
              />

              <section className="bg-white border border-[#141414] p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
                <h2 className="font-serif italic text-lg mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" /> Argument Structure Graph
                </h2>
                <ArgumentGraph 
                  nodes={analysis.nodes} 
                  onNodeClick={(node) => setSelectedNode(node)} 
                />
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <section className="bg-white border border-[#141414] p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] min-h-[300px]">
                  <h2 className="font-serif italic text-lg mb-4 flex items-center gap-2">
                    <ChevronRight className="w-4 h-4" /> Argument Detail
                  </h2>
                  <AnimatePresence mode="wait">
                    {selectedNode ? (
                      <motion.div
                        key={selectedNode.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="space-y-4"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-mono uppercase bg-[#141414] text-white px-2 py-0.5 rounded-sm">
                              {selectedNode.type}
                            </span>
                            <div className="font-bold mt-1">{selectedNode.author}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] font-mono uppercase opacity-50">Reasoning</div>
                            <div className={cn("text-lg font-bold", getScoreColor(selectedNode.reasoningScore))}>
                              {selectedNode.reasoningScore}/100
                            </div>
                          </div>
                        </div>
                        <p className="text-sm italic text-gray-600 border-l-2 border-black/10 pl-4 py-1">
                          "{selectedNode.text}"
                        </p>
                        <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-sm">
                          <p className="text-xs text-emerald-800 leading-relaxed">
                            {selectedNode.feedback}
                          </p>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-center opacity-30 py-12">
                        <p className="text-xs font-mono uppercase">Select a node in the graph to view details</p>
                      </div>
                    )}
                  </AnimatePresence>
                </section>

                <section className="bg-[#141414] text-white p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,0.2)]">
                  <h2 className="font-serif italic text-lg mb-4 flex items-center gap-2 text-white">
                    <TrendingUp className="w-4 h-4" /> Top Reasoning
                  </h2>
                  <div className="space-y-4">
                    {analysis.bestArguments?.map((id, index) => {
                      const node = analysis.nodes.find(n => n.id === id);
                      if (!node) return null;
                      return (
                        <div key={id} className="group cursor-pointer" onClick={() => setSelectedNode(node)}>
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-[10px] font-mono opacity-40">0{index + 1}</span>
                            <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400">
                              Score: {node.reasoningScore}
                            </span>
                          </div>
                          <p className="text-xs line-clamp-2 opacity-80 group-hover:opacity-100 transition-opacity">
                            {node.text}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>
            </>
          )}

          {isVoice && !analysis.nodes && (
            <section className="bg-white border border-[#141414] p-12 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-16 h-16 bg-[#141414] text-white rounded-full flex items-center justify-center">
                <TrendingUp className="w-8 h-8" />
              </div>
              <div className="max-w-md">
                <h3 className="text-xl font-serif italic mb-2">Voice Analysis Complete</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  The AI has processed the emotional flow and speaker dynamics of this exchange. View the summary and speaker diarization in the sidebar for insights.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {(analysis as any).fallacies?.map((f: string, i: number) => (
                  <span key={i} className="text-[10px] font-mono bg-rose-50 text-rose-700 border border-rose-200 px-2 py-1 rounded">
                    {f}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};
