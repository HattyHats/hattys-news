import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { X, ExternalLink } from 'lucide-react';

export interface DoomsdayModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
}

export function DoomsdayModal({ isOpen, onClose, isDark }: DoomsdayModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const threats = [
    {
      category: 'NUCLEAR ARSENALS',
      level: 'CRITICAL',
      color: '#ef4444',
      desc: 'War in Ukraine, erosion of bilateral arms control treaties (New START), North Korean ballistic tests, and modernization of atomic arsenals.'
    },
    {
      category: 'CLIMATE DISRUPTION',
      level: 'SEVERE',
      color: '#f97316',
      desc: 'Record-shattering surface & ocean temperatures, extreme weather disruptions, and lagging global emission reduction targets.'
    },
    {
      category: 'AI & AUTONOMOUS WEAPONS',
      level: 'HIGH',
      color: '#eab308',
      desc: 'Militarized AI decision systems, deepfake-driven cognitive warfare, and synthetic biology design automation without oversight.'
    },
    {
      category: 'BIOSECURITY RISKS',
      level: 'ELEVATED',
      color: '#a855f7',
      desc: 'High-containment pathogen research, gain-of-function experiments, and rapid synthesis of engineered biological agents.'
    }
  ];

  const timeline = [
    { year: '1947', setting: '7 MIN', desc: 'Clock created at 7 minutes to midnight by Manhattan Project scientists.' },
    { year: '1953', setting: '2 MIN', desc: 'US and USSR test thermonuclear H-bombs.' },
    { year: '1991', setting: '17 MIN', desc: 'Cold War ends; START I treaty signed (humanity’s safest benchmark).' },
    { year: '2020', setting: '100 SEC', desc: 'First time set within the two-minute threshold.' },
    { year: 'PRESENT', setting: '90 SEC', desc: 'Closest to global catastrophe in human history.' },
  ];

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-3 sm:p-4 overflow-hidden overscroll-none select-none">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/85 backdrop-blur-md cursor-pointer"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-xl max-h-[90dvh] overflow-y-auto overscroll-contain bg-[var(--surface-solid)] border border-red-500/30 rounded-2xl p-5 sm:p-7 shadow-2xl z-10 text-[var(--ink)] select-text touch-pan-y touch-scroll scrollbar-thin"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          type="button"
          onClick={onClose}
          aria-label="Close Doomsday Clock Modal"
          className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 w-10 h-10 rounded-xl bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 active:scale-95 text-[var(--ink)] flex items-center justify-center transition-all cursor-pointer border border-[var(--border)] shadow-sm touch-manipulation z-30"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-500 font-mono text-[11px] font-bold tracking-widest uppercase mb-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            GLOBAL EXISTENTIAL RISK MONITOR
          </div>
          <h2 className="font-display text-3xl sm:text-4xl text-[var(--ink)] mb-1">THE DOOMSDAY CLOCK</h2>
          <div className="font-mono text-xs text-[var(--ink-muted)] tracking-wider uppercase mb-5">
            BULLETIN OF THE ATOMIC SCIENTISTS
          </div>

          {/* Clock Visual Representation */}
          <div className="relative inline-flex items-center justify-center my-2">
            <svg width="220" height="220" viewBox="0 0 240 240" className="overflow-visible">
              <defs>
                <radialGradient id="dangerGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="metalRim" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={isDark ? "#334155" : "#cbd5e1"} />
                  <stop offset="100%" stopColor={isDark ? "#0f172a" : "#64748b"} />
                </linearGradient>
              </defs>

              {/* Glowing Aura */}
              <circle cx="120" cy="120" r="115" fill="url(#dangerGlow)" />

              {/* Outer Bezel */}
              <circle cx="120" cy="120" r="105" fill={isDark ? "#0a0c10" : "#ffffff"} stroke="url(#metalRim)" strokeWidth="8" />
              <circle cx="120" cy="120" r="97" fill="none" stroke={isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"} strokeWidth="1.5" />

              {/* 11:00 to 12:00 General Warning Sector */}
              <path
                d="M 120 120 L 71.5 36 A 97 97 0 0 1 120 23 Z"
                fill="rgba(239, 68, 68, 0.12)"
              />
              {/* Critical 90 Seconds to Midnight Danger Wedge (11:58:30 to 12:00:00) */}
              <path
                d="M 120 120 L 104.83 24.19 A 97 97 0 0 1 120 23 Z"
                fill="#ef4444"
                className="animate-pulse"
              />

              {/* Hour & Minute Tick Marks */}
              {[...Array(12)].map((_, i) => {
                const angle = (i * 30) * (Math.PI / 180);
                const x1 = 120 + 84 * Math.sin(angle);
                const y1 = 120 - 84 * Math.cos(angle);
                const x2 = 120 + 94 * Math.sin(angle);
                const y2 = 120 - 94 * Math.cos(angle);
                const isCrit = i === 11 || i === 0;
                return (
                  <line 
                    key={i} 
                    x1={x1} 
                    y1={y1} 
                    x2={x2} 
                    y2={y2} 
                    stroke={isCrit ? "#ef4444" : isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"} 
                    strokeWidth={isCrit ? "3" : "1.5"} 
                  />
                );
              })}

              {/* Roman Numerals */}
              <text x="120" y="48" fill="#ef4444" fontSize="13" fontFamily="sans-serif" fontWeight="900" textAnchor="middle">XII</text>
              <text x="70" y="58" fill={isDark ? "#94a3b8" : "#475569"} fontSize="11" fontFamily="sans-serif" fontWeight="700" textAnchor="middle">XI</text>
              <text x="48" y="125" fill={isDark ? "#64748b" : "#94a3b8"} fontSize="10" fontFamily="sans-serif" fontWeight="600" textAnchor="middle">IX</text>
              <text x="192" y="125" fill={isDark ? "#64748b" : "#94a3b8"} fontSize="10" fontFamily="sans-serif" fontWeight="600" textAnchor="middle">III</text>

              {/* Hour Hand (Pointing towards 12, at ~11:58) */}
              <line x1="120" y1="120" x2="119.35" y2="70" stroke={isDark ? "#ffffff" : "#0f172a"} strokeWidth="5" strokeLinecap="round" />

              {/* Minute Hand (Pointing at 11:58:30 = 9 degrees before midnight) */}
              <line x1="120" y1="120" x2="108.27" y2="45.9" stroke="#ef4444" strokeWidth="3.5" strokeLinecap="round" />

              {/* Second Hand with Counterweight */}
              <line x1="120" y1="135" x2="106" y2="30" stroke="#f87171" strokeWidth="1.5" />
              <circle cx="106" cy="30" r="2.5" fill="#ef4444" />

              {/* Center Hub */}
              <circle cx="120" cy="120" r="7" fill={isDark ? "#ffffff" : "#0f172a"} />
              <circle cx="120" cy="120" r="3.5" fill="#ef4444" />
            </svg>
          </div>

          {/* Primary Readout */}
          <div className="flex flex-col items-center mt-2 mb-5">
            <div className="flex items-baseline gap-2 font-mono">
              <span className="text-4xl sm:text-6xl font-black text-red-500 tracking-tight drop-shadow-[0_0_20px_rgba(239,68,68,0.4)]">
                90 SECONDS
              </span>
            </div>
            <span className="text-xs sm:text-sm font-mono font-bold tracking-widest text-[var(--ink-muted)] uppercase mt-0.5">
              TO MIDNIGHT
            </span>

            <div className="mt-3 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-500 font-mono text-xs font-bold uppercase tracking-wider">
              STATUS: HISTORIC MAXIMUM PERIL
            </div>
          </div>

          {/* Core Threat Factors Grid */}
          <div className="text-left mb-6">
            <div className="text-[11px] font-mono font-bold uppercase text-[var(--ink-muted)] tracking-wider mb-2.5">
              PRIMARY THREAT DRIVERS (BULLETIN MATRIX)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {threats.map((t) => (
                <div key={t.category} className="p-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-xs font-bold text-[var(--ink)]">{t.category}</span>
                    <span 
                      className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border"
                      style={{ color: t.color, borderColor: `${t.color}40`, backgroundColor: `${t.color}15` }}
                    >
                      {t.level}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--ink-muted)] leading-relaxed">
                    {t.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Historical Timeline */}
          <div className="text-left mb-6">
            <div className="text-[11px] font-mono font-bold uppercase text-[var(--ink-muted)] tracking-wider mb-2.5">
              HISTORICAL BENCHMARKS
            </div>
            <div className="space-y-1.5 font-mono text-xs bg-[var(--bg)] p-3.5 rounded-xl border border-[var(--border)]">
              {timeline.map((item, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 sm:gap-3 py-1.5 border-b border-[var(--border)] last:border-none">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-bold text-[var(--ink)] sm:w-16">{item.year}:</span>
                    <span className={`font-bold sm:w-16 sm:text-right ${item.year === 'PRESENT' ? 'text-red-500' : 'text-[var(--accent)]'}`}>
                      {item.setting}
                    </span>
                  </div>
                  <span className="text-[11px] text-[var(--ink-muted)] text-left flex-1 font-sans">
                    {item.desc}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer & Source Link */}
          <div className="flex justify-between items-center text-[10px] font-mono text-[var(--ink-muted)] border-t border-[var(--border)] pt-3">
            <div>Setting: 90s (Science and Security Board)</div>
            <a 
              href="https://thebulletin.org/doomsday-clock/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-red-500 hover:underline flex items-center gap-1 font-semibold"
            >
              TheBulletin.org <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
