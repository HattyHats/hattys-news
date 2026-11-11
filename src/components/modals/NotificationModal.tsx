import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Bell, BellRing, BellOff, Zap, Smartphone, ShieldCheck, ExternalLink } from 'lucide-react';

export function NotificationModal({
  isOpen,
  onClose,
  isEnabled,
  permission,
  onToggle,
  onTest
}: {
  isOpen: boolean;
  onClose: () => void;
  isEnabled: boolean;
  permission: NotificationPermission | 'unsupported';
  onToggle: () => void;
  onTest: () => void;
}) {
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalTouchAction = document.body.style.touchAction;
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.touchAction = originalTouchAction;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

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
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        className="relative w-full max-w-lg bg-[var(--surface-solid)] border border-[var(--border)] rounded-2xl p-5 sm:p-6 shadow-2xl z-10 max-h-[92vh] overflow-y-auto overscroll-contain text-[var(--ink)] select-text touch-pan-y scrollbar-thin"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Notifications Modal"
          className="absolute top-3.5 right-3.5 w-10 h-10 rounded-xl bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 active:scale-95 text-[var(--ink)] flex items-center justify-center transition-all cursor-pointer border border-[var(--border)] shadow-sm touch-manipulation z-30"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 dark:text-emerald-400 mb-3 shadow-[0_0_20px_rgba(16,185,129,0.25)]">
            {isEnabled ? <BellRing className="w-6 h-6 animate-bounce" /> : <Bell className="w-6 h-6" />}
          </div>

          <div className="cs mb-1">REAL-TIME DISPATCH ALERTS</div>
          <h2 className="font-display text-3xl sm:text-4xl text-[var(--ink)] mb-2">
            BREAKING NEWS NOTIFICATIONS
          </h2>
          <p className="text-xs text-[var(--ink-muted)] max-w-md mx-auto mb-4 leading-relaxed">
            Get instant native notifications whenever high-impact breaking global stories or crypto catalyst dispatches drop.
          </p>

          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 mb-5 text-xs font-mono font-bold tracking-wider">
            {isEnabled ? (
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                ACTIVE // YOU WILL RECEIVE BREAKING ALERTS
              </span>
            ) : permission === 'denied' ? (
              <span className="text-rose-500 flex items-center gap-1.5 border border-rose-500/40 bg-rose-500/10 px-3 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                BLOCKED BY BROWSER // PERMISSION REQUIRED
              </span>
            ) : permission === 'unsupported' ? (
              <span className="text-amber-500 flex items-center gap-1.5 border border-amber-500/40 bg-amber-500/10 px-3 py-1 rounded-full">
                NOT SUPPORTED IN CURRENT BROWSER
              </span>
            ) : (
              <span className="text-[var(--ink-muted)] flex items-center gap-1.5 border border-[var(--border)] bg-black/5 dark:bg-white/5 px-3 py-1 rounded-full">
                OFF // TAP BELOW TO ACTIVATE
              </span>
            )}
          </div>

          {/* Value Props Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left mb-6 font-mono text-xs">
            <div className="p-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl">
              <div className="flex items-center gap-1.5 font-bold text-[var(--ink)] mb-1">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>ZERO SPAM PROTOCOL</span>
              </div>
              <p className="text-[11px] text-[var(--ink-muted)] leading-relaxed font-sans">
                Only top-tier wire consensus reports and major market catalysts trigger alerts.
              </p>
            </div>

            <div className="p-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl">
              <div className="flex items-center gap-1.5 font-bold text-[var(--ink)] mb-1">
                <Smartphone className="w-3.5 h-3.5 text-blue-500" />
                <span>CHROME APP & WEB PWA</span>
              </div>
              <p className="text-[11px] text-[var(--ink-muted)] leading-relaxed font-sans">
                Delivered straight to your mobile lock screen or desktop notification center.
              </p>
            </div>

            <div className="p-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl">
              <div className="flex items-center gap-1.5 font-bold text-[var(--ink)] mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>100% FREE & PRIVATE</span>
              </div>
              <p className="text-[11px] text-[var(--ink-muted)] leading-relaxed font-sans">
                No tracking, no sign-ups, and no emails. Pure browser-native delivery.
              </p>
            </div>

            <div className="p-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl">
              <div className="flex items-center gap-1.5 font-bold text-[var(--ink)] mb-1">
                <ExternalLink className="w-3.5 h-3.5 text-purple-500" />
                <span>1-CLICK DIRECT READ</span>
              </div>
              <p className="text-[11px] text-[var(--ink-muted)] leading-relaxed font-sans">
                Tap any notification to immediately open the full verified wire report.
              </p>
            </div>
          </div>

          {permission === 'denied' && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 dark:text-rose-400 text-xs font-mono text-left">
              <strong>Notice:</strong> Notifications were previously blocked for this site. Click the lock or settings icon in your browser's address bar, set <em>Notifications</em> to <strong>Allow</strong>, and reload.
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            <button
              onClick={onToggle}
              className={`w-full py-3 rounded-xl font-mono text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                isEnabled
                  ? 'bg-rose-500/15 text-rose-500 dark:text-rose-400 border border-rose-500/30 hover:bg-rose-500/25'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.35)]'
              }`}
            >
              {isEnabled ? (
                <>
                  <BellOff className="w-4 h-4" />
                  <span>DISABLE BREAKING ALERTS</span>
                </>
              ) : (
                <>
                  <BellRing className="w-4 h-4" />
                  <span>ACTIVATE BREAKING ALERTS NOW</span>
                </>
              )}
            </button>

            {isEnabled && (
              <button
                onClick={onTest}
                className="w-full py-2.5 rounded-xl font-mono text-xs font-bold text-[var(--ink-muted)] hover:text-[var(--ink)] bg-[var(--bg)] border border-[var(--border)] hover:border-[var(--accent)]/50 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>SEND TEST ALERT TO MY DEVICE</span>
              </button>
            )}
          </div>

          <div className="flex justify-between items-center text-[10px] font-mono text-[var(--ink-muted)] border-t border-[var(--border)] pt-3 mt-5">
            <span>TERMINAL NOTIFICATION DISPATCH</span>
            <span className="text-emerald-500 dark:text-emerald-400 font-bold">W3C WEB NOTIFICATIONS ✓</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
