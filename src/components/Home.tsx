import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, ArrowRight, Shield, BookOpen, Brain } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Home = () => {
  return (
    <div className="max-w-4xl mx-auto py-20 px-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-8"
      >
        <div className="inline-block p-4 bg-[#141414] rounded-sm mb-4">
          <TrendingUp className="text-white w-12 h-12" />
        </div>
        <h1 className="text-6xl font-bold tracking-tighter uppercase">Logos</h1>
        <p className="text-xl font-serif italic text-gray-600 max-w-2xl mx-auto">
          The world's first automated reasoning quality analyzer. We don't just look at sentiment; we map the logic of human discourse.
        </p>
        
        <div className="flex flex-wrap justify-center gap-4 pt-8">
          <Link 
            to="/analyze" 
            className="bg-[#141414] text-white px-8 py-4 font-mono uppercase text-sm tracking-widest hover:bg-[#333] transition-colors flex items-center gap-2"
          >
            Start Analyzing <ArrowRight className="w-4 h-4" />
          </Link>
          <Link 
            to="/leaderboard" 
            className="border border-[#141414] px-8 py-4 font-mono uppercase text-sm tracking-widest hover:bg-[#141414] hover:text-white transition-all"
          >
            View Leaderboard
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-20">
          <div className="p-6 border border-black/5 bg-white/50 text-left space-y-3">
            <Brain className="w-6 h-6 opacity-40" />
            <h3 className="font-bold uppercase text-xs tracking-widest">Logic Mapping</h3>
            <p className="text-xs text-gray-500 leading-relaxed">Visualizing argument chains using force-directed graphs to see how claims connect to evidence.</p>
          </div>
          <div className="p-6 border border-black/5 bg-white/50 text-left space-y-3">
            <Shield className="w-6 h-6 opacity-40" />
            <h3 className="font-bold uppercase text-xs tracking-widest">Fallacy Detection</h3>
            <p className="text-xs text-gray-500 leading-relaxed">Automated identification of strawman, ad hominem, and other logical inconsistencies.</p>
          </div>
          <div className="p-6 border border-black/5 bg-white/50 text-left space-y-3">
            <BookOpen className="w-6 h-6 opacity-40" />
            <h3 className="font-bold uppercase text-xs tracking-widest">Reasoning Scores</h3>
            <p className="text-xs text-gray-500 leading-relaxed">Objective scoring of persuasiveness and constructiveness based on structural integrity.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
