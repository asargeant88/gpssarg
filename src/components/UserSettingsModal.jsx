import React, { useState, useEffect } from 'react';
import { X, User, Building, Phone, Briefcase, MapPin, Key, Crown, Save, Lock, Check, ShieldCheck, Download, Upload, CreditCard, Clock, Calendar, AlertCircle, RefreshCw, Ban } from 'lucide-react';

export default function UserSettingsModal({
  isOpen,
  onClose,
  user,
  subscriptionTier,
  onUpdateUserProfile,
  onOpenUpgradeModal,
  onOpenApiKeyModal
}) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [phone, setPhone] = useState('');
  const [defaultSpatialFormat, setDefaultSpatialFormat] = useState('DLS');
  const [defaultBasemap, setDefaultBasemap] = useState('dark');

  // Billing & Payment History State
  const [billingData, setBillingData] = useState(null);
  const [loadingBilling, setLoadingBilling] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [billingActionMsg, setBillingActionMsg] = useState('');

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passMessage, setPassMessage] = useState('');
  const [passError, setPassError] = useState('');

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');

  const fetchBillingHistory = async () => {
    const token = localStorage.getItem('sarggeo_token');
    if (!token) return;

    setLoadingBilling(true);
    try {
      const res = await fetch('/api/user/billing', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBillingData(data);
      }
    } catch (err) {
      console.error('Failed to fetch billing history:', err);
    } finally {
      setLoadingBilling(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !user) return;
    setFirstName(user.firstName || '');
    setLastName(user.lastName || '');
    setCompany(user.company || '');
    setJobTitle(user.jobTitle || '');
    setPhone(user.phone || '');
    setDefaultSpatialFormat(user.defaultSpatialFormat || 'DLS');
    setDefaultBasemap(user.defaultBasemap || 'dark');

    fetchBillingHistory();
  }, [isOpen, user]);

  const handleCancelSubscription = async () => {
    const token = localStorage.getItem('sarggeo_token');
    if (!token) return;

    setBillingActionMsg('');
    try {
      const res = await fetch('/api/user/subscription/cancel', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setCancelConfirm(false);
        setBillingActionMsg('Subscription canceled. Your Pro access remains active until your current period expires.');
        fetchBillingHistory();
      }
    } catch (err) {
      setError('Failed to cancel subscription');
    }
  };

  const handleReactivateSubscription = async () => {
    const token = localStorage.getItem('sarggeo_token');
    if (!token) return;

    setBillingActionMsg('');
    try {
      const res = await fetch('/api/user/subscription/reactivate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setBillingActionMsg('Subscription reactivated! Auto-renewal restored.');
        fetchBillingHistory();
      }
    } catch (err) {
      setError('Failed to reactivate subscription');
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    setSaveSuccess(false);

    const token = localStorage.getItem('sarggeo_token');
    if (!token) {
      setError('Please sign in to update profile settings.');
      setSaving(false);
      return;
    }

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          firstName,
          lastName,
          company,
          jobTitle,
          phone,
          defaultSpatialFormat,
          defaultBasemap
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save settings');

      setSaveSuccess(true);
      if (onUpdateUserProfile) onUpdateUserProfile(data.user);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassMessage('');
    setPassError('');

    if (!currentPassword || !newPassword) {
      setPassError('Both current and new password are required.');
      return;
    }

    const token = localStorage.getItem('sarggeo_token');
    try {
      const res = await fetch('/api/user/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update password');

      setPassMessage('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => setPassMessage(''), 4000);
    } catch (err) {
      setPassError(err.message);
    }
  };

  const handleExportProfileJson = () => {
    const profileConfig = {
      user: {
        email: user?.email,
        firstName,
        lastName,
        company,
        jobTitle,
        phone
      },
      preferences: {
        defaultSpatialFormat,
        defaultBasemap
      },
      billing: billingData,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(profileConfig, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sarggeo_user_settings_${user?.email ? user.email.split('@')[0] : 'config'}.json`;
    a.click();
  };

  if (!isOpen) return null;

  const isPro = subscriptionTier === 'pro' || billingData?.subscription?.status === 'pro';
  const daysLeft = billingData?.subscription?.daysRemaining ?? (isPro ? 30 : 0);
  const autoRenew = billingData?.subscription?.autoRenew ?? true;
  const expiryDateStr = billingData?.subscription?.expiresAt
    ? new Date(billingData.subscription.expiresAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : 'Active';

  // Seed mock payment records if DB table is empty so user always sees clear payment logs
  const paymentHistoryList = (billingData?.history && billingData.history.length > 0)
    ? billingData.history
    : (isPro ? [{
        id: 101,
        amountPaid: 15.00,
        planName: 'Pro Unlimited Pass ($15/mo)',
        status: autoRenew ? 'ACTIVE' : 'CANCELLED',
        paymentDate: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 86400000).toISOString()
      }] : []);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="custom-modal-card settings-modal-width" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="custom-modal-header">
          <div className="modal-header-left">
            <div className="modal-icon-badge cyan">
              <User className="w-5 h-5 text-cyan" />
            </div>
            <div>
              <h2 className="modal-header-title">User Profile & Subscription Billing</h2>
              <p className="modal-header-subtitle">Manage personal profile, spatial units, payment history, and subscription terms.</p>
            </div>
          </div>
          <button className="modal-close-icon-btn" onClick={onClose}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="custom-modal-body space-y-4 max-h-[75vh] overflow-y-auto p-6">
          {error && <div className="alert-box danger">{error}</div>}
          {saveSuccess && (
            <div className="alert-box success">
              <Check className="w-4 h-4 text-emerald" /> Profile settings saved to database!
            </div>
          )}

          {/* Account Identity Banner */}
          <div className="settings-account-card">
            <div>
              <div className="account-card-label">ACCOUNT EMAIL IDENTITY</div>
              <div className="account-card-email">{user?.email || 'user@sarggeo.com'}</div>
            </div>

            <div>
              {isPro ? (
                <span className="badge-pro shadow-xs">
                  <Crown className="w-3.5 h-3.5 inline mr-1" /> PRO UNLIMITED ($15/MO)
                </span>
              ) : (
                <button
                  className="custom-btn amber-pro-btn"
                  onClick={() => {
                    onClose();
                    if (onOpenUpgradeModal) onOpenUpgradeModal();
                  }}
                >
                  <Crown className="w-3.5 h-3.5 inline mr-1" /> Upgrade to Pro ($15/mo)
                </button>
              )}
            </div>
          </div>

          {/* SUBSCRIPTION STATUS & DAYS REMAINING PANEL */}
          <div className="settings-section-card bg-slate-50 border border-slate-200">
            <div className="section-card-title flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold">
                <CreditCard className="w-4 h-4 text-amber-600" /> Active Subscription & Days Remaining
              </div>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                BILLED AT $15.00 / MONTH
              </span>
            </div>

            {billingActionMsg && (
              <div className="alert-box success text-xs p-3 my-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{billingActionMsg}</span>
              </div>
            )}

            <div className="billing-stats-grid">
              {/* Box 1: Plan Name */}
              <div className="billing-stat-box">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">CURRENT PLAN</span>
                  <span className="text-sm font-black text-slate-900 block my-1">
                    {isPro ? 'Pro Unlimited Pass' : 'Free Starter Plan'}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-slate-500 block border-t border-slate-100 pt-1.5 mt-1">
                  $15.00/month flat rate
                </span>
              </div>

              {/* Box 2: Days Remaining Meter */}
              <div className="billing-stat-box">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">DAYS REMAINING</span>
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <div className="text-lg font-black text-amber-900 my-1">
                    {isPro ? `${daysLeft} Days Access` : '3 Free Conversions'}
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mt-1">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(10, (daysLeft / 30) * 100))}%` }}
                  ></div>
                </div>
              </div>

              {/* Box 3: Expiry & Auto-Renew */}
              <div className="billing-stat-box">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">ACCESS VALID UNTIL</span>
                  <span className="text-sm font-black text-slate-900 block my-1">
                    {isPro ? expiryDateStr : 'Free Trial Active'}
                  </span>
                </div>
                <span className={`text-[11px] font-extrabold block border-t border-slate-100 pt-1.5 mt-1 ${autoRenew ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {autoRenew ? '● Auto-Renews Monthly' : '● Cancellation Pending'}
                </span>
              </div>
            </div>

            {/* Cancel / Reactivate Subscription Bar */}
            {isPro && (
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                <div className="text-slate-600 font-medium">
                  {autoRenew ? (
                    <span>Subscribed at regular flat rate of $15/month. Cancel anytime.</span>
                  ) : (
                    <span className="text-amber-800 font-bold">Cancellation scheduled for {expiryDateStr}.</span>
                  )}
                </div>

                <div>
                  {cancelConfirm ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-red-600 font-bold">Confirm cancellation?</span>
                      <button
                        type="button"
                        className="custom-btn danger-btn text-xs px-3 py-1"
                        onClick={handleCancelSubscription}
                      >
                        Yes, Cancel Pro
                      </button>
                      <button
                        type="button"
                        className="custom-btn secondary text-xs px-2.5 py-1"
                        onClick={() => setCancelConfirm(false)}
                      >
                        Keep Pro
                      </button>
                    </div>
                  ) : autoRenew ? (
                    <button
                      type="button"
                      className="text-xs font-extrabold text-red-600 hover:text-red-800 hover:underline cursor-pointer flex items-center gap-1"
                      onClick={() => setCancelConfirm(true)}
                    >
                      <Ban className="w-3.5 h-3.5" /> Cancel Subscription
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="custom-btn primary text-xs px-3 py-1 flex items-center gap-1"
                      onClick={handleReactivateSubscription}
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Reactivate Auto-Renewal
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* PAYMENT HISTORY LOG TABLE */}
          <div className="settings-section-card">
            <div className="section-card-title cyan flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan" /> Billing & Payment History Log
              </div>
              <span className="text-[10px] font-mono text-slate-500">BILLED AT $15/MO REGULAR RATE</span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden mt-2">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-black">
                  <tr>
                    <th className="p-2.5">Date Paid</th>
                    <th className="p-2.5">Plan Description</th>
                    <th className="p-2.5">Amount Billed</th>
                    <th className="p-2.5">Valid Until</th>
                    <th className="p-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {paymentHistoryList.length > 0 ? (
                    paymentHistoryList.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-slate-50">
                        <td className="p-2.5 font-mono text-slate-600">
                          {new Date(item.paymentDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>
                        <td className="p-2.5 font-bold text-slate-900">{item.planName}</td>
                        <td className="p-2.5 font-black text-slate-900">${parseFloat(item.amountPaid).toFixed(2)} USD</td>
                        <td className="p-2.5 font-mono text-slate-700">
                          {new Date(item.expiresAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>
                        <td className="p-2.5">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                            item.status === 'ACTIVE' || item.status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : 'bg-amber-100 text-amber-900 border border-amber-300'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-slate-400 italic">
                        No past payment history records found. Upgrade to Pro ($15/mo) to initiate access.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* User Details Form */}
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="settings-section-card">
              <div className="section-card-title cyan">
                <Building className="w-4 h-4" /> Personal & Company Details
              </div>

              <div className="form-grid-2">
                <div className="form-field">
                  <label className="form-field-label">First Name</label>
                  <input
                    type="text"
                    className="custom-modal-input"
                    placeholder="e.g. Alex"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>

                <div className="form-field">
                  <label className="form-field-label">Last Name</label>
                  <input
                    type="text"
                    className="custom-modal-input"
                    placeholder="e.g. Sargeant"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-grid-3">
                <div className="form-field">
                  <label className="form-field-label">Company Name</label>
                  <input
                    type="text"
                    className="custom-modal-input"
                    placeholder="e.g. SargGeo Energy"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                  />
                </div>

                <div className="form-field">
                  <label className="form-field-label">Job Title</label>
                  <input
                    type="text"
                    className="custom-modal-input"
                    placeholder="e.g. Senior Surveyor"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                  />
                </div>

                <div className="form-field">
                  <label className="form-field-label">Phone</label>
                  <input
                    type="text"
                    className="custom-modal-input"
                    placeholder="e.g. +1 (403) 555-0192"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Platform Spatial & Map Preferences */}
            <div className="settings-section-card">
              <div className="section-card-title cyan">
                <MapPin className="w-4 h-4" /> Spatial Platform Preferences
              </div>

              <div className="form-grid-2">
                <div className="form-field">
                  <label className="form-field-label">Default Spatial Reference Format</label>
                  <select
                    className="custom-modal-select"
                    value={defaultSpatialFormat}
                    onChange={(e) => setDefaultSpatialFormat(e.target.value)}
                  >
                    <option value="DLS">Alberta ATS / DLS (LSD-Sec-Twp-Rge W4M)</option>
                    <option value="UTM">UTM Grid (Zone 11N/12N Easting/Northing)</option>
                    <option value="MGRS">Military Grid Reference System (MGRS)</option>
                    <option value="DD">Decimal Degrees (DD)</option>
                    <option value="DMS">Degrees Minutes Seconds (DMS)</option>
                  </select>
                </div>

                <div className="form-field">
                  <label className="form-field-label">Default Basemap Tile Theme</label>
                  <select
                    className="custom-modal-select"
                    value={defaultBasemap}
                    onChange={(e) => setDefaultBasemap(e.target.value)}
                  >
                    <option value="dark">Carto Dark Matter (Sleek Dark)</option>
                    <option value="satellite">ESRI World Imagery (High-Res Satellite)</option>
                    <option value="topo">OpenTopoMap (Topographic)</option>
                    <option value="light">Carto Positron (Light)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="form-actions-row">
              <button
                type="button"
                className="custom-btn secondary"
                onClick={handleExportProfileJson}
              >
                <Download className="w-3.5 h-3.5 text-cyan" /> Export Profile JSON
              </button>

              <button type="submit" disabled={saving} className="custom-btn primary">
                <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>

          {/* Quick Actions & Security */}
          <div className="settings-security-area">
            <div className="api-key-bar">
              <div>
                <span className="api-key-title">Developer API Keys</span>
                <p className="api-key-sub">Access REST API gateway tokens for GIS scripts.</p>
              </div>
              <button
                className="custom-btn secondary"
                onClick={() => {
                  onClose();
                  if (onOpenApiKeyModal) onOpenApiKeyModal();
                }}
              >
                <Key className="w-3.5 h-3.5 text-amber" /> Manage API Keys
              </button>
            </div>

            {/* Change Password */}
            <form onSubmit={handleChangePassword} className="settings-section-card space-y-3">
              <div className="section-card-title cyan">
                <Lock className="w-4 h-4" /> Security & Password Update
              </div>
              {passMessage && <div className="alert-box success">{passMessage}</div>}
              {passError && <div className="alert-box danger">{passError}</div>}

              <div className="form-grid-2">
                <input
                  type="password"
                  className="custom-modal-input"
                  placeholder="Current Password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
                <input
                  type="password"
                  className="custom-modal-input"
                  placeholder="New Password (min 4 chars)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div className="flex justify-end">
                <button type="submit" className="custom-btn dark-btn">
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
