import React, { useState } from 'react';

export type InfoModalType = 'about' | 'contact' | 'terms' | 'sketch' | 'drop' | null;

interface ZineInfoModalProps {
  type: InfoModalType;
  onClose: () => void;
}

export const ZineInfoModal: React.FC<ZineInfoModalProps> = ({ type, onClose }) => {
  const [contactSent, setContactSent] = useState(false);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  if (!type) return null;

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSent(true);
    setTimeout(() => {
      setContactSent(false);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-[#121212]/80 backdrop-blur-xs" onClick={onClose} />

      {/* Sheet Container */}
      <div className="relative w-full max-w-xl bg-[#faf8f2] bg-notebook-paper border-4 border-[#111111] polaroid-drop-shadow-lg p-5 sm:p-8 z-10 my-auto">
        
        {/* Masking Tape */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-28 h-7 masking-tape z-20 opacity-95 shadow transform -rotate-1 pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-[#111111] pb-3 mb-5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
            <span className="font-mono-tag font-bold text-xs uppercase tracking-wider text-neutral-900">
              {type === 'about' && 'ARCHIVE MANIFESTO // ABOUT TO KNOW NOTHING'}
              {type === 'contact' && 'COMMUNICATIONS // CONTACT ARCHIVE'}
              {type === 'terms' && 'TERMS & REPAIR GUARANTEE // S/S 26'}
              {type === 'sketch' && 'SKETCH NOTE // ARCHIVE INTERACTION GUIDE'}
              {type === 'drop' && 'WHAT\'S NEW DROP // FRIDAY MIDNIGHT SCHEDULE'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="bg-[#111111] hover:bg-neutral-800 text-white font-mono-tag text-xs font-bold px-2.5 py-1 border border-black"
          >
            [✕]
          </button>
        </div>

        {/* Content based on modal type */}
        {type === 'about' && (
          <div className="space-y-4 font-typewriter text-xs text-neutral-800 leading-relaxed">
            <div className="bg-[#feef89] border-2 border-black p-3 font-marker text-sm text-[#111111] transform -rotate-1">
              "WE DO NOT MAKE FAST FASHION. WE MAKE BULLETPROOF COTTON ARMOR."
            </div>

            <p>
              To Know Nothing™ was founded as an underground skater & printmaker zine archive. Sick of paper-thin fast fashion tees twisting after one wash, we sourced 500GSM ultra-dense loopback French Terry and 14oz duck canvas.
            </p>

            <div className="border-t border-b border-dashed border-neutral-400 py-3 space-y-1 font-mono-tag text-[11px]">
              <div className="font-bold text-black uppercase">THE 3 ARCHIVAL PILLARS:</div>
              <div>01 // ZERO PRE-PACKAGED PLASTIC</div>
              <div>02 // 100% PRE-SHRUNK INDUSTRIAL MINERAL WASH</div>
              <div>03 // INDESTRUCTIBLE CHAINSTITCHING</div>
            </div>

            <p>
              Every garment is hand-inspected, tagged with physical typewriter cards, and shipped worldwide in biodegradable unbleached mailers from our London studio.
            </p>

            <div className="bg-[#f2efe6] border border-black p-2.5 space-y-1 text-[10px] font-mono-tag">
              <span className="font-bold text-black uppercase block">UK STUDIO & REGISTERED OFFICE:</span>
              <p className="text-neutral-700">
                TO KNOW NOTHING APPAREL LTD<br />
                Studio 4B, Redchurch Street, Shoreditch<br />
                London E2 7DD, United Kingdom<br />
                Registered in England & Wales (#14289104) • VAT GB 392 8410 92
              </p>
            </div>
          </div>
        )}

        {type === 'contact' && (
          <div className="space-y-4">
            {contactSent ? (
              <div className="py-8 text-center space-y-2">
                <span className="font-marker text-xl text-green-700">✓ TRANSMISSION PINNED!</span>
                <p className="font-typewriter text-xs text-neutral-700">
                  The print shop crew will respond within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-3 font-mono-tag text-xs">
                <div>
                  <label className="block text-neutral-600 mb-1">YOUR EMAIL / DISCORD HANDLE</label>
                  <input
                    required
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="skater@domain.com"
                    className="w-full bg-white border-2 border-black p-2 outline-none focus:bg-yellow-50"
                  />
                </div>

                <div>
                  <label className="block text-neutral-600 mb-1">INQUIRY / CUSTOM SCREENPRINT INQUIRY</label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Ask about sizing, upcoming Friday drops, or wholesale..."
                    className="w-full bg-white border-2 border-black p-2 outline-none focus:bg-yellow-50 font-typewriter"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#111111] hover:bg-black text-[#fff500] font-headline font-bold text-sm py-2.5 border-2 border-black shadow-[3px_3px_0px_#111111]"
                >
                  SEND TRANSMISSION ➔
                </button>
              </form>
            )}

            <div className="border-t border-dashed border-neutral-400 pt-3 text-[11px] font-mono-tag text-neutral-600 flex justify-between">
              <span>DISCORD: #toknownothing-archive</span>
              <span>IG: @toknownothing.heavy</span>
            </div>
          </div>
        )}

        {type === 'terms' && (
          <div className="space-y-3 font-typewriter text-xs text-neutral-800 leading-relaxed">
            <h4 className="font-headline font-black text-sm uppercase text-black">
              10-YEAR SEAM REPAIR GUARANTEE
            </h4>
            <p>
              If any bar-tack or chainstitch fails while skating or working, mail it back to our studio. We will repair the stitch with contrasting yellow waxed thread for free.
            </p>

            <h4 className="font-headline font-black text-sm uppercase text-black pt-2">
              30-DAY CRUMPLE-FREE RETURNS
            </h4>
            <p>
              If the boxy fit doesn't match your proportions, return unworn with intact zine hangtags within 30 days for an exchange or full refund.
            </p>
          </div>
        )}

        {type === 'sketch' && (
          <div className="space-y-3 font-typewriter text-xs text-neutral-800 leading-relaxed">
            <div className="bg-white border-2 border-black p-3 space-y-2">
              <div className="font-marker text-sm text-[#111111]">
                HOW TO OPERATE THE ARCHIVE POLAROIDS:
              </div>
              <ul className="list-disc pl-5 space-y-1.5 font-typewriter">
                <li>
                  <strong>Top Right [1/3 ⤢] Pill:</strong> Click to immediately cycle front, back, and detail macro shots right on the page.
                </li>
                <li>
                  <strong>Clicking Any Polaroid:</strong> Opens the floating photo studio with high-resolution 2x zoom and macro weave inspection.
                </li>
                <li>
                  <strong>Hover Stacking:</strong> Each card sits atop stacked offset physical cards that slide on interaction.
                </li>
              </ul>
            </div>
          </div>
        )}

        {type === 'drop' && (
          <div className="space-y-4 font-mono-tag text-xs">
            <div className="bg-[#111111] text-white p-4 text-center border-2 border-black space-y-1">
              <div className="text-yellow-300 font-marker text-lg">NEXT DROP: FRIDAY MIDNIGHT</div>
              <div className="text-xs font-typewriter text-neutral-300">
                COUNTDOWN: 03 DAYS : 07 HRS : 22 MIN
              </div>
            </div>

            <div className="space-y-2">
              <div className="font-bold text-black uppercase">SCHEDULED PREVIEWS:</div>
              <div className="bg-white border border-black p-2 flex justify-between items-center">
                <span>01 // DOUBLE HOOD 600GSM PARKA</span>
                <span className="font-bold text-red-600">LIMITED 40 PCS</span>
              </div>
              <div className="bg-white border border-black p-2 flex justify-between items-center">
                <span>02 // ACID DISTRESSED SKATE CARPENTER</span>
                <span className="font-bold text-black">IN WORKSHOP</span>
              </div>
              <div className="bg-white border border-black p-2 flex justify-between items-center">
                <span>03 // 340GSM THERMAL WAFFLE IN SAGE</span>
                <span className="font-bold text-black">TEST WEAVE</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full bg-[#feef89] border-2 border-black font-marker text-xs py-2 text-black hover:bg-yellow-300"
            >
              GOT IT // BROWSE CURRENT INVENTORY ➔
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
