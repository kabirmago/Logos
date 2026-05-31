import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertTriangle, Loader2, ExternalLink } from 'lucide-react';
import { ArgumentGraph } from './ArgumentGraph';
import { EscalationTrajectory } from './EscalationTrajectory';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function getScoreColor(score: number) {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 50) return 'text-amber-600';
  return 'text-rose-600';
}

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
  return getScoreBarColor(score);
}

export const SharedAnalysis: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!id) return;
    fetch(`/api/analysis/${id}`)
      .then(r => {
        if (!r.ok) throw new Error('Not found');
        return r.json();
      })
      .then(data => {
        setAnalysis(data);
        // Inject OG tags client-side (fallback for dev / CSR)
        document.title = `Debate Analysis — ${data.summary?.substring(0, 60) || 'Logos'}`;
      })
      .catch(() => setError('This analysis link is invalid or has expired.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin opacity-40" />
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="max-w-xl mx-auto p-12 text-center space-y-4">
        <p className="font-mono text-sm opacity-50">{error || 'Analysis not found.'}</p>
        <Link to="/analyze" className="inline-block text-[11px] font-mono uppercase tracking-widest bg-[#141414] text-white px-4 py-2 rounded-sm hover:bg-[#333] transition-colors">
          Run Your Own Analysis
        </Link>
      </div>
    );
  }

  const sortedNodes = [...(analysis.nodes || [])].sort((a: any, b: any) => b.reasoningScore - a.reasoningScore);
  const total = sortedNodes.length;
  const top5 = sortedNodes.slice(0, Math.min(5, Math.floor(total / 2)));
  const worst5 = sortedNodes.slice(Math.max(total - 5, Math.ceil(total / 2)));

  return (
    <main className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Read-only banner */}
      <div className="flex items-center justify-between bg-[#141414] text-white px-5 py-3 rounded-sm">
        <p className="text-[11px] font-mono uppercase tracking-widest opacity-70">Shared Analysis — Read Only</p>
        <Link
          to="/analyze"
          className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest hover:opacity-70 transition-opacity"
        >
          <ExternalLink className="w-3 h-3" />
          Analyze Your Own
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-4 space-y-6">
          {/* Overall Scores */}
          <section className="bg-white border border-[#141414] p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
            <h2 className="font-serif italic text-lg mb-4">Overall Scores</h2>
            {[
              { label: 'Persuasiveness', value: analysis.overallScores?.persuasiveness ?? 0 },
              { label: 'Constructiveness', value: analysis.overallScores?.constructiveness ?? 0 },
              { label: 'Toxicity', value: analysis.overallScores?.toxicity ?? 0 },
            ].map(({ label, value }) => (
              <div key={label} className="mb-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[11px] font-mono uppercase tracking-widest opacity-50">{label}</span>
                  <span className={cn('text-sm font-bold tabular-nums', getScoreColor(value))}>{value}</span>
                </div>
                <div className="h-1.5 bg-black/10 rounded-full overflow-hidden">
                  <div className={cn('h-full rounded-full', getScoreBarColor(value))} style={{ width: `${value}%` }} />
                </div>
              </div>
            ))}
          </section>

          {/* Trajectory */}
          {analysis.nodes && analysis.nodes.length > 0 && (
            <section className="bg-white border border-[#141414] p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
              <h2 className="font-serif italic text-lg mb-4">Vibe Trajectory</h2>
              <EscalationTrajectory nodes={analysis.nodes} insight={analysis.trajectoryInsight} />
            </section>
          )}

          {/* Summary */}
          <section className="bg-white border border-[#141414] p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
            <h2 className="font-serif italic text-lg mb-3">Summary</h2>
            <p className="text-sm leading-relaxed opacity-70">{analysis.summary}</p>
          </section>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-8 space-y-6">
          {/* Argument Graph */}
          {analysis.nodes && analysis.nodes.length > 0 && (
            <section className="bg-white border border-[#141414] p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
              <h2 className="font-serif italic text-lg mb-4">Argument Graph</h2>
              <ArgumentGraph nodes={analysis.nodes} />
            </section>
          )}

          {/* Best Arguments */}
          {top5.length > 0 && (
            <section className="bg-white border border-[#141414] p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
              <h2 className="font-serif italic text-lg mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" /> Best Arguments
              </h2>
              <div className="space-y-2">
                {top5.map((node: any, i: number) => (
                  <motion.div
                    key={node.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="rounded-sm border border-black/10 bg-white p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0', getScoreDotColor(node.reasoningScore))} />
                      <div className="flex-shrink-0 w-16 h-1.5 bg-black/10 rounded-full overflow-hidden">
                        <div className={cn('h-full rounded-full', getScoreBarColor(node.reasoningScore))} style={{ width: `${node.reasoningScore}%` }} />
                      </div>
                      <span className="text-[10px] font-mono flex-shrink-0 opacity-50">{node.reasoningScore}/100</span>
                      <p className="text-xs line-clamp-1 flex-1 text-gray-800">{node.text}</p>
                      <span className="text-[10px] font-mono flex-shrink-0 opacity-30 ml-auto">{node.author}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* Weakest Arguments */}
          {worst5.length > 0 && (
            <section className="bg-white border border-[#141414] p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
              <h2 className="font-serif italic text-lg mb-4 flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-rose-500" /> Weakest Arguments
              </h2>
              <div className="space-y-2">
                {worst5.map((node: any, i: number) => (
                  <motion.div
                    key={node.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="rounded-sm border border-black/10 bg-white p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0', getScoreDotColor(node.reasoningScore))} />
                      <div className="flex-shrink-0 w-16 h-1.5 bg-black/10 rounded-full overflow-hidden">
                        <div className={cn('h-full rounded-full', getScoreBarColor(node.reasoningScore))} style={{ width: `${node.reasoningScore}%` }} />
                      </div>
                      <span className="text-[10px] font-mono flex-shrink-0 opacity-50">{node.reasoningScore}/100</span>
                      <p className="text-xs line-clamp-1 flex-1 text-gray-800">{node.text}</p>
                      <span className="text-[10px] font-mono flex-shrink-0 opacity-30 ml-auto">{node.author}</span>
                    </div>
                    {node.fallacies && node.fallacies.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1 pl-6">
                        {node.fallacies.map((f: string) => (
                          <span key={f} className="inline-flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded-sm border border-rose-200">
                            <AlertTriangle className="w-2.5 h-2.5" />{f}
                          </span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
};
