import React from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Globe, Github } from 'lucide-react';

export const About = () => {
  return (
    <div className="max-w-3xl mx-auto py-20 px-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white border border-[#141414] p-12 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] space-y-8"
      >
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 bg-[#E4E3E0] border border-black/10 flex items-center justify-center">
            <User className="w-12 h-12 opacity-20" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tighter uppercase">Kabir Mago</h1>
            <p className="font-serif italic text-gray-500">Architect of Logos</p>
          </div>
        </div>

        <div className="space-y-4 text-gray-700 leading-relaxed">
          <p>
            Logos was built with a single mission: to improve the quality of online discourse through objective, AI-driven analysis. By focusing on the structure of arguments rather than just the sentiment of words, we can better understand how ideas are formed and challenged.
          </p>
        
        </div>

        <div className="pt-8 border-t border-black/5 flex gap-6">
          <a href="#" className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest hover:opacity-50 transition-opacity">
            <Mail className="w-3 h-3" /> Contact
          </a>
          <a href="#" className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest hover:opacity-50 transition-opacity">
            <Github className="w-3 h-3" /> GitHub
          </a>
          <a href="#" className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest hover:opacity-50 transition-opacity">
            <Globe className="w-3 h-3" /> Website
          </a>
        </div>
      </motion.div>
    </div>
  );
};
