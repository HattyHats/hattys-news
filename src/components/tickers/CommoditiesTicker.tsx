import React, { memo, useState, useEffect, useRef } from 'react';
import { CommodityItem } from '../../types';
import { DEFAULT_COMMODITIES, DEFAULT_STOCKS } from '../../config/assets';

interface CommoditiesTickerProps {
  marketQuotes?: Record<string, { price: number; change24h: number; formatted: string }>;
}

export const CommoditiesTicker = memo(function CommoditiesTicker({ marketQuotes }: CommoditiesTickerProps) {
  const [tickerView, setTickerView] = useState<'commodities' | 'stocks'>('commodities');
  const [commodities, setCommodities] = useState<Record<string, CommodityItem>>(DEFAULT_COMMODITIES);
  const [stocks, setStocks] = useState<Record<string, CommodityItem>>(DEFAULT_STOCKS);
  const baseCommoditiesRef = useRef<Record<string, { price: number; change24h: number }>>({});
  const baseStocksRef = useRef<Record<string, { price: number; change24h: number }>>({});
  const flashTimerRef = useRef<number | null>(null);

  // Sync quotes when parent App passes updated centralized quotes
  useEffect(() => {
    if (!marketQuotes) return;

    setCommodities(prev => {
      let changed = false;
      const updated = { ...prev };
      for (const [k, item] of Object.entries(prev) as [string, CommodityItem][]) {
        const q = marketQuotes[k] || marketQuotes[item.ticker] || marketQuotes[item.symbol];
        if (q && (baseCommoditiesRef.current[k]?.price !== q.price || baseCommoditiesRef.current[k]?.change24h !== q.change24h)) {
          changed = true;
          baseCommoditiesRef.current[k] = { price: q.price, change24h: q.change24h };
          updated[k] = {
            ...item,
            price: q.price,
            change24h: q.change24h,
            formatted: q.formatted
          };
        }
      }
      return changed ? updated : prev;
    });

    setStocks(prev => {
      let changed = false;
      const updated = { ...prev };
      for (const [k, item] of Object.entries(prev) as [string, CommodityItem][]) {
        const q = marketQuotes[k] || marketQuotes[item.ticker] || marketQuotes[item.symbol];
        if (q && (baseStocksRef.current[k]?.price !== q.price || baseStocksRef.current[k]?.change24h !== q.change24h)) {
          changed = true;
          baseStocksRef.current[k] = { price: q.price, change24h: q.change24h };
          updated[k] = {
            ...item,
            price: q.price,
            change24h: q.change24h,
            formatted: q.formatted
          };
        }
      }
      return changed ? updated : prev;
    });
  }, [marketQuotes]);

  // Subtle anchored live micro-tick pulse bounded within ±0.25% of synced quote
  useEffect(() => {
    const cKeys = Object.keys(DEFAULT_COMMODITIES);
    const sKeys = Object.keys(DEFAULT_STOCKS);

    const interval = window.setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      // Tick Commodities
      const targetC = cKeys[Math.floor(Math.random() * cKeys.length)];
      setCommodities(prev => {
        const item = prev[targetC];
        if (!item) return prev;
        const base = baseCommoditiesRef.current[targetC] || {
          price: DEFAULT_COMMODITIES[targetC].price,
          change24h: DEFAULT_COMMODITIES[targetC].change24h,
        };
        const deltaPct = (Math.random() - 0.5) * 0.0014;
        const rawPrice = item.price * (1 + deltaPct);
        const minP = base.price * 0.9975;
        const maxP = base.price * 1.0025;
        const newPrice = Math.min(maxP, Math.max(minP, rawPrice));
        const flash: 'up' | 'down' = newPrice >= item.price ? 'up' : 'down';
        const driftFromBase = ((newPrice - base.price) / Math.max(base.price, 0.01)) * 100;
        const newChange = base.change24h + driftFromBase;

        let formatted = '';
        if (item.symbol === 'GOLD') {
          formatted = `$${newPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        } else if (item.symbol === 'NAT GAS' || item.symbol === 'COPPER') {
          formatted = `$${newPrice.toFixed(3)}`;
        } else {
          formatted = `$${newPrice.toFixed(2)}`;
        }

        return {
          ...prev,
          [targetC]: { ...item, price: newPrice, change24h: newChange, formatted, flash }
        };
      });

      // Tick Stocks
      const targetS = sKeys[Math.floor(Math.random() * sKeys.length)];
      setStocks(prev => {
        const item = prev[targetS];
        if (!item) return prev;
        const base = baseStocksRef.current[targetS] || {
          price: DEFAULT_STOCKS[targetS].price,
          change24h: DEFAULT_STOCKS[targetS].change24h,
        };
        const deltaPct = (Math.random() - 0.5) * 0.0012;
        const rawPrice = item.price * (1 + deltaPct);
        const minP = base.price * 0.9975;
        const maxP = base.price * 1.0025;
        const newPrice = Math.min(maxP, Math.max(minP, rawPrice));
        const flash: 'up' | 'down' = newPrice >= item.price ? 'up' : 'down';
        const driftFromBase = ((newPrice - base.price) / Math.max(base.price, 0.01)) * 100;
        const newChange = base.change24h + driftFromBase;
        const formatted = `$${newPrice.toFixed(2)}`;

        return {
          ...prev,
          [targetS]: { ...item, price: newPrice, change24h: newChange, formatted, flash }
        };
      });

      if (flashTimerRef.current !== null) {
        window.clearTimeout(flashTimerRef.current);
      }
      flashTimerRef.current = window.setTimeout(() => {
        flashTimerRef.current = null;
        setCommodities(prev => {
          if (!prev[targetC] || prev[targetC].flash === null) return prev;
          return { ...prev, [targetC]: { ...prev[targetC], flash: null } };
        });
        setStocks(prev => {
          if (!prev[targetS] || prev[targetS].flash === null) return prev;
          return { ...prev, [targetS]: { ...prev[targetS], flash: null } };
        });
      }, 450);
    }, 3000);

    return () => {
      window.clearInterval(interval);
      if (flashTimerRef.current !== null) {
        window.clearTimeout(flashTimerRef.current);
      }
    };
  }, []);

  const activeItems = tickerView === 'commodities' 
    ? (Object.values(commodities) as CommodityItem[])
    : (Object.values(stocks) as CommodityItem[]);

  return (
    <div className="w-full flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-1">
      {/* Switcher Badge: Toggle Between Commodities and Stocks */}
      <div className="flex items-center gap-1 bg-black/20 p-0.5 rounded-lg border border-[var(--border)] shrink-0 font-mono text-[10px]">
        <button
          onClick={() => setTickerView('commodities')}
          className={`px-2 py-0.5 rounded font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            tickerView === 'commodities'
              ? 'bg-amber-500/20 text-amber-500 border border-amber-500/40 shadow-sm'
              : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
          }`}
          title="Show Live Commodities & Energy"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${tickerView === 'commodities' ? 'bg-amber-500' : 'bg-gray-400'} shrink-0`} />
          COMMODITIES
        </button>
        <button
          onClick={() => setTickerView('stocks')}
          className={`px-2 py-0.5 rounded font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            tickerView === 'stocks'
              ? 'bg-blue-500/20 text-blue-500 border border-blue-500/40 shadow-sm'
              : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
          }`}
          title="Show Live Stocks & Indices"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${tickerView === 'stocks' ? 'bg-blue-500' : 'bg-gray-400'} shrink-0`} />
          STOCKS
        </button>
      </div>

      {/* Stream of Live Assets with Flash Indicators */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {activeItems.map((item) => (
          <div
            key={item.symbol}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono text-xs transition-colors duration-200 shrink-0 ${
              item.flash === 'up'
                ? 'bg-emerald-500/25 border-emerald-500/60 text-emerald-400'
                : item.flash === 'down'
                ? 'bg-rose-500/25 border-rose-500/60 text-rose-400'
                : 'bg-[var(--surface-solid)] border-[var(--border)] text-[var(--ink)] hover:border-[var(--accent)] shadow-sm'
            }`}
          >
            <span className="font-bold text-[var(--ink-muted)] text-[11px]">{item.symbol}</span>
            <span className="font-semibold text-[var(--ink)] tracking-tight">{item.formatted}</span>
            <span className={`text-[10px] font-bold flex items-center gap-0.5 ${
              item.change24h >= 0 ? 'text-emerald-500 dark:text-green-400' : 'text-rose-500 dark:text-red-400'
            }`}>
              {item.change24h >= 0 ? '▲' : '▼'}{Math.abs(item.change24h).toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});
