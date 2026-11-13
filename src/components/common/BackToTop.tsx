import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronUp } from 'lucide-react';

interface BackToTopProps {
  show: boolean;
}

export function BackToTop({ show }: BackToTopProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.button
          initial={{ opacity: 0, y: 15, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 15, scale: 0.9 }}
          onClick={() => {
            window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
          }}
          className="fixed bottom-[calc(74px+env(safe-area-inset-bottom,0px))] right-4 sm:right-6 z-40 px-3 py-2 rounded-full bg-[var(--surface-solid)]/95 border border-[var(--border)] text-[var(--ink)] shadow-2xl hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all backdrop-blur-md flex items-center gap-1.5 text-xs font-mono font-bold group cursor-pointer"
          title="Return to top of feed"
        >
          <ChevronUp className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform text-[var(--accent)]" />
          <span className="hidden sm:inline">TOP</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
