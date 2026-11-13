import React, { memo, useState, useEffect } from 'react';
import { TapeQuote } from '../../types';
import { INITIAL_TAPE_QUOTES } from '../../config/assets';

interface StockTickerTapeProps {
  isDark: boolean;
  marketQuotes?: Record<string, { price: number; change24h: number; formatted: string }>;
}

export const StockTickerTape = memo(function StockTickerTape({ isDark, marketQuotes }: StockTickerTapeProps) {
  const [quotes, setQuotes] = useState<TapeQuote[]>(INITIAL_TAPE_QUOTES);

  // Sync quotes whenever marketQuotes updates from centralized hook
  useEffect(() => {
    if (!marketQuotes) return;
    setQuotes(prev =>
      prev.map(item => {
        const match = marketQuotes[item.id] || marketQuotes[item.ticker];
        if (!match) return item;
        return {
          ...item,
          price: match.price ?? item.price,
          change24h: match.change24h ?? item.change24h,
          formatted: match.formatted ?? item.formatted
        };
      })
    );
  }, [marketQuotes]);

  const renderStrip = (copyKey: string) => (
    <div key={copyKey} className="flex items-center shrink-0">
      {quotes.map((q) => {
        const isUp = q.change24h >= 0;
        return (
          <a
            key={`${copyKey}-${q.id}`}
            href={q.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-2.5 px-5 h-[48px] border-r transition-colors whitespace-nowrap select-none ${
              isDark
                ? 'border-white/10 hover:bg-white/5 text-slate-100'
                : 'border-slate-200 hover:bg-slate-100 text-slate-900'
            }`}
          >
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-mono font-bold text-white shrink-0 shadow-sm"
              style={{ backgroundColor: q.color }}
            >
              {q.badge}
            </span>
            <span className="font-sans font-bold text-xs tracking-tight">
              {q.name}
            </span>
            <span className={`font-mono text-[11px] font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              {q.formatted}
            </span>
            <span
              className={`font-mono text-[11px] font-bold flex items-center gap-0.5 ${
                isUp ? 'text-emerald-400' : 'text-rose-500'
              }`}
            >
              <span>{isUp ? '▲' : '▼'}</span>
              <span>{isUp ? '+' : ''}{q.change24h.toFixed(2)}%</span>
            </span>
          </a>
        );
      })}
    </div>
  );

  return (
    <div
      className="w-full h-[48px] overflow-hidden flex items-center relative"
      style={{ minHeight: '48px', height: '48px' }}
    >
      <div className="stock-marquee-track">
        {renderStrip('copy-a')}
        {renderStrip('copy-b')}
      </div>
    </div>
  );
});
