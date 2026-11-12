import React, { memo } from 'react';
import { motion } from 'motion/react';
import { ExternalLink, ShieldCheck } from 'lucide-react';
import { AffizyAdUnit } from '../ads/AffizyAdUnit';

interface SponsoredCardProps {
  idx?: number;
}

export const SponsoredCard = memo(function SponsoredCard({ idx = 7 }: SponsoredCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(idx * 0.03, 0.6), ease: "easeOut" }}
      className="card group col-span-1 flex flex-col justify-between overflow-hidden relative shadow-sm hover:border-blue-500/40 transition-all min-h-[380px]"
    >
      {/* Top Header Bar matching terminal wire style */}
      <div className="px-3.5 py-2.5 bg-black/30 dark:bg-black/50 border-b border-[var(--border)] flex items-center justify-between">
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          <span className="font-bold text-[var(--ink)] tracking-wider uppercase">
            SPONSORED DISPATCH
          </span>
        </div>
        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-blue-500/15 text-blue-500 dark:text-blue-400 border border-blue-500/30 uppercase tracking-wider">
          PROMOTED
        </span>
      </div>

      {/* Main Banner Unit Container - Fits 300x250 natively */}
      <div className="flex-1 flex flex-col items-center justify-center p-3 my-auto w-full overflow-hidden">
        <div className="w-full flex items-center justify-center">
          <AffizyAdUnit zoneId="1015" bannerSize="300x250" maxWidth="max-w-[300px]" noCardWrapper={true} />
        </div>
      </div>

      {/* Card Footer matching ArticleCard verification slots */}
      <div className="px-3.5 py-2.5 bg-black/20 dark:bg-black/40 border-t border-[var(--border)] flex items-center justify-between font-mono text-[10px] text-[var(--ink-muted)]">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
          <span className="font-bold tracking-wide">AFFIZY AD NETWORK</span>
        </div>
        <span className="flex items-center gap-1 opacity-70">
          <span>PARTNER</span>
          <ExternalLink className="w-2.5 h-2.5" />
        </span>
      </div>
    </motion.div>
  );
});
