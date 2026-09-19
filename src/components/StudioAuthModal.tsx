import React, { useState } from 'react';
import { InternalRole, InternalStaffUser } from '../types';
import { api } from '../lib/api';

interface StudioAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: InternalStaffUser | null;
  onLoginSuccess: (user: InternalStaffUser) => void;
  onLogout: () => void;
}

export const StudioAuthModal: React.FC<StudioAuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  onLogout,
}) => {
  const [selectedRole, setSelectedRole] = useState<InternalRole>('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRoleSelect = (role: InternalRole) => {
    setSelectedRole(role);
    setErrorMsg(null);
    if (role === 'admin') {
      setEmail('admin@toknownothing.com');
      setPassword('tkn2026');
    } else if (role === 'manager') {
      setEmail('manager@toknownothing.com');
      setPassword('manager2026');
    } else {
      setEmail('staff@toknownothing.com');
      setPassword('staff2026');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter email and passcode');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await api.loginInternal({
        email: email.trim(),
        password: password.trim(),
        role: selectedRole,
      });

      if (res.success && res.user) {
        onLoginSuccess(res.user);
        onClose();
      } else {
        setErrorMsg(res.error || 'Authentication failed. Please verify credentials.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Connection error.');
    } finally {
      setLoading(false);
    }
  };

  const quickDemoLogin = (role: InternalRole) => {
    let demoEmail = 'admin@toknownothing.com';
    let demoPass = 'tkn2026';
    if (role === 'manager') {
      demoEmail = 'manager@toknownothing.com';
      demoPass = 'manager2026';
    } else if (role === 'staff') {
      demoEmail = 'staff@toknownothing.com';
      demoPass = 'staff2026';
    }

    setSelectedRole(role);
    setEmail(demoEmail);
    setPassword(demoPass);
    setLoading(true);
    setErrorMsg(null);

    api.loginInternal({ email: demoEmail, password: demoPass, role }).then((res) => {
      setLoading(false);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
        onClose();
      } else {
        setErrorMsg(res.error || 'Login failed');
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div
      id="studio-auth-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        id="studio-auth-modal-container"
        className="bg-neutral-900 border border-neutral-700 w-full max-w-xl flex flex-col text-neutral-100 shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-black/60">
          <div className="flex items-center space-x-3">
            <span className="text-xl">⚙</span>
            <div>
              <h2 className="text-sm font-bold tracking-widest uppercase font-mono">
                TO KNOW NOTHING • STUDIO INTERNAL ACCESS
              </h2>
              <p className="text-[10px] text-neutral-400 font-mono tracking-wider">
                STAFF • MANAGER • ADMIN ROLES WITH TAILORED PERMISSIONS
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 font-mono text-sm border border-neutral-700 hover:border-neutral-400 px-2 transition-colors"
          >
            [ESC]
          </button>
        </div>

        <div className="p-5 font-mono text-xs space-y-5">
          {currentUser ? (
            /* Currently Logged In */
            <div className="p-4 bg-black border border-neutral-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-neutral-400 uppercase">ACTIVE SESSION</div>
                  <div className="text-base font-bold text-white uppercase">{currentUser.name}</div>
                  <div className="text-[11px] text-neutral-300">{currentUser.email}</div>
                  <div className="text-[10px] text-neutral-400 mt-1">Department: {currentUser.department}</div>
                </div>
                <span
                  className={`px-3 py-1 font-bold text-[10px] uppercase tracking-widest border ${
                    currentUser.role === 'admin'
                      ? 'bg-amber-400/20 text-amber-300 border-amber-400/60'
                      : currentUser.role === 'manager'
                      ? 'bg-blue-400/20 text-blue-300 border-blue-400/60'
                      : 'bg-emerald-400/20 text-emerald-300 border-emerald-400/60'
                  }`}
                >
                  ROLE: {currentUser.role.toUpperCase()}
                </span>
              </div>

              <div className="text-[11px] text-neutral-400 border-t border-neutral-800 pt-3">
                <div className="font-bold text-neutral-300 mb-1">Assigned Permissions:</div>
                <div className="flex flex-wrap gap-1">
                  {currentUser.permissions.map((p) => (
                    <span key={p} className="px-1.5 py-0.5 bg-neutral-800 text-neutral-300 text-[9px]">
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={onLogout}
                  className="px-3 py-1.5 border border-red-800 text-red-400 hover:bg-red-950/50 uppercase text-[11px] transition-colors"
                >
                  SIGN OUT OF STUDIO
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-1.5 bg-white text-black font-bold uppercase text-[11px] hover:bg-neutral-200 transition-colors"
                >
                  ENTER CONSOLE →
                </button>
              </div>
            </div>
          ) : (
            /* Not Logged In - Role Selector & Form */
            <div className="space-y-4">
              {/* Role Tabs */}
              <div className="grid grid-cols-3 gap-1 bg-black p-1 border border-neutral-800">
                <button
                  type="button"
                  onClick={() => handleRoleSelect('staff')}
                  className={`py-2 px-1 text-center font-bold text-[10px] sm:text-xs tracking-wider uppercase transition-all ${
                    selectedRole === 'staff'
                      ? 'bg-neutral-800 text-emerald-400 border border-emerald-500/40'
                      : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  [1] STAFF LOGIN
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleSelect('manager')}
                  className={`py-2 px-1 text-center font-bold text-[10px] sm:text-xs tracking-wider uppercase transition-all ${
                    selectedRole === 'manager'
                      ? 'bg-neutral-800 text-blue-400 border border-blue-500/40'
                      : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  [2] MANAGER LOGIN
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleSelect('admin')}
                  className={`py-2 px-1 text-center font-bold text-[10px] sm:text-xs tracking-wider uppercase transition-all ${
                    selectedRole === 'admin'
                      ? 'bg-neutral-800 text-amber-400 border border-amber-500/40'
                      : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  [3] ADMIN LOGIN
                </button>
              </div>

              {/* Role Scope Description */}
              <div className="p-3 bg-neutral-950 border border-neutral-800 text-[11px] space-y-1">
                {selectedRole === 'staff' && (
                  <div>
                    <div className="font-bold text-emerald-400 uppercase tracking-wider">
                      STAFF ROLE • FULFILLMENT & PACKING
                    </div>
                    <p className="text-neutral-400 text-[10px] leading-relaxed mt-0.5">
                      Operational access: Inspect incoming orders, print packing slips, update Royal Mail shipment tracking, view live inventory levels, and see restock waitlists. Financial analytics and catalog deletion are locked.
                    </p>
                  </div>
                )}
                {selectedRole === 'manager' && (
                  <div>
                    <div className="font-bold text-blue-400 uppercase tracking-wider">
                      MANAGER ROLE • STUDIO OPERATIONS & INVENTORY LEAD
                    </div>
                    <p className="text-neutral-400 text-[10px] leading-relaxed mt-0.5">
                      Operations access: Manage orders, adjust garment inventory & restock sizes, edit product catalogue details, dispatch customer waitlist restock alerts, moderate reviews, and view store analytics.
                    </p>
                  </div>
                )}
                {selectedRole === 'admin' && (
                  <div>
                    <div className="font-bold text-amber-400 uppercase tracking-wider">
                      ADMIN ROLE • STUDIO EXECUTIVE & FULL COMMAND
                    </div>
                    <p className="text-neutral-400 text-[10px] leading-relaxed mt-0.5">
                      Unrestricted command: Full control of products, orders, promo codes, drop announcements, financial analytics, SEO meta tags, team role management, and Gemini AI Studio & Veo Video tools.
                    </p>
                  </div>
                )}
              </div>

              {/* 1-Click Fast Pass for testing */}
              <div className="p-3 bg-black border border-neutral-800 space-y-2">
                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex justify-between">
                  <span>⚡ 1-CLICK INSTANT DEMO PASS</span>
                  <span className="text-neutral-500">PRE-POPULATED CREDENTIALS</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => quickDemoLogin('staff')}
                    className="p-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-emerald-400 text-left transition-all"
                  >
                    <div className="font-bold text-emerald-400 text-[10px]">Liam O’Connor</div>
                    <div className="text-[9px] text-neutral-400">Staff • Fulfillment</div>
                    <div className="text-[8px] text-neutral-500 mt-1">staff@ / staff2026</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => quickDemoLogin('manager')}
                    className="p-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-blue-400 text-left transition-all"
                  >
                    <div className="font-bold text-blue-400 text-[10px]">Sofia Chen</div>
                    <div className="text-[9px] text-neutral-400">Manager • Operations</div>
                    <div className="text-[8px] text-neutral-500 mt-1">manager@ / manager2026</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => quickDemoLogin('admin')}
                    className="p-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-amber-400 text-left transition-all"
                  >
                    <div className="font-bold text-amber-400 text-[10px]">Alexander Wright</div>
                    <div className="text-[9px] text-neutral-400">Admin • Director</div>
                    <div className="text-[8px] text-neutral-500 mt-1">admin@ / tkn2026</div>
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="p-2.5 bg-red-950/60 border border-red-800 text-red-300 text-xs">
                  ⚠️ {errorMsg}
                </div>
              )}

              {/* Manual Login Form */}
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-[10px] text-neutral-400 uppercase tracking-widest mb-1">
                    INTERNAL STUDIO EMAIL *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder={
                      selectedRole === 'admin'
                        ? 'admin@toknownothing.com'
                        : selectedRole === 'manager'
                        ? 'manager@toknownothing.com'
                        : 'staff@toknownothing.com'
                    }
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-700 p-2 text-xs text-white focus:border-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-neutral-400 uppercase tracking-widest mb-1">
                    STUDIO PASSCODE *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-700 p-2 text-xs text-white focus:border-white focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-white hover:bg-neutral-200 text-black font-bold uppercase tracking-widest transition-colors flex items-center justify-center space-x-2 text-xs"
                >
                  {loading ? (
                    <span>AUTHENTICATING ROLE...</span>
                  ) : (
                    <span>ENTER STUDIO AS {selectedRole.toUpperCase()} →</span>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
