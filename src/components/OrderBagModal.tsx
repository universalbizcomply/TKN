import React, { useState } from 'react';
import { CartItem, Order } from '../types';
import { api } from '../lib/api';
import { CurrencyCode, formatMoney } from '../utils/currency';

interface OrderBagModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (index: number, newQty: number) => void;
  onRemoveItem: (index: number) => void;
  onClearCart: () => void;
  onTrackOrder: (orderId: string) => void;
  currency?: CurrencyCode;
}

export const OrderBagModal: React.FC<OrderBagModalProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onTrackOrder,
  currency = 'GBP',
}) => {
  const [step, setStep] = useState<'bag' | 'checkout' | 'success'>('bag');
  const [promoCode, setPromoCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [promoMsg, setPromoMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  // Form State - UK defaults
  const [customer, setCustomer] = useState({
    name: 'Callum Davies',
    email: 'callum.davies@hackneyskate.co.uk',
    street: '14 Redchurch Street, Shoreditch',
    city: 'London',
    state: 'Greater London',
    zip: 'E2 7DD',
    country: 'United Kingdom',
  });
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'apple_pay' | 'crypto' | 'cash_on_delivery'>('card');
  const [cardNumber, setCardNumber] = useState('•••• •••• •••• 4242');

  if (!isOpen) return null;

  const isUK = customer.country === 'United Kingdom';
  const shippingThresholdGBP = isUK ? 65 : 120;
  const standardShippingGBP = isUK ? 4.50 : 14.00;

  const rawSubtotal = items.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const discountAmount = (rawSubtotal * discountPercent) / 100;
  const subtotalAfterDiscount = Math.max(0, rawSubtotal - discountAmount);
  const shippingFee = subtotalAfterDiscount >= shippingThresholdGBP ? 0 : standardShippingGBP;
  const finalTotal = Math.max(0, subtotalAfterDiscount + shippingFee);
  const freeShippingLeft = Math.max(0, shippingThresholdGBP - subtotalAfterDiscount);
  const ukVatIncluded = (subtotalAfterDiscount * 0.20) / 1.20; // 20% standard UK VAT portion

  const applyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCode.trim()) return;

    try {
      const res = await api.validatePromo(promoCode);
      if (res.success && res.promo) {
        setDiscountPercent(res.promo.discountPercent);
        setPromoMsg(`✓ ${res.promo.discountPercent}% ARCHIVE CODE APPLIED!`);
      } else {
        setPromoMsg(`✕ ${res.error || 'INVALID CODE (TRY "NOTHING26")'}`);
      }
    } catch {
      // Fallback
      if (promoCode.toUpperCase() === 'NOTHING26') {
        setDiscountPercent(15);
        setPromoMsg('✓ 15% ARCHIVE CODE APPLIED!');
      } else {
        setPromoMsg('✕ INVALID CODE (TRY "NOTHING26")');
      }
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      customer,
      items: items.map((it) => ({
        productId: it.product.id,
        title: it.product.title,
        size: it.selectedSize,
        colorIndex: it.selectedColorIndex,
        price: it.product.price,
        quantity: it.quantity,
        gsm: it.product.gsm,
      })),
      promoCode: discountPercent > 0 ? promoCode.toUpperCase() : undefined,
      paymentMethod,
    };

    const res = await api.createOrder(payload);
    setIsSubmitting(false);

    if (res.success && res.order) {
      setCreatedOrder(res.order);
      setStep('success');
      onClearCart();
    } else {
      alert(res.error || 'Failed to generate order slip. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-5 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-xs cursor-pointer" onClick={onClose} />

      {/* Slip Container */}
      <div className="relative w-full max-w-lg bg-[#faf8f2] bg-notebook-paper border-3 border-black polaroid-drop-shadow-lg p-4 sm:p-6 z-10 my-auto">
        
        {/* Masking Tape on Top */}
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-28 h-6 masking-tape serrated-tape z-20 opacity-95 shadow transform -rotate-1 pointer-events-none" />

        {/* Header Bar */}
        <div className="flex items-center justify-between border-b-2 border-black pb-2.5 mb-3.5">
          <div className="flex items-center gap-2">
            <span className="font-headline font-black text-lg sm:text-xl text-black tracking-tight uppercase">
              TO KNOW NOTHING // BAG
            </span>
            <span className="bg-black text-yellow-300 text-[9px] font-mono-tag font-bold px-1.5 py-0.2 uppercase">
              {step === 'bag' ? 'STEP 1: REVIEW' : step === 'checkout' ? 'STEP 2: DISPATCH' : 'ORDER CONFIRMED'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="bg-black hover:bg-neutral-800 text-white font-mono-tag text-xs font-bold px-2 py-0.5 border border-black active:scale-95 cursor-pointer"
          >
            [✕]
          </button>
        </div>

        {/* STEP 1: BAG OVERVIEW */}
        {step === 'bag' && (
          <div>
            {items.length === 0 ? (
              <div className="py-10 text-center space-y-2.5">
                <p className="font-typewriter text-sm text-neutral-600 italic">
                  Your archive bag is currently empty.
                </p>
                <p className="font-marker text-xs text-black">
                  CLICK ANY POLAROID CARD TO PIN HEAVY APPAREL
                </p>
                <button
                  onClick={onClose}
                  className="mt-3 bg-black text-[#fff500] font-headline font-bold text-xs px-4 py-1.5 border border-black uppercase tracking-wider cursor-pointer"
                >
                  RETURN TO CATALOG ➔
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Free Shipping Progress Tracker */}
                <div className="bg-white border border-black p-2 text-xs font-mono-tag shadow-xs">
                  <div className="flex justify-between items-center mb-1 text-[11px]">
                    <span className="font-bold text-black flex items-center gap-1">
                      <span>🇬🇧</span>
                      <span>FREE UK SHIPPING OVER £65 (ROYAL MAIL TRACKED 24)</span>
                    </span>
                    <span className="text-neutral-600 font-typewriter">
                      {freeShippingLeft === 0 ? '✓ UNLOCKED' : `ADD ${formatMoney(freeShippingLeft, currency)} MORE`}
                    </span>
                  </div>
                  <div className="w-full bg-neutral-200 h-1.5 border border-black overflow-hidden">
                    <div
                      className="bg-yellow-400 h-full border-r border-black transition-all duration-300"
                      style={{ width: `${Math.min(100, (subtotalAfterDiscount / shippingThresholdGBP) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Items List */}
                <div className="max-h-56 overflow-y-auto space-y-2 pr-1 no-scrollbar">
                  {items.map((item, idx) => (
                    <div
                      key={`${item.product.id}-${item.selectedSize}-${idx}`}
                      className="bg-white border-2 border-black p-2 flex items-center justify-between gap-2.5 shadow-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 border border-black bg-neutral-900 flex items-center justify-center text-[10px] font-mono-tag font-bold text-yellow-300 flex-shrink-0">
                          {item.selectedSize}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-headline font-bold text-xs text-black uppercase truncate">
                            {item.product.title}
                          </h4>
                          <span className="text-[10px] font-mono-tag text-neutral-500">
                            {formatMoney(item.product.price, currency)} × {item.quantity}
                          </span>
                        </div>
                      </div>

                      {/* Quantity Controls & Remove */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="flex items-center border border-black bg-[#fbf9f3]">
                          <button
                            onClick={() => onUpdateQuantity(idx, item.quantity - 1)}
                            className="px-1.5 py-0.5 text-xs font-bold hover:bg-neutral-200 cursor-pointer"
                          >
                            -
                          </button>
                          <span className="px-2 text-xs font-mono-tag font-bold">{item.quantity}</span>
                          <button
                            onClick={() => onUpdateQuantity(idx, item.quantity + 1)}
                            className="px-1.5 py-0.5 text-xs font-bold hover:bg-neutral-200 cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => onRemoveItem(idx)}
                          className="text-red-600 font-mono-tag text-xs font-bold hover:underline cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Promo Code Form */}
                <form onSubmit={applyPromo} className="flex gap-1.5 pt-1">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="PROMO CODE (e.g. NOTHING26, HEAVY10)"
                    className="flex-1 bg-white border-2 border-black px-2 py-1 text-xs font-mono-tag outline-none uppercase placeholder:normal-case"
                  />
                  <button
                    type="submit"
                    className="bg-black text-yellow-300 px-3 py-1 font-mono-tag text-xs font-bold border border-black uppercase cursor-pointer"
                  >
                    APPLY
                  </button>
                </form>

                {promoMsg && (
                  <p className={`text-[10px] font-mono-tag font-bold ${discountPercent > 0 ? 'text-green-700' : 'text-red-600'}`}>
                    {promoMsg}
                  </p>
                )}

                {/* Totals Breakdown */}
                <div className="bg-[#f5f3ed] border border-black p-2.5 font-mono-tag text-xs space-y-1">
                  <div className="flex justify-between text-neutral-600">
                    <span>SUBTOTAL:</span>
                    <span>{formatMoney(rawSubtotal, currency)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-green-700 font-bold">
                      <span>DISCOUNT ({discountPercent}%):</span>
                      <span>-{formatMoney(discountAmount, currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-neutral-600">
                    <span className="flex items-center gap-1">
                      <span>DISPATCH:</span>
                      <span className="text-[10px] text-neutral-500">
                        {isUK ? '(Royal Mail Tracked 24)' : '(DHL Express Int.)'}
                      </span>
                    </span>
                    <span>{shippingFee === 0 ? 'FREE' : formatMoney(shippingFee, currency)}</span>
                  </div>
                  <div className="flex justify-between text-neutral-500 text-[10px] border-t border-dashed border-neutral-300 pt-1">
                    <span>INCL. 20% UK VAT (GB 392 8410 92):</span>
                    <span>{formatMoney(ukVatIncluded, currency)}</span>
                  </div>
                  <div className="flex justify-between text-black font-black text-sm border-t border-black pt-1">
                    <span>FINAL TOTAL:</span>
                    <span>{formatMoney(finalTotal, currency)}</span>
                  </div>
                </div>

                {/* Proceed Button */}
                <button
                  onClick={() => setStep('checkout')}
                  className="w-full bg-black hover:bg-neutral-800 text-[#fff500] font-headline font-black text-sm py-2.5 border-2 border-black shadow-[2px_2px_0px_#000000] active:translate-y-0.5 uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>PROCEED TO DISPATCH ADDRESS</span>
                  <span>➔</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: SHIPPING & CHECKOUT FORM */}
        {step === 'checkout' && (
          <form onSubmit={handlePlaceOrder} className="space-y-3 font-mono-tag text-xs">
            <div className="flex items-center justify-between border-b border-dashed border-neutral-400 pb-1">
              <span className="font-bold text-black uppercase flex items-center gap-1">
                <span>🇬🇧</span>
                <span>DISPATCH & DESTINATION SLIP</span>
              </span>
              <button
                type="button"
                onClick={() => setStep('bag')}
                className="text-neutral-500 hover:text-black text-[11px] underline cursor-pointer"
              >
                ← Edit Bag
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-neutral-600 text-[10px] mb-0.5 font-bold">FULL NAME</label>
                <input
                  required
                  type="text"
                  value={customer.name}
                  onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                  className="w-full bg-white border border-black p-1.5 outline-none font-typewriter text-xs"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-neutral-600 text-[10px] mb-0.5 font-bold">EMAIL (FOR ROYAL MAIL TRACKING)</label>
                <input
                  required
                  type="email"
                  value={customer.email}
                  onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                  className="w-full bg-white border border-black p-1.5 outline-none font-typewriter text-xs"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-neutral-600 text-[10px] mb-0.5 font-bold">STREET ADDRESS / STUDIO</label>
                <input
                  required
                  type="text"
                  value={customer.street}
                  onChange={(e) => setCustomer({ ...customer, street: e.target.value })}
                  className="w-full bg-white border border-black p-1.5 outline-none font-typewriter text-xs"
                  placeholder="e.g. 14 Redchurch Street, Shoreditch"
                />
              </div>
              <div>
                <label className="block text-neutral-600 text-[10px] mb-0.5 font-bold">TOWN / CITY</label>
                <input
                  required
                  type="text"
                  value={customer.city}
                  onChange={(e) => setCustomer({ ...customer, city: e.target.value })}
                  className="w-full bg-white border border-black p-1.5 outline-none font-typewriter text-xs"
                  placeholder="e.g. London"
                />
              </div>
              <div>
                <label className="block text-neutral-600 text-[10px] mb-0.5 font-bold">COUNTY / REGION</label>
                <input
                  required
                  type="text"
                  value={customer.state}
                  onChange={(e) => setCustomer({ ...customer, state: e.target.value })}
                  className="w-full bg-white border border-black p-1.5 outline-none font-typewriter text-xs"
                  placeholder="e.g. Greater London"
                />
              </div>
              <div>
                <label className="block text-neutral-600 text-[10px] mb-0.5 font-bold">POSTCODE</label>
                <input
                  required
                  type="text"
                  value={customer.zip}
                  onChange={(e) => setCustomer({ ...customer, zip: e.target.value })}
                  className="w-full bg-white border border-black p-1.5 outline-none font-typewriter text-xs uppercase"
                  placeholder="e.g. E2 7DD"
                />
              </div>
              <div>
                <label className="block text-neutral-600 text-[10px] mb-0.5 font-bold">COUNTRY</label>
                <select
                  value={customer.country}
                  onChange={(e) => setCustomer({ ...customer, country: e.target.value })}
                  className="w-full bg-white border border-black p-1.5 outline-none font-typewriter text-xs cursor-pointer"
                >
                  <option value="United Kingdom">🇬🇧 United Kingdom</option>
                  <option value="United States">🇺🇸 United States</option>
                  <option value="Germany">🇩🇪 Germany</option>
                  <option value="France">🇫🇷 France</option>
                  <option value="Japan">🇯🇵 Japan</option>
                  <option value="Canada">🇨🇦 Canada</option>
                  <option value="Australia">🇦🇺 Australia</option>
                  <option value="Netherlands">🇳🇱 Netherlands</option>
                </select>
              </div>
            </div>

            {/* Carrier Route Notice */}
            <div className="bg-[#f2efe6] border border-black p-2 text-[10px] font-mono-tag flex justify-between items-center">
              <div>
                <span className="font-bold text-black uppercase block">ESTIMATED DISPATCH METHOD:</span>
                <span className="text-neutral-700">
                  {customer.country === 'United Kingdom'
                    ? 'Royal Mail Tracked 24 (Next Working Day)'
                    : 'DHL Express Worldwide Priority'}
                </span>
              </div>
              <span className="font-bold text-black">
                {shippingFee === 0 ? 'FREE' : formatMoney(shippingFee, currency)}
              </span>
            </div>

            {/* Payment Method Selector */}
            <div className="pt-2 border-t border-dashed border-neutral-400">
              <label className="block text-neutral-800 font-bold mb-1.5 text-[10px] uppercase">
                PAYMENT PROTOCOL
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'card', label: 'CREDIT / DEBIT CARD', icon: '💳' },
                  { id: 'apple_pay', label: 'APPLE PAY', icon: '' },
                  { id: 'crypto', label: 'USDC / ETH', icon: '⚡' },
                  { id: 'cash_on_delivery', label: 'CASH ON DELIVERY (UK)', icon: '💵' },
                ].map((pm) => (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setPaymentMethod(pm.id as any)}
                    className={`border p-1.5 text-left text-[11px] font-mono-tag font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      paymentMethod === pm.id
                        ? 'bg-black text-yellow-300 border-black shadow-xs'
                        : 'bg-white text-black border-neutral-300 hover:border-black'
                    }`}
                  >
                    <span>{pm.icon}</span>
                    <span>{pm.label}</span>
                  </button>
                ))}
              </div>

              {paymentMethod === 'card' && (
                <div className="mt-2 bg-white border border-black p-2 space-y-1">
                  <label className="block text-neutral-500 text-[9px]">CARD NUMBER (TEST MODE SIMULATION)</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full font-mono-tag text-xs outline-none bg-transparent"
                  />
                </div>
              )}
            </div>

            {/* Total Due & Submit Button */}
            <div className="pt-2">
              <div className="bg-[#feef89] border border-black p-2 flex justify-between items-center mb-2 font-mono-tag text-xs font-bold text-black">
                <div>
                  <span className="block">TOTAL DUE:</span>
                  <span className="text-[9px] font-normal text-neutral-700">Incl. 20% UK VAT</span>
                </div>
                <span className="text-base">{formatMoney(finalTotal, currency)}</span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-black hover:bg-neutral-800 text-[#fff500] font-headline font-black text-sm py-2.5 border-2 border-black shadow-[3px_3px_0px_#000000] active:translate-y-0.5 uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>GENERATING ARCHIVE SLIP...</span>
                ) : (
                  <>
                    <span>AUTHORIZE & PIN ORDER</span>
                    <span>➔</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: ORDER SUCCESS RECEIPT */}
        {step === 'success' && createdOrder && (
          <div className="py-4 text-center space-y-3 font-mono-tag">
            <div className="w-12 h-12 bg-yellow-300 border-2 border-black rounded-full mx-auto flex items-center justify-center font-marker text-2xl">
              ✓
            </div>

            <div>
              <span className="bg-black text-yellow-300 text-[10px] font-bold px-2 py-0.5 uppercase">
                DISPATCH ORDER ID: {createdOrder.id}
              </span>
              <h3 className="font-headline font-black text-xl text-black uppercase tracking-tight mt-1.5">
                SLIP PRINTED // ORDER PINNED!
              </h3>
              <p className="font-typewriter text-xs text-neutral-700 max-w-xs mx-auto mt-1">
                Your order is queued at our London screen-print studio. A Royal Mail physical typewriter dispatch slip has been generated.
              </p>
            </div>

            {/* Order Details Mini-Card */}
            <div className="bg-white border-2 border-black p-3 text-left text-xs space-y-1.5 shadow-xs max-w-sm mx-auto">
              <div className="flex justify-between border-b border-dashed border-neutral-300 pb-1">
                <span className="text-neutral-500 text-[10px]">CUSTOMER:</span>
                <span className="font-bold">{createdOrder.customer.name}</span>
              </div>
              <div className="flex justify-between border-b border-dashed border-neutral-300 pb-1">
                <span className="text-neutral-500 text-[10px]">DESTINATION:</span>
                <span className="font-bold">{createdOrder.customer.city}, {createdOrder.customer.zip}</span>
              </div>
              <div className="flex justify-between border-b border-dashed border-neutral-300 pb-1">
                <span className="text-neutral-500 text-[10px]">ITEMS:</span>
                <span className="font-bold">{createdOrder.items.length} garments</span>
              </div>
              <div className="flex justify-between border-b border-dashed border-neutral-300 pb-1">
                <span className="text-neutral-500 text-[10px]">TOTAL PAID:</span>
                <span className="font-bold text-black">{formatMoney(createdOrder.total, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500 text-[10px]">CARRIER:</span>
                <span className="bg-yellow-100 text-black border border-black px-1.5 text-[9px] font-bold uppercase">
                  {createdOrder.carrier || 'Royal Mail Tracked 24'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={() => {
                  onTrackOrder(createdOrder.id);
                  onClose();
                }}
                className="flex-1 bg-black text-[#fff500] font-headline font-bold text-xs py-2 border border-black shadow-xs uppercase tracking-wider hover:bg-neutral-800 cursor-pointer"
              >
                TRACK DISPATCH STATUS ➔
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-white hover:bg-neutral-100 text-black font-headline font-bold text-xs py-2 border border-black shadow-xs uppercase cursor-pointer"
              >
                CONTINUE BROWSING
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

