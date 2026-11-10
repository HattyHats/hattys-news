import React from 'react';
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
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-md bg-[var(--surface-solid)] border border-[var(--border)] rounded-2xl p-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto text-[var(--ink)]"
        >
          <button 
            className="absolute top-4 right-4 text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors p-1 cursor-pointer"
            onClick={onClose}
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
                    <Smartphone className="w-4 h-4 text-emerald-500" />
                    <span>FAST 1-CLICK INSTALLATION</span>
                  </div>
                  <p className="text-[11px] text-[var(--ink-muted)]">
                    Click the install button below or select <strong className="text-[var(--ink)]">"Install Hatty's News"</strong> from your browser menu.
                  </p>
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
