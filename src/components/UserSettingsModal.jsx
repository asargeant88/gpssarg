import React, { useState, useEffect } from 'react';
import { X, User, Building, Phone, Briefcase, MapPin, Key, Crown, Save, Lock, Check, ShieldCheck, Download, Upload } from 'lucide-react';

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

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passMessage, setPassMessage] = useState('');
  const [passError, setPassError] = useState('');

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !user) return;
    setFirstName(user.firstName || '');
    setLastName(user.lastName || '');
    setCompany(user.company || '');
    setJobTitle(user.jobTitle || '');
    setPhone(user.phone || '');
    setDefaultSpatialFormat(user.defaultSpatialFormat || 'DLS');
    setDefaultBasemap(user.defaultBasemap || 'dark');
  }, [isOpen, user]);

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
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');

      setSaveSuccess(true);
      if (onUpdateUserProfile) onUpdateUserProfile(data.profile);
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

    const token = localStorage.getItem('sarggeo_token');
    if (!token) return;

    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Password update failed');

      setPassMessage('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setPassError(err.message);
    }
  };

  const handleExportProfileJson = () => {
    const config = {
      email: user?.email,
      firstName,
      lastName,
      company,
      jobTitle,
      phone,
      defaultSpatialFormat,
      defaultBasemap,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sarggeo_user_settings_${user?.email ? user.email.split('@')[0] : 'config'}.json`;
    a.click();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="batch-modal-content" style={{ width: '680px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <div className="modal-icon-badge" style={{ background: 'rgba(56, 189, 248, 0.15)', borderColor: 'rgba(56, 189, 248, 0.3)' }}>
              <User className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="modal-title">User Settings & Preferences</h2>
              <p className="modal-subtitle">Manage personal profile, default spatial units, and security.</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto" style={{ maxHeight: '75vh' }}>
          {error && <div className="error-alert text-xs">{error}</div>}
          {saveSuccess && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-500/60 rounded-xl text-emerald-300 text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" /> Profile settings saved to database!
            </div>
          )}

          {/* Account Tier Badge Header */}
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-400 font-semibold uppercase">ACCOUNT IDENTITY</div>
              <div className="text-sm font-extrabold text-white">{user?.email}</div>
            </div>

            <div className="flex items-center gap-2">
              {subscriptionTier === 'pro' ? (
                <span className="badge-pro flex items-center gap-1">
                  <Crown className="w-3.5 h-3.5 text-slate-950" /> PRO UNLIMITED
                </span>
              ) : (
                <button
                  className="pane-btn primary small text-xs font-bold px-3 py-1.5"
                  onClick={() => {
                    onClose();
                    if (onOpenUpgradeModal) onOpenUpgradeModal();
                  }}
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#0f172a' }}
                >
                  Upgrade to Pro ($15/mo)
                </button>
              )}
            </div>
          </div>

          {/* User Details Form */}
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <label className="field-label text-cyan-400">PERSONAL & COMPANY DETAILS</label>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400">First Name</label>
                <input
                  type="text"
                  className="modal-input text-xs mt-1"
                  placeholder="e.g. Alex"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400">Last Name</label>
                <input
                  type="text"
                  className="modal-input text-xs mt-1"
                  placeholder="e.g. Sargeant"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400">Company Name</label>
                <input
                  type="text"
                  className="modal-input text-xs mt-1"
                  placeholder="e.g. SargGeo Energy"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400">Job Title</label>
                <input
                  type="text"
                  className="modal-input text-xs mt-1"
                  placeholder="e.g. Senior Surveyor"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400">Phone</label>
                <input
                  type="text"
                  className="modal-input text-xs mt-1"
                  placeholder="e.g. +1 (403) 555-0192"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            {/* Platform Spatial & Map Preferences */}
            <div className="pt-2">
              <label className="field-label text-cyan-400">SPATIAL PLATFORM PREFERENCES</label>

              <div className="grid grid-cols-2 gap-3 mt-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400">Default Spatial Reference Format</label>
                  <select
                    className="modal-input text-xs mt-1 bg-slate-900 border-slate-800 text-slate-200"
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

                <div>
                  <label className="text-[11px] font-semibold text-slate-400">Default Basemap Tile Theme</label>
                  <select
                    className="modal-input text-xs mt-1 bg-slate-900 border-slate-800 text-slate-200"
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

            <div className="flex items-center justify-between pt-3">
              <button
                type="button"
                className="pane-btn secondary small text-xs flex items-center gap-1.5 py-2 px-3"
                onClick={handleExportProfileJson}
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" /> Export Profile JSON
              </button>

              <button type="submit" disabled={saving} className="pane-btn primary text-xs font-bold px-5 py-2">
                <Save className="w-4 h-4 mr-1.5 inline" /> {saving ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>

          {/* Quick Actions & Security */}
          <div className="pt-4 border-t border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-extrabold text-white">Developer API Keys</span>
                <p className="text-[11px] text-slate-400">Access REST API gateway tokens for GIS scripts.</p>
              </div>
              <button
                className="pane-btn secondary small text-xs font-bold px-3 py-1.5 flex items-center gap-1.5"
                onClick={() => {
                  onClose();
                  if (onOpenApiKeyModal) onOpenApiKeyModal();
                }}
              >
                <Key className="w-3.5 h-3.5 text-amber-400" /> Manage API Keys
              </button>
            </div>

            {/* Change Password */}
            <form onSubmit={handleChangePassword} className="p-4 bg-slate-900/40 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <Lock className="w-4 h-4 text-cyan-400" />
                <span>Security & Password Update</span>
              </div>
              {passMessage && <div className="p-2 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs rounded">{passMessage}</div>}
              {passError && <div className="error-alert text-xs">{passError}</div>}

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="password"
                  className="modal-input text-xs"
                  placeholder="Current Password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
                <input
                  type="password"
                  className="modal-input text-xs"
                  placeholder="New Password (min 4 chars)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div className="flex justify-end">
                <button type="submit" className="pane-btn secondary small text-xs font-bold px-4 py-1.5">
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
