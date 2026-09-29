import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Space / K', desc: 'Play / Pause live stream' },
    { key: 'M', desc: 'Mute / Unmute audio' },
    { key: 'F', desc: 'Toggle Fullscreen' },
    { key: 'P', desc: 'Toggle Picture-in-Picture (PiP)' },
    { key: 'Up / Down', desc: 'Increase / Decrease volume' },
    { key: 'C', desc: 'Toggle Cinema Mode' },
    { key: 'G', desc: 'Open Electronic Program Guide (EPG)' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="px-5 py-3.5 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-rose-500" />
            <h2 className="text-sm font-bold text-white">Keyboard Shortcuts</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded text-neutral-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 divide-y divide-neutral-800/80 text-xs">
          {shortcuts.map(sc => (
            <div key={sc.key} className="py-2 flex items-center justify-between">
              <span className="text-neutral-400">{sc.desc}</span>
              <kbd className="px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-200 font-mono text-[11px] font-semibold">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="px-4 py-3 bg-neutral-950 border-t border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
