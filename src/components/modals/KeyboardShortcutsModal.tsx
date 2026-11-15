import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Keyboard, Zap } from 'lucide-react';
import { AppMode } from '../../types';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  mode: AppMode;
  onClose: () => void;
}

const SHORTCUT_GROUPS = [
  {
    title: 'FEED NAVIGATION & READING',
    items: [
      { keys: ['J'], desc: 'Select next dispatch down in feed' },
      { keys: ['K'], desc: 'Select previous dispatch up in feed' },
      { keys: ['Enter', 'O'], desc: 'Open selected dispatch in Terminal Reader' },
      { keys: ['←', '→'], desc: 'Previous / Next dispatch inside Reader Drawer' },
      { keys: ['Esc'], desc: 'Close active Drawer, Modal, or clear focus' },
    ],
  },
  {
    title: 'ACTIONS & TERMINAL CONTROLS',
    items: [
      { keys: ['/'], desc: 'Focus instant search bar' },
      { keys: ['S'], desc: 'Save / Bookmark active or focused dispatch' },
      { keys: ['L'], desc: 'Listen aloud (Audio Reader) on active/focused story' },
      { keys: ['P'], desc: 'Generate HD Share Snapshot Card for active/focused story' },
      { keys: ['C'], desc: 'Mark all new dispatches as Caught Up ✓' },
      { keys: ['M'], desc: 'Switch between Crypto & World News modes' },
      { keys: ['W'], desc: 'Toggle Cards Grid vs. Terminal Wire view' },
      { keys: ['?'], desc: 'Open or close this Keyboard Shortcuts guide' },
    ],
  },
];

export function KeyboardShortcutsModal({
  isOpen,
  mode,
  onClose,
}: KeyboardShortcutsModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100025] flex items-center justify-center p-3 sm:p-5 overflow-hidden overscroll-none select-none">
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
          className="relative w-full max-w-2xl bg-[var(--surface-solid)] border border-[var(--border)] rounded-2xl shadow-2xl z-10 text-[var(--ink)] overflow-hidden flex flex-col max-h-[88dvh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[var(--border)] shrink-0">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-xl border ${
                mode === 'world'
                  ? 'bg-blue-500/15 border-blue-500/30 text-blue-400'
                  : 'bg-red-500/15 border-red-500/30 text-red-500'
              }`}>
                <Keyboard className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display text-xl sm:text-2xl tracking-tight text-[var(--ink)]">
                  TERMINAL KEYBOARD SHORTCUTS
                </h2>
                <p className="text-[11px] font-mono text-[var(--ink-muted)]">
                  Navigate, read, listen, and share at institutional desk speed
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close Keyboard Shortcuts Modal"
              className="w-9 h-9 rounded-xl bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 text-[var(--ink)] border border-[var(--border)] flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 overflow-y-auto space-y-5">
            {SHORTCUT_GROUPS.map((group) => (
              <div key={group.title} className="space-y-2.5">
                <div className="flex items-center gap-1.5 text-[11px] font-mono font-black tracking-wider uppercase text-[var(--accent)]">
                  <Zap className="w-3.5 h-3.5" />
                  <span>{group.title}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {group.items.map((item) => (
                    <div
                      key={item.desc}
                      className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)]"
                    >
                      <span className="text-xs text-[var(--ink)] font-sans leading-snug">
                        {item.desc}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        {item.keys.map((k) => (
                          <kbd
                            key={k}
                            className="px-2 py-1 rounded-md bg-[var(--surface-solid)] border border-[var(--border)] font-mono text-[11px] font-black text-[var(--ink)] shadow-sm min-w-[26px] text-center"
                          >
                            {k}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-[var(--border)] bg-[var(--bg)] flex items-center justify-between text-[11px] font-mono text-[var(--ink-muted)]">
            <span>TIP: PRESS <strong className="text-[var(--ink)]">J</strong> OR <strong className="text-[var(--ink)]">K</strong> ANYTIME TO HIGHLIGHT CARDS</span>
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-[var(--surface-solid)] border border-[var(--border)] hover:border-[var(--accent)] text-[var(--ink)] font-bold cursor-pointer"
            >
              GOT IT
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
