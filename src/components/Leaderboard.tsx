import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Trophy, ArrowLeft, BarChart3, Info, ChevronRight, AlertTriangle } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArgumentGraph } from './ArgumentGraph';
import { EscalationTrajectory } from './EscalationTrajectory';
import { DebateAnalysis, ArgumentNode } from '../services/geminiService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { collection, query, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [selectedDebate, setSelectedDebate] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState<ArgumentNode | null>(null);
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const q = query(collection(db, 'leaderboard'), orderBy('score', 'desc'), limit(50));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLeaderboard(data);
    };
    fetchLeaderboard().catch(err => console.error('Fetch error:', err));
  }, []);

  useEffect(() => {
    if (id) {
      fetchDebate(id);
    } else {
      setSelectedDebate(null);
    }
  }, [id]);

  const fetchDebate = async (debateId: string) => {
    setLoading(true);
    try {
      const docRef = doc(db, 'leaderboard', debateId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setSelectedDebate({ id: docSnap.id, ...docSnap.data() });
      }
    } catch (err) {
      console.error('Failed to fetch debate', err);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 50) return 'text-amber-600';
    return 'text-rose-600';
  };

  if (id && selectedDebate) {
    const analysis: DebateAnalysis = selectedDebate.analysis;
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate('/leaderboard')}
            className="flex items-center gap-2 text-[10px] font-mono uppercase opacity-50 hover:opacity-100 transition-opacity"
          >
            <ArrowLeft className="w-3 h-3" /> Back to Leaderboard
          </button>
          <div className="text-right">
            <p className="text-[10px] font-mono uppercase opacity-40">Published by</p>
            <p className="font-bold">{selectedDebate.author || 'Anonymous'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Summary */}
          <div className="lg:col-span-4 space-y-6">
            <section className="bg-white border border-[#141414] p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
              <h2 className="font-serif italic text-lg mb-4 flex items-center gap-2">
                <Info className="w-4 h-4" /> Executive Summary
              </h2>
              <p className="text-sm leading-relaxed text-gray-700">
                {analysis.summary}
              </p>
              
              <div className="mt-8 grid grid-cols-3 gap-4 border-t border-black/5 pt-6">
                <div className="text-center">
                  <div className="text-[10px] font-mono uppercase opacity-50 mb-1">Toxicity</div>
                  <div className={cn("text-xl font-bold", getScoreColor(100 - analysis.overallScores.toxicity))}>
                    {analysis.overallScores.toxicity}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] font-mono uppercase opacity-50 mb-1">Constructive</div>
                  <div className={cn("text-xl font-bold", getScoreColor(analysis.overallScores.constructiveness))}>
                    {analysis.overallScores.constructiveness}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] font-mono uppercase opacity-50 mb-1">Persuasion</div>
                  <div className={cn("text-xl font-bold", getScoreColor(analysis.overallScores.persuasiveness))}>
                    {analysis.overallScores.persuasiveness}%
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Visualization */}
          <div className="lg:col-span-8 space-y-6">
            <EscalationTrajectory 
              nodes={analysis.nodes} 
              insight={analysis.trajectoryInsight} 
            />

            <section className="bg-white border border-[#141414] p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-serif italic text-lg flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" /> Argument Structure Graph
                </h2>
              </div>
              <ArgumentGraph 
                nodes={analysis.nodes} 
                onNodeClick={(node) => setSelectedNode(node)} 
              />
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Selected Node Details */}
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
                        <div className="text-right flex gap-4">
                          <div>
                            <div className="text-[10px] font-mono uppercase opacity-50">Reasoning</div>
                            <div className={cn("text-lg font-bold", getScoreColor(selectedNode.reasoningScore))}>
                              {selectedNode.reasoningScore}/100
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] font-mono uppercase opacity-50">Vibe</div>
                            <div className={cn("text-lg font-bold", getScoreColor(selectedNode.vibe))}>
                              {selectedNode.vibe}%
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm italic text-gray-600 border-l-2 border-black/10 pl-4 py-1">
                        "{selectedNode.text}"
                      </p>
                      
                      <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-sm">
                        <div className="text-[10px] font-mono uppercase text-emerald-600 mb-1 flex items-center gap-1">
                          <Info className="w-3 h-3" /> AI Feedback
                        </div>
                        <p className="text-xs text-emerald-800 leading-relaxed">
                          {selectedNode.feedback}
                        </p>
                      </div>

                      {selectedNode.fallacies.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-[10px] font-mono uppercase opacity-50 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-rose-500" /> Fallacies Detected
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {selectedNode.fallacies.map((f, i) => (
                              <span key={i} className="text-[10px] font-mono bg-rose-50 text-rose-700 border border-rose-200 px-2 py-1 rounded">
                                {f}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-center opacity-30 py-12">
                      <p className="text-xs font-mono uppercase">Select a node in the graph to view details</p>
                    </div>
                  )}
                </AnimatePresence>
              </section>

              {/* Best Arguments */}
              <section className="bg-[#141414] text-white border border-[#141414] p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,0.2)]">
                <h2 className="font-serif italic text-lg mb-4 flex items-center gap-2 text-white">
                  <TrendingUp className="w-4 h-4" /> Top Reasoning
                </h2>
                <div className="space-y-4">
                  {analysis.bestArguments.map((id, index) => {
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
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-20 px-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-12"
      >
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold tracking-tighter uppercase flex items-center justify-center gap-4">
            <Trophy className="w-10 h-10" /> Hall of Reason
          </h1>
          <p className="font-serif italic text-gray-500">The most well-structured debates analyzed by Logos.</p>
        </div>

        <div className="bg-white border border-[#141414] shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#141414] text-white font-mono text-[10px] uppercase tracking-widest">
                <th className="p-4">Rank</th>
                <th className="p-4">Debate Summary</th>
                <th className="p-4">Author</th>
                <th className="p-4">Persuasion</th>
                <th className="p-4">Constructive</th>
                <th className="p-4">Date</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {leaderboard.map((item, idx) => (
                <tr 
                  key={item.id} 
                  className="border-b border-black/5 hover:bg-[#f9f9f9] transition-colors cursor-pointer"
                  onClick={() => navigate(`/leaderboard/${item.id}`)}
                >
                  <td className="p-4 font-mono opacity-40">#{idx + 1}</td>
                  <td className="p-4 font-medium max-w-md truncate">{item.title}</td>
                  <td className="p-4 font-mono text-[10px] uppercase opacity-60">{item.author}</td>
                  <td className="p-4">
                    <span className="font-bold text-emerald-600">{Math.round(item.score)}%</span>
                  </td>
                  <td className="p-4">
                    <span className="font-bold text-indigo-600">{Math.round(item.constructiveness)}%</span>
                  </td>
                  <td className="p-4 text-[10px] font-mono opacity-40">
                    {item.timestamp?.toDate ? item.timestamp.toDate().toLocaleDateString() : new Date(item.timestamp).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {leaderboard.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center font-mono uppercase opacity-30">
                    No records found in the reasoning archive.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};
