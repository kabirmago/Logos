import React from 'react';
import { motion } from 'framer-motion';
import { Book, ShieldCheck, Code } from 'lucide-react';

export const Methodology = () => (
  <div className="max-w-3xl mx-auto py-20 px-6 space-y-12">
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <h1 className="text-4xl font-bold tracking-tighter uppercase flex items-center gap-4">
        <Book className="w-8 h-8" /> Methodology
      </h1>
      <div className="bg-white border border-[#141414] p-8 space-y-6 text-sm leading-relaxed">
        <p>Logos utilizes a multi-layered analysis approach to evaluate debate quality:</p>
        <ul className="list-disc pl-5 space-y-4">
          <li><strong>Structural Parsing:</strong> We break down text into discrete nodes (claims, evidence, rebuttals) based on linguistic markers and logical flow.</li>
          <li><strong>Fallacy Heuristics:</strong> Our engine cross-references argument structures against a database of 40+ common logical fallacies.</li>
          <li><strong>Reasoning Scoring:</strong> Scores are calculated based on the ratio of evidence to claims, the relevance of rebuttals, and the presence of constructive concessions.</li>
        </ul>
      </div>
    </motion.section>
  </div>
);

export const ApiDocs = () => (
  <div className="max-w-3xl mx-auto py-20 px-6 space-y-12">
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <h1 className="text-4xl font-bold tracking-tighter uppercase flex items-center gap-4">
        <Code className="w-8 h-8" /> API Documentation
      </h1>
      <div className="bg-white border border-[#141414] p-8 space-y-6 text-sm font-mono">
        <div className="space-y-2">
          <p className="text-emerald-600 font-bold">GET /api/leaderboard</p>
          <p className="text-gray-500">Returns the top 10 analyzed debates by persuasiveness score.</p>
        </div>
        <div className="space-y-2">
          <p className="text-emerald-600 font-bold">POST /api/leaderboard</p>
          <p className="text-gray-500">Submits a new debate analysis to the leaderboard.</p>
        </div>
      </div>
    </motion.section>
  </div>
);

export const Privacy = () => (
  <div className="max-w-3xl mx-auto py-20 px-6 space-y-12">
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <h1 className="text-4xl font-bold tracking-tighter uppercase flex items-center gap-4">
        <ShieldCheck className="w-8 h-8" /> Privacy Policy
      </h1>
      <div className="bg-white border border-[#141414] p-8 space-y-6 text-sm leading-relaxed">
        <p>At Logos, we prioritize the privacy of your data:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>We do not store the full text of debates unless you explicitly submit them to the leaderboard.</li>
          <li>Leaderboard submissions only store the summary and scores, not the original input.</li>
          <li>All analysis is performed in real-time and cleared from memory after the session ends.</li>
        </ul>
      </div>
    </motion.section>
  </div>
);
