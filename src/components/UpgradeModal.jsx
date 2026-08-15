import React, { useState } from 'react';
import { X, Crown, CheckCircle2, Zap, Shield, CreditCard, Sparkles } from 'lucide-react';

export default function UpgradeModal({ isOpen, onClose, user, onUpgradeSuccess, remainingFree = 0 }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    const token = localStorage.getItem('sarggeo_token');
    if (!token) {
      setError('Please sign in or create a free account to activate your $15/mo Pro subscription.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/subscribe/pro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to activate subscription');

      setSuccess(true);
      if (onUpgradeSuccess) onUpgradeSuccess(data.user);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="upgrade-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="upgrade-banner">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="w-6 h-6 text-amber-300 animate-pulse" />
              <span className="text-xs font-extrabold uppercase tracking-widest text-amber-200">SargGeo Pro Tier</span>
            </div>
            <button className="modal-close-btn text-white hover:text-amber-200" onClick={onClose}>
              <X className="w-5 h-5" />
            </button>
          </div>
          <h2 className="text-xl font-black text-white mt-2">Unlimited Multi-Grid Spatial Power</h2>
          <p className="text-xs text-amber-100/90 mt-1">
            You reached your free test limit ({3 - remainingFree}/3 conversions used). Upgrade to unlock unlimited access.
          </p>
        </div>

        <div className="p-6 space-y-5">
          <div className="pricing-card">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-2xl font-black text-white">$15</span>
                <span className="text-sm font-semibold text-cyan-300"> / month</span>
              </div>
              <span className="badge-pro">UNLIMITED ACCESS</span>
            </div>
            <p className="text-xs text-slate-300 mt-1">Cancel anytime. Billed monthly with instant activation.</p>
          </div>

          <div className="feature-list space-y-2.5 text-xs text-slate-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span><strong>Unlimited Conversions</strong> across DLS / ATS, UTM, MGRS, DD, DMS & NTS</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span><strong>Coordinate King Batch Converter</strong> (Unlimited rows & CSV/GeoJSON export)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span><strong>Hosted Cloud Projects</strong> saved securely to your cloud workspace</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span><strong>EXIF Drag & Drop Geotagged Media</strong> mapping</span>
            </div>
          </div>

          {error && <div className="error-alert text-xs">{error}</div>}

          {success ? (
            <div className="success-alert flex items-center justify-center gap-2 py-3">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span className="font-bold text-emerald-400 text-sm">Pro Subscription Activated! Welcome aboard!</span>
            </div>
          ) : (
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="pane-btn primary full py-3 font-extrabold text-sm shadow-lg hover:brightness-110 transition-all"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#0f172a' }}
            >
              {loading ? (
                'Processing Order...'
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2 inline" /> Activate Pro Plan — $15/Month
                </>
              )}
            </button>
          )}

          <p className="text-[10px] text-center text-slate-400 flex items-center justify-center gap-1">
            <Shield className="w-3 h-3 text-slate-400" /> 256-Bit Encrypted Secure Checkout
          </p>
        </div>
      </div>
    </div>
  );
}
