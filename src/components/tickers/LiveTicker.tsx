import React, { memo, useState, useEffect, useRef } from 'react';
import { TickerToken } from '../../types';
import { DEFAULT_TOKENS } from '../../config/assets';

const PRODUCT_IDS = Object.keys(DEFAULT_TOKENS);

interface LiveTickerProps {
  activeQuery?: string;
  onSelectSymbol?: (symbol: string) => void;
  onBatchPriceTick?: (updates: Record<string, { price: number; change: number; formatted: string }>) => void;
}

function formatCryptoPrice(rawPrice: number): string {
  return rawPrice >= 1000
    ? `$${rawPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : rawPrice >= 1
      ? `$${rawPrice.toFixed(2)}`
      : `$${rawPrice.toFixed(4)}`;
}

export const LiveTicker = memo(function LiveTicker({
  activeQuery = '',
  onSelectSymbol,
  onBatchPriceTick,
}: LiveTickerProps) {
  const [tokens, setTokens] = useState<Record<string, TickerToken>>(DEFAULT_TOKENS);
  const onBatchRef = useRef(onBatchPriceTick);
  onBatchRef.current = onBatchPriceTick;

  // Buffer high-frequency Coinbase WS messages and flush cleanly in batches
  const uiPendingRef = useRef<Record<string, { price: number; open: number; change: number; formatted: string; sym: string }>>({});
  const parentPendingRef = useRef<Record<string, { price: number; change: number; formatted: string }>>({});
  const flashResetTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchInitial = async () => {
      try {
        const cgRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,dogecoin,ripple,near,cardano&vs_currencies=usd&include_24hr_change=true');
        if (cgRes.ok && !cancelled) {
          const cg = await cgRes.json();
          const map: Record<string, { price: number; change: number }> = {
            'BTC-USD': { price: cg.bitcoin?.usd, change: cg.bitcoin?.usd_24h_change || 0 },
            'ETH-USD': { price: cg.ethereum?.usd, change: cg.ethereum?.usd_24h_change || 0 },
            'SOL-USD': { price: cg.solana?.usd, change: cg.solana?.usd_24h_change || 0 },
            'DOGE-USD': { price: cg.dogecoin?.usd, change: cg.dogecoin?.usd_24h_change || 0 },
            'XRP-USD': { price: cg.ripple?.usd, change: cg.ripple?.usd_24h_change || 0 },
            'NEAR-USD': { price: cg.near?.usd, change: cg.near?.usd_24h_change || 0 },
            'ADA-USD': { price: cg.cardano?.usd, change: cg.cardano?.usd_24h_change || 0 },
          };

          const parentUpdates: Record<string, { price: number; change: number; formatted: string }> = {};
          setTokens(prev => {
            const next = { ...prev };
            for (const [id, val] of Object.entries(map)) {
              if (val.price && next[id]) {
                const formatted = formatCryptoPrice(val.price);
                next[id] = {
                  ...next[id],
                  price: val.price,
                  change24h: val.change,
                  formatted,
                };
                parentUpdates[next[id].symbol] = { price: val.price, change: val.change, formatted };
              }
            }
            return next;
          });
          if (Object.keys(parentUpdates).length > 0 && !cancelled) {
            onBatchRef.current?.(parentUpdates);
          }
        }
      } catch {}

      const cbParentUpdates: Record<string, { price: number; change: number; formatted: string }> = {};
      await Promise.allSettled(
        PRODUCT_IDS.map(async (id) => {
          try {
            const res = await fetch(`https://api.exchange.coinbase.com/products/${id}/ticker`);
            if (!res.ok || cancelled) return;
            const data = await res.json();
            if (data && data.price && !cancelled) {
              const rawPrice = parseFloat(data.price);
              const sym = id.split('-')[0];
              const formatted = formatCryptoPrice(rawPrice);
              let computedChange = 0;
              setTokens(prev => {
                const current = prev[id];
                if (!current) return prev;
                const open = parseFloat(data.open_24h) || current.open24h || rawPrice;
                const change = open ? ((rawPrice - open) / open) * 100 : current.change24h;
                computedChange = change;
                return {
                  ...prev,
                  [id]: {
                    ...current,
                    price: rawPrice,
                    open24h: open,
                    change24h: change,
                    formatted,
                  }
                };
              });
              cbParentUpdates[sym] = { price: rawPrice, change: computedChange, formatted };
            }
          } catch {}
        })
      );
      if (Object.keys(cbParentUpdates).length > 0 && !cancelled) {
        onBatchRef.current?.(cbParentUpdates);
      }
    };
    fetchInitial();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: number | null = null;
    let isDisposed = false;

    const connect = () => {
      if (isDisposed) return;
      try {
        ws = new WebSocket('wss://ws-feed.exchange.coinbase.com');

        ws.onopen = () => {
          ws?.send(JSON.stringify({
            type: 'subscribe',
            product_ids: PRODUCT_IDS,
            channels: ['ticker']
          }));
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'ticker' && data.product_id && data.price) {
              const productId = data.product_id as string;
              const rawPrice = parseFloat(data.price);
              const open = parseFloat(data.open_24h) || rawPrice;
              const change = open ? ((rawPrice - open) / open) * 100 : 0;
              const sym = productId.split('-')[0];
              const formatted = formatCryptoPrice(rawPrice);

              uiPendingRef.current[productId] = { price: rawPrice, open, change, formatted, sym };
              parentPendingRef.current[sym] = { price: rawPrice, change, formatted };
            }
          } catch {}
        };

        ws.onclose = () => {
          if (!isDisposed) {
            reconnectTimeout = window.setTimeout(connect, 3000);
          }
        };

        ws.onerror = () => {
          ws?.close();
        };
      } catch {
        if (!isDisposed) {
          reconnectTimeout = window.setTimeout(connect, 3000);
        }
      }
    };

    connect();

    // Flush ticker UI at most every 1.5s (and skip when tab is hidden)
    const uiInterval = window.setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      const updates = uiPendingRef.current;
      const keys = Object.keys(updates);
      if (keys.length === 0) return;
      uiPendingRef.current = {};

      let anyFlash = false;
      setTokens(cur => {
        const next = { ...cur };
        for (const productId of keys) {
          const u = updates[productId];
          const prevPrice = cur[productId]?.price ?? u.price;
          const flash = u.price > prevPrice ? 'up' : u.price < prevPrice ? 'down' : null;
          if (flash) anyFlash = true;
          next[productId] = {
            symbol: u.sym,
            name: productId,
            price: u.price,
            open24h: u.open,
            change24h: u.change,
            flash,
            formatted: u.formatted,
          };
        }
        return next;
      });

      if (anyFlash) {
        if (flashResetTimerRef.current !== null) {
          window.clearTimeout(flashResetTimerRef.current);
        }
        flashResetTimerRef.current = window.setTimeout(() => {
          flashResetTimerRef.current = null;
          setTokens(cur => {
            let changed = false;
            const next = { ...cur };
            for (const key of Object.keys(next)) {
              if (next[key].flash !== null) {
                changed = true;
                next[key] = { ...next[key], flash: null };
              }
            }
            return changed ? next : cur;
          });
        }, 450);
      }
    }, 1500);

    // Push consolidated quote updates up to parent App every 12s to avoid global card grid churn
    const parentInterval = window.setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      const batch = parentPendingRef.current;
      if (Object.keys(batch).length === 0) return;
      parentPendingRef.current = {};
      onBatchRef.current?.(batch);
    }, 12000);

    return () => {
      isDisposed = true;
      if (reconnectTimeout !== null) window.clearTimeout(reconnectTimeout);
      if (flashResetTimerRef.current !== null) window.clearTimeout(flashResetTimerRef.current);
      window.clearInterval(uiInterval);
      window.clearInterval(parentInterval);
      if (ws) {
        ws.onclose = null;
        ws.onerror = null;
        ws.onmessage = null;
        ws.close();
      }
    };
  }, []);

  const cleanActive = activeQuery.trim().replace(/^\$/, '').toLowerCase();

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-1">
      {(Object.values(tokens) as TickerToken[]).map((t) => {
        const isUp = t.change24h >= 0;
        const isSelected = cleanActive === t.symbol.toLowerCase();
        return (
          <button
            type="button"
            key={t.symbol}
            onClick={() => onSelectSymbol?.(t.symbol)}
            title={
              isSelected
                ? `Filtering by ${t.symbol} — click again to clear`
                : `Click to filter news mentioning ${t.symbol}`
            }
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-md border text-xs font-mono shrink-0 transition-all cursor-pointer active:scale-95 ${
              isSelected
                ? 'bg-[var(--accent)]/15 border-[var(--accent)] text-[var(--ink)] ring-1 ring-[var(--accent)] shadow-sm'
                : t.flash === 'up'
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                  : t.flash === 'down'
                    ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                    : 'bg-[var(--surface)] border-[var(--border)] hover:border-[var(--accent)]/60 text-[var(--ink)]'
            }`}
          >
            <span className={`font-bold ${isSelected ? 'text-[var(--accent)]' : ''}`}>{t.symbol}</span>
            <span className="font-semibold">{t.formatted}</span>
            <span
              className={`text-[10px] font-bold flex items-center ${
                isUp ? 'text-emerald-400' : 'text-rose-500'
              }`}
            >
              {isUp ? '▲' : '▼'}
              {Math.abs(t.change24h).toFixed(2)}%
            </span>
          </button>
        );
      })}
    </div>
  );
});
