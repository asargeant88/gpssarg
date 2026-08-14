import React from 'react';
import { X, User, Crown, LogOut, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

export default function AccountModal({
  isOpen,
  onClose,
  user,
  subscriptionTier,
  conversionsUsed,
  onOpenUpgradeModal,
  onSignOut
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="batch-modal-content" style={{ width: '480px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <div className="modal-icon-badge" style={{ background: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
              <User className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="modal-title">Account & Subscription Status</h2>
              <p className="modal-subtitle">Manage your profile, tier limits, and cloud credentials.</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {user ? (
            <>
              <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 uppercase font-semibold">SIGNED IN AS</span>
                  {subscriptionTier === 'pro' ? (
                    <span className="badge-pro flex items-center gap-1">
                      <Crown className="w-3.5 h-3.5 text-slate-950" /> PRO UNLIMITED
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded">
                      FREE TIER ({conversionsUsed}/3 Used)
                    </span>
                  )}
                </div>
                <div className="text-base font-extrabold text-white">{user.email}</div>
              </div>

              {subscriptionTier !== 'pro' && (
                <div className="p-4 bg-gradient-to-br from-amber-950/40 to-slate-900 border border-amber-500/40 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                    <Crown className="w-5 h-5 text-amber-400" />
                    <span>Upgrade to SargGeo Pro — $15/Month</span>
                  </div>
                  <p className="text-xs text-amber-100/80">
                    Unlock unlimited multi-grid conversions, unlimited Coordinate King batch rows, and hosted cloud database storage.
                  </p>
                  <button
                    className="pane-btn primary full py-2.5 text-xs font-black shadow-lg"
                    style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#0f172a' }}
                    onClick={() => {
                      onClose();
                      if (onOpenUpgradeModal) onOpenUpgradeModal();
                    }}
                  >
                    <Zap className="w-4 h-4 mr-1.5 inline" /> Activate Pro Subscription ($15/mo)
                  </button>
                </div>
              )}

              <button
                className="pane-btn secondary full py-2.5 text-xs font-bold text-red-400 hover:bg-red-950/30 hover:border-red-500/40"
                onClick={() => {
                  onSignOut();
                  onClose();
                }}
              >
                <LogOut className="w-4 h-4 mr-1.5 inline" /> Sign Out
              </button>
            </>
          ) : (
            <div className="text-center py-4 space-y-4">
              <ShieldCheck className="w-12 h-12 text-slate-500 mx-auto" />
              <p className="text-xs text-slate-300">You are currently using SargGeo as a Guest user ({conversionsUsed}/3 free conversions used).</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
