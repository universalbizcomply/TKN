import React, { useState, useEffect } from 'react';
import { X, Bell, Mail, Sparkles, Check, ArrowRight } from 'lucide-react';
import { ProductItem } from '../types';
import { api } from '../lib/api';

interface NotifyMeModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductItem | null;
  initialSize?: string;
  onSuccess?: (message: string) => void;
}

export const NotifyMeModal: React.FC<NotifyMeModalProps> = ({
  isOpen,
  onClose,
  product,
  initialSize,
  onSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && product) {
      setIsSuccess(false);
      setError(null);
      // Pick initial size or first sold out size or first available size
      if (initialSize) {
        setSelectedSize(initialSize);
      } else if (product.availableSizes && product.availableSizes.length > 0) {
        const soldOutSize = product.availableSizes.find(
          (sz) => product.stock?.[sz] === 0
        );
        setSelectedSize(soldOutSize || product.availableSizes[0]);
      } else {
        setSelectedSize('ANY');
      }
    }
  }, [isOpen, product, initialSize]);

  if (!isOpen || !product) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await api.joinWaitlist({
        productId: product.id,
        productTitle: product.title,
        size: selectedSize || 'ANY',
        email,
        gsm: product.gsm,
      });

      if (res.success) {
        setIsSuccess(true);
        onSuccess?.(`✓ Restock alert registered for ${product.title} (${selectedSize})`);
        setTimeout(() => {
          onClose();
        }, 2200);
      } else {
        setError(res.error || 'Failed to register waitlist entry');
      }
    } catch (err: any) {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="notifyMeModalOverlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs select-none"
      onClick={onClose}
    >
      <div
        id="notifyMeModalCard"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-[#fbf9f3] bg-notebook-paper border-2 border-black shadow-[6px_6px_0px_#000000] p-4 sm:p-6 text-black font-mono-tag animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Masking tape header sticker */}
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#feef89] border border-black px-3 py-0.5 text-[8px] sm:text-[9px] font-black uppercase tracking-wider shadow-xs transform -rotate-1">
          <span>[RESTOCK DISPATCH // WAITLIST QUEUE]</span>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2.5 right-2.5 w-7 h-7 bg-white hover:bg-neutral-200 border-2 border-black flex items-center justify-center cursor-pointer shadow-2xs active:scale-95 transition-transform"
          title="Close modal"
        >
          <X className="w-4 h-4 text-black" />
        </button>

        {isSuccess ? (
          <div className="py-6 text-center space-y-3">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 border-2 border-black text-emerald-700 shadow-xs mb-1">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
            
            <div className="border-2 border-black bg-yellow-200 p-2 transform -rotate-1 inline-block shadow-xs">
              <span className="font-marker text-sm uppercase tracking-wider text-black">
                ✓ YOU'RE ON THE DROP WAITLIST!
              </span>
            </div>

            <p className="font-headline font-bold text-sm text-black">
              {product.title} • SIZE {selectedSize}
            </p>

            <p className="text-[10px] text-neutral-600 max-w-xs mx-auto">
              We logged your request under <span className="font-bold text-black">{email}</span>. The London studio will dispatch an automated restock alert as soon as fabric rolls are cut!
            </p>

            <div className="text-[9px] font-bold text-neutral-500 pt-2">
              Closing window...
            </div>
          </div>
        ) : (
          <div>
            {/* Header Title */}
            <div className="flex items-center gap-2 mb-2">
              <span className="w-7 h-7 bg-black text-[#feef89] flex items-center justify-center rounded-none shadow-xs">
                <Bell className="w-4 h-4" />
              </span>
              <div>
                <h3 className="font-headline font-black text-sm sm:text-base uppercase tracking-tight text-black">
                  RESTOCK ALERT // NOTIFY ME
                </h3>
                <p className="text-[9px] text-neutral-600">
                  Join the archive waitlist for instant notifications when restocked.
                </p>
              </div>
            </div>

            {/* Garment Preview Bar */}
            <div className="my-3 p-2.5 bg-white border-2 border-black shadow-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-10 h-10 bg-neutral-900 border border-black flex flex-col items-center justify-center text-white text-[8px] font-black shrink-0 shadow-2xs">
                  <span>{product.gsm ? product.gsm.replace(' GSM', '') : 'HEAVY'}</span>
                  <span className="text-[6px] text-yellow-300 font-mono">GSM</span>
                </div>
                <div className="min-w-0">
                  <span className="font-headline font-black text-xs uppercase truncate block text-black">
                    {product.title}
                  </span>
                  <span className="text-[8px] text-neutral-600 block truncate">
                    {product.fabric || product.fit || 'Heavyweight Streetwear'}
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="font-headline font-black text-xs text-black block">
                  £{product.price.toFixed(2)}
                </span>
                <span className="bg-red-600 text-white text-[7px] font-black px-1 py-0.2 uppercase inline-block">
                  OUT OF STOCK
                </span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Size selection */}
              {product.availableSizes && product.availableSizes.length > 0 && (
                <div>
                  <label className="block text-[8px] font-black uppercase tracking-wider text-neutral-700 mb-1.5 flex items-center justify-between">
                    <span>SELECT DESIRED SIZE:</span>
                    <span className="text-neutral-500 font-normal">
                      {product.stock?.[selectedSize] === 0 ? '• Out of Stock' : ''}
                    </span>
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {product.availableSizes.map((sz) => {
                      const isSoldOut = product.stock?.[sz] === 0;
                      const isChosen = selectedSize === sz;
                      return (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => setSelectedSize(sz)}
                          className={`px-2.5 py-1 text-[10px] font-headline font-black border-2 transition-all cursor-pointer ${
                            isChosen
                              ? 'bg-black text-[#feef89] border-black shadow-[2px_2px_0px_#000000]'
                              : 'bg-white hover:bg-neutral-100 text-neutral-800 border-neutral-400'
                          }`}
                        >
                          <span>{sz}</span>
                          {isSoldOut && (
                            <span className="ml-1 text-[7px] text-red-600 font-mono font-bold">
                              [SOLD]
                            </span>
                          )}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => setSelectedSize('ANY')}
                      className={`px-2 py-1 text-[9px] font-bold border-2 transition-all cursor-pointer ${
                        selectedSize === 'ANY'
                          ? 'bg-black text-[#feef89] border-black shadow-[2px_2px_0px_#000000]'
                          : 'bg-white hover:bg-neutral-100 text-neutral-600 border-neutral-400'
                      }`}
                    >
                      ANY SIZE
                    </button>
                  </div>
                </div>
              )}

              {/* Email input */}
              <div>
                <label className="block text-[8px] font-black uppercase tracking-wider text-neutral-700 mb-1 flex items-center gap-1">
                  <Mail className="w-2.5 h-2.5" />
                  <span>YOUR EMAIL ADDRESS:</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@archivezine.co.uk"
                  className="w-full bg-white border-2 border-black px-2.5 py-1.5 text-xs font-mono text-black outline-none focus:bg-yellow-50 focus:shadow-[2px_2px_0px_#000000] transition-all"
                  autoFocus
                />
              </div>

              {error && (
                <div className="p-1.5 bg-red-100 border border-red-500 text-red-700 text-[9px] font-bold">
                  {error}
                </div>
              )}

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-black hover:bg-neutral-800 text-[#feef89] border-2 border-black py-2 px-3 font-headline font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-[3px_3px_0px_#000000] active:translate-y-0.5 cursor-pointer disabled:opacity-50 transition-all"
              >
                {isSubmitting ? (
                  <span>LOGGING TO ARCHIVE QUEUE...</span>
                ) : (
                  <>
                    <Bell className="w-3.5 h-3.5" />
                    <span>ENROLL ON WAITLIST ({selectedSize || 'ANY'})</span>
                    <ArrowRight className="w-3 h-3" />
                  </>
                )}
              </button>

              <div className="text-[8px] text-neutral-500 text-center flex items-center justify-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-yellow-600" />
                <span>Recorded in Studio Waitlist Queue • Stored in Admin Console</span>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
