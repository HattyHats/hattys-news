import React from 'react';
import { AppMode } from '../../types';

export function ThemedCardBanner({
  category,
  title,
  mode,
  source,
}: {
  category: string;
  title: string;
  mode: AppMode;
  source: string;
}) {
  const cat = (category || '').toLowerCase();
  let color1 = mode === 'world' ? '#2563eb' : '#dc2626';
  let color2 = mode === 'world' ? '#1e3a8a' : '#7f1d1d';
  let symbol = mode === 'world' ? '🌐' : '⚡';
  let label = mode === 'world' ? 'WORLD NEWS WIRE' : 'HATTY NEWS TERMINAL';

  if (mode === 'world') {
    if (cat.includes('politics')) {
      color1 = '#8b5cf6'; color2 = '#2e1065'; symbol = '🏛️'; label = 'POLITICS & DIPLOMACY';
    } else if (cat.includes('geopolitics')) {
      color1 = '#f59e0b'; color2 = '#78350f'; symbol = '⚔️'; label = 'GEOPOLITICAL WIRE';
    } else if (cat.includes('economy')) {
      color1 = '#10b981'; color2 = '#064e3b'; symbol = '💼'; label = 'GLOBAL ECONOMY';
    } else if (cat.includes('tech')) {
      color1 = '#06b6d4'; color2 = '#164e63'; symbol = '🔬'; label = 'TECH & AI DISPATCH';
    } else if (cat.includes('env') || cat.includes('climate')) {
      color1 = '#14b8a6'; color2 = '#134e4a'; symbol = '🌍'; label = 'CLIMATE & EARTH';
    } else if (cat.includes('health')) {
      color1 = '#f43f5e'; color2 = '#881337'; symbol = '🏥'; label = 'GLOBAL HEALTH';
    } else if (cat.includes('space')) {
      color1 = '#a855f7'; color2 = '#3b0764'; symbol = '🛰️'; label = 'SCIENCE & SPACE';
    }
  } else {
    if (cat.includes('bitcoin')) {
      color1 = '#f7931a'; color2 = '#78350f'; symbol = '₿'; label = 'BITCOIN DISPATCH';
    } else if (cat.includes('ethereum')) {
      color1 = '#627eea'; color2 = '#1e1b4b'; symbol = 'Ξ'; label = 'ETHEREUM INTEL';
    } else if (cat.includes('defi')) {
      color1 = '#10b981'; color2 = '#064e3b'; symbol = '🏦'; label = 'DEFI PROTOCOL';
    } else if (cat.includes('nft')) {
      color1 = '#a855f7'; color2 = '#4c1d95'; symbol = '🖼️'; label = 'WEB3 & DIGITAL ASSETS';
    } else if (cat.includes('altcoin')) {
      color1 = '#ec4899'; color2 = '#831843'; symbol = '🚀'; label = 'ALTCOIN DYNAMICS';
    } else if (cat.includes('mining')) {
      color1 = '#f97316'; color2 = '#7c2d12'; symbol = '⛏️'; label = 'MINING & INFRASTRUCTURE';
    } else if (cat.includes('regulation') || cat.includes('policy')) {
      color1 = '#ef4444'; color2 = '#450a0a'; symbol = '⚖️'; label = 'GLOBAL POLICY & LAW';
    }
  }

  return (
    <div 
      className="w-full h-[180px] relative overflow-hidden flex flex-col justify-between p-4 select-none"
      style={{
        background: `linear-gradient(135deg, #09090d 0%, ${color2} 100%)`
      }}
    >
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.2) 1px, transparent 0)',
          backgroundSize: '24px 24px'
        }}
      />
      <div 
        className="absolute -top-10 -right-10 w-36 h-36 rounded-full blur-3xl opacity-30 pointer-events-none"
        style={{ backgroundColor: color1 }}
      />
      <div 
        className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full blur-2xl opacity-20 pointer-events-none"
        style={{ backgroundColor: color1 }}
      />

      <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: color1 }} />
          <span className="text-[10px] font-mono font-bold tracking-wider uppercase" style={{ color: color1 }}>
            {label}
          </span>
        </div>
        <span className="text-xl leading-none">{symbol}</span>
      </div>

      <div className="relative z-10 my-auto py-1">
        <p className="text-white font-sans font-extrabold text-sm line-clamp-2 leading-snug drop-shadow-md">
          {title}
        </p>
      </div>

      <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-2 text-[9px] font-mono text-gray-400">
        <span className="uppercase tracking-wider">{source}</span>
        <span className="font-bold tracking-widest text-white/70">HATTY'S NEWS</span>
      </div>
    </div>
  );
}
