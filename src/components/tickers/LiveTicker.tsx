import React, { useState, useEffect, useRef } from 'react';
import { Radio, Zap } from 'lucide-react';
import { TickerToken } from '../../types';
import { DEFAULT_TOKENS } from '../../config/assets';

interface LiveTickerProps {
  onPriceTick?: (sym: string, price: number, change: number, formatted: string) => void;
}

export function LiveTicker({ onPriceTick }: LiveTickerProps) {
  const [tokens, setTokens] = useState<Record<string, TickerToken>>(DEFAULT_TOKENS);
  const [isConnected, setIsConnected] = useState(false);
  const tokensRef = useRef(tokens);
  tokensRef.current = tokens;

  // Throttled price tick queue to prevent re-render flooding in parent App
  const pendingTicksRef = useRef<Record<string, { price: number; change: number; formatted: string }>>({});
  const tickFlushTimeoutRef = useRef<any>(null);

  const scheduleThrottledTick = (sym: string, price: number, change: number, formatted: string) => {
    pendingTicksRef.current[sym] = { price, change, formatted };
    if (!tickFlushTimeoutRef.current) {
      tickFlushTimeoutRef.current = setTimeout(() => {
        tickFlushTimeoutRef.current = null;
        if (!onPriceTick) return;
        for (const [s, data] of Object.entries(pendingTicksRef.current) as [string, { price: number; change: number; formatted: string }][]) {
          onPriceTick(s, data.price, data.change, data.formatted);
        }
        pendingTicksRef.current = {};
      }, 1000); // 1-second batch throttle
    }
  };

  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const cgRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,dogecoin,ripple&vs_currencies=usd&include_24hr_change=true');
        if (cgRes.ok) {
          const cg = await cgRes.json();
          const map: Record<string, { price: number; change: number }> = {
            'BTC-USD': { price: cg.bitcoin?.usd, change: cg.bitcoin?.usd_24h_change || 0 },
            'ETH-USD': { price: cg.ethereum?.usd, change: cg.ethereum?.usd_24h_change || 0 },
            'SOL-USD': { price: cg.solana?.usd, change: cg.solana?.usd_24h_change || 0 },
            'DOGE-USD': { price: cg.dogecoin?.usd, change: cg.dogecoin?.usd_24h_change || 0 },
            'XRP-USD': { price: cg.ripple?.usd, change: cg.ripple?.usd_24h_change || 0 },
          };

          setTokens(prev => {
            const next = { ...prev };
            for (const [id, val] of Object.entries(map)) {
              if (val.price && next[id]) {
                const rawPrice = val.price;
                const formatted = rawPrice >= 1000
                  ? `$${rawPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : rawPrice >= 1 ? `$${rawPrice.toFixed(2)}` : `$${rawPrice.toFixed(4)}`;
                next[id] = {
                  ...next[id],
                  price: rawPrice,
                  change24h: val.change,
                  formatted
                };
              }
            }
            return next;
          });
        }
      } catch {}

      const productIds = ['BTC-USD', 'ETH-USD', 'SOL-USD', 'DOGE-USD', 'XRP-USD'];
      productIds.forEach(async (id) => {
        try {
          const res = await fetch(`https://api.exchange.coinbase.com/products/${id}/ticker`);
          if (!res.ok) return;
          const data = await res.json();
          if (data && data.price) {
            const rawPrice = parseFloat(data.price);
            setTokens(prev => {
              const current = prev[id];
              if (!current) return prev;
              const open = parseFloat(data.open_24h) || current.open24h || rawPrice;
              const change = open ? ((rawPrice - open) / open) * 100 : current.change24h;
              const formatted = rawPrice >= 1000 
                ? `$${rawPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : rawPrice >= 1 ? `$${rawPrice.toFixed(2)}` : `$${rawPrice.toFixed(4)}`;
              return {
                ...prev,
                [id]: {
                  ...current,
                  price: rawPrice,
                  open24h: open,
                  change24h: change,
                  formatted
                }
              };
            });
          }
        } catch {}
      });
    };
    fetchInitial();
  }, []);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connect = () => {
      try {
        ws = new WebSocket('wss://ws-feed.exchange.coinbase.com');

        ws.onopen = () => {
          setIsConnected(true);
          ws?.send(JSON.stringify({
            type: 'subscribe',
            product_ids: ['BTC-USD', 'ETH-USD', 'SOL-USD', 'DOGE-USD', 'XRP-USD'],
            channels: ['ticker']
          }));
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'ticker' && data.product_id && data.price) {
              const productId = data.product_id;
              const rawPrice = parseFloat(data.price);
              const open = parseFloat(data.open_24h) || rawPrice;
              const change = open ? ((rawPrice - open) / open) * 100 : 0;
              const sym = productId.split('-')[0];
              const prev = tokensRef.current[productId];
              const prevPrice = prev ? prev.price : rawPrice;
              const flash = rawPrice > prevPrice ? 'up' : rawPrice < prevPrice ? 'down' : null;

              const formatted = rawPrice >= 1000 
                ? `$${rawPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : rawPrice >= 1 
                ? `$${rawPrice.toFixed(2)}`
                : `$${rawPrice.toFixed(4)}`;

              setTokens(cur => ({
                ...cur,
                [productId]: {
                  symbol: sym,
                  name: productId,
                  price: rawPrice,
                  open24h: open,
                  change24h: change,
                  flash,
                  formatted
                }
              }));

              // Throttled notification to parent App
              scheduleThrottledTick(sym, rawPrice, change, formatted);

              if (flash) {
                setTimeout(() => {
                  setTokens(cur => {
                    if (!cur[productId] || cur[productId].flash === null) return cur;
                    return {
                      ...cur,
                      [productId]: {
                        ...cur[productId],
                        flash: null
                      }
                    };
                  });
                }, 450);
              }
            }
          } catch {}
        };

        ws.onclose = () => {
          setIsConnected(false);
          reconnectTimeout = setTimeout(connect, 3000);
        };

        ws.onerror = () => {
          ws?.close();
        };
      } catch {
        reconnectTimeout = setTimeout(connect, 3000);
      }
    };

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      clearTimeout(tickFlushTimeoutRef.current);
      if (ws) ws.close();
    };
  }, []);

  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 px-1">
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--surface)] border border-[var(--border)] text-[10px] font-mono shrink-0">
        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
        <span className="font-bold text-[var(--ink)]">COINBASE PRO</span>
        <span className="text-[var(--ink-muted)] hidden sm:inline">TICKER</span>
      </div>

      {(Object.values(tokens) as TickerToken[]).map((t) => {
        const isUp = t.change24h >= 0;
        return (
          <div
            key={t.name}
            className={`flex items-center gap-2 px-3 py-1 rounded-md border text-xs font-mono shrink-0 transition-colors ${
              t.flash === 'up'
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                : t.flash === 'down'
                ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                : 'bg-[var(--surface)] border-[var(--border)] text-[var(--ink)]'
            }`}
          >
            <span className="font-bold">{t.symbol}</span>
            <span className="font-semibold">{t.formatted}</span>
            <span
              className={`text-[10px] font-bold flex items-center ${
                isUp ? 'text-emerald-400' : 'text-rose-500'
              }`}
            >
              {isUp ? '▲' : '▼'}
              {Math.abs(t.change24h).toFixed(2)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
