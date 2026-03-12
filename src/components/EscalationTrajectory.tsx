import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { motion } from 'framer-motion';
import { ArgumentNode } from '../services/geminiService';
import { Zap, Thermometer, TrendingUp, TrendingDown } from 'lucide-react';

interface EscalationTrajectoryProps {
  nodes: ArgumentNode[];
  insight: string;
}

export const EscalationTrajectory: React.FC<EscalationTrajectoryProps> = ({ nodes, insight }) => {
  // Sort nodes by their order in the debate (assuming ID or parentId structure implies order)
  // For now, we'll just use the order they appear in the array as a proxy for time
  const data = nodes.map((node, index) => ({
    index: index + 1,
    vibe: node.vibe,
    author: node.author,
    type: node.type
  }));

  const getInsightIcon = () => {
    if (insight.toLowerCase().includes('redemption')) return <TrendingUp className="w-5 h-5 text-emerald-500" />;
    if (insight.toLowerCase().includes('entropy')) return <TrendingDown className="w-5 h-5 text-rose-500" />;
    return <Zap className="w-5 h-5 text-indigo-500" />;
  };

  return (
    <div className="bg-white border border-[#141414] p-8 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-xs font-mono uppercase tracking-widest opacity-50 flex items-center gap-2">
            <Thermometer className="w-3 h-3" /> Escalation Trajectory
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold tracking-tighter uppercase">{insight}</span>
            {getInsightIcon()}
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-mono uppercase opacity-40">Vibe Variance</p>
          <p className="font-bold">±{Math.round(Math.max(...data.map(d => d.vibe)) - Math.min(...data.map(d => d.vibe)))}%</p>
        </div>
      </div>

      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorVibe" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#141414" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#141414" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
            <XAxis 
              dataKey="index" 
              hide 
            />
            <YAxis 
              domain={[0, 100]} 
              hide
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-[#141414] text-white p-3 font-mono text-[10px] border border-white/20 shadow-xl">
                      <p className="uppercase opacity-50 mb-1">Turn {d.index} • {d.author}</p>
                      <p className="font-bold">VIBE: {d.vibe}%</p>
                      <p className="opacity-70 uppercase">{d.type}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area 
              type="monotone" 
              dataKey="vibe" 
              stroke="#141414" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorVibe)" 
              animationDuration={2000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex justify-between text-[10px] font-mono uppercase opacity-40 pt-4 border-t border-black/5">
        <span>Start of Discourse</span>
        <div className="flex gap-4">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500" /> Civil
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-rose-500" /> Hostile
          </div>
        </div>
        <span>Present Moment</span>
      </div>
    </div>
  );
};
