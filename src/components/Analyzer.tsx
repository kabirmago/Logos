import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  MessageSquare, 
  AlertTriangle, 
  TrendingUp,
  TrendingDown,
  ChevronRight, 
  Loader2,
  Info,
  ArrowRight,
  Share2,
  Check,
  Trash2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { ArgumentNode } from '../services/geminiService';
import { EscalationTrajectory } from './EscalationTrajectory';
import { useAuth } from '../context/AuthContext';
import { useDiscourse } from '../context/DiscourseContext';
import { Link } from 'react-router-dom';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Color scale: red (0) -> yellow (50) -> green (100)
function getScoreBarColor(score: number): string {
  if (score >= 85) return 'bg-emerald-500';
  if (score >= 70) return 'bg-emerald-400';
  if (score >= 55) return 'bg-lime-400';
  if (score >= 45) return 'bg-yellow-400';
  if (score >= 30) return 'bg-orange-400';
  if (score >= 15) return 'bg-red-400';
  return 'bg-red-600';
}

function getScoreDotColor(score: number): string {
  if (score >= 85) return 'bg-emerald-500';
  if (score >= 70) return 'bg-emerald-400';
  if (score >= 55) return 'bg-lime-400';
  if (score >= 45) return 'bg-yellow-400';
  if (score >= 30) return 'bg-orange-400';
  if (score >= 15) return 'bg-red-400';
  return 'bg-red-600';
}

function getScoreColor(score: number) {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 50) return 'text-amber-600';
  return 'text-rose-600';
}

interface ReasoningRowProps {
  node: ArgumentNode;
  index: number;
  rank: 'best' | 'worst' | 'all';
  isSelected: boolean;
  onClick: () => void;
}

const ReasoningRow: React.FC<ReasoningRowProps> = ({ node, index, rank, isSelected, onClick }) => {
  const score = node.reasoningScore;
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      onClick={onClick}
      className={cn(
        'cursor-pointer rounded-sm border transition-all p-3 group',
        isSelected
          ? 'border-[#141414] bg-[#141414] text-white'
          : 'border-black/10 bg-white hover:border-black/30 hover:bg-black/2'
      )}
    >
      <div className="flex items-center gap-3">
        {/* Color dot */}
        <div className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0', getScoreDotColor(score))} />
        {/* Score bar */}
        <div className="flex-shrink-0 w-16 h-1.5 bg-black/10 rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all', getScoreBarColor(score))}
            style={{ width: `${score}%` }}
          />
        </div>
        <span className={cn(
          'text-[10px] font-mono flex-shrink-0',
          isSelected ? 'text-white/70' : 'opacity-50'
        )}>
          {score}/100
        </span>
        <p className={cn(
          'text-xs line-clamp-1 flex-1',
          isSelected ? 'text-white' : 'text-gray-800'
        )}>
          {node.text}
        </p>
        <span className={cn(
          'text-[10px] font-mono flex-shrink-0 ml-auto',
          isSelected ? 'text-white/50' : 'opacity-30'
        )}>
          {node.author}
        </span>
      </div>
    </motion.div>
  );
};

export const Analyzer = () => {
  const { user } = useAuth();
  const {
    inputText,
    setInputText,
    isAnalyzing,
    analysis,
    selectedNode,
    setSelectedNode,
    isPublishing,
    isPublished,
    handleAnalyze,
    handlePublish,
    clearAnalysis
  } = useDiscourse();

  const [showAll, setShowAll] = useState(false);

  // Sort nodes by reasoning score
  const sortedNodes = analysis
    ? [...analysis.nodes].sort((a, b) => b.reasoningScore - a.reasoningScore)
    : [];

  const top5 = sortedNodes.slice(0, 5);
  const worst5 = [...sortedNodes].reverse().slice(0, 5);

  return (
    <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Column: Input & Summary */}
      <div className="lg:col-span-4 space-y-6">
        <section className="bg-white border border-[#141414] p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-serif italic text-lg flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> Input Debate Text
            </h2>
            {(inputText || analysis) && (
              <button 
                onClick={clearAnalysis}
                className="text-[10px] font-mono uppercase opacity-50 hover:opacity-100 flex items-center gap-1 transition-opacity"
              >
                <Trash2 className="w-3 h-3" /> Clear
              </button>
            )}
          </div>
          <textarea
            className="w-full h-64 p-4 bg-[#f5f5f5] border border-black/10 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-[#141414] transition-all resize-none"
            placeholder="Paste Reddit threads, forum debates, or transcripts here..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !inputText.trim()}
            className="mt-4 w-full bg-[#141414] text-white py-3 px-6 font-mono uppercase text-xs tracking-widest hover:bg-[#333] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing Reasoning...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Run Analysis
              </>
            )}
          </button>
        </section>

        {analysis && (
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-[#141414] p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]"
          >
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

            <div className="mt-8 pt-6 border-t border-black/5">
              {user ? (
                <button
                  onClick={handlePublish}
                  disabled={isPublishing || isPublished}
                  className={cn(
                    "w-full py-3 px-6 font-mono uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2",
                    isPublished 
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-200" 
                      : "bg-[#141414] text-white hover:bg-[#333]"
                  )}
                >
                  {isPublishing ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : isPublished ? (
                    <><Check className="w-3 h-3" /> Published to Leaderboard</>
                  ) : (
                    <><Share2 className="w-3 h-3" /> Publish to Leaderboard</>
                  )}
                </button>
              ) : (
                <Link
                  to="/auth"
                  className="w-full py-3 px-6 border border-black/10 text-black/50 font-mono uppercase text-[10px] tracking-widest text-center block hover:bg-black/5 transition-colors"
                >
                  Login to publish to leaderboard
                </Link>
              )}
            </div>
          </motion.section>
        )}
      </div>

      {/* Right Column */}
      <div className="lg:col-span-8 space-y-6">
        {!analysis && !isAnalyzing && (
          <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-black/10 rounded-lg p-12 text-center opacity-40">
            <TrendingUp className="w-16 h-16 mb-4" />
            <h3 className="text-xl font-serif italic">Awaiting Input</h3>
            <p className="max-w-xs text-sm mt-2">Paste a debate to analyze reasoning quality and identify the strongest and weakest arguments.</p>
          </div>
        )}

        {isAnalyzing && (
          <div className="h-full flex flex-col items-center justify-center space-y-4 py-20">
            <Loader2 className="w-12 h-12 animate-spin text-[#141414]" />
            <div className="text-center">
              <p className="font-mono uppercase text-xs tracking-[0.2em]">Processing Argument Chains</p>
              <p className="text-[10px] opacity-50 mt-1">Gemini is identifying claims and evidence...</p>
            </div>
          </div>
        )}

        {analysis && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Trajectory */}
            <EscalationTrajectory 
              nodes={analysis.nodes} 
              insight={analysis.trajectoryInsight} 
            />

            {/* Top 5 Best + Top 5 Worst */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Top 5 Best */}
              <section className="bg-white border border-[#141414] p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
                <h2 className="font-serif italic text-lg mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> Top Reasoning
                </h2>
                <div className="space-y-2">
                  {top5.map((node, i) => (
                    <ReasoningRow
                      key={node.id}
                      node={node}
                      index={i}
                      rank="best"
                      isSelected={selectedNode?.id === node.id}
                      onClick={() => setSelectedNode(selectedNode?.id === node.id ? null : node)}
                    />
                  ))}
                </div>
              </section>

              {/* Top 5 Worst */}
              <section className="bg-white border border-[#141414] p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
                <h2 className="font-serif italic text-lg mb-4 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4" /> Weakest Reasoning
                </h2>
                <div className="space-y-2">
                  {worst5.map((node, i) => (
                    <ReasoningRow
                      key={node.id}
                      node={node}
                      index={i}
                      rank="worst"
                      isSelected={selectedNode?.id === node.id}
                      onClick={() => setSelectedNode(selectedNode?.id === node.id ? null : node)}
                    />
                  ))}
                </div>
              </section>
            </div>

            {/* Detail Panel */}
            <AnimatePresence mode="wait">
              {selectedNode && (
                <motion.section
                  key={selectedNode.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-white border border-[#141414] p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]"
                >
                  <h2 className="font-serif italic text-lg mb-4 flex items-center gap-2">
                    <ChevronRight className="w-4 h-4" /> Argument Detail
                  </h2>
                  <div className="space-y-4">
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

                    {/* Score bar */}
                    <div className="w-full h-2 bg-black/10 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all', getScoreBarColor(selectedNode.reasoningScore))}
                        style={{ width: `${selectedNode.reasoningScore}%` }}
                      />
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
                  </div>
                </motion.section>
              )}
            </AnimatePresence>

            {/* Show All Reasoning */}
            <section className="bg-white border border-[#141414] p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
              <button
                onClick={() => setShowAll(v => !v)}
                className="w-full flex items-center justify-between font-mono uppercase text-xs tracking-widest hover:opacity-70 transition-opacity"
              >
                <span className="flex items-center gap-2">
                  {showAll ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  All Reasoning — Best to Worst ({sortedNodes.length})
                </span>
                <span className="text-[10px] opacity-40">{showAll ? 'Collapse' : 'Expand'}</span>
              </button>

              <AnimatePresence>
                {showAll && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 space-y-2">
                      {sortedNodes.map((node, i) => (
                        <ReasoningRow
                          key={node.id}
                          node={node}
                          index={i}
                          rank="all"
                          isSelected={selectedNode?.id === node.id}
                          onClick={() => setSelectedNode(selectedNode?.id === node.id ? null : node)}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          </motion.div>
        )}
      </div>
    </main>
  );
};
