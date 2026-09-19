import React, { useState, useRef, useEffect } from 'react';
import { api } from '../../lib/api';
import {
  Bot,
  Send,
  User,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  ShieldAlert,
  Cpu,
  Layers,
  Zap,
  Package,
  Boxes,
  Tag,
  Bell,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';

interface ExecutedAction {
  success: boolean;
  actionType: string;
  summary: string;
  data?: any;
  error?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  modelUsed?: string;
  actionsExecuted?: ExecutedAction[];
}

type ChatRole = 'admin_copilot' | 'creative_director' | 'apparel_stylist';

interface GeminiChatbotTabProps {
  onNavigateTab?: (tab: 'orders' | 'inventory' | 'marketing' | 'products' | 'analytics' | 'waitlist') => void;
  onRefreshData?: () => void;
}

const ROLE_CONFIGS: Record<
  ChatRole,
  {
    name: string;
    description: string;
    defaultModel: 'gemini-3.5-flash' | 'gemini-3.1-pro-preview' | 'gemini-3.1-flash-lite';
    badge: string;
    taskType: string;
    color: string;
  }
> = {
  admin_copilot: {
    name: 'Executive Chief of Operations (Full Admin Authority)',
    description: 'Full store execution authority: resolves orders, assigns Royal Mail tracking, restocks warehouse, generates promos, and automates store tasks.',
    defaultModel: 'gemini-3.5-flash',
    badge: 'FULL ADMIN AUTHORITY',
    taskType: 'Store Automation',
    color: 'bg-yellow-400 text-black border border-black font-black',
  },
  creative_director: {
    name: 'Archive Creative Director & Copywriter',
    description: 'Complex brand reasoning, editorial drop manifestos, high-impact lookbook copy, and design philosophy.',
    defaultModel: 'gemini-3.1-pro-preview',
    badge: 'COMPLEX REASONING',
    taskType: 'Creative Tasks',
    color: 'bg-purple-600 text-white',
  },
  apparel_stylist: {
    name: 'London Studio Apparel Stylist',
    description: 'General styling, 300-500GSM sizing guidance, heavy cotton drape advice, and fabric care.',
    defaultModel: 'gemini-3.5-flash',
    badge: 'GENERAL APPAREL',
    taskType: 'General Tasks',
    color: 'bg-blue-600 text-white',
  },
};

const PROMPT_SUGGESTIONS: Record<ChatRole, string[]> = {
  admin_copilot: [
    'Give me an operational snapshot of revenue, pending orders, and low inventory.',
    'Mark order TKN-7814 as shipped with carrier Royal Mail Tracked 24 and tracking GB-RM-940028192UK.',
    'Restock 500GSM HOODIE size L by 25 units in the live warehouse.',
    'Create active promo code SECRET25 for 25% off with max 150 uses.',
    'Cancel order TKN-8492 and return garments back into inventory stock.',
    'Update the drop banner to "EXCLUSIVE MIDNIGHT DROP IS LIVE NOW" with tag [VAULT RELEASE].',
    'Dispatch restock notification alerts to all customers on the waitlist.',
  ],
  creative_director: [
    'Draft a gritty London studio launch manifesto for our 500GSM ultra-dense hoodie drop.',
    'Analyze why heavy 300-500GSM cotton creates superior boxy drape compared to commercial blanks.',
    'Write high-contrast lookbook descriptions for the Duck Canvas Skate Pant and Raw Edge Crew.',
    'Conceptualize a limited winter archive drop inspired by London brutalist architecture.',
  ],
  apparel_stylist: [
    'Explain how to choose between size L and XL for our Boxy Drop-Shoulder 300GSM Acid Box Tee.',
    'What are the optimal washing and drying instructions for heavy loopback French Terry without shrinking?',
    'Suggest 3 streetwear layering outfits pairing the 550GSM Zip Hoodie with wide-leg trousers.',
    'How does 14oz duck canvas soften and patina through daily skateboarding?',
  ],
};

export const GeminiChatbotTab: React.FC<GeminiChatbotTabProps> = ({
  onNavigateTab,
  onRefreshData,
}) => {
  const [role, setRole] = useState<ChatRole>('admin_copilot');
  const [modelOverride, setModelOverride] = useState<
    'gemini-3.1-pro-preview' | 'gemini-3.5-flash' | 'gemini-3.1-flash-lite'
  >(ROLE_CONFIGS['admin_copilot'].defaultModel);

  const [inputMessage, setInputMessage] = useState('');
  const [storeSnapshot, setStoreSnapshot] = useState<any>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: '⚡ **Archive Operations Co-Pilot Online // Full Admin Authority Active**\n\nI have direct execution access to your live store database:\n- **Fulfill & Track Orders:** Mark shipped, assign carriers & Royal Mail tracking, cancel & restock.\n- **Warehouse Inventory:** Restock sizes, adjust stock counts, monitor zero-stock items.\n- **Marketing & Promos:** Create discount coupons, toggle codes, update the storefront announcement banner.\n- **Customer Waitlist:** Dispatch restock alerts automatically.\n\nTell me what needs resolving, or click one of the quick automation triggers below.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelUsed: 'gemini-3.5-flash',
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleRoleChange = (newRole: ChatRole) => {
    setRole(newRole);
    setModelOverride(ROLE_CONFIGS[newRole].defaultModel);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    setErrorMessage(null);
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newThread = [...messages, userMsg];
    setMessages(newThread);
    setInputMessage('');
    setIsLoading(true);

    const apiPayload = newThread
      .filter((m) => m.id !== 'welcome')
      .map((m) => ({
        role: m.role,
        text: m.text,
      }));

    try {
      if (role === 'admin_copilot') {
        const response = await api.geminiAdminChat({
          model: modelOverride,
          role,
          messages: apiPayload,
        });

        if (response.success && response.text) {
          const modelMsg: ChatMessage = {
            id: `model-${Date.now()}`,
            role: 'model',
            text: response.text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            modelUsed: response.modelUsed || modelOverride,
            actionsExecuted: response.actionsExecuted,
          };
          setMessages((prev) => [...prev, modelMsg]);

          if (response.snapshot) {
            setStoreSnapshot(response.snapshot);
          }

          // If actions were executed, refresh the main admin data tables
          if (response.actionsExecuted && response.actionsExecuted.length > 0 && onRefreshData) {
            onRefreshData();
          }
        } else {
          setErrorMessage(response.error || 'Failed to complete admin operation');
        }
      } else {
        const response = await api.geminiChat({
          model: modelOverride,
          role,
          messages: apiPayload,
        });

        if (response.success && response.text) {
          const modelMsg: ChatMessage = {
            id: `model-${Date.now()}`,
            role: 'model',
            text: response.text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            modelUsed: response.modelUsed || modelOverride,
          };
          setMessages((prev) => [...prev, modelMsg]);
        } else {
          setErrorMessage(response.error || 'Failed to generate response');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error communicating with Gemini API');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleResetConversation = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'model',
        text: `Switched mode to **${ROLE_CONFIGS[role].name}**.\n\nReady for instructions. How can I assist your operations?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: modelOverride,
      },
    ]);
    setErrorMessage(null);
  };

  return (
    <div id="gemini-admin-chatbot-tab" className="flex flex-col h-[780px] bg-neutral-900 border-2 border-black text-white font-sans overflow-hidden">
      {/* Top Header & Role Selector */}
      <div className="bg-black p-4 border-b-2 border-neutral-700 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-400 border-2 border-black flex items-center justify-center text-black font-black shadow-[2px_2px_0px_#fff]">
            <Zap className="w-5 h-5 fill-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-headline font-black text-base uppercase tracking-wider text-yellow-300">
                EXECUTIVE ARCHIVE CO-PILOT
              </h2>
              <span className="bg-emerald-500 text-black font-mono-tag font-bold text-[10px] px-2 py-0.5 uppercase flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping" />
                FULL ADMIN AUTHORITY
              </span>
            </div>
            <p className="font-mono-tag text-xs text-neutral-400">
              Direct store execution: automated order resolution, inventory restocks, and promo dispatch
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Role Selector */}
          <div className="flex border-2 border-neutral-700 bg-neutral-950 p-0.5">
            {(['admin_copilot', 'creative_director', 'apparel_stylist'] as ChatRole[]).map((rKey) => (
              <button
                key={rKey}
                onClick={() => handleRoleChange(rKey)}
                className={`px-3 py-1 text-xs font-mono-tag font-bold transition-all cursor-pointer ${
                  role === rKey
                    ? 'bg-yellow-400 text-black shadow-xs'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {rKey === 'admin_copilot'
                  ? '⚡ FULL ADMIN'
                  : rKey === 'creative_director'
                  ? '🖋️ CREATIVE DIR'
                  : '📐 STYLIST'}
              </button>
            ))}
          </div>

          <button
            onClick={handleResetConversation}
            className="p-2 border-2 border-neutral-700 hover:border-white bg-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
            title="Reset conversation"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Real-Time Operational Bar */}
      <div className="bg-neutral-950 px-4 py-2 border-b border-neutral-800 flex flex-wrap items-center justify-between text-xs font-mono-tag">
        <div className="flex items-center gap-4 text-neutral-400">
          <span className="flex items-center gap-1.5 text-neutral-200">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            GROSS REVENUE: <strong className="text-yellow-300">£{storeSnapshot?.grossRevenue || '1,686.00'}</strong>
          </span>
          <span className="text-neutral-600">|</span>
          <span className="flex items-center gap-1.5 text-neutral-200">
            <Package className="w-3.5 h-3.5 text-blue-400" />
            PENDING ORDERS: <strong className="text-white">{storeSnapshot?.pendingOrdersCount ?? '1'}</strong>
          </span>
          <span className="text-neutral-600">|</span>
          <span className="flex items-center gap-1.5 text-neutral-200">
            <Boxes className="w-3.5 h-3.5 text-amber-400" />
            LOW STOCK: <strong className="text-amber-400">{storeSnapshot?.lowStockItems?.length ?? '3'} ITEMS</strong>
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px]">
          <span className="text-neutral-500">ENGINE:</span>
          <span className="bg-neutral-800 text-neutral-300 px-2 py-0.5 border border-neutral-700 font-bold">
            {modelOverride}
          </span>
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-neutral-950 font-sans">
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-full`}
            >
              <div className="flex items-center gap-2 mb-1.5 px-1">
                <span className="font-mono-tag text-[10px] uppercase font-bold text-neutral-500 flex items-center gap-1">
                  {isUser ? (
                    <>
                      <User className="w-3 h-3 text-neutral-400" /> YOU (STORE OWNER)
                    </>
                  ) : (
                    <>
                      <Bot className="w-3 h-3 text-yellow-400" />{' '}
                      {ROLE_CONFIGS[role].name}
                    </>
                  )}
                </span>
                <span className="font-mono-tag text-[10px] text-neutral-500">{m.timestamp}</span>
                {m.modelUsed && (
                  <span className="font-mono-tag text-[9px] bg-neutral-800 text-neutral-400 px-1.5 py-0.5 border border-neutral-700">
                    {m.modelUsed}
                  </span>
                )}
              </div>

              <div
                className={`p-4 text-xs leading-relaxed border-2 relative group ${
                  isUser
                    ? 'bg-neutral-800 text-white border-neutral-600 max-w-[85%]'
                    : 'bg-[#151614] text-neutral-200 border-neutral-700 max-w-[92%]'
                }`}
              >
                <div className="whitespace-pre-line font-mono text-[12px]">{m.text}</div>

                {/* Render Executed Actions Cards */}
                {m.actionsExecuted && m.actionsExecuted.length > 0 && (
                  <div className="mt-3.5 space-y-2 pt-3 border-t border-neutral-700">
                    <div className="text-[10px] font-mono-tag uppercase font-black text-yellow-300 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" />
                      LIVE STORE AUTOMATION EXECUTED:
                    </div>
                    {m.actionsExecuted.map((act, aIdx) => (
                      <div
                        key={aIdx}
                        className={`p-3 border-2 ${
                          act.success
                            ? 'bg-neutral-900 border-emerald-500 text-white'
                            : 'bg-red-950/80 border-red-500 text-red-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="font-mono-tag font-bold text-[11px] flex items-center gap-1.5 text-emerald-400">
                            <Check className="w-3.5 h-3.5" />
                            {act.summary}
                          </span>
                          <span className="font-mono-tag text-[9px] uppercase px-1.5 py-0.5 bg-black border border-neutral-700 text-neutral-400">
                            {act.actionType}
                          </span>
                        </div>

                        {/* Direct Navigation Links for the Business Owner */}
                        <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-neutral-800">
                          {act.actionType === 'update_order_status' && onNavigateTab && (
                            <button
                              onClick={() => onNavigateTab('orders')}
                              className="px-2.5 py-1 bg-yellow-400 text-black hover:bg-yellow-300 font-mono-tag font-bold text-[10px] uppercase flex items-center gap-1 cursor-pointer"
                            >
                              VIEW IN ORDERS TAB <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                          {act.actionType === 'adjust_inventory' && onNavigateTab && (
                            <button
                              onClick={() => onNavigateTab('inventory')}
                              className="px-2.5 py-1 bg-yellow-400 text-black hover:bg-yellow-300 font-mono-tag font-bold text-[10px] uppercase flex items-center gap-1 cursor-pointer"
                            >
                              VIEW IN INVENTORY TAB <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                          {(act.actionType === 'create_promo' || act.actionType === 'update_banner') && onNavigateTab && (
                            <button
                              onClick={() => onNavigateTab('marketing')}
                              className="px-2.5 py-1 bg-yellow-400 text-black hover:bg-yellow-300 font-mono-tag font-bold text-[10px] uppercase flex items-center gap-1 cursor-pointer"
                            >
                              VIEW IN MARKETING TAB <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                          {act.actionType === 'notify_waitlist' && onNavigateTab && (
                            <button
                              onClick={() => onNavigateTab('waitlist')}
                              className="px-2.5 py-1 bg-yellow-400 text-black hover:bg-yellow-300 font-mono-tag font-bold text-[10px] uppercase flex items-center gap-1 cursor-pointer"
                            >
                              VIEW WAITLIST TAB <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => handleCopyMessage(m.id, m.text)}
                  className="absolute top-2 right-2 p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-opacity opacity-0 group-hover:opacity-100 cursor-pointer"
                  title="Copy text"
                >
                  {copiedId === m.id ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 p-3 bg-neutral-900 border border-neutral-700 max-w-[240px]">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" />
              <span
                className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"
                style={{ animationDelay: '0.15s' }}
              />
              <span
                className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"
                style={{ animationDelay: '0.3s' }}
              />
            </div>
            <span className="font-mono-tag text-xs text-neutral-400">
              Executing store automation...
            </span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 bg-red-950/80 border-2 border-red-500 text-red-200 text-xs font-mono-tag flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Triggers */}
      <div className="px-4 py-2 bg-neutral-900 border-t border-neutral-800 flex items-center gap-2 overflow-x-auto">
        <span className="font-mono-tag text-[10px] text-yellow-400 uppercase font-black shrink-0 flex items-center gap-1">
          <Zap className="w-3 h-3" /> FAST AUTOMATE:
        </span>
        {PROMPT_SUGGESTIONS[role].map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(p)}
            disabled={isLoading}
            className="text-[11px] font-mono-tag px-2.5 py-1 bg-neutral-800 hover:bg-yellow-400 hover:text-black border border-neutral-700 text-neutral-300 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Message Input Form */}
      <div className="p-3.5 bg-black border-t-2 border-neutral-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={
              role === 'admin_copilot'
                ? 'Issue command, e.g. "Fulfill order TKN-7814", "Add 20 stock to hoodie", "Create promo CODE20"...'
                : 'Prompt archive creative assistant...'
            }
            disabled={isLoading}
            className="flex-1 px-3 py-2.5 bg-neutral-900 border-2 border-neutral-700 text-white font-mono text-xs focus:border-yellow-400 focus:outline-none placeholder:text-neutral-500"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="px-5 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-black font-headline font-black text-xs uppercase border-2 border-black flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Send className="w-4 h-4" />
            EXECUTE
          </button>
        </form>
      </div>
    </div>
  );
};
