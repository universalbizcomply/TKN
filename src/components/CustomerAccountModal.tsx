import React, { useState, useEffect } from 'react';
import { CustomerProfile, Order, LinkedAccountProvider, LinkedAccountItem, LinkedAccounts } from '../types';
import { api } from '../lib/api';

const PROVIDER_INFO: Record<
  LinkedAccountProvider,
  {
    name: string;
    icon: string;
    badge: string;
    description: string;
    perk: string;
    defaultPlaceholder: string;
    brandColor: string;
  }
> = {
  google: {
    name: 'Google Account',
    icon: 'G',
    badge: '1-TAP SSO',
    description: 'Google Identity & One-Tap Authentication',
    perk: 'Instant passwordless sign-in, Google Pay archive synchronization, and order notifications.',
    defaultPlaceholder: 'user@gmail.com',
    brandColor: 'border-white text-white',
  },
  apple: {
    name: 'Apple ID',
    icon: '',
    badge: 'PRIVATE RELAY',
    description: 'Apple Sign-In with Face ID / Touch ID passkeys',
    perk: 'Private relay email obfuscation, biometrics passkey login, and instant Apple Pay checkout.',
    defaultPlaceholder: 'privaterelay.appleid.com',
    brandColor: 'border-neutral-400 text-neutral-200',
  },
  shoppay: {
    name: 'Shop Pay',
    icon: '⚡',
    badge: 'FAST DISPATCH',
    description: 'Shopify Express 1-Tap Checkout Network',
    perk: 'Pre-filled UK & international delivery coordinates and 1-tap card authentication.',
    defaultPlaceholder: '+44 7911 123456 / shoppay@me.com',
    brandColor: 'border-[#5a31f4] text-[#a58dff]',
  },
  instagram: {
    name: 'Instagram',
    icon: '📸',
    badge: 'FIT TAGS',
    description: 'Streetwear Archive Fit Tagging & Editorial Feature',
    perk: 'Tag #TKNarchive in your street fits to auto-verify your patron badge on community lookbooks.',
    defaultPlaceholder: '@username',
    brandColor: 'border-pink-500 text-pink-400',
  },
  discord: {
    name: 'Discord',
    icon: '💬',
    badge: 'VIP DROPS',
    description: 'TKN Underground Private Discord Server',
    perk: 'Grants exclusive role access to secret 300 GSM tees, private voice rooms, and midnight restocks.',
    defaultPlaceholder: 'username#0000',
    brandColor: 'border-[#5865F2] text-[#8ea1ff]',
  },
  github: {
    name: 'GitHub',
    icon: '🐙',
    badge: 'OPEN ARCHIVE',
    description: 'Open-Spec Telemetry & Developer Contributor',
    perk: 'Unlocks developer patron badge on digital zine code releases and technical drops.',
    defaultPlaceholder: 'github-username',
    brandColor: 'border-neutral-600 text-neutral-300',
  },
};

interface CustomerAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCustomer: CustomerProfile | null;
  onCustomerLogin: (customer: CustomerProfile) => void;
  onCustomerLogout: () => void;
  onOpenTracker?: (orderId?: string) => void;
}

export const CustomerAccountModal: React.FC<CustomerAccountModalProps> = ({
  isOpen,
  onClose,
  currentCustomer,
  onCustomerLogin,
  onCustomerLogout,
  onOpenTracker,
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [activeProfileTab, setActiveProfileTab] = useState<'orders' | 'address' | 'measurements' | 'perks' | 'accounts'>('orders');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [zip, setZip] = useState('');
  const [country, setCountry] = useState('United Kingdom');
  const [preferredFit, setPreferredFit] = useState<'snug' | 'true-to-size' | 'oversized-boxy' | 'extreme-drop'>('oversized-boxy');
  const [heightCm, setHeightCm] = useState<number>(182);
  const [weightKg, setWeightKg] = useState<number>(76);
  const [preferredChestInches, setPreferredChestInches] = useState<number>(42);

  // Account Linking states
  const [connectingProvider, setConnectingProvider] = useState<LinkedAccountProvider | null>(null);
  const [connectInputValue, setConnectInputValue] = useState('');
  const [connectDisplayName, setConnectDisplayName] = useState('');
  const [socialAuthModalProvider, setSocialAuthModalProvider] = useState<LinkedAccountProvider | null>(null);
  const [socialAuthInputValue, setSocialAuthInputValue] = useState('');
  const [socialAuthNameValue, setSocialAuthNameValue] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3200);
  };

  // Load orders when customer is active
  useEffect(() => {
    if (currentCustomer) {
      loadOrders(currentCustomer.email);
      // Initialize edit fields
      setName(currentCustomer.name || '');
      setPhone(currentCustomer.phone || '');
      setStreet(currentCustomer.address?.street || '');
      setCity(currentCustomer.address?.city || '');
      setZip(currentCustomer.address?.zip || '');
      setCountry(currentCustomer.address?.country || 'United Kingdom');
      if (currentCustomer.measurements) {
        if (currentCustomer.measurements.preferredFit) setPreferredFit(currentCustomer.measurements.preferredFit);
        if (currentCustomer.measurements.heightCm) setHeightCm(currentCustomer.measurements.heightCm);
        if (currentCustomer.measurements.weightKg) setWeightKg(currentCustomer.measurements.weightKg);
        if (currentCustomer.measurements.preferredChestInches) setPreferredChestInches(currentCustomer.measurements.preferredChestInches);
      }
    }
  }, [currentCustomer]);

  const loadOrders = async (userEmail: string) => {
    try {
      const res = await api.getCustomerOrders(userEmail);
      if (res.orders) {
        setCustomerOrders(res.orders);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Please enter your account email.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.loginCustomer({
        email: email.trim(),
        password: password.trim() || undefined,
      });
      if (res.success && res.customer) {
        onCustomerLogin(res.customer);
        showToast(`✓ Welcome back, ${res.customer.name}!`);
      } else {
        setErrorMsg(res.error || 'Failed to sign in. Please verify your credentials.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !name.trim()) {
      setErrorMsg('Name and email are required.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.registerCustomer({
        name: name.trim(),
        email: email.trim(),
        password: password.trim() || 'archive26',
        phone: phone.trim(),
        address: {
          street: street.trim(),
          city: city.trim() || 'London',
          state: '',
          zip: zip.trim(),
          country: country.trim() || 'United Kingdom',
        },
        measurements: {
          heightCm: Number(heightCm) || undefined,
          weightKg: Number(weightKg) || undefined,
          preferredFit,
          preferredChestInches: Number(preferredChestInches) || undefined,
        },
      });
      if (res.success && res.customer) {
        onCustomerLogin(res.customer);
        showToast(`✓ Welcome to the archive, ${res.customer.name}!`);
      } else {
        setErrorMsg(res.error || 'Registration failed.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration error.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCustomer) return;
    setLoading(true);
    try {
      const res = await api.updateCustomerProfile({
        email: currentCustomer.email,
        name: name.trim(),
        phone: phone.trim(),
        address: {
          street: street.trim(),
          city: city.trim(),
          state: '',
          zip: zip.trim(),
          country: country.trim(),
        },
        measurements: {
          heightCm: Number(heightCm),
          weightKg: Number(weightKg),
          preferredFit,
          preferredChestInches: Number(preferredChestInches),
        },
      });
      if (res.success && res.customer) {
        onCustomerLogin(res.customer);
        showToast('✓ Profile & shipping address updated!');
      } else {
        setErrorMsg(res.error || 'Failed to update profile.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Update failed.');
    } finally {
      setLoading(false);
    }
  };

  const quickLoginDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMsg(null);
    setLoading(true);
    api.loginCustomer({ email: demoEmail, password: demoPass }).then((res) => {
      setLoading(false);
      if (res.success && res.customer) {
        onCustomerLogin(res.customer);
        showToast(`✓ Signed in as ${res.customer.name}!`);
      } else {
        setErrorMsg(res.error || 'Login failed');
      }
    });
  };

  // Social Auth (Login & Register) Handlers
  const handleInitiateSocialAuth = (provider: LinkedAccountProvider) => {
    setSocialAuthModalProvider(provider);
    if (provider === 'google') {
      setSocialAuthInputValue('muradnizam@gmail.com');
      setSocialAuthNameValue('Murad Nizam');
    } else if (provider === 'apple') {
      setSocialAuthInputValue('patron.apple@privaterelay.appleid.com');
      setSocialAuthNameValue('Apple Archive Patron');
    } else if (provider === 'shoppay') {
      setSocialAuthInputValue('+44 7911 123456');
      setSocialAuthNameValue('Shop Pay Verified User');
    } else if (provider === 'instagram') {
      setSocialAuthInputValue('@murad_fits');
      setSocialAuthNameValue('Murad');
    } else if (provider === 'discord') {
      setSocialAuthInputValue('archive_patron#1994');
      setSocialAuthNameValue('Archive Patron');
    } else if (provider === 'github') {
      setSocialAuthInputValue('tkn-contributor');
      setSocialAuthNameValue('TKN Contributor');
    }
  };

  const handleExecuteSocialAuth = async () => {
    if (!socialAuthModalProvider) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const isEmailLike = socialAuthInputValue.includes('@');
      const payload = {
        provider: socialAuthModalProvider,
        email: isEmailLike ? socialAuthInputValue.trim() : `${socialAuthInputValue.replace(/[@#]/g, '')}.${Date.now()}@archive-patron.local`,
        name: socialAuthNameValue.trim() || socialAuthInputValue.replace(/[@#]/g, ''),
        handle: socialAuthInputValue.trim(),
        accountId: `${socialAuthModalProvider}-${Date.now()}`,
      };

      const res = await api.socialAuthCustomer(payload);
      if (res.success && res.customer) {
        onCustomerLogin(res.customer);
        showToast(
          res.isNew
            ? `✓ Archive account created & linked with ${PROVIDER_INFO[socialAuthModalProvider].name}!`
            : `✓ Signed in with ${PROVIDER_INFO[socialAuthModalProvider].name}!`
        );
        setSocialAuthModalProvider(null);
      } else {
        setErrorMsg(res.error || 'Social sign-in could not be completed.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Social authentication error.');
    } finally {
      setLoading(false);
    }
  };

  // Profile Account Linking Handlers
  const handleStartConnect = (provider: LinkedAccountProvider) => {
    setConnectingProvider(provider);
    if (provider === 'google') {
      setConnectInputValue('muradnizam@gmail.com');
      setConnectDisplayName(currentCustomer?.name || 'Murad Nizam');
    } else if (provider === 'apple') {
      setConnectInputValue(`${currentCustomer?.email.split('@')[0] || 'patron'}@privaterelay.appleid.com`);
      setConnectDisplayName(currentCustomer?.name || 'Apple ID User');
    } else if (provider === 'shoppay') {
      setConnectInputValue(currentCustomer?.phone || '+44 7911 123456');
      setConnectDisplayName(currentCustomer?.name || 'Shop Pay Profile');
    } else if (provider === 'instagram') {
      setConnectInputValue(`@${currentCustomer?.name.toLowerCase().replace(/\s+/g, '_') || 'streetwear_patron'}`);
      setConnectDisplayName(currentCustomer?.name || 'Instagram User');
    } else if (provider === 'discord') {
      setConnectInputValue(`${currentCustomer?.name.toLowerCase().replace(/\s+/g, '') || 'patron'}#2026`);
      setConnectDisplayName(currentCustomer?.name || 'Discord Member');
    } else if (provider === 'github') {
      setConnectInputValue(`${currentCustomer?.name.toLowerCase().replace(/\s+/g, '-') || 'developer'}`);
      setConnectDisplayName(currentCustomer?.name || 'GitHub Developer');
    }
  };

  const handleSaveConnectAccount = async () => {
    if (!connectingProvider || !currentCustomer) return;
    if (!connectInputValue.trim()) {
      showToast('Please enter an account identifier or handle');
      return;
    }
    setLoading(true);
    try {
      const res = await api.linkCustomerAccount({
        email: currentCustomer.email,
        provider: connectingProvider,
        emailOrHandle: connectInputValue.trim(),
        displayName: connectDisplayName.trim() || undefined,
        accountId: `${connectingProvider}-${Date.now()}`,
      });

      if (res.success && res.customer) {
        onCustomerLogin(res.customer);
        showToast(`✓ Linked ${PROVIDER_INFO[connectingProvider].name} to your profile!`);
        setConnectingProvider(null);
      } else {
        showToast(`⚠️ ${res.error || 'Failed to link account'}`);
      }
    } catch (err: any) {
      showToast(`⚠️ ${err.message || 'Error linking account'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlinkAccount = async (provider: LinkedAccountProvider) => {
    if (!currentCustomer) return;
    const confirmPrompt = window.confirm
      ? window.confirm(`Unlink ${PROVIDER_INFO[provider].name} from your profile?`)
      : true;
    if (!confirmPrompt) return;

    setLoading(true);
    try {
      const res = await api.unlinkCustomerAccount({
        email: currentCustomer.email,
        provider,
      });

      if (res.success && res.customer) {
        onCustomerLogin(res.customer);
        showToast(`✓ Unlinked ${PROVIDER_INFO[provider].name}`);
      } else {
        showToast(`⚠️ ${res.error || 'Failed to unlink account'}`);
      }
    } catch (err: any) {
      showToast(`⚠️ ${err.message || 'Error unlinking account'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="customer-account-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        id="customer-account-modal-container"
        className="bg-neutral-900 border border-neutral-700 w-full max-w-2xl max-h-[90vh] flex flex-col text-neutral-100 shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toast Alert */}
        {toastMsg && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 bg-white text-black px-4 py-1.5 text-xs font-mono font-bold tracking-wider shadow-lg border border-neutral-200 animate-bounce">
            {toastMsg}
          </div>
        )}

        {/* Modal Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-black/40">
          <div className="flex items-center space-x-3">
            <span className="text-xl">👤</span>
            <div>
              <h2 className="text-sm font-bold tracking-widest uppercase font-mono">
                {currentCustomer ? 'TKN CUSTOMER ACCOUNT & ARCHIVE PROFILE' : 'TKN CUSTOMER ACCESS'}
              </h2>
              <p className="text-[10px] text-neutral-400 font-mono tracking-wider">
                {currentCustomer
                  ? `LOGGED IN: ${currentCustomer.email.toUpperCase()} • ${currentCustomer.tier.replace(/_/g, ' ')}`
                  : 'SIGN IN FOR LIFETIME TRACKING, SAVED SHIPPING & ARCHIVE PERKS'}
              </p>
            </div>
          </div>
          <button
            id="btn-close-customer-account"
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 font-mono text-sm border border-neutral-700 hover:border-neutral-400 px-2 transition-colors"
          >
            [ESC / ✕]
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 text-xs font-mono">
          {!currentCustomer ? (
            /* ------------------ AUTH FORM (LOGIN / REGISTER) ------------------ */
            <div className="space-y-6">
              {/* Tab Selector */}
              <div className="flex border-b border-neutral-800">
                <button
                  id="tab-btn-customer-login"
                  onClick={() => {
                    setAuthMode('login');
                    setErrorMsg(null);
                  }}
                  className={`flex-1 py-2 text-center text-xs tracking-wider uppercase font-bold border-b-2 transition-all ${
                    authMode === 'login'
                      ? 'border-white text-white bg-neutral-800/40'
                      : 'border-transparent text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  [1] SIGN IN TO ACCOUNT
                </button>
                <button
                  id="tab-btn-customer-register"
                  onClick={() => {
                    setAuthMode('register');
                    setErrorMsg(null);
                  }}
                  className={`flex-1 py-2 text-center text-xs tracking-wider uppercase font-bold border-b-2 transition-all ${
                    authMode === 'register'
                      ? 'border-white text-white bg-neutral-800/40'
                      : 'border-transparent text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  [2] CREATE NEW ARCHIVE ACCOUNT
                </button>
              </div>

              {/* Error Banner */}
              {errorMsg && (
                <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs">
                  ⚠️ {errorMsg}
                </div>
              )}

              {/* Federated & Linked Account Sign-In / Registration Bar */}
              <div className="p-3 bg-neutral-950 border border-neutral-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-1.5">
                    <span>🔗</span> 1-TAP ARCHIVE PASS (CONTINUE WITH LINKED ACCOUNT)
                  </span>
                  <span className="text-[9px] text-amber-400 font-bold uppercase bg-amber-950/60 border border-amber-800/80 px-1.5 py-0.5">
                    NO PASSWORD REQ.
                  </span>
                </div>
                <p className="text-[10px] text-neutral-400 leading-normal">
                  Connect your Google, Apple ID, Shop Pay, or social handle to sign in instantly or create a pre-verified archive account:
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleInitiateSocialAuth('google')}
                    className="p-2 bg-neutral-900 hover:bg-neutral-850 border border-neutral-700 hover:border-white text-white flex items-center justify-center gap-2 font-bold transition-all text-xs group"
                  >
                    <span className="w-4 h-4 bg-white text-black text-[10px] font-black rounded-full flex items-center justify-center">G</span>
                    <span>Google</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInitiateSocialAuth('apple')}
                    className="p-2 bg-neutral-900 hover:bg-neutral-850 border border-neutral-700 hover:border-white text-white flex items-center justify-center gap-2 font-bold transition-all text-xs"
                  >
                    <span className="text-sm"></span>
                    <span>Apple ID</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInitiateSocialAuth('shoppay')}
                    className="p-2 bg-neutral-900 hover:bg-neutral-850 border border-neutral-700 hover:border-[#5a31f4] text-white flex items-center justify-center gap-2 font-bold transition-all text-xs"
                  >
                    <span className="text-sm text-[#8d6eff]">⚡</span>
                    <span>Shop Pay</span>
                  </button>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-neutral-900 text-[10px]">
                  <span className="text-neutral-500">More accounts:</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleInitiateSocialAuth('instagram')}
                      className="text-neutral-400 hover:text-pink-400 underline transition-colors"
                    >
                      📸 Instagram
                    </button>
                    <span className="text-neutral-700">•</span>
                    <button
                      type="button"
                      onClick={() => handleInitiateSocialAuth('discord')}
                      className="text-neutral-400 hover:text-[#8ea1ff] underline transition-colors"
                    >
                      💬 Discord
                    </button>
                    <span className="text-neutral-700">•</span>
                    <button
                      type="button"
                      onClick={() => handleInitiateSocialAuth('github')}
                      className="text-neutral-400 hover:text-white underline transition-colors"
                    >
                      🐙 GitHub
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center my-3">
                <div className="flex-1 border-t border-neutral-800" />
                <span className="px-3 text-[10px] text-neutral-500 uppercase tracking-widest font-mono">
                  OR DEMO PROFILES / STANDARD EMAIL
                </span>
                <div className="flex-1 border-t border-neutral-800" />
              </div>

              {/* 1-Click Fast Pass for Customer */}
              <div className="p-3 bg-neutral-950 border border-neutral-800 space-y-2">
                <div className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider flex items-center justify-between">
                  <span>⚡ 1-CLICK DEMO CUSTOMER PASS</span>
                  <span className="text-[10px] text-neutral-500">TEST DATA READY</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => quickLoginDemo('callum.davies@hackneyskate.co.uk', 'archive26')}
                    className="text-left p-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-white transition-all text-[11px] group"
                  >
                    <div className="font-bold text-white group-hover:text-amber-300">Callum Davies (VIP Patron)</div>
                    <div className="text-[10px] text-neutral-400">callum.davies@hackneyskate.co.uk</div>
                    <div className="text-[9px] text-emerald-400 mt-0.5">3 Orders • £348.50 spent • Shoreditch, London</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => quickLoginDemo('maya.lin@berlinzine.de', 'berlin2026')}
                    className="text-left p-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-white transition-all text-[11px] group"
                  >
                    <div className="font-bold text-white group-hover:text-amber-300">Maya Lin (Core Patron)</div>
                    <div className="text-[10px] text-neutral-400">maya.lin@berlinzine.de</div>
                    <div className="text-[9px] text-emerald-400 mt-0.5">2 Orders • £210.00 spent • Berlin, DE</div>
                  </button>
                </div>
              </div>

              {authMode === 'login' ? (
                /* Login Form */
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] text-neutral-400 uppercase tracking-widest mb-1">
                      EMAIL ADDRESS *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. callum.davies@hackneyskate.co.uk"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-700 p-2.5 text-xs text-white placeholder-neutral-600 focus:border-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] text-neutral-400 uppercase tracking-widest">
                        PASSWORD *
                      </label>
                      <span className="text-[10px] text-neutral-500">(Demo pass: archive26)</span>
                    </div>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-700 p-2.5 text-xs text-white placeholder-neutral-600 focus:border-white focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-white hover:bg-neutral-200 text-black font-bold uppercase tracking-widest transition-colors flex items-center justify-center space-x-2"
                  >
                    {loading ? <span>AUTHENTICATING...</span> : <span>SIGN IN TO ARCHIVE PROFILE →</span>}
                  </button>

                  <div className="p-3 border border-neutral-800 bg-black/40 text-neutral-400 text-[11px] leading-relaxed">
                    <span className="text-white font-bold">Shopping without an account?</span> You can always checkout as a <span className="text-amber-300">Guest</span> in your Order Bag with zero password setup required.
                  </div>
                </form>
              ) : (
                /* Register Form */
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-neutral-400 uppercase tracking-widest mb-1">
                        FULL NAME *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Julian Ross"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-700 p-2 text-xs text-white focus:border-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-neutral-400 uppercase tracking-widest mb-1">
                        EMAIL ADDRESS *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. julian@studio.co.uk"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-700 p-2 text-xs text-white focus:border-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-neutral-400 uppercase tracking-widest mb-1">
                        PASSWORD *
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="Create a password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-700 p-2 text-xs text-white focus:border-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-neutral-400 uppercase tracking-widest mb-1">
                        PHONE (FOR DELIVERY UPDATES)
                      </label>
                      <input
                        type="tel"
                        placeholder="+44 7900 000000"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-700 p-2 text-xs text-white focus:border-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="border-t border-neutral-800 pt-3">
                    <div className="text-[10px] text-neutral-400 uppercase tracking-widest mb-2 font-bold">
                      DEFAULT SHIPPING DESTINATION (OPTIONAL)
                    </div>
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Street Address"
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-700 p-2 text-xs text-white focus:border-white focus:outline-none"
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          placeholder="City (e.g. London)"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="bg-neutral-950 border border-neutral-700 p-2 text-xs text-white focus:border-white focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Postcode"
                          value={zip}
                          onChange={(e) => setZip(e.target.value)}
                          className="bg-neutral-950 border border-neutral-700 p-2 text-xs text-white focus:border-white focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Country"
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          className="bg-neutral-950 border border-neutral-700 p-2 text-xs text-white focus:border-white focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-white hover:bg-neutral-200 text-black font-bold uppercase tracking-widest transition-colors flex items-center justify-center space-x-2"
                  >
                    {loading ? <span>CREATING ACCOUNT...</span> : <span>CREATE ARCHIVE ACCOUNT →</span>}
                  </button>
                </form>
              )}
            </div>
          ) : (
            /* ------------------ LOGGED IN CUSTOMER HUB ------------------ */
            <div className="space-y-6">
              {/* Member Status Card */}
              <div className="p-4 bg-black border border-neutral-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-base font-bold text-white uppercase">{currentCustomer.name}</span>
                    <span
                      className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                        currentCustomer.tier === 'VIP_ARCHIVE_PATRON'
                          ? 'bg-amber-400 text-black'
                          : currentCustomer.tier === 'CORE_PATRON'
                          ? 'bg-neutral-200 text-black'
                          : 'bg-neutral-800 text-neutral-300'
                      }`}
                    >
                      ★ {currentCustomer.tier.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="text-neutral-400 text-[11px] mt-1">{currentCustomer.email}</div>
                  <div className="text-neutral-500 text-[10px] mt-0.5">
                    Member ID: {currentCustomer.id} • Joined: {new Date(currentCustomer.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="text-right sm:border-r border-neutral-800 sm:pr-4">
                    <div className="text-[10px] text-neutral-400 uppercase">LIFETIME ORDERS</div>
                    <div className="text-base font-bold text-white">{customerOrders.length || currentCustomer.ordersCount}</div>
                  </div>
                  <div className="text-right sm:pl-2">
                    <div className="text-[10px] text-neutral-400 uppercase">TOTAL SPENT</div>
                    <div className="text-base font-bold text-emerald-400">
                      £{currentCustomer.totalSpent.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sub-Tabs */}
              <div className="flex border-b border-neutral-800 gap-1 overflow-x-auto">
                <button
                  id="tab-orders"
                  onClick={() => setActiveProfileTab('orders')}
                  className={`px-3 py-2 text-xs tracking-wider uppercase font-bold border-b-2 transition-all whitespace-nowrap ${
                    activeProfileTab === 'orders'
                      ? 'border-white text-white bg-neutral-800/40'
                      : 'border-transparent text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  📦 MY ORDERS ({customerOrders.length})
                </button>
                <button
                  id="tab-address"
                  onClick={() => setActiveProfileTab('address')}
                  className={`px-3 py-2 text-xs tracking-wider uppercase font-bold border-b-2 transition-all whitespace-nowrap ${
                    activeProfileTab === 'address'
                      ? 'border-white text-white bg-neutral-800/40'
                      : 'border-transparent text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  📍 SHIPPING ADDRESS
                </button>
                <button
                  id="tab-measurements"
                  onClick={() => setActiveProfileTab('measurements')}
                  className={`px-3 py-2 text-xs tracking-wider uppercase font-bold border-b-2 transition-all whitespace-nowrap ${
                    activeProfileTab === 'measurements'
                      ? 'border-white text-white bg-neutral-800/40'
                      : 'border-transparent text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  📏 MEASUREMENTS & FIT
                </button>
                <button
                  id="tab-perks"
                  onClick={() => setActiveProfileTab('perks')}
                  className={`px-3 py-2 text-xs tracking-wider uppercase font-bold border-b-2 transition-all whitespace-nowrap ${
                    activeProfileTab === 'perks'
                      ? 'border-white text-white bg-neutral-800/40'
                      : 'border-transparent text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  ⚡ VIP TIER PERKS
                </button>
                <button
                  id="tab-accounts"
                  onClick={() => setActiveProfileTab('accounts')}
                  className={`px-3 py-2 text-xs tracking-wider uppercase font-bold border-b-2 transition-all whitespace-nowrap ${
                    activeProfileTab === 'accounts'
                      ? 'border-white text-white bg-neutral-800/40'
                      : 'border-transparent text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  🔗 CONNECTED ACCOUNTS ({Object.keys(currentCustomer.linkedAccounts || {}).length})
                </button>
              </div>

              {/* Sub-Tab 1: Orders */}
              {activeProfileTab === 'orders' && (
                <div className="space-y-3">
                  {customerOrders.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-neutral-800 text-neutral-500">
                      <div>No archive orders placed yet under this account.</div>
                      <div className="text-[10px] mt-1 text-neutral-600">
                        Orders placed with {currentCustomer.email} will automatically appear here with live Royal Mail tracking.
                      </div>
                    </div>
                  ) : (
                    customerOrders.map((ord) => (
                      <div
                        key={ord.id}
                        className="p-3 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 transition-colors space-y-2"
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-white text-sm">{ord.id}</span>
                            <span
                              className={`px-2 py-0.5 text-[9px] font-bold uppercase ${
                                ord.status === 'delivered'
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                  : ord.status === 'shipped'
                                  ? 'bg-blue-950 text-blue-400 border border-blue-800'
                                  : 'bg-neutral-800 text-neutral-300'
                              }`}
                            >
                              {ord.status}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-white text-sm">£{ord.total.toFixed(2)}</span>
                            <span className="text-[10px] text-neutral-500 ml-2">
                              {new Date(ord.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {/* Items preview */}
                        <div className="text-neutral-400 text-[11px] divide-y divide-neutral-900 border-y border-neutral-900 py-1.5 my-1">
                          {ord.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between py-0.5">
                              <span>
                                {item.quantity}x {item.title} ({item.size})
                              </span>
                              <span className="text-neutral-500">£{(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>

                        {/* Tracking status */}
                        <div className="flex justify-between items-center text-[10px]">
                          <div className="text-neutral-400">
                            Carrier: <span className="text-neutral-200">{ord.carrier || 'Royal Mail Tracked 24'}</span>
                            {ord.trackingNumber && (
                              <span className="ml-2 text-neutral-500">({ord.trackingNumber})</span>
                            )}
                          </div>
                          {onOpenTracker && (
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onOpenTracker(ord.id);
                              }}
                              className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-white font-bold uppercase transition-colors"
                            >
                              TRACK PARCEL →
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Sub-Tab 2: Shipping Address */}
              {activeProfileTab === 'address' && (
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="p-3 bg-neutral-950 border border-neutral-800 space-y-3">
                    <div className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">
                      PRIMARY DISPATCH ADDRESS
                    </div>
                    <div>
                      <label className="block text-[10px] text-neutral-500 uppercase mb-1">RECIPIENT NAME</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-700 p-2 text-xs text-white focus:border-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-neutral-500 uppercase mb-1">STREET ADDRESS</label>
                      <input
                        type="text"
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        placeholder="e.g. 14 Redchurch Street"
                        className="w-full bg-neutral-900 border border-neutral-700 p-2 text-xs text-white focus:border-white focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] text-neutral-500 uppercase mb-1">CITY</label>
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="London"
                          className="w-full bg-neutral-900 border border-neutral-700 p-2 text-xs text-white focus:border-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-neutral-500 uppercase mb-1">POSTCODE / ZIP</label>
                        <input
                          type="text"
                          value={zip}
                          onChange={(e) => setZip(e.target.value)}
                          placeholder="E2 7DD"
                          className="w-full bg-neutral-900 border border-neutral-700 p-2 text-xs text-white focus:border-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-neutral-500 uppercase mb-1">COUNTRY</label>
                        <input
                          type="text"
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          placeholder="United Kingdom"
                          className="w-full bg-neutral-900 border border-neutral-700 p-2 text-xs text-white focus:border-white focus:outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] text-neutral-500 uppercase mb-1">CONTACT PHONE</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+44 7911 123456"
                        className="w-full bg-neutral-900 border border-neutral-700 p-2 text-xs text-white focus:border-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-white hover:bg-neutral-200 text-black font-bold uppercase tracking-wider transition-colors"
                  >
                    {loading ? 'SAVING CHANGES...' : 'SAVE SHIPPING ADDRESS →'}
                  </button>
                </form>
              )}

              {/* Sub-Tab 3: Measurements & Fit */}
              {activeProfileTab === 'measurements' && (
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="p-3 bg-neutral-950 border border-neutral-800 space-y-3">
                    <div className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">
                      SAVED FIT SCHEMATICS FOR AI CONCIERGE & SIZING
                    </div>
                    <p className="text-[10px] text-neutral-500">
                      These measurements help our TKN AI Concierge recommend your exact size across 300 GSM tees, 500 GSM hoodies, and 14oz skate pants.
                    </p>

                    <div>
                      <label className="block text-[10px] text-neutral-400 uppercase mb-1">PREFERRED SILHOUETTE FIT</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {(['snug', 'true-to-size', 'oversized-boxy', 'extreme-drop'] as const).map((fit) => (
                          <button
                            key={fit}
                            type="button"
                            onClick={() => setPreferredFit(fit)}
                            className={`p-2 border text-center font-mono uppercase text-[10px] transition-all ${
                              preferredFit === fit
                                ? 'border-white bg-white text-black font-bold'
                                : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-600'
                            }`}
                          >
                            {fit.replace(/-/g, ' ')}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] text-neutral-500 uppercase mb-1">HEIGHT (CM)</label>
                        <input
                          type="number"
                          value={heightCm}
                          onChange={(e) => setHeightCm(Number(e.target.value))}
                          className="w-full bg-neutral-900 border border-neutral-700 p-2 text-xs text-white focus:border-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-neutral-500 uppercase mb-1">WEIGHT (KG)</label>
                        <input
                          type="number"
                          value={weightKg}
                          onChange={(e) => setWeightKg(Number(e.target.value))}
                          className="w-full bg-neutral-900 border border-neutral-700 p-2 text-xs text-white focus:border-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-neutral-500 uppercase mb-1">CHEST WIDTH (INCHES)</label>
                        <input
                          type="number"
                          value={preferredChestInches}
                          onChange={(e) => setPreferredChestInches(Number(e.target.value))}
                          className="w-full bg-neutral-900 border border-neutral-700 p-2 text-xs text-white focus:border-white focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-white hover:bg-neutral-200 text-black font-bold uppercase tracking-wider transition-colors"
                  >
                    {loading ? 'SAVING...' : 'UPDATE FIT PREFERENCES →'}
                  </button>
                </form>
              )}

              {/* Sub-Tab 4: Perks & VIP Tier */}
              {activeProfileTab === 'perks' && (
                <div className="space-y-4">
                  <div className="p-4 bg-neutral-950 border border-neutral-800 space-y-3">
                    <div className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">
                      LOYALTY & ARCHIVE TIERS
                    </div>
                    <div className="space-y-3">
                      <div className={`p-3 border ${currentCustomer.tier === 'ARCHIVE_INITIATE' ? 'border-amber-400 bg-neutral-900/80' : 'border-neutral-800 opacity-70'}`}>
                        <div className="flex justify-between items-center font-bold">
                          <span>[1] ARCHIVE INITIATE</span>
                          <span className="text-[10px] text-neutral-400">£0 - £199</span>
                        </div>
                        <p className="text-[10px] text-neutral-400 mt-1">
                          Standard access to online catalogue, digital order tracking slips, and email restock alerts.
                        </p>
                      </div>

                      <div className={`p-3 border ${currentCustomer.tier === 'CORE_PATRON' ? 'border-amber-400 bg-neutral-900/80' : 'border-neutral-800 opacity-70'}`}>
                        <div className="flex justify-between items-center font-bold">
                          <span>[2] CORE PATRON</span>
                          <span className="text-[10px] text-emerald-400">£200+ Spent</span>
                        </div>
                        <p className="text-[10px] text-neutral-400 mt-1">
                          Early 1-hour access to Friday midnight drops, free UK Tracked 24 on all orders over £80, exclusive zine sticker packs included.
                        </p>
                      </div>

                      <div className={`p-3 border ${currentCustomer.tier === 'VIP_ARCHIVE_PATRON' ? 'border-amber-400 bg-neutral-900/80' : 'border-neutral-800 opacity-70'}`}>
                        <div className="flex justify-between items-center font-bold">
                          <span className="text-amber-300">★ [3] VIP ARCHIVE PATRON</span>
                          <span className="text-[10px] text-amber-300">£500+ Spent</span>
                        </div>
                        <p className="text-[10px] text-neutral-400 mt-1">
                          Private London studio fitting access, complimentary Royal Mail Tracked 24 on every order with no minimum, dedicated AI Concierge queue priority, and archive deadstock reserves.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-Tab 5: Connected Accounts */}
              {activeProfileTab === 'accounts' && (
                <div className="space-y-4">
                  <div className="p-4 bg-neutral-950 border border-neutral-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <span>🔗</span> LINKED EXTERNAL IDENTITIES & FEDERATED PASSES
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono font-bold">
                        {Object.keys(currentCustomer.linkedAccounts || {}).length} / 6 CONNECTED
                      </span>
                    </div>
                    <p className="text-[10px] text-neutral-400 leading-relaxed">
                      Link your Google, Apple ID, Shop Pay, or social channels to log in without passwords, automatically verify streetwear lookbook photos, and gain access to VIP underground drops.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(Object.keys(PROVIDER_INFO) as LinkedAccountProvider[]).map((provKey) => {
                      const info = PROVIDER_INFO[provKey];
                      const linkedItem = currentCustomer.linkedAccounts?.[provKey];
                      const isLinked = Boolean(linkedItem);

                      return (
                        <div
                          key={provKey}
                          className={`p-3.5 border transition-all flex flex-col justify-between ${
                            isLinked
                              ? 'bg-neutral-900/90 border-emerald-500/50 shadow-sm'
                              : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                          }`}
                        >
                          <div className="space-y-2">
                            {/* Provider Header */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <span className="text-base font-bold">{info.icon}</span>
                                <div>
                                  <div className="font-bold text-white text-xs">{info.name}</div>
                                  <div className="text-[9px] text-neutral-500 uppercase tracking-wider">{info.badge}</div>
                                </div>
                              </div>
                              <span
                                className={`text-[9px] px-1.5 py-0.5 font-bold uppercase tracking-wider ${
                                  isLinked
                                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                    : 'bg-neutral-800 text-neutral-400'
                                }`}
                              >
                                {isLinked ? '✓ CONNECTED' : 'UNLINKED'}
                              </span>
                            </div>

                            {/* Provider Benefit */}
                            <p className="text-[10px] text-neutral-400 leading-normal">
                              {info.perk}
                            </p>

                            {/* Connected Item Details */}
                            {isLinked && linkedItem && (
                              <div className="p-2 bg-black/60 border border-neutral-800 space-y-1 text-[10px] font-mono">
                                <div className="flex justify-between text-neutral-300">
                                  <span className="text-neutral-500">IDENTIFIER:</span>
                                  <span className="font-bold text-white truncate max-w-[180px]">{linkedItem.emailOrHandle}</span>
                                </div>
                                {linkedItem.displayName && linkedItem.displayName !== linkedItem.emailOrHandle && (
                                  <div className="flex justify-between text-neutral-400 text-[9px]">
                                    <span className="text-neutral-500">NAME:</span>
                                    <span>{linkedItem.displayName}</span>
                                  </div>
                                )}
                                <div className="flex justify-between text-neutral-500 text-[9px]">
                                  <span>LINKED ON:</span>
                                  <span>{new Date(linkedItem.linkedAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Action Button */}
                          <div className="pt-3 mt-2 border-t border-neutral-800 flex justify-end">
                            {isLinked ? (
                              <button
                                type="button"
                                disabled={loading}
                                onClick={() => handleUnlinkAccount(provKey)}
                                className="px-3 py-1.5 border border-red-800/80 hover:bg-red-950/50 text-red-400 text-[10px] font-bold uppercase transition-colors"
                              >
                                DISCONNECT / UNLINK
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={loading}
                                onClick={() => handleStartConnect(provKey)}
                                className="px-3 py-1.5 bg-white hover:bg-neutral-200 text-black text-[10px] font-bold uppercase transition-colors"
                              >
                                + LINK {info.name.toUpperCase()}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sign Out / Actions */}
              <div className="border-t border-neutral-800 pt-4 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => {
                    onCustomerLogout();
                    showToast('Logged out of archive account');
                  }}
                  className="px-3 py-2 border border-red-800/80 text-red-400 hover:bg-red-950/40 text-xs font-bold uppercase transition-colors"
                >
                  SIGN OUT OF ACCOUNT
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-bold uppercase transition-colors text-xs"
                >
                  DONE / CLOSE
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ----------------- POPUP 1: 1-TAP SOCIAL AUTH MODAL (LOGIN/REGISTER) ----------------- */}
      {socialAuthModalProvider && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in font-mono">
          <div className="bg-neutral-900 border border-neutral-700 w-full max-w-md shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold">{PROVIDER_INFO[socialAuthModalProvider].icon}</span>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    AUTHENTICATE WITH {PROVIDER_INFO[socialAuthModalProvider].name.toUpperCase()}
                  </h3>
                  <p className="text-[10px] text-neutral-400">
                    ONE-TAP ARCHIVE SIGN-IN & VERIFICATION
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSocialAuthModalProvider(null)}
                className="text-neutral-400 hover:text-white text-xs px-2 py-1 border border-neutral-800"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-neutral-950 border border-neutral-800 space-y-1 text-[11px]">
              <div className="text-amber-300 font-bold uppercase text-[10px] tracking-wider">
                ⚡ FEDERATED PASS ACTIVE
              </div>
              <p className="text-neutral-400 text-[10px]">
                {PROVIDER_INFO[socialAuthModalProvider].perk}
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-neutral-400 uppercase tracking-widest mb-1">
                  {socialAuthModalProvider === 'shoppay' ? 'MOBILE PHONE / SHOP ACCOUNT' : 'EMAIL / HANDLE'}
                </label>
                <input
                  type="text"
                  required
                  value={socialAuthInputValue}
                  onChange={(e) => setSocialAuthInputValue(e.target.value)}
                  placeholder={PROVIDER_INFO[socialAuthModalProvider].defaultPlaceholder}
                  className="w-full bg-neutral-950 border border-neutral-700 p-2.5 text-xs text-white placeholder-neutral-600 focus:border-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-neutral-400 uppercase tracking-widest mb-1">
                  PATRON DISPLAY NAME (OPTIONAL)
                </label>
                <input
                  type="text"
                  value={socialAuthNameValue}
                  onChange={(e) => setSocialAuthNameValue(e.target.value)}
                  placeholder="e.g. Murad Nizam"
                  className="w-full bg-neutral-950 border border-neutral-700 p-2.5 text-xs text-white placeholder-neutral-600 focus:border-white focus:outline-none"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-2 bg-red-950/80 border border-red-800 text-red-300 text-[10px]">
                ⚠️ {errorMsg}
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setSocialAuthModalProvider(null)}
                className="px-3 py-2 border border-neutral-700 text-neutral-400 hover:text-white text-xs uppercase"
              >
                CANCEL
              </button>
              <button
                type="button"
                disabled={loading || !socialAuthInputValue.trim()}
                onClick={handleExecuteSocialAuth}
                className="px-4 py-2 bg-white hover:bg-neutral-200 text-black font-bold uppercase text-xs transition-colors flex items-center gap-2"
              >
                {loading ? 'AUTHENTICATING...' : `AUTHORIZE & ENTER ARCHIVE →`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- POPUP 2: CONNECT ACCOUNT TO PROFILE ----------------- */}
      {connectingProvider && currentCustomer && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in font-mono">
          <div className="bg-neutral-900 border border-neutral-700 w-full max-w-md shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold">{PROVIDER_INFO[connectingProvider].icon}</span>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    LINK {PROVIDER_INFO[connectingProvider].name.toUpperCase()}
                  </h3>
                  <p className="text-[10px] text-neutral-400">
                    TO ARCHIVE ACCOUNT: {currentCustomer.email}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConnectingProvider(null)}
                className="text-neutral-400 hover:text-white text-xs px-2 py-1 border border-neutral-800"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-neutral-950 border border-neutral-800 space-y-1 text-[11px]">
              <div className="text-white font-bold uppercase text-[10px] tracking-wider">
                PERK: {PROVIDER_INFO[connectingProvider].badge}
              </div>
              <p className="text-neutral-400 text-[10px]">
                {PROVIDER_INFO[connectingProvider].perk}
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-neutral-400 uppercase tracking-widest mb-1">
                  ACCOUNT IDENTIFIER / HANDLE *
                </label>
                <input
                  type="text"
                  required
                  value={connectInputValue}
                  onChange={(e) => setConnectInputValue(e.target.value)}
                  placeholder={PROVIDER_INFO[connectingProvider].defaultPlaceholder}
                  className="w-full bg-neutral-950 border border-neutral-700 p-2.5 text-xs text-white placeholder-neutral-600 focus:border-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-neutral-400 uppercase tracking-widest mb-1">
                  CONNECTED DISPLAY NAME
                </label>
                <input
                  type="text"
                  value={connectDisplayName}
                  onChange={(e) => setConnectDisplayName(e.target.value)}
                  placeholder="e.g. Murad Nizam"
                  className="w-full bg-neutral-950 border border-neutral-700 p-2.5 text-xs text-white placeholder-neutral-600 focus:border-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setConnectingProvider(null)}
                className="px-3 py-2 border border-neutral-700 text-neutral-400 hover:text-white text-xs uppercase"
              >
                CANCEL
              </button>
              <button
                type="button"
                disabled={loading || !connectInputValue.trim()}
                onClick={handleSaveConnectAccount}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold uppercase text-xs transition-colors flex items-center gap-1.5"
              >
                {loading ? 'LINKING...' : `✓ VERIFY & LINK ACCOUNT`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
