import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, ChevronDown } from 'lucide-react';
import { lookupFallacy } from '../lib/fallacies';

interface FallacyChipProps {
  name: string;
  /** Compact chips (e.g. in dense lists) start collapsed and are smaller. */
  size?: 'sm' | 'md';
}

/**
 * A fallacy tag that doubles as a teaching aid: click to reveal what the
 * fallacy is and how to respond to it. Turns the analyzer from judge into coach.
 */
export const FallacyChip: React.FC<FallacyChipProps> = ({ name, size = 'md' }) => {
  const [open, setOpen] = useState(false);
  const info = lookupFallacy(name);
  const isSm = size === 'sm';

  return (
    <div className="inline-block align-top">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={[
          'inline-flex items-center gap-1 font-mono uppercase tracking-wider rounded-sm border transition-colors',
          'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
          isSm ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2 py-1',
        ].join(' ')}
        title={`${info.name} — click to learn more`}
      >
        <AlertTriangle className={isSm ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
        {info.name}
        <ChevronDown
          className={[isSm ? 'w-2.5 h-2.5' : 'w-3 h-3', 'transition-transform', open ? 'rotate-180' : ''].join(' ')}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="mt-1.5 max-w-xs rounded-sm border border-rose-200 bg-white p-3 text-left shadow-[2px_2px_0px_0px_rgba(225,29,72,0.15)]">
              <p className="text-xs leading-relaxed text-gray-800">{info.definition}</p>
              <div className="mt-2 border-t border-rose-100 pt-2">
                <div className="text-[9px] font-mono uppercase tracking-widest text-rose-500 mb-1">How to counter</div>
                <p className="text-xs leading-relaxed text-gray-600">{info.counter}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
