import React, { useState, useRef, useEffect } from 'react';
import { api } from '../lib/api';
import { ProductItem } from '../types';
import {
  X,
  Send,
  ShoppingBag,
  Package,
  Check,
  Copy,
  RefreshCw,
  Minus,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  ArrowLeftRight,
  ThumbsUp,
  Sparkles,
  Mic,
  MicOff,
  GripVertical,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  suggestedProductIds?: string[];
  orderCard?: any;
  isLiked?: boolean;
}

type ConciergeMode = 'all' | 'sales' | 'support' | 'qa';

interface CustomerConciergeModalProps {
  isOpen: boolean;
  onOpen?: () => void;
  onClose: () => void;
  products: ProductItem[];
  onAddToCart: (product: ProductItem, size: string) => void;
  onOpenProduct: (product: ProductItem) => void;
  onOpenTracker: (orderId: string) => void;
}

const QUICK_PROMPTS: Record<ConciergeMode, string[]> = {
  all: [
    'Track my order TKN-9021',
    'What is the difference between 300 GSM and 500 GSM?',
    'Recommend a winter streetwear layering outfit',
    'How do I wash heavy French Terry without shrinking?',
  ],
  sales: [
    'What is the heaviest hoodie available in the archive?',
    'Tell me about the Acid Box Tee and mineral wash',
    'Which pants are best for high-impact skateboarding?',
    'Recommend a complete boxy drop-shoulder outfit',
  ],
  support: [
    'Track order TKN-9021',
    'What is your 14-day London return policy?',
    'Size recommendation: I am 6ft (183cm), 78kg',
    'How do I care for puff silkscreen prints?',
  ],
  qa: [
    'When does the next capsule drop?',
    'Where is your London studio workshop located?',
    'Is your heavy combed cotton ethically sourced?',
    'Do you offer free UK Royal Mail shipping?',
  ],
};

// Subtle synthesized audio feedback via Web Audio API
const playAudioTone = (type: 'send' | 'receive' | 'click', enabled: boolean) => {
  if (!enabled || typeof window === 'undefined') return;
  try {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === 'send') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(740, now + 0.08);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'receive') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.setValueAtTime(880, now + 0.08);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.19);
    } else if (type === 'click') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(650, now);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.start(now);
      osc.stop(now + 0.05);
    }
  } catch {
    // Graceful fallback if audio is disabled
  }
};

export const CustomerConciergeModal: React.FC<CustomerConciergeModalProps> = ({
  isOpen,
  onOpen,
  onClose,
  products,
  onAddToCart,
  onOpenProduct,
  onOpenTracker,
}) => {
  const [mode, setMode] = useState<ConciergeMode>('all');
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedTracking, setCopiedTracking] = useState<string | null>(null);
  const [addedItemName, setAddedItemName] = useState<string | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [dockSide, setDockSide] = useState<'right' | 'left'>('right');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [teaserDismissed, setTeaserDismissed] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [isAvatarHovered, setIsAvatarHovered] = useState(false);
  const [windowPos, setWindowPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ startX: 0, startY: 0, initX: 0, initY: 0 });

  const PROACTIVE_TIPS = [
    '💡 What is the difference between 300 GSM and 500 GSM?',
    '📦 Need to track your order? Enter TKN-9021 anytime',
    '⚡ Looking for the heaviest boxy drop-shoulder fit?',
    '👤 VIP Member drops & Instant Guest Purchase active',
    '🇬🇧 London studio screenprinted: ask about care & wash',
  ];

  // Rotate tips periodically when collapsed
  useEffect(() => {
    if (isOpen) return;
    const interval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % PROACTIVE_TIPS.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const speakText = (text: string) => {
    if (!ttsEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const clean = text.replace(/[*_`#]/g, ' ').replace(/\s+/g, ' ').slice(0, 300);
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      const voices = window.speechSynthesis.getVoices();
      const ukVoice =
        voices.find((v) => v.lang.includes('en-GB') || v.lang.includes('en_GB')) ||
        voices.find((v) => v.lang.includes('en'));
      if (ukVoice) utterance.voice = ukVoice;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } catch {
      setIsSpeaking(false);
    }
  };

  const handleToggleVoiceInput = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice dictation is supported in Chrome, Edge, and Safari.');
      return;
    }
    if (isListening) {
      setIsListening(false);
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-GB';
      recognition.onstart = () => {
        setIsListening(true);
        playAudioTone('click', soundEnabled);
      };
      recognition.onresult = (e: any) => {
        const transcript = e.results[0]?.[0]?.transcript;
        if (transcript) {
          setInputMessage((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const handleStartDrag = (e: React.MouseEvent) => {
    if (isMaximized) return;
    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: windowPos.x,
      initY: windowPos.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartRef.current.startX;
      const dy = e.clientY - dragStartRef.current.startY;
      setWindowPos({
        x: dragStartRef.current.initX + dx,
        y: dragStartRef.current.initY + dy,
      });
    };
    const handleMouseUp = () => {
      if (isDragging) setIsDragging(false);
    };
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-concierge',
      role: 'model',
      text: 'Welcome to the **TO KNOW NOTHING** Archive Studio in London. I am **TKN**, your personal archive AI concierge.\n\nAsk me about **garment sizing & styling**, **300–550GSM cotton weights**, or **track your live order** by entering your order number (e.g. `TKN-9021`). How can I help you today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    playAudioTone('send', soundEnabled);

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updated = [...messages, userMsg];
    setMessages(updated);
    setInputMessage('');
    setIsLoading(true);

    const apiPayload = updated
      .filter((m) => m.id !== 'welcome-concierge')
      .map((m) => ({
        role: m.role,
        text: m.text,
      }));

    try {
      const res = await api.geminiCustomerChat({
        messages: apiPayload,
        customerMode: mode,
      });

      playAudioTone('receive', soundEnabled);

      if (res.success && res.text) {
        const botMsg: ChatMessage = {
          id: `model-${Date.now()}`,
          role: 'model',
          text: res.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestedProductIds: res.suggestedProductIds,
          orderCard: res.orderCard,
        };
        setMessages((prev) => [...prev, botMsg]);
        speakText(res.text);
      } else {
        const fallbackMsg: ChatMessage = {
          id: `err-${Date.now()}`,
          role: 'model',
          text: res.error || 'TKN is currently attending other visitors in the studio. Please try again shortly.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, fallbackMsg]);
        speakText(fallbackMsg.text);
      }
    } catch {
      playAudioTone('receive', soundEnabled);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'model',
          text: 'TKN cannot connect to the server right now. Please check your connectivity or reach out directly to the studio.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyTracking = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedTracking(code);
    playAudioTone('click', soundEnabled);
    setTimeout(() => setCopiedTracking(null), 2000);
  };

  const handleClear = () => {
    playAudioTone('click', soundEnabled);
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'model',
        text: 'Session reset. I am TKN. What garment recommendations, fit inquiries, or order lookups can I assist you with?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const toggleLikeMessage = (msgId: string) => {
    playAudioTone('click', soundEnabled);
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, isLiked: !m.isLiked } : m))
    );
  };

  const handleAddGarmentToBag = (prod: ProductItem) => {
    const defaultSize = prod.availableSizes?.[0] || 'L';
    onAddToCart(prod, defaultSize);
    playAudioTone('click', soundEnabled);
    setAddedItemName(prod.title);
    setTimeout(() => setAddedItemName(null), 2500);
  };

  const handleLaunchWithPrompt = (prompt: string) => {
    if (onOpen) onOpen();
    handleSend(prompt);
  };

  // -------------------------------------------------------------
  // 1. COLLAPSED FLOATING LAUNCHER & INTERACTIVE PROMPT TEASER
  // -------------------------------------------------------------
  if (!isOpen) {
    return (
      <div
        id="tkn-floating-launcher-container"
        className={`fixed bottom-4 z-40 flex flex-col transition-all duration-300 ${
          dockSide === 'right' ? 'right-4 sm:right-6 items-end' : 'left-4 sm:left-6 items-start'
        }`}
      >
        {/* Interactive Floating Teaser Bubble */}
        {!teaserDismissed && (
          <div className="mb-2 max-w-[320px] sm:max-w-[380px] animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className="bg-[#FAF8F3] border-2 border-black p-3 shadow-[5px_5px_0px_#000] relative">
              <div className="flex items-center justify-between border-b border-black/15 pb-1.5 mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-mono-tag font-bold text-[10px] uppercase text-black tracking-wider">
                    TKN // STORE BOT
                  </span>
                  <span className="font-mono-tag text-[9px] bg-yellow-300 text-black px-1.5 py-0.2 font-black border border-black">
                    ONLINE
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {/* Dock Side Switcher */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      playAudioTone('click', soundEnabled);
                      setDockSide((prev) => (prev === 'right' ? 'left' : 'right'));
                    }}
                    title={dockSide === 'right' ? 'Move bot to left' : 'Move bot to right'}
                    className="p-1 text-neutral-500 hover:text-black transition-colors cursor-pointer"
                  >
                    <ArrowLeftRight className="w-3 h-3" />
                  </button>
                  {/* Dismiss */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTeaserDismissed(true);
                    }}
                    className="p-1 text-neutral-400 hover:text-black cursor-pointer transition-colors"
                    title="Dismiss bubble"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Dynamic Rotating Tip */}
              <div className="flex items-start gap-2 mb-2">
                <span className="text-sm shrink-0">💬</span>
                <p className="font-sans text-xs text-neutral-900 leading-snug font-medium transition-all duration-300">
                  {PROACTIVE_TIPS[currentTipIndex]}
                </p>
              </div>

              {/* Quick Interactive Prompt Chips */}
              <div className="flex flex-wrap gap-1 pt-1 border-t border-black/10">
                <button
                  onClick={() => handleLaunchWithPrompt('What is the difference between 300 GSM and 500 GSM?')}
                  className="font-mono-tag text-[10px] bg-white hover:bg-black hover:text-yellow-300 text-black border border-black px-2 py-0.5 transition-colors cursor-pointer active:scale-95"
                >
                  ✦ 500GSM vs 300GSM
                </button>
                <button
                  onClick={() => handleLaunchWithPrompt('Track my order TKN-9021')}
                  className="font-mono-tag text-[10px] bg-white hover:bg-black hover:text-yellow-300 text-black border border-black px-2 py-0.5 transition-colors cursor-pointer active:scale-95"
                >
                  📦 Track TKN-9021
                </button>
                <button
                  onClick={() => handleLaunchWithPrompt('Recommend a heavy boxy streetwear fit')}
                  className="font-mono-tag text-[10px] bg-white hover:bg-black hover:text-yellow-300 text-black border border-black px-2 py-0.5 transition-colors cursor-pointer active:scale-95"
                >
                  ⚡ Sizing & Fits
                </button>
              </div>
            </div>

            {/* Triangle pointing to trigger */}
            <div
              className={`w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-black ${
                dockSide === 'right' ? 'mr-7' : 'ml-7'
              }`}
            />
          </div>
        )}

        {/* Floating Action Button with Animated Robot Face Avatar */}
        <div className="flex items-center gap-1.5">
          <button
            id="customer-concierge-trigger"
            onMouseEnter={() => setIsAvatarHovered(true)}
            onMouseLeave={() => setIsAvatarHovered(false)}
            onClick={() => {
              playAudioTone('click', soundEnabled);
              if (onOpen) onOpen();
            }}
            className="group relative flex items-center gap-2 px-3 py-2 sm:px-3.5 sm:py-2.5 bg-black text-yellow-300 border-2 border-black shadow-[4px_4px_0px_#000] hover:shadow-[6px_6px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 transition-all cursor-pointer font-mono-tag text-xs font-black uppercase tracking-wider"
            title="Chat with TKN - AI Storefront Concierge [C]"
          >
            {/* Animated CRT Robot Avatar */}
            <div className="w-6 h-6 bg-[#1b1c18] border border-yellow-300 text-yellow-300 rounded flex items-center justify-center font-mono text-[9px] font-bold shadow-2xs relative">
              <span>{isAvatarHovered ? '[^‿^]' : '[●_●]'}</span>
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full" />
            </div>

            <span className="flex items-center gap-1.5">
              <span>TKN BOT</span>
            </span>

            <span className="text-[9px] bg-yellow-300 text-black px-1.5 py-0.2 border border-black font-black">
              AI CONCIERGE
            </span>

            <kbd className="hidden sm:inline bg-neutral-800 text-yellow-200 border border-neutral-700 text-[8px] px-1 font-mono">
              C
            </kbd>
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 2. OPEN FLOATING CHAT WINDOW (COMPACT OR MAXIMIZED)
  // -------------------------------------------------------------
  return (
    <>
      {/* Optional Dim Backdrop ONLY in Maximized Mode */}
      {isMaximized && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setIsMaximized(false)}
        />
      )}

      {/* Floating Container (Non-blocking & Draggable) */}
      <div
        id="tkn-floating-chat-window"
        style={{
          transform: isMaximized ? 'none' : `translate(${windowPos.x}px, ${windowPos.y}px)`,
        }}
        className={`z-50 flex flex-col transition-all duration-150 ${
          isMaximized
            ? 'fixed inset-4 sm:inset-10 md:inset-16 m-auto max-w-4xl max-h-[90vh]'
            : `fixed bottom-4 sm:bottom-6 ${
                dockSide === 'right' ? 'right-4 sm:right-6' : 'left-4 sm:left-6'
              } w-[calc(100vw-32px)] sm:w-[450px] md:w-[490px] h-[610px] max-h-[85vh]`
        }`}
      >
        <div className="w-full h-full bg-[#FAF8F3] border-2 border-black flex flex-col shadow-[8px_8px_0px_#000] overflow-hidden">
          {/* Header Bar with Drag Handle and Controls */}
          <div className="bg-[#1b1c18] text-white p-2.5 sm:p-3 border-b-2 border-black flex items-center justify-between shrink-0 select-none">
            <div className="flex items-center gap-2">
              {/* Drag Handle */}
              {!isMaximized && (
                <div
                  onMouseDown={handleStartDrag}
                  className="cursor-move p-1 text-neutral-400 hover:text-yellow-300 hover:bg-neutral-800 rounded transition-colors"
                  title="Click & drag to reposition floating bot window"
                >
                  <GripVertical className="w-4 h-4" />
                </div>
              )}

              {/* Animated Robot Face in Header */}
              <div className="w-7 h-7 bg-black border border-yellow-300 text-yellow-300 rounded flex items-center justify-center font-mono text-[10px] font-black relative">
                <span>{isSpeaking ? '[~o~]' : '[●_●]'}</span>
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-headline font-black text-xs sm:text-sm uppercase tracking-wider text-yellow-300">
                    TKN // ARCHIVE CONCIERGE
                  </h3>
                  <span className="text-[9px] font-mono-tag bg-yellow-300 text-black px-1 py-0.2 border border-black font-black">
                    AI BOT
                  </span>
                  {isSpeaking && (
                    <span className="text-[8px] font-mono-tag bg-emerald-500 text-black px-1 font-bold animate-pulse">
                      SPEAKING 🔊
                    </span>
                  )}
                </div>
                <p className="font-mono-tag text-[9px] text-neutral-400">
                  Heavyweight Sizing • Live Tracking • London Studio
                </p>
              </div>
            </div>

            {/* Interactive Window Controls */}
            <div className="flex items-center gap-1">
              {/* Voice Readout Toggle (TTS) */}
              <button
                onClick={() => {
                  const next = !ttsEnabled;
                  setTtsEnabled(next);
                  playAudioTone('click', soundEnabled);
                  if (!next && typeof window !== 'undefined' && 'speechSynthesis' in window) {
                    window.speechSynthesis.cancel();
                    setIsSpeaking(false);
                  }
                }}
                title={ttsEnabled ? 'Disable voice readouts' : 'Enable voice readouts (British TTS)'}
                className={`p-1.5 text-xs font-mono font-bold transition-colors cursor-pointer flex items-center gap-0.5 ${
                  ttsEnabled
                    ? 'bg-yellow-300 text-black'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
              >
                <span>🔊</span>
                <span className="hidden md:inline text-[9px]">{ttsEnabled ? 'VOICE ON' : 'VOICE'}</span>
              </button>

              {/* Dock Side Toggle (Right / Left) */}
              {!isMaximized && (
                <button
                  onClick={() => {
                    playAudioTone('click', soundEnabled);
                    setDockSide((prev) => (prev === 'right' ? 'left' : 'right'));
                  }}
                  title={dockSide === 'right' ? 'Dock bot to left' : 'Dock bot to right'}
                  className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Sound FX Toggle */}
              <button
                onClick={() => {
                  const next = !soundEnabled;
                  setSoundEnabled(next);
                  playAudioTone('click', next);
                }}
                title={soundEnabled ? 'Mute audio chimes' : 'Enable audio chimes'}
                className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                {soundEnabled ? (
                  <Volume2 className="w-3.5 h-3.5 text-yellow-300" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5" />
                )}
              </button>

              {/* Maximize / Restore Toggle */}
              <button
                onClick={() => {
                  playAudioTone('click', soundEnabled);
                  setIsMaximized((prev) => !prev);
                }}
                title={isMaximized ? 'Restore floating compact mode' : 'Maximize window'}
                className="hidden sm:block p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                {isMaximized ? (
                  <Minimize2 className="w-3.5 h-3.5" />
                ) : (
                  <Maximize2 className="w-3.5 h-3.5" />
                )}
              </button>

              {/* Reset Conversation */}
              <button
                onClick={handleClear}
                title="Reset conversation"
                className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>

              {/* Minimize to Floating Bubble */}
              <button
                onClick={() => {
                  playAudioTone('click', soundEnabled);
                  onClose();
                }}
                title="Minimize TKN bot"
                className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              {/* Close */}
              <button
                onClick={() => {
                  playAudioTone('click', soundEnabled);
                  onClose();
                }}
                title="Close"
                className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mode Selector Tabs */}
          <div className="bg-[#edeae0] border-b-2 border-black p-1.5 flex items-center gap-1 overflow-x-auto shrink-0 select-none">
            <button
              onClick={() => {
                playAudioTone('click', soundEnabled);
                setMode('all');
              }}
              className={`px-2.5 py-1 text-[10px] sm:text-[11px] font-mono-tag font-bold uppercase transition-all cursor-pointer whitespace-nowrap ${
                mode === 'all'
                  ? 'bg-black text-yellow-300 shadow-[2px_2px_0px_#000]'
                  : 'bg-white text-neutral-700 border border-neutral-300 hover:border-black'
              }`}
            >
              ✦ ALL-IN-ONE
            </button>
            <button
              onClick={() => {
                playAudioTone('click', soundEnabled);
                setMode('sales');
              }}
              className={`px-2.5 py-1 text-[10px] sm:text-[11px] font-mono-tag font-bold uppercase transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                mode === 'sales'
                  ? 'bg-black text-yellow-300 shadow-[2px_2px_0px_#000]'
                  : 'bg-white text-neutral-700 border border-neutral-300 hover:border-black'
              }`}
            >
              <span>⚡ SALES & FITS</span>
            </button>
            <button
              onClick={() => {
                playAudioTone('click', soundEnabled);
                setMode('support');
              }}
              className={`px-2.5 py-1 text-[10px] sm:text-[11px] font-mono-tag font-bold uppercase transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                mode === 'support'
                  ? 'bg-black text-yellow-300 shadow-[2px_2px_0px_#000]'
                  : 'bg-white text-neutral-700 border border-neutral-300 hover:border-black'
              }`}
            >
              <span>📦 DISPATCH & POLICY</span>
            </button>
            <button
              onClick={() => {
                playAudioTone('click', soundEnabled);
                setMode('qa');
              }}
              className={`px-2.5 py-1 text-[10px] sm:text-[11px] font-mono-tag font-bold uppercase transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                mode === 'qa'
                  ? 'bg-black text-yellow-300 shadow-[2px_2px_0px_#000]'
                  : 'bg-white text-neutral-700 border border-neutral-300 hover:border-black'
              }`}
            >
              <span>❓ STUDIO Q&A</span>
            </button>
          </div>

          {/* Added to Bag Toast Notification Banner */}
          {addedItemName && (
            <div className="bg-yellow-300 text-black px-3 py-1.5 border-b-2 border-black flex items-center justify-between font-mono-tag text-xs font-bold animate-in slide-in-from-top-2 duration-200">
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-black" />
                <span>ADDED "{addedItemName.toUpperCase()}" TO SHOPPING BAG</span>
              </span>
              <span className="text-[10px] uppercase underline cursor-pointer" onClick={() => setAddedItemName(null)}>
                DISMISS
              </span>
            </div>
          )}

          {/* Conversation Stream */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 bg-[#FAF8F3] min-h-0">
            {messages.map((m) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} group`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <span className="font-mono-tag text-[9px] uppercase font-bold text-neutral-500">
                      {isUser ? 'YOU' : 'TKN (AI ARCHIVE BOT)'}
                    </span>
                    <span className="font-mono-tag text-[9px] text-neutral-400">{m.timestamp}</span>
                  </div>

                  <div
                    className={`p-3 text-xs leading-relaxed border-2 ${
                      isUser
                        ? 'bg-[#1b1c18] text-white border-black rounded-tl-lg rounded-bl-lg rounded-tr-lg max-w-[85%]'
                        : 'bg-white text-neutral-900 border-black rounded-tr-lg rounded-br-lg rounded-tl-lg shadow-[3px_3px_0px_rgba(0,0,0,0.08)] max-w-[95%]'
                    }`}
                  >
                    <div className="whitespace-pre-line font-sans">{m.text}</div>

                    {/* Render Live Order Card if Attached */}
                    {m.orderCard && (
                      <div className="mt-3 p-2.5 bg-[#F4F1EA] border-2 border-black">
                        <div className="flex items-center justify-between pb-1.5 border-b border-black/20 mb-2">
                          <div className="flex items-center gap-1.5">
                            <Package className="w-3.5 h-3.5 text-black" />
                            <span className="font-mono-tag font-bold text-[11px] text-black">
                              ORDER {m.orderCard.id}
                            </span>
                          </div>
                          <span
                            className={`font-mono-tag text-[9px] px-1.5 py-0.5 font-bold uppercase ${
                              m.orderCard.status === 'shipped'
                                ? 'bg-blue-600 text-white'
                                : m.orderCard.status === 'delivered'
                                ? 'bg-emerald-600 text-white'
                                : m.orderCard.status === 'processing'
                                ? 'bg-amber-500 text-black'
                                : 'bg-neutral-800 text-white'
                            }`}
                          >
                            {m.orderCard.status}
                          </span>
                        </div>

                        <div className="space-y-1 font-mono-tag text-[10px] text-neutral-700">
                          <div className="flex justify-between">
                            <span>Carrier:</span>
                            <span className="font-bold text-black">{m.orderCard.carrier || 'Royal Mail Tracked 24'}</span>
                          </div>
                          {m.orderCard.trackingNumber && (
                            <div className="flex justify-between items-center bg-white p-1 border border-neutral-300">
                              <span className="truncate pr-1 text-black font-bold">
                                {m.orderCard.trackingNumber}
                              </span>
                              <button
                                onClick={() => handleCopyTracking(m.orderCard.trackingNumber)}
                                className="text-[9px] uppercase px-1 py-0.5 bg-neutral-100 hover:bg-neutral-200 border border-black flex items-center gap-0.5 cursor-pointer"
                              >
                                {copiedTracking === m.orderCard.trackingNumber ? (
                                  <Check className="w-2.5 h-2.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-2.5 h-2.5" />
                                )}
                                {copiedTracking === m.orderCard.trackingNumber ? 'COPIED' : 'COPY'}
                              </button>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span>Destination:</span>
                            <span className="text-black">{m.orderCard.customer.city}, {m.orderCard.customer.country}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            onOpenTracker(m.orderCard.id);
                            onClose();
                          }}
                          className="w-full mt-2 py-1.5 bg-black text-yellow-300 font-mono-tag font-bold text-[10px] uppercase hover:bg-neutral-800 flex items-center justify-center gap-1 cursor-pointer"
                        >
                          VIEW FULL DISPATCH TIMELINE →
                        </button>
                      </div>
                    )}

                    {/* Render Interactive Suggested Garments */}
                    {m.suggestedProductIds && m.suggestedProductIds.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-black/15">
                        <p className="font-mono-tag text-[9px] uppercase font-bold text-neutral-600 mb-1.5 flex items-center gap-1">
                          <ShoppingBag className="w-3 h-3 text-black" />
                          RECOMMENDED GARMENTS:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {m.suggestedProductIds.map((pid) => {
                            const prod = products.find((p) => p.id === pid);
                            if (!prod) return null;
                            return (
                              <div
                                key={pid}
                                className="p-2 bg-[#F9F7F1] border border-black flex flex-col justify-between"
                              >
                                <div>
                                  <div className="flex items-center justify-between gap-1 mb-1">
                                    <span className="font-mono-tag font-bold text-[9px] bg-black text-yellow-300 px-1">
                                      {prod.gsm}
                                    </span>
                                    <span className="font-mono-tag font-bold text-[11px] text-black">
                                      £{prod.price}
                                    </span>
                                  </div>
                                  <h4 className="font-headline font-bold text-xs uppercase line-clamp-1 text-black">
                                    {prod.title}
                                  </h4>
                                </div>

                                <div className="flex gap-1.5 mt-2">
                                  <button
                                    onClick={() => {
                                      onOpenProduct(prod);
                                      if (!isMaximized) {
                                        // in floating mode, we can keep bot open or close it
                                      }
                                    }}
                                    className="flex-1 py-1 bg-white hover:bg-neutral-100 border border-black font-mono-tag text-[9px] font-bold uppercase cursor-pointer"
                                  >
                                    VIEW FIT
                                  </button>
                                  <button
                                    onClick={() => handleAddGarmentToBag(prod)}
                                    className="flex-1 py-1 bg-black hover:bg-neutral-800 text-yellow-300 font-mono-tag text-[9px] font-bold uppercase cursor-pointer flex items-center justify-center gap-0.5"
                                  >
                                    + BAG
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Interactive Helpful / Thumbs Up Reaction */}
                    {!isUser && (
                      <div className="mt-2 pt-1 border-t border-black/10 flex items-center justify-between text-[10px] text-neutral-400">
                        <span className="font-mono-tag text-[9px]">Verified Archive Knowledge</span>
                        <button
                          onClick={() => toggleLikeMessage(m.id)}
                          className={`flex items-center gap-1 font-mono-tag text-[9px] px-1.5 py-0.5 border cursor-pointer transition-colors ${
                            m.isLiked
                              ? 'bg-yellow-300 text-black border-black font-bold'
                              : 'bg-transparent text-neutral-500 border-neutral-300 hover:border-black hover:text-black'
                          }`}
                          title="Was this helpful?"
                        >
                          <ThumbsUp className="w-2.5 h-2.5" />
                          <span>{m.isLiked ? 'HELPFUL' : 'HELPFUL?'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center gap-2 p-3 bg-white border border-neutral-300 max-w-[220px]">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-black rounded-full animate-bounce" />
                  <span
                    className="w-1.5 h-1.5 bg-black rounded-full animate-bounce"
                    style={{ animationDelay: '0.15s' }}
                  />
                  <span
                    className="w-1.5 h-1.5 bg-black rounded-full animate-bounce"
                    style={{ animationDelay: '0.3s' }}
                  />
                </div>
                <span className="font-mono-tag text-[10px] text-neutral-600">
                  TKN consulting archive...
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Interactive Suggestion Chips Carousel */}
          <div className="px-2.5 py-1.5 bg-[#edeae0] border-t border-black/20 flex items-center gap-1.5 overflow-x-auto shrink-0 select-none">
            <span className="font-mono-tag text-[9px] uppercase font-bold text-neutral-500 shrink-0 flex items-center gap-0.5">
              <Sparkles className="w-2.5 h-2.5 text-black" />
              QUICK:
            </span>
            {QUICK_PROMPTS[mode].map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt)}
                disabled={isLoading}
                className="text-[10px] font-mono-tag px-2 py-0.5 bg-white hover:bg-black hover:text-yellow-300 border border-neutral-400 text-neutral-800 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50 shrink-0"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="p-2.5 sm:p-3 bg-white border-t-2 border-black shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <div className="flex-1 relative flex items-center">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={
                    isListening
                      ? 'Listening to your voice... speak now'
                      : mode === 'support'
                      ? 'Ask TKN: enter order # (e.g. TKN-9021) or returns...'
                      : mode === 'sales'
                      ? 'Ask TKN about 300-500GSM cuts, pairings, or sizing...'
                      : 'Ask TKN anything about garments, orders, or studio...'
                  }
                  disabled={isLoading}
                  className={`w-full pl-3 pr-8 py-2 text-xs font-mono-tag border-2 border-black focus:outline-none text-black placeholder:text-neutral-500 transition-colors ${
                    isListening ? 'bg-red-50 border-red-500' : 'bg-[#FAF8F3] focus:bg-white'
                  }`}
                />
                {/* Voice Dictation Mic Button */}
                <button
                  type="button"
                  onClick={handleToggleVoiceInput}
                  className={`absolute right-1.5 p-1 rounded transition-colors cursor-pointer ${
                    isListening
                      ? 'text-red-600 animate-pulse bg-red-100'
                      : 'text-neutral-400 hover:text-black hover:bg-neutral-200'
                  }`}
                  title={isListening ? 'Listening... click to stop' : 'Click to dictate via microphone'}
                >
                  {isListening ? <MicOff className="w-3.5 h-3.5 text-red-600" /> : <Mic className="w-3.5 h-3.5" />}
                </button>
              </div>
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="px-3.5 py-2 bg-black hover:bg-neutral-800 text-yellow-300 font-mono-tag font-bold text-xs uppercase border-2 border-black disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 shrink-0 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">SEND</span>
              </button>
            </form>
            <div className="flex items-center justify-between mt-1 px-0.5">
              <span className="font-mono-tag text-[9px] text-neutral-500 truncate">
                Direct live AI connection to London studio catalog & dispatch
              </span>
              <span className="font-mono-tag text-[9px] text-neutral-400 font-bold shrink-0 ml-2">
                ESC TO CLOSE
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
