import React, { useState } from 'react';
import { X, Lock, Mail, UserPlus, LogIn, ShieldCheck, AlertCircle } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const text = await res.text();
      let data = {};
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error('Backend API connection error. Please verify the server is running on port 8080.');
      }

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      localStorage.setItem('sarggeo_token', data.token);
      if (onAuthSuccess) onAuthSuccess(data.user, data.token);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="custom-modal-card auth-modal-width" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="custom-modal-header">
          <div className="modal-header-left">
            <div className="modal-icon-badge cyan">
              <ShieldCheck className="w-5 h-5 text-cyan" />
            </div>
            <div>
              <h2 className="modal-header-title">{isLogin ? 'Sign In to SargGeo' : 'Create SargGeo Account'}</h2>
              <p className="modal-header-subtitle">Save projects, sync waypoints to cloud DB, and upgrade to Pro.</p>
            </div>
          </div>
          <button className="modal-close-icon-btn" onClick={onClose}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="custom-modal-body space-y-4">
          {error && (
            <div className="alert-box error flex items-center gap-2 mb-2 p-3 text-xs">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="custom-field-label">EMAIL ADDRESS</label>
              <div className="custom-input-relative">
                <Mail className="custom-input-icon" />
                <input
                  type="email"
                  required
                  className="custom-modal-input with-icon"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="custom-field-label">PASSWORD</label>
              <div className="custom-input-relative">
                <Lock className="custom-input-icon" />
                <input
                  type="password"
                  required
                  minLength={4}
                  className="custom-modal-input with-icon"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="custom-btn primary full py-3 text-xs font-extrabold justify-center shadow-xs"
              style={{ marginTop: '20px' }}
            >
              {loading ? (
                'Processing...'
              ) : isLogin ? (
                <>
                  <LogIn className="w-4 h-4 mr-1.5" /> Sign In
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-1.5" /> Create Free Account
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                className="text-xs font-extrabold text-cyan-800 hover:text-cyan-950 hover:underline cursor-pointer"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
              >
                {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
