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
              <h2 className="modal-header-title">User Settings & Preferences</h2>
              <p className="modal-header-subtitle">Manage personal profile, default spatial units, and security.</p>
            </div>
          </div>
          <button className="modal-close-icon-btn" onClick={onClose}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="custom-modal-body space-y-4">
          {error && <div className="alert-box danger">{error}</div>}
          {saveSuccess && (
            <div className="alert-box success">
              <Check className="w-4 h-4 text-emerald" /> Profile settings saved to database!
            </div>
          )}

          {/* Account Tier Card */}
          <div className="settings-account-card">
            <div>
              <div className="account-card-label">ACCOUNT IDENTITY</div>
              <div className="account-card-email">{user?.email || 'asargeant8484@gmail.com'}</div>
            </div>

            <div>
              {subscriptionTier === 'pro' ? (
                <span className="badge-pro shadow-xs">
                  <Crown className="w-3.5 h-3.5 inline mr-1" /> PRO UNLIMITED
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
