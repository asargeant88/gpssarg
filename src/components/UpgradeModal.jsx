import React, { useState, useEffect } from 'react';
import { X, Crown, CheckCircle2, ShieldCheck, CreditCard, Sparkles, Check, ExternalLink } from 'lucide-react';

export default function UpgradeModal({ isOpen, onClose, user, onUpgradeSuccess, remainingFree = 0 }) {
  const [selectedPlan, setSelectedPlan] = useState('1year'); // '1month' | '6months' | '1year'
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const plans = {
    '1month': {
      id: '1month',
      name: '1 Month Pass',
      price: '$15',
      billing: 'Billed monthly ($15.00/mo)',
      period: 'per month',
      badge: null,
      stripeUrl: 'https://buy.stripe.com/14AdRae0P0I72dk4sn0oM02',
      buyButtonId: 'buy_btn_1U4a8rJgpYIb9gi2VmTSny6a'
    },
    '6months': {
      id: '6months',
      name: '6 Months Pass',
      price: '$75',
      billing: 'Billed semi-annually ($12.50/mo)',
      period: 'per 6 months',
      badge: '6 MONTH ACCESS',
      stripeUrl: 'https://buy.stripe.com/28E28s8Gv76vg4a5wr0oM01',
      buyButtonId: 'buy_btn_1U4a9DJgpYIb9gi2tLt95C3E'
    },
    '1year': {
      id: '1year',
      name: '1 Year Full Pass',
      price: '$125',
      billing: 'Billed annually ($10.41/mo)',
      period: 'per year',
      badge: 'ANNUAL PASS',
      stripeUrl: 'https://buy.stripe.com/00waEY5uj76v19gaQL0oM00',
      buyButtonId: 'buy_btn_1U4a9fJgpYIb9gi22JUJE67x'
    }
  };

  useEffect(() => {
    // Dynamically load Stripe Buy Button script if not present
    if (!document.getElementById('stripe-js-script')) {
      const script = document.createElement('script');
      script.id = 'stripe-js-script';
      script.src = 'https://js.stripe.com/v3/buy-button.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  if (!isOpen) return null;

  const currentPlan = plans[selectedPlan];

  const handleCheckout = async () => {
    const token = localStorage.getItem('sarggeo_token');
    
    // Open Stripe Checkout in new tab for direct payment processing
    window.open(currentPlan.stripeUrl, '_blank', 'noopener,noreferrer');

    // Also activate local user session if logged in
    if (token) {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/subscribe/pro', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ planId: selectedPlan })
        });
        const data = await res.json();
        if (res.ok) {
          setSuccess(true);
          if (onUpgradeSuccess) onUpgradeSuccess(data.user);
        }
      } catch (err) {
        console.error('Subscription sync error:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="custom-modal-card legal-modal-width" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="custom-modal-header">
          <div className="modal-header-left">
            <div className="modal-icon-badge amber">
              <Crown className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="modal-header-title">SargGeo Pro Unlimited Spatial Access</h2>
              <p className="modal-header-subtitle">
                {remainingFree <= 0
                  ? 'You reached your free test limit (3/3 conversions used). Upgrade to unlock unlimited spatial power.'
                  : 'Unlock unlimited DLS/ATS conversions, project data grids, KMZ export, and developer API keys.'}
              </p>
            </div>
          </div>
          <button className="modal-close-icon-btn" onClick={onClose}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="custom-modal-body space-y-5 p-6">
          {/* Plan Duration Selector Cards */}
          <div>
            <label className="custom-field-label">SELECT SUBSCRIPTION PLAN DURATION</label>
            <div className="upgrade-plans-grid">
              {Object.values(plans).map((plan) => {
                const isSelected = selectedPlan === plan.id;
                return (
                  <div
                    key={plan.id}
                    className={`upgrade-plan-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedPlan(plan.id)}
                  >
                    {plan.badge && (
                      <span className="upgrade-plan-badge">
                        {plan.badge}
                      </span>
                    )}

                    <div>
                      <div className="upgrade-plan-header-row">
                        <span className="upgrade-plan-title">{plan.name}</span>
                        <div className="upgrade-radio-circle">
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </div>
                      <div className="upgrade-plan-price-row">
                        <span className="upgrade-plan-price">{plan.price}</span>
                        <span className="upgrade-plan-period">{plan.period}</span>
                      </div>
                    </div>

                    <p className="upgrade-plan-billing">
                      {plan.billing}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pro Feature Highlights Grid */}
          <div className="upgrade-features-box">
            <span className="text-[11px] font-black text-slate-800 uppercase tracking-wide block">INCLUDED IN PRO UNLIMITED ACCESS:</span>
            <div className="upgrade-features-grid text-xs text-slate-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span><strong>Unlimited Conversions</strong> (DLS/ATS, UTM, MGRS, DD, DMS, NTS)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span><strong>Coordinate King Batch Converter</strong> (Multi-line DLS & CSV)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span><strong>Project Spreadsheet Grid</strong> with 3D DEM Elevation (m & ft)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span><strong>Export & Import</strong> KMZ, KML, GeoJSON, CSV & ESRI Shapefiles</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span><strong>EXIF Geotagged Media</strong> Drone Photo Field Mapping</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span><strong>Developer REST API Portal</strong> for Python & GIS software (`x-api-key`)</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="alert-box error text-xs p-3">
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-black flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600 animate-bounce" />
              <span>Pro Subscription Activated Successfully! Redirecting...</span>
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              <button
                type="button"
                onClick={handleCheckout}
                disabled={loading}
                className="custom-btn amber-pro-btn full py-3.5 text-sm font-black justify-center shadow-md cursor-pointer hover:brightness-105"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Proceed to Secure Stripe Checkout — {currentPlan.price} ({currentPlan.name})
                <ExternalLink className="w-4 h-4 ml-2" />
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>256-Bit SSL Encrypted Payment powered by Stripe • Cancel Anytime</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
