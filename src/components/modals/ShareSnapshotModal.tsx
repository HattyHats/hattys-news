import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, Download, Check, Share2, Camera, Sparkles } from 'lucide-react';
import { Article, AppMode } from '../../types';
import { getOutletBadge, detectStoryImpact, detectAssetsInArticle } from '../../utils/classifier';
import { formatTimeAgo } from '../../utils/formatters';
import { CRYPTO_CATEGORIES, WORLD_CATEGORIES } from '../../config/feeds';
import { computeStoryPulse, PulseVote } from '../../utils/communityPulse';

interface ShareSnapshotModalProps {
  isOpen: boolean;
  article: Article | null;
  mode: AppMode;
  marketQuotes: Record<string, { price: number; change24h: number; formatted: string }>;
  userVote: PulseVote | null;
  relatedCount: number;
  onClose: () => void;
}

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    const testLine = currentLine ? `${currentLine} ${words[i]}` : words[i];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = words[i];
      if (lines.length === maxLines - 1) {
        const remaining = words.slice(i).join(' ');
        let truncated = remaining;
        while (ctx.measureText(truncated + '…').width > maxWidth && truncated.length > 0) {
          truncated = truncated.slice(0, -1).trim();
        }
        lines.push(truncated + (truncated.length < remaining.length ? '…' : ''));
        return lines;
      }
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function ShareSnapshotModal({
  isOpen,
  article,
  mode,
  marketQuotes,
  userVote,
  relatedCount,
  onClose,
}: ShareSnapshotModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copiedImage, setCopiedImage] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [copyStatusMsg, setCopyStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !article || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 1200;
    const H = 675;
    canvas.width = W;
    canvas.height = H;

    const cardMode = article.mode || mode;
    const isWorld = cardMode === 'world';
    const accent = isWorld ? '#3b82f6' : '#ef4444';
    const accentSoft = isWorld ? 'rgba(59, 130, 246, 0.16)' : 'rgba(239, 68, 68, 0.16)';
    const accentBorder = isWorld ? 'rgba(59, 130, 246, 0.45)' : 'rgba(239, 68, 68, 0.45)';

    // 1. Deep Terminal Background
    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0, isWorld ? '#060a14' : '#07070b');
    bgGrad.addColorStop(1, isWorld ? '#0b1326' : '#10080c');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Subtle Grid Overlay
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // Radial Accent Glow in Top Right
    const glow = ctx.createRadialGradient(W - 180, 110, 20, W - 180, 110, 420);
    glow.addColorStop(0, isWorld ? 'rgba(59, 130, 246, 0.22)' : 'rgba(239, 68, 68, 0.22)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // Outer Terminal Frame Border
    drawRoundedRect(ctx, 24, 24, W - 48, H - 48, 20);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Top Accent Bar inside frame
    ctx.fillStyle = accent;
    ctx.fillRect(56, 24, 180, 4);

    // 2. Header Row (Brand + Mode + Domain)
    ctx.fillStyle = accent;
    drawRoundedRect(ctx, 56, 54, 14, 14, 4);
    ctx.fill();

    ctx.font = '900 22px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText("HATTY'S NEWS TERMINAL", 80, 69);

    const modeBadgeText = isWorld ? 'GLOBAL WIRE DESK' : 'CRYPTO INTELLIGENCE WIRE';
    ctx.font = '700 13px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
    const modeW = ctx.measureText(modeBadgeText).width + 26;
    drawRoundedRect(ctx, 395, 48, modeW, 28, 6);
    ctx.fillStyle = accentSoft;
    ctx.fill();
    ctx.strokeStyle = accentBorder;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = isWorld ? '#60a5fa' : '#f87171';
    ctx.fillText(modeBadgeText, 408, 67);

    // Right Domain Pill
    const domainText = 'HATTYNEWS.ORG';
    ctx.font = '800 14px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
    const domW = ctx.measureText(domainText).width + 32;
    drawRoundedRect(ctx, W - 56 - domW, 46, domW, 32, 8);
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.16)';
    ctx.stroke();
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText(domainText, W - 56 - domW + 16, 67);

    // Divider line
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.moveTo(56, 98);
    ctx.lineTo(W - 56, 98);
    ctx.stroke();

    // 3. Metadata Row (Outlet + Category + Impact + Time)
    const outlet = getOutletBadge(article.src);
    const cats = isWorld ? WORLD_CATEGORIES : CRYPTO_CATEGORIES;
    const catObj = cats.find(c => c.id === article.primaryCat) || cats[0];
    const impact = detectStoryImpact(article.title, article.snippet);

    let cursorX = 56;
    const metaY = 122;

    // Outlet Pill
    const outletText = `${outlet.name.toUpperCase()} • ${outlet.region} DESK`;
    ctx.font = '800 14px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
    const outW = ctx.measureText(outletText).width + 24;
    drawRoundedRect(ctx, cursorX, metaY, outW, 30, 6);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillText(outletText, cursorX + 12, metaY + 20);
    cursorX += outW + 12;

    // Category Pill
    const catText = catObj.label.toUpperCase();
    const catW = ctx.measureText(catText).width + 24;
    drawRoundedRect(ctx, cursorX, metaY, catW, 30, 6);
    ctx.fillStyle = accentSoft;
    ctx.fill();
    ctx.fillStyle = isWorld ? '#93c5fd' : '#fca5a5';
    ctx.fillText(catText, cursorX + 12, metaY + 20);
    cursorX += catW + 12;

    // Impact Pill if present
    if (impact) {
      const impText = impact.label.replace(/^[^\w]+/, '').trim().toUpperCase();
      const impW = ctx.measureText(impText).width + 24;
      drawRoundedRect(ctx, cursorX, metaY, impW, 30, 6);
      ctx.fillStyle = 'rgba(245, 158, 11, 0.16)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
      ctx.stroke();
      ctx.fillStyle = '#fbbf24';
      ctx.fillText(impText, cursorX + 12, metaY + 20);
      cursorX += impW + 12;
    }

    // Timestamp on Right
    const timeText = `DISPATCHED ${formatTimeAgo(article.date).toUpperCase()}`;
    ctx.fillStyle = '#94a3b8';
    const timeW = ctx.measureText(timeText).width;
    ctx.fillText(timeText, W - 56 - timeW, metaY + 20);

    // 4. Headline (Large Bold Multi-line)
    ctx.font = '800 40px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#ffffff';
    const headlineLines = wrapCanvasText(ctx, article.title, W - 112, 3);
    let currentY = 206;
    for (const line of headlineLines) {
      ctx.fillText(line, 56, currentY);
      currentY += 50;
    }

    // 5. Executive Summary Box
    const rawSummary =
      (article.snippet || article.fullText || '').replace(/\s+/g, ' ').trim() ||
      `Verified wire dispatch reported by ${outlet.name}. Track real-time coverage, cross-outlet verification, and live market reaction on Hatty's News Terminal.`;

    const boxTop = Math.max(currentY + 4, 345);
    const boxHeight = 118;
    drawRoundedRect(ctx, 56, boxTop, W - 112, boxHeight, 12);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.035)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.09)';
    ctx.stroke();

    // Left Accent Stripe on Summary Box
    ctx.fillStyle = accent;
    drawRoundedRect(ctx, 56, boxTop, 6, boxHeight, 3);
    ctx.fill();

    ctx.font = '500 21px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#cbd5e1';
    const summaryLines = wrapCanvasText(ctx, rawSummary, W - 164, 3);
    let sumY = boxTop + 36;
    for (const sLine of summaryLines) {
      ctx.fillText(sLine, 82, sumY);
      sumY += 30;
    }

    // 6. Community Pulse & Consensus Bar
    const pulse = computeStoryPulse(article, cardMode, userVote, relatedCount);
    const pulseY = boxTop + boxHeight + 22;

    drawRoundedRect(ctx, 56, pulseY, W - 112, 62, 12);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.09)';
    ctx.stroke();

    ctx.font = '800 14px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('COMMUNITY PULSE:', 76, pulseY + 26);

    ctx.fillStyle = '#34d399';
    ctx.fillText(`▲ ${pulse.upLabel} ${pulse.upPct}%`, 235, pulseY + 26);

    ctx.fillStyle = '#fb7185';
    ctx.fillText(`▼ ${pulse.downLabel} ${pulse.downPct}%`, 430, pulseY + 26);

    ctx.fillStyle = '#64748b';
    ctx.fillText(`(${pulse.totalVotes} VOTES)`, 620, pulseY + 26);

    if (relatedCount > 0) {
      const corrText = `✓ CORROBORATED BY ${relatedCount + 1} OUTLETS`;
      ctx.fillStyle = '#34d399';
      const cw = ctx.measureText(corrText).width;
      ctx.fillText(corrText, W - 76 - cw, pulseY + 26);
    }

    // Progress split bar inside Pulse Card
    const barX = 76;
    const barY = pulseY + 38;
    const barW = W - 152;
    const barH = 8;
    drawRoundedRect(ctx, barX, barY, barW, barH, 4);
    ctx.fillStyle = 'rgba(244, 63, 94, 0.45)';
    ctx.fill();

    const greenW = Math.max(12, Math.round((barW * pulse.upPct) / 100));
    drawRoundedRect(ctx, barX, barY, greenW, barH, 4);
    ctx.fillStyle = '#10b981';
    ctx.fill();

    // 7. Bottom Live Market Ticker Footer
    const footerY = H - 72;
    ctx.font = '700 14px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
    ctx.fillStyle = '#94a3b8';

    const detected = detectAssetsInArticle(article.title, article.snippet, marketQuotes, cardMode);
    const tickerItems: string[] = [];

    if (detected.length > 0) {
      for (const a of detected.slice(0, 3)) {
        const sign = (a.change24h ?? 0) >= 0 ? '+' : '';
        tickerItems.push(
          `$${a.symbol} ${a.formatted || ''} ${typeof a.change24h === 'number' ? `(${sign}${a.change24h.toFixed(1)}%)` : ''}`.trim()
        );
      }
    }

    if (tickerItems.length < 3) {
      const defaults = isWorld ? ['OIL_CRUDE', 'GOLD', 'SPY'] : ['BTC', 'ETH', 'SOL'];
      for (const sym of defaults) {
        if (tickerItems.length >= 3) break;
        const q = marketQuotes[sym];
        if (q && q.formatted) {
          const label = sym === 'OIL_CRUDE' ? 'WTI OIL' : sym;
          const sign = q.change24h >= 0 ? '+' : '';
          tickerItems.push(`${label} ${q.formatted} (${sign}${q.change24h.toFixed(1)}%)`);
        }
      }
    }

    const tickerLine = tickerItems.length > 0
      ? `LIVE MARKETS:  ${tickerItems.join('   •   ')}`
      : 'LIVE INTELLIGENCE STREAM • CRYPTO & GLOBAL WIRE';

    ctx.fillStyle = '#e2e8f0';
    ctx.fillText(tickerLine, 56, footerY + 22);

    const watermark = 'hattynews.org';
    ctx.fillStyle = isWorld ? '#60a5fa' : '#f87171';
    const wmW = ctx.measureText(watermark).width;
    ctx.fillText(watermark, W - 56 - wmW, footerY + 22);
  }, [isOpen, article, mode, marketQuotes, userVote, relatedCount]);

  if (!isOpen || !article) return null;

  const handleCopySnapshotImage = async () => {
    if (!canvasRef.current) return;
    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvasRef.current?.toBlob((b) => resolve(b), 'image/png')
      );
      if (!blob) throw new Error('Canvas blob failed');

      if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        setCopiedImage(true);
        setCopyStatusMsg('Snapshot image copied! Paste (Ctrl+V / ⌘V) into X, Discord, or Telegram.');
        setTimeout(() => {
          setCopiedImage(false);
          setCopyStatusMsg(null);
        }, 3500);
        return;
      }
    } catch {}

    // Fallback to downloading if clipboard image write is unsupported
    handleDownloadPng();
    setCopyStatusMsg('Snapshot downloaded as PNG (browser restricted direct image clipboard).');
    setTimeout(() => setCopyStatusMsg(null), 3500);
  };

  const handleDownloadPng = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    const slug = article.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 45);
    a.href = url;
    a.download = `hattys-news-${slug || 'dispatch'}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyShareText = () => {
    const shareText = `🚨 ${article.title} (via ${article.src})\n\nLive Terminal Coverage: https://hattynews.org`;
    try {
      navigator.clipboard.writeText(shareText);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2500);
    } catch {}
  };

  const handleShareX = () => {
    const text = `🚨 ${article.title} (via ${article.src})\n\nReal-time coverage on Hatty's News Terminal:`;
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent('https://hattynews.org')}`;
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100020] flex items-center justify-center p-3 sm:p-5 overflow-hidden overscroll-none select-none">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/85 backdrop-blur-md cursor-pointer"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          className="relative w-full max-w-3xl bg-[var(--surface-solid)] border border-[var(--border)] rounded-2xl shadow-2xl z-10 text-[var(--ink)] overflow-hidden flex flex-col max-h-[92dvh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3.5 border-b border-[var(--border)] shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-mono text-[11px] font-bold uppercase border ${
                mode === 'world'
                  ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                  : 'bg-red-500/15 text-red-500 border-red-500/30'
              }`}>
                <Camera className="w-3.5 h-3.5" />
                <span>TERMINAL SNAPSHOT GENERATOR</span>
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-[var(--ink-muted)]">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>HD 1200×675 SOCIAL CARD</span>
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close Snapshot Modal"
              className="w-9 h-9 rounded-xl bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 text-[var(--ink)] border border-[var(--border)] flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Canvas Preview Area */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
            <div className="rounded-xl overflow-hidden border border-[var(--border)] shadow-2xl bg-[#07070b]">
              <canvas
                ref={canvasRef}
                className="w-full h-auto block"
              />
            </div>

            {copyStatusMsg && (
              <div className="px-3.5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-400 font-mono text-xs flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{copyStatusMsg}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              <button
                type="button"
                onClick={handleCopySnapshotImage}
                className="rbtn py-2.5 px-3 text-xs font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copiedImage ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedImage ? 'IMAGE COPIED!' : 'COPY CARD IMAGE'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPng}
                className="py-2.5 px-3 rounded-xl bg-[var(--bg)] border border-[var(--border)] hover:border-[var(--accent)] text-[var(--ink)] font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4 text-[var(--accent)]" />
                <span>DOWNLOAD PNG</span>
              </button>

              <button
                type="button"
                onClick={handleShareX}
                className="py-2.5 px-3 rounded-xl bg-[var(--bg)] border border-[var(--border)] hover:border-sky-400 text-[var(--ink)] font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-sky-400" />
                <span>POST ON 𝕏</span>
              </button>

              <button
                type="button"
                onClick={handleCopyShareText}
                className="py-2.5 px-3 rounded-xl bg-[var(--bg)] border border-[var(--border)] hover:border-emerald-400 text-[var(--ink)] font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                {copiedText ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-emerald-400" />}
                <span>{copiedText ? 'CAPTION COPIED' : 'COPY CAPTION'}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
