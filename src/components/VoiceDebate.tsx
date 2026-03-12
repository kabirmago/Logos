import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Loader2, AlertCircle, TrendingUp, User, Activity, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDiscourse } from '../context/DiscourseContext';

export const VoiceDebate = () => {
  const { user } = useAuth();
  const {
    isRecording,
    isVoiceAnalyzing,
    realtimeStatus,
    realtimeReason,
    voiceResult: result,
    voiceError: error,
    recordingTime,
    stream,
    startRecording,
    stopRecording,
    clearVoiceAnalysis
  } = useDiscourse();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <header className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-center md:text-left space-y-1">
          <h1 className="text-4xl font-serif italic tracking-tight">Voice Discourse Analysis</h1>
          <p className="text-sm font-mono uppercase opacity-50 tracking-widest">Real-time Diarization & Quality Assessment</p>
        </div>
        {(result || error) && !isRecording && (
          <button 
            onClick={clearVoiceAnalysis}
            className="text-[10px] font-mono uppercase opacity-50 hover:opacity-100 flex items-center gap-1 transition-opacity"
          >
            <Trash2 className="w-3 h-3" /> Clear Analysis
          </button>
        )}
      </header>

      <div className="bg-white border border-[#141414] p-12 shadow-[12px_12px_0px_0px_rgba(20,20,20,1)] flex flex-col items-center justify-center space-y-8 relative overflow-hidden">
        {/* Real-time Indicator Light */}
        <AnimatePresence>
          {isRecording && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-6 right-6 flex items-center gap-3"
            >
              <div className="text-right">
                <p className="text-[10px] font-mono uppercase opacity-50">Live Status</p>
                <p className="text-[11px] font-mono uppercase font-bold">{realtimeReason || 'Listening...'}</p>
              </div>
              <div className={cn(
                "w-4 h-4 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.2)] transition-colors duration-500",
                realtimeStatus === 'green' ? 'bg-emerald-500 shadow-emerald-500/50' :
                realtimeStatus === 'yellow' ? 'bg-amber-500 shadow-amber-500/50' :
                realtimeStatus === 'red' ? 'bg-rose-500 shadow-rose-500/50' :
                'bg-gray-300 animate-pulse'
              )} />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative">
          <AnimatePresence>
            {isRecording && (
              <motion.div
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute inset-0 bg-rose-500 rounded-full -z-10"
              />
            )}
          </AnimatePresence>
          
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isVoiceAnalyzing}
            className={cn(
              "w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300",
              isRecording 
                ? "bg-rose-600 text-white hover:bg-rose-700" 
                : "bg-[#141414] text-white hover:bg-[#333]"
            )}
          >
            {isRecording ? <Square className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
          </button>
        </div>

        <div className="text-center space-y-2">
          <p className="text-3xl font-mono font-bold tracking-tighter">
            {formatTime(recordingTime)}
          </p>
          <p className="text-[10px] font-mono uppercase opacity-50 tracking-widest">
            {isRecording ? "Recording in progress..." : "Click to start recording"}
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-rose-600 bg-rose-50 px-4 py-2 border border-rose-200 text-xs font-mono uppercase">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}
      </div>

      {isVoiceAnalyzing && (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 className="w-12 h-12 animate-spin opacity-20" />
          <p className="text-[10px] font-mono uppercase tracking-widest opacity-50">Performing Diarization & Analysis...</p>
        </div>
      )}

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="bg-white border border-[#141414] p-8 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)]">
              <h2 className="text-xl font-serif italic mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" /> Analysis Overview
              </h2>
              <div className="space-y-6">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-mono uppercase opacity-50">Persuasion Score</span>
                  <span className="text-4xl font-bold tracking-tighter">{result.score}%</span>
                </div>
                <div className="h-2 bg-[#f5f5f5] border border-black/5 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${result.score}%` }}
                    className="h-full bg-[#141414]"
                  />
                </div>
                
                <div className="flex justify-between items-end pt-4">
                  <span className="text-[10px] font-mono uppercase opacity-50">Constructiveness</span>
                  <span className="text-4xl font-bold tracking-tighter">{result.constructiveness}%</span>
                </div>
                <div className="h-2 bg-[#f5f5f5] border border-black/5 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${result.constructiveness}%` }}
                    className="h-full bg-emerald-500"
                  />
                </div>
              </div>
            </section>

            <section className="bg-white border border-[#141414] p-8 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)]">
              <h2 className="text-xl font-serif italic mb-6 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" /> Logical Fallacies
              </h2>
              <div className="flex flex-wrap gap-2">
                {result.fallacies.map((f, i) => (
                  <span key={i} className="px-3 py-1 bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-mono uppercase tracking-wider">
                    {f}
                  </span>
                ))}
                {result.fallacies.length === 0 && (
                  <p className="text-sm italic opacity-50">No major fallacies detected.</p>
                )}
              </div>
              <div className="mt-8">
                <h3 className="text-[10px] font-mono uppercase opacity-50 mb-2">Summary</h3>
                <p className="text-sm leading-relaxed italic">{result.summary}</p>
              </div>
            </section>
          </div>

          <section className="bg-white border border-[#141414] p-8 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)]">
            <h2 className="text-xl font-serif italic mb-8 flex items-center gap-2">
              <Activity className="w-5 h-5" /> Speaker Diarization
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {result.speakers.map((s, i) => (
                <div key={i} className="p-6 bg-[#f5f5f5] border border-black/5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#141414] text-white rounded-full flex items-center justify-center">
                        <User className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-sm">{s.name}</span>
                    </div>
                    <span className="text-[10px] font-mono uppercase px-2 py-1 border border-black/10 rounded-full">
                      {s.tone}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed opacity-70">{s.contribution}</p>
                </div>
              ))}
            </div>
          </section>
        </motion.div>
      )}
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
