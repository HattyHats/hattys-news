import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Share2, Smartphone, Download } from 'lucide-react';

interface PwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isIOS: boolean;
  deferredPrompt: any;
  onInstalled: () => void;
}

export function PwaInstallModal({
  isOpen,
  onClose,
  isIOS,
  deferredPrompt,
  onInstalled
}: PwaInstallModalProps) {
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

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100000] flex items-center justify-center p-3 sm:p-4 overflow-hidden overscroll-none select-none">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/85 backdrop-blur-md cursor-pointer"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-md max-h-[90dvh] overflow-y-auto overscroll-contain touch-scroll bg-[var(--surface-solid)] border border-[var(--border)] rounded-2xl p-5 sm:p-6 shadow-2xl z-10 text-[var(--ink)] select-text touch-pan-y scrollbar-thin"
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            type="button"
            onClick={onClose}
            aria-label="Close Install App Modal"
            className="absolute top-3.5 right-3.5 w-10 h-10 rounded-xl bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 active:scale-95 text-[var(--ink)] flex items-center justify-center transition-all cursor-pointer border border-[var(--border)] shadow-sm touch-manipulation z-30"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center">
            <div className="relative inline-block mb-3">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-red-600 to-blue-600 blur-lg opacity-60" />
              <img 
                src="/favicon.svg" 
                alt="Hatty's News Logo" 
                className="relative w-16 h-16 rounded-2xl border border-white/20 shadow-xl mx-auto" 
              />
            </div>

            <div className="cs mb-1">STANDALONE WEB APP</div>
            <h2 className="font-display text-3xl sm:text-4xl text-[var(--ink)] mb-2">INSTALL HATTY'S NEWS</h2>
            <p className="text-xs text-[var(--ink-muted)] mb-5">
              Save Hatty's News directly to your Home Screen or Desktop for instant, full-screen offline-ready access.
            </p>

            {isIOS ? (
              /* iOS Safari Instructions */
              <div className="text-left space-y-3 bg-[var(--bg)] p-4 rounded-xl border border-[var(--border)] text-xs font-mono text-[var(--ink)]">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-500 font-bold flex items-center justify-center shrink-0">1</span>
                  <div>
                    Tap the <strong className="text-[var(--ink)]">Share</strong> button <Share2 className="w-3.5 h-3.5 inline text-blue-500 mx-1" /> at the bottom of Safari.
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-500 font-bold flex items-center justify-center shrink-0">2</span>
                  <div>
                    Scroll down and tap <strong className="text-[var(--ink)]">"Add to Home Screen"</strong> <span className="text-amber-500">📲</span>.
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-500 font-bold flex items-center justify-center shrink-0">3</span>
                  <div>
                    Tap <strong className="text-[var(--ink)]">"Add"</strong> in the top right. Hatty's News will now open as a standalone app!
                  </div>
                </div>
              </div>
            ) : (
              /* Android / Desktop Chrome & Edge Instructions */
              <div className="space-y-4">
                <div className="text-left space-y-2.5 bg-[var(--bg)] p-4 rounded-xl border border-[var(--border)] text-xs font-mono text-[var(--ink-muted)]">
                  <div className="flex items-center gap-2 text-[var(--ink)] font-bold">
                    <Smartphone className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{deferredPrompt ? 'FAST 1-CLICK INSTALLATION' : 'INSTALL VIA CHROME / EDGE MENU'}</span>
                  </div>
                  {deferredPrompt ? (
                    <p className="text-[11px] text-[var(--ink-muted)] leading-relaxed">
                      Click the install button below to add <strong className="text-[var(--ink)]">Hatty&apos;s News</strong> to your dock, taskbar, or home screen as a native-style standalone app.
                    </p>
                  ) : (
                    <ul className="space-y-1.5 text-[11px] text-[var(--ink-muted)] leading-relaxed">
                      <li>• <strong className="text-[var(--ink)]">Desktop Chrome/Edge:</strong> Click the <strong className="text-[var(--ink)]">Install App</strong> icon in the address bar, or open <strong className="text-[var(--ink)]">⋮ → Cast, save, and share → Install page as app…</strong></li>
                      <li>• <strong className="text-[var(--ink)]">Android Chrome:</strong> Tap <strong className="text-[var(--ink)]">⋮ → Add to Home screen / Install app</strong>.</li>
                    </ul>
                  )}
                </div>

                <button
                  onClick={async () => {
                    if (deferredPrompt) {
                      deferredPrompt.prompt();
                      const choice = await deferredPrompt.userChoice;
                      if (choice?.outcome === 'accepted') {
                        onInstalled();
                        onClose();
                      }
                    } else {
                      onClose();
                    }
                  }}
                  className="w-full py-3 bg-gradient-to-r from-red-600 via-purple-600 to-blue-600 text-white font-mono font-bold text-xs rounded-xl shadow-[0_0_25px_rgba(220,38,38,0.4)] hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-white" />
                  <span>{deferredPrompt ? 'INSTALL APP NOW' : 'GOT IT'}</span>
                </button>
              </div>
            )}

            <div className="flex justify-between items-center text-[10px] font-mono text-[var(--ink-muted)] border-t border-[var(--border)] pt-4 mt-5">
              <span>FREE // NO APP STORE NEEDED</span>
              <span className="text-emerald-500 font-bold">PWA READY ✓</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
