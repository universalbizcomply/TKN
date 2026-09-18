import React from 'react';
import { Keyboard, X, Sparkles, Check } from 'lucide-react';
import { ARCHIVE_SHORTCUTS } from '../hooks/useArchiveShortcuts';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="keyboardShortcutsModal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-xs select-none"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-[#fbf9f3] bg-notebook-paper border-4 border-black p-4 sm:p-5 shadow-[8px_8px_0px_#000000] transform -rotate-0.5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b-2 border-black pb-2.5">
          <div className="flex items-center gap-2">
            <div className="bg-black text-[#fff500] p-1.5 border border-black shadow-xs">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-headline font-black text-sm uppercase tracking-wider text-black">
                  POWER-USER SHORTCUTS
                </h3>
                <span className="bg-[#feef89] text-black border border-black text-[9px] font-mono-tag font-bold px-1.5 uppercase">
                  ACTIVE
                </span>
              </div>
              <p className="font-mono-tag text-[10px] text-neutral-600">
                TO KNOW NOTHING ARCHIVE // QUICK-KEY DIRECTORY
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 bg-white hover:bg-black hover:text-white text-black border-2 border-black flex items-center justify-center font-bold text-xs cursor-pointer shadow-xs active:translate-y-0.5"
            title="Close [Esc]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="space-y-2 font-mono-tag">
          {ARCHIVE_SHORTCUTS.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2 bg-white border-2 border-black shadow-xs hover:bg-yellow-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-black font-medium">{item.description}</span>
              </div>
              <div className="flex items-center gap-1">
                {item.key.split(' ').map((k, kIdx) =>
                  k === 'or' ? (
                    <span key={kIdx} className="text-[9px] text-neutral-400 font-bold px-0.5">
                      or
                    </span>
                  ) : (
                    <kbd
                      key={kIdx}
                      className="bg-neutral-100 hover:bg-yellow-200 border-2 border-black text-black px-2 py-0.5 text-xs font-black shadow-[1px_1px_0px_#000] uppercase"
                    >
                      {k}
                    </kbd>
                  )
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Categories Number Shortcuts Callout */}
        <div className="bg-[#feef89] border-2 border-black p-2.5 shadow-xs space-y-1 font-mono-tag">
          <div className="flex items-center gap-1.5 text-xs font-bold text-black uppercase">
            <Sparkles className="w-3.5 h-3.5 text-black" />
            <span>NUMERIC CATEGORY JUMPS:</span>
          </div>
          <div className="grid grid-cols-3 gap-1 text-[10px] pt-1">
            <span className="truncate"><kbd className="bg-white border border-black px-1 font-bold">1</kbd> Best Sellers</span>
            <span className="truncate"><kbd className="bg-white border border-black px-1 font-bold">2</kbd> What's New</span>
            <span className="truncate"><kbd className="bg-white border border-black px-1 font-bold">3</kbd> Hoodies</span>
            <span className="truncate"><kbd className="bg-white border border-black px-1 font-bold">4</kbd> Tees</span>
            <span className="truncate"><kbd className="bg-white border border-black px-1 font-bold">5</kbd> Sweatshirts</span>
            <span className="truncate"><kbd className="bg-white border border-black px-1 font-bold">6</kbd> Pants</span>
          </div>
        </div>

        {/* Footer Hint */}
        <div className="flex items-center justify-between text-[10px] font-mono-tag text-neutral-600 pt-1">
          <span>* Shortcuts are automatically paused when typing in form inputs.</span>
          <button
            onClick={onClose}
            className="text-black font-bold underline hover:text-red-600 uppercase cursor-pointer"
          >
            DISMISS [ESC]
          </button>
        </div>
      </div>
    </div>
  );
};
