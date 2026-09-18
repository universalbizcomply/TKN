import React, { useState, useEffect } from 'react';
import { Order } from '../types';
import { api } from '../lib/api';
import { CurrencyCode, formatMoney } from '../utils/currency';
import { Copy, Check, ExternalLink, RefreshCw, Sparkles } from 'lucide-react';

interface OrderTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialOrderId?: string;
  currency?: CurrencyCode;
}

// Marker-style icons with hand-drawn aesthetic
const WarehouseMarkerIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Gable roof with slight hand-drawn angle */}
    <path d="M2.5 9.5 L12 2.5 L21.5 9.5" />
    {/* Atelier walls */}
    <path d="M4 9.5 V21 H20 V9.5" />
    {/* Warehouse double roll-up door with sketched lines */}
    <path d="M8.5 21 V13 H15.5 V21" />
    <line x1="8.5" y1="15.5" x2="15.5" y2="15.5" />
    <line x1="8.5" y1="18.5" x2="15.5" y2="18.5" />
    {/* Garment hanger doodle in attic */}
    <path d="M12 5.5 L10 8 H14 Z" />
  </svg>
);

const RoyalMailMarkerIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Van cab and cargo body */}
    <path d="M2 5 H14 V17 H2 Z" />
    <path d="M14 8 H18.5 L21.5 12 V17 H14" />
    {/* Wheels with sketch concentric hubs */}
    <circle cx="6.5" cy="17.5" r="2.5" />
    <circle cx="17.5" cy="17.5" r="2.5" />
    {/* Royal Mail speed dashes */}
    <line x1="0.5" y1="9" x2="1.5" y2="9" />
    <line x1="0" y1="13" x2="1.5" y2="13" />
    {/* Post Horn / Stamp emblem */}
    <path d="M5.5 10.5 H10.5 M8 8.5 V12.5" />
  </svg>
);

const OutForDeliveryMarkerIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Courier navigation pin with radar pulse waves */}
    <path d="M12 2 C8.5 2 5.5 5 5.5 8.5 C5.5 13.5 12 21.5 12 21.5 C12 21.5 18.5 13.5 18.5 8.5 C18.5 5 15.5 2 12 2 Z" />
    <circle cx="12" cy="8.5" r="2.5" />
    {/* Motion radar speed lines */}
    <path d="M20 4.5 C21.5 6 22 8 22 9.5" />
    <path d="M4 4.5 C2.5 6 2 8 2 9.5" />
  </svg>
);

const DeliveredMarkerIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Heavy 3D parcel on doorstep */}
    <path d="M12 2.5 L21 7.5 L12 12.5 L3 7.5 Z" />
    <path d="M3 7.5 V16.5 L12 21.5 V12.5" />
    <path d="M21 7.5 V16.5 L12 21.5" />
    {/* Twine packaging band */}
    <path d="M7.5 10 L16.5 15" />
    {/* Hand-drawn checkmark badge stamp */}
    <circle cx="18" cy="18" r="4.5" fill="#ef4444" stroke="#000" strokeWidth="1.5" />
    <path d="M16 18 L17.5 19.5 L20.5 16.5" stroke="#fff" strokeWidth="1.8" />
  </svg>
);

interface DeliveryStep {
  id: number;
  label: string;
  subtitle: string;
  hub: string;
  icon: React.ComponentType<{ className?: string }>;
  badge: string;
}

const DELIVERY_STEPS: DeliveryStep[] = [
  {
    id: 1,
    label: 'Warehouse',
    subtitle: 'Cut, Print & Quality Inspection',
    hub: 'London Atelier, E2',
    icon: WarehouseMarkerIcon,
    badge: 'STAGE 01',
  },
  {
    id: 2,
    label: 'Royal Mail Collected',
    subtitle: 'Tracked 24 Hub Processing',
    hub: 'Mount Pleasant Regional Hub',
    icon: RoyalMailMarkerIcon,
    badge: 'STAGE 02',
  },
  {
    id: 3,
    label: 'Out for Delivery',
    subtitle: 'Loaded onto Local Postal Van',
    hub: 'Local Carrier En Route',
    icon: OutForDeliveryMarkerIcon,
    badge: 'STAGE 03',
  },
  {
    id: 4,
    label: 'Delivered',
    subtitle: 'Signed & Posted to Safe Place',
    hub: 'Recipient Letterbox',
    icon: DeliveredMarkerIcon,
    badge: 'STAGE 04',
  },
];

export const OrderTrackerModal: React.FC<OrderTrackerModalProps> = ({
  isOpen,
  onClose,
  initialOrderId,
  currency = 'GBP',
}) => {
  const [searchId, setSearchId] = useState(initialOrderId || 'TKN-9021');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedWaybill, setCopiedWaybill] = useState(false);
  const [stepOverride, setStepOverride] = useState<number | null>(null);

  const lookupOrder = async (id: string) => {
    if (!id.trim()) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.getOrderById(id.trim());
      if (res) {
        setOrder(res);
      } else {
        setOrder(null);
        setErrorMsg(`✕ No archive record found for order "${id}". Check ID format (e.g. TKN-9021).`);
      }
    } catch {
      setErrorMsg('Failed to reach archive tracking network.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setStepOverride(null);
      if (initialOrderId) {
        setSearchId(initialOrderId);
        lookupOrder(initialOrderId);
      } else {
        lookupOrder(searchId || 'TKN-9021');
      }
    }
  }, [isOpen, initialOrderId]);

  if (!isOpen) return null;

  // Derive step index based on order status or override
  const getComputedStep = (ord: Order | null): number => {
    if (stepOverride !== null) return stepOverride;
    if (!ord) return 1;

    switch (ord.status) {
      case 'pending':
        return 1;
      case 'processing':
        return 1;
      case 'shipped': {
        // If timeline mentions out for delivery
        const hasOutForDelivery = ord.timeline?.some((t) =>
          t.note.toLowerCase().includes('out for delivery') ||
          t.note.toLowerCase().includes('local carrier') ||
          t.note.toLowerCase().includes('van')
        );
        return hasOutForDelivery ? 3 : 2;
      }
      case 'delivered':
        return 4;
      default:
        return 2;
    }
  };

  const currentStep = getComputedStep(order);

  const handleCopyWaybill = (waybill: string) => {
    navigator.clipboard.writeText(waybill);
    setCopiedWaybill(true);
    setTimeout(() => setCopiedWaybill(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/85 backdrop-blur-xs cursor-pointer" onClick={onClose} />

      {/* Main Container */}
      <div className="relative w-full max-w-2xl bg-[#faf8f2] bg-notebook-paper border-3 border-black polaroid-drop-shadow-lg p-3.5 sm:p-5 z-10 my-auto space-y-3.5">
        {/* Masking tape header sticker */}
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-36 h-6 masking-tape serrated-tape z-20 opacity-95 shadow transform -rotate-1 pointer-events-none" />

        {/* Header Bar */}
        <div className="flex items-center justify-between border-b-2 border-black pb-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444] animate-pulse" />
            <span className="font-headline font-black text-base sm:text-lg text-black uppercase tracking-tight">
              ROYAL MAIL TRACKED 24 // WAYBILL TIMELINE
            </span>
          </div>

          <button
            onClick={onClose}
            className="bg-black hover:bg-neutral-800 text-white font-mono-tag text-xs font-bold px-2 py-0.5 border border-black cursor-pointer active:translate-y-0.5"
            title="Close [Esc]"
          >
            [✕]
          </button>
        </div>

        {/* Lookup Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            lookupOrder(searchId);
          }}
          className="flex gap-1.5"
        >
          <input
            type="text"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            placeholder="ENTER ORDER ID (e.g. TKN-9021)"
            className="flex-1 bg-white border-2 border-black px-3 py-1 font-mono-tag text-xs outline-none uppercase font-bold focus:bg-yellow-50 focus:shadow-[2px_2px_0px_#000]"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-black hover:bg-neutral-800 text-[#fff500] px-3 sm:px-4 py-1 font-mono-tag text-xs font-bold border border-black uppercase tracking-wider disabled:opacity-50 flex items-center gap-1 cursor-pointer active:translate-y-0.5"
          >
            {loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <span>SEARCH ➔</span>}
          </button>
        </form>

        {errorMsg && (
          <div className="p-2 bg-red-100 border border-red-500 text-red-700 font-mono-tag text-xs">
            {errorMsg}
          </div>
        )}

        {/* Order Details & Zine Delivery Timeline */}
        {order && (
          <div className="space-y-3.5">
            {/* Top Order Metadata Card */}
            <div className="bg-white border-2 border-black p-3 space-y-2 shadow-xs">
              <div className="flex flex-wrap justify-between items-center border-b border-dashed border-neutral-300 pb-2 gap-2">
                <div>
                  <span className="text-[9px] font-mono-tag text-neutral-500 uppercase block font-bold">
                    ORDER DISPATCH IDENTIFIER
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-headline font-black text-base sm:text-lg text-black uppercase">
                      {order.id}
                    </span>
                    <span className="text-[10px] font-mono-tag bg-neutral-100 border border-black px-1.5 py-0.2 font-bold">
                      {new Date(order.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <span className="text-[9px] font-mono-tag text-neutral-500 uppercase block font-bold">
                      LIVE STATUS
                    </span>
                    <span className="inline-block bg-[#fff500] border-2 border-black font-mono-tag font-black text-xs px-2.5 py-0.5 uppercase shadow-[2px_2px_0px_#000]">
                      ● {order.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Waybill & British Royal Mail Carrier Strip */}
              <div className="bg-[#fcfbf7] border-2 border-black p-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs font-mono-tag">
                <div className="flex items-center gap-2">
                  <span className="bg-[#ef4444] text-white text-[9px] font-black px-1.5 py-0.5 uppercase border border-black">
                    🇬🇧 ROYAL MAIL 24
                  </span>
                  <div>
                    <span className="text-neutral-500 text-[9px] block">CARRIER ROUTE</span>
                    <span className="font-bold text-black">{order.carrier || 'Royal Mail Tracked 24 (Next Day)'}</span>
                  </div>
                </div>

                {order.trackingNumber && (
                  <div className="flex items-center gap-2">
                    {/* Simulated Authentic Postal Barcode */}
                    <div className="hidden md:flex items-center gap-0.5 h-6 px-1.5 py-0.5 bg-white border border-black" title="UK Royal Mail Tracking Barcode">
                      {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 4, 2, 1, 3, 2, 1, 4, 1, 3].map((w, i) => (
                        <span
                          key={i}
                          className="h-full bg-black inline-block"
                          style={{ width: `${w}px` }}
                        />
                      ))}
                    </div>

                    <div>
                      <span className="text-neutral-500 text-[9px] block">WAYBILL NUMBER</span>
                      <button
                        type="button"
                        onClick={() => handleCopyWaybill(order.trackingNumber || '')}
                        className="font-black text-blue-800 hover:text-black hover:underline cursor-pointer flex items-center gap-1"
                        title="Click to copy waybill"
                      >
                        <span>{order.trackingNumber}</span>
                        {copiedWaybill ? (
                          <Check className="w-3 h-3 text-green-600" />
                        ) : (
                          <Copy className="w-3 h-3 text-neutral-400" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ZINE-STYLE DELIVERY TIMELINE USING CSS STEPS & MARKER-STYLE ICONS */}
            <div className="bg-[#fbf9f3] bg-notebook-paper border-2 border-black p-3.5 sm:p-4 space-y-3 shadow-xs">
              
              {/* Timeline Section Title & Step Simulation Selector */}
              <div className="flex flex-wrap items-center justify-between border-b border-black pb-2 gap-2">
                <div className="flex items-center gap-2">
                  <span className="bg-black text-[#fff500] text-[9px] font-mono-tag font-bold px-1.5 py-0.2 uppercase">
                    CSS STEPS
                  </span>
                  <h4 className="font-headline font-black text-xs sm:text-sm text-black uppercase tracking-wider">
                    PARCEL DISPATCH PROGRESSION
                  </h4>
                </div>

                {/* Quick Simulation Mode: Test All 4 Steps */}
                <div className="flex items-center gap-1 font-mono-tag text-[9px]">
                  <span className="text-neutral-500 font-bold uppercase hidden xs:inline">TEST STEP:</span>
                  {[1, 2, 3, 4].map((stepNum) => (
                    <button
                      key={stepNum}
                      type="button"
                      onClick={() => setStepOverride(stepNum)}
                      className={`px-1.5 py-0.5 border border-black font-bold uppercase transition-all cursor-pointer ${
                        currentStep === stepNum
                          ? 'bg-[#feef89] text-black shadow-[1px_1px_0px_#000] scale-105'
                          : 'bg-white text-neutral-600 hover:bg-neutral-100'
                      }`}
                      title={`Preview Step ${stepNum}`}
                    >
                      {stepNum}
                    </button>
                  ))}
                  {stepOverride !== null && (
                    <button
                      type="button"
                      onClick={() => setStepOverride(null)}
                      className="text-[8px] text-red-600 underline font-bold pl-1 hover:text-black cursor-pointer"
                      title="Reset to real order status"
                    >
                      RESET
                    </button>
                  )}
                </div>
              </div>

              {/* Visual CSS Steps Grid with Connector Lines */}
              <div className="relative pt-2 pb-1">
                {/* Horizontal Desktop Connector Rail */}
                <div className="hidden sm:block absolute top-7 left-8 right-8 h-1 z-0">
                  {/* Background dashed ink line */}
                  <div className="w-full h-full border-t-2 border-dashed border-neutral-400" />
                  {/* Active completed solid line */}
                  <div
                    className="absolute top-0 left-0 h-full bg-black border-t-2 border-black transition-all duration-500 ease-out"
                    style={{
                      width: `${((currentStep - 1) / (DELIVERY_STEPS.length - 1)) * 100}%`,
                    }}
                  />
                </div>

                {/* 4 Step Nodes */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-2 relative z-10">
                  {DELIVERY_STEPS.map((step) => {
                    const isCompleted = step.id < currentStep;
                    const isCurrent = step.id === currentStep;
                    const isUpcoming = step.id > currentStep;
                    const IconComponent = step.icon;

                    return (
                      <div
                        key={step.id}
                        className={`flex sm:flex-col items-center sm:text-center gap-2.5 sm:gap-1.5 p-2 sm:p-1.5 border-2 sm:border-0 transition-all ${
                          isCurrent
                            ? 'bg-[#feef89]/30 border-black sm:bg-transparent shadow-xs sm:shadow-none'
                            : 'border-transparent'
                        }`}
                      >
                        {/* Marker Icon Node */}
                        <div className="relative shrink-0">
                          <div
                            className={`w-11 h-11 sm:w-12 sm:h-12 border-2 border-black flex items-center justify-center transition-transform ${
                              isCompleted
                                ? 'bg-black text-[#fff500] shadow-[2px_2px_0px_#000000]'
                                : isCurrent
                                ? 'bg-[#fff500] text-black border-3 shadow-[3px_3px_0px_#000000] scale-105 transform -rotate-1'
                                : 'bg-white text-neutral-400 border-dashed border-neutral-400 opacity-60'
                            }`}
                          >
                            <IconComponent className="w-5 h-5 sm:w-6 sm:h-6" />
                          </div>

                          {/* Completed checkmark badge */}
                          {isCompleted && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 text-white text-[10px] font-black rounded-full border border-black flex items-center justify-center">
                              ✓
                            </span>
                          )}

                          {/* Current pulsating beacon */}
                          {isCurrent && (
                            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#ef4444] border border-black animate-ping" />
                          )}
                        </div>

                        {/* Step Text Info */}
                        <div className="flex-1 min-w-0 sm:w-full">
                          {/* Stage Tag */}
                          <div className="flex items-center sm:justify-center gap-1">
                            <span
                              className={`text-[8px] font-mono-tag font-bold px-1 py-0.2 uppercase border ${
                                isCompleted
                                  ? 'bg-neutral-200 text-black border-neutral-400'
                                  : isCurrent
                                  ? 'bg-black text-[#fff500] border-black animate-pulse'
                                  : 'bg-neutral-100 text-neutral-400 border-neutral-300'
                              }`}
                            >
                              {isCompleted ? '✓ DONE' : isCurrent ? '● IN PROGRESS' : 'UPCOMING'}
                            </span>
                          </div>

                          {/* Primary Label */}
                          <h5
                            className={`font-headline font-black text-xs sm:text-[11px] md:text-xs uppercase tracking-tight truncate mt-0.5 ${
                              isCurrent
                                ? 'text-black underline decoration-yellow-400 decoration-2'
                                : isCompleted
                                ? 'text-black'
                                : 'text-neutral-500'
                            }`}
                          >
                            {step.label}
                          </h5>

                          {/* Subtitle & Hub */}
                          <p className="font-mono-tag text-[9px] text-neutral-600 leading-tight hidden sm:block">
                            {step.subtitle}
                          </p>
                          <span className="font-typewriter text-[9px] text-neutral-500 block italic leading-tight">
                            {step.hub}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Hand-drawn Marker Highlight Bar at bottom */}
                <div className="mt-3 pt-2 border-t border-dashed border-neutral-300 flex flex-wrap items-center justify-between gap-1 text-[10px] font-mono-tag">
                  <div className="flex items-center gap-1.5 text-neutral-700">
                    <Sparkles className="w-3 h-3 text-black shrink-0" />
                    <span>
                      CURRENT CHECKPOINT:{' '}
                      <strong className="text-black uppercase">
                        {DELIVERY_STEPS[currentStep - 1]?.label} ({DELIVERY_STEPS[currentStep - 1]?.hub})
                      </strong>
                    </span>
                  </div>

                  <span className="font-typewriter text-neutral-500 italic">
                    {currentStep === 4
                      ? '★ Signed & posted safely'
                      : currentStep === 3
                      ? '★ Out on courier delivery route today'
                      : currentStep === 2
                      ? '★ In transit via Royal Mail East London Hub'
                      : '★ Undergoing 500GSM quality inspection'}
                  </span>
                </div>
              </div>
            </div>

            {/* Timeline Dispatch Event Logs */}
            <div className="bg-white border-2 border-black p-3 space-y-1.5 shadow-xs">
              <div className="flex items-center justify-between border-b border-black pb-1">
                <h4 className="font-headline font-black text-xs text-black uppercase tracking-wider">
                  DISPATCH LOGS // TIME STAMPS
                </h4>
                <span className="font-mono-tag text-[9px] text-neutral-500 uppercase">
                  {order.timeline.length} RECORDED EVENTS
                </span>
              </div>

              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {order.timeline.map((entry, idx) => (
                  <div key={idx} className="flex gap-2 text-xs font-mono-tag items-start py-0.5 border-b border-dashed border-neutral-100 last:border-b-0">
                    <span className="text-neutral-400 text-[10px] w-14 shrink-0 font-bold">
                      {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <div className="flex-1">
                      <span className="font-black text-black uppercase mr-1.5 text-[11px]">
                        [{entry.status}]
                      </span>
                      <span className="font-typewriter text-neutral-800 text-[11px]">
                        {entry.note}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Destination Address & Garment Manifest Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono-tag">
              <div className="bg-white border border-black p-2.5 space-y-1">
                <span className="text-[9px] font-black text-neutral-500 block uppercase">
                  SHIPPING DESTINATION
                </span>
                <p className="font-bold text-black text-[11px]">{order.customer.name}</p>
                <p className="text-neutral-700 text-[10px] font-typewriter leading-tight">
                  {order.customer.street}<br />
                  {order.customer.city}, {order.customer.state} {order.customer.zip}<br />
                  {order.customer.country}
                </p>
              </div>

              <div className="bg-white border border-black p-2.5 space-y-1">
                <span className="text-[9px] font-black text-neutral-500 block uppercase">
                  GARMENT MANIFEST ({order.items.length})
                </span>
                <div className="space-y-1 max-h-20 overflow-y-auto">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-[10px] border-b border-dashed border-neutral-200 pb-0.5">
                      <span className="truncate pr-1">
                        {item.title} ({item.size}) {item.gsm ? `[${item.gsm}]` : ''} × {item.quantity}
                      </span>
                      <span className="font-bold shrink-0">
                        {formatMoney(item.price * item.quantity, currency)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between font-bold pt-1 text-black text-[11px] border-t border-black">
                  <span>TOTAL SETTLED:</span>
                  <span>{formatMoney(order.total, currency)}</span>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
