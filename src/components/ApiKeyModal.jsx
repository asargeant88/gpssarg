import React, { useState, useEffect } from 'react';
import { X, Key, Copy, Check, Plus, Trash2, Code, Terminal, AlertCircle, Sparkles, Shield, Clock } from 'lucide-react';

export default function ApiKeyModal({ isOpen, onClose, user, subscriptionTier, onOpenUpgradeModal }) {
  const [keys, setKeys] = useState([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdRawKey, setCreatedRawKey] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [activeSnippetTab, setActiveSnippetTab] = useState('curl');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !user) return;
    fetchKeys();
  }, [isOpen, user]);

  const fetchKeys = async () => {
    const token = localStorage.getItem('sarggeo_token');
    if (!token) return;

    try {
      const res = await fetch('/api/keys', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.keys) setKeys(data.keys);
    } catch (e) {}
  };

  const handleGenerateKey = async (e) => {
    e.preventDefault();
    setError('');

    if (subscriptionTier !== 'pro') {
      setError('Developer API Key access requires an active Pro Subscription ($15/mo).');
      return;
    }

    const token = localStorage.getItem('sarggeo_token');
    if (!token) return;

    setLoading(true);

    try {
      const res = await fetch('/api/keys/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: newKeyName || 'Production API Key' })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Failed to generate key');

      setCreatedRawKey(data.apiKey);
      setNewKeyName('');
      fetchKeys();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeKey = async (id) => {
    const token = localStorage.getItem('sarggeo_token');
    if (!token) return;

    try {
      await fetch(`/api/keys/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setKeys((prev) => prev.filter((k) => k.id !== id));
    } catch (e) {}
  };

  const handleCopyRawKey = () => {
    if (!createdRawKey) return;
    navigator.clipboard.writeText(createdRawKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const getSampleSnippet = () => {
    const sampleKey = createdRawKey || 'sg_live_7a3f9e1b2c4d5e6f7a8b9c0d';
    const baseUrl = window.location.origin;

    if (activeSnippetTab === 'curl') {
      return `curl -X GET "${baseUrl}/api/v1/convert?input=16-29-44-4%20W4" \\
  -H "x-api-key: ${sampleKey}"`;
    }

    if (activeSnippetTab === 'js') {
      return `const response = await fetch('${baseUrl}/api/v1/convert?input=16-29-44-4 W4', {
  headers: {
    'x-api-key': '${sampleKey}'
  }
});
const data = await response.json();
console.log('Converted Coordinates:', data.coordinates);`;
    }

    if (activeSnippetTab === 'python') {
      return `import requests

url = "${baseUrl}/api/v1/convert"
headers = {"x-api-key": "${sampleKey}"}
params = {"input": "16-29-44-4 W4"}

response = requests.get(url, headers=headers, params=params)
print(response.json())`;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="custom-modal-card converter-modal-width" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="custom-modal-header">
          <div className="modal-header-left">
            <div className="modal-icon-badge amber">
              <Key className="w-5 h-5 text-amber" />
            </div>
            <div>
              <h2 className="modal-header-title">Developer API Portal & Keys</h2>
              <p className="modal-header-subtitle">Generate API keys linked to your subscription status.</p>
            </div>
          </div>
          <button className="modal-close-icon-btn" onClick={onClose}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="custom-modal-body space-y-4">
          {subscriptionTier !== 'pro' ? (
            <div className="p-5 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
              <div className="flex items-center gap-2 font-extrabold text-amber-900 text-sm">
                <Sparkles className="w-5 h-5 text-amber-600" />
                <span>Pro Subscription Required for Developer API Access</span>
              </div>
              <p className="text-xs text-amber-800 font-medium">
                Developer API keys allow integration into GIS software, custom web applications, and python scripts. Upgrade to Pro ($15/mo) to unlock API keys.
              </p>
              <button
                className="custom-btn amber-pro-btn px-5 py-2.5 text-xs"
                onClick={() => {
                  onClose();
                  if (onOpenUpgradeModal) onOpenUpgradeModal();
                }}
              >
                Upgrade to Pro ($15/mo)
              </button>
            </div>
          ) : (
            <>
              {/* Newly Created Key Alert */}
              {createdRawKey && (
                <div className="alert-box success flex-col items-start gap-2">
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-black uppercase tracking-wide text-emerald-900">API KEY GENERATED — SAVE THIS SECRET KEY NOW</span>
                    <button className="text-emerald-700 hover:text-emerald-950" onClick={() => setCreatedRawKey(null)}>
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-emerald-800 font-medium">
                    This raw secret key is only displayed once. Please copy and store it securely.
                  </p>
                  <div className="flex items-center gap-2 w-full mt-1">
                    <input
                      type="text"
                      readOnly
                      value={createdRawKey}
                      className="custom-modal-input mono-font text-xs font-extrabold text-emerald-950 bg-white border-emerald-300"
                    />
                    <button
                      className="custom-btn primary shrink-0 text-xs py-2 px-3"
                      onClick={handleCopyRawKey}
                    >
                      {copiedKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedKey ? 'Copied!' : 'Copy Key'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Generate New Key Form */}
              <div className="settings-section-card">
                <div className="section-card-title cyan">
                  <Key className="w-4 h-4" /> Generate New Developer API Key
                </div>
                {error && <div className="alert-box danger">{error}</div>}
                <form onSubmit={handleGenerateKey} className="flex gap-2">
                  <input
                    type="text"
                    className="custom-modal-input text-xs flex-1"
                    placeholder="Key Label (e.g. GIS Pipeline Worker, Mobile App)"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                  />
                  <button type="submit" disabled={loading} className="custom-btn primary text-xs shrink-0 px-4">
                    <Plus className="w-4 h-4" /> {loading ? 'Generating...' : 'Generate Key'}
                  </button>
                </form>
              </div>

              {/* Active API Keys List */}
              <div className="space-y-2">
                <div className="card-title-label">YOUR API KEYS ({keys.length})</div>
                {keys.length === 0 ? (
                  <div className="rhs-empty-list">
                    <Key className="w-6 h-6 text-slate-400 mb-1" />
                    <span>No API keys created yet. Generate one above to start building integrations!</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {keys.map((k) => {
                      const isExpired = k.status !== 'active' || (k.expires_at && new Date(k.expires_at) < new Date());
                      return (
                        <div
                          key={k.id}
                          className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 shadow-2xs"
                        >
                          <div className="truncate space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-xs text-slate-900">{k.name}</span>
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${isExpired ? 'bg-red-100 text-red-800 border border-red-300' : 'bg-emerald-100 text-emerald-900 border border-emerald-300'}`}>
                                {isExpired ? 'EXPIRED / REVOKED' : 'ACTIVE'}
                              </span>
                            </div>
                            <div className="text-xs mono-font font-bold text-cyan-800">{k.key_prefix}</div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-2 font-medium">
                              <span>Created: {new Date(k.created_at).toLocaleDateString()}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                Expires: {k.expires_at ? new Date(k.expires_at).toLocaleDateString() : 'Active with Subscription'}
                              </span>
                            </div>
                          </div>

                          <button
                            className="point-icon-btn danger"
                            onClick={() => handleRevokeKey(k.id)}
                            title="Revoke Key"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Sample Code Integration Snippets */}
              <div className="settings-section-card">
                <div className="flex items-center justify-between">
                  <div className="section-card-title cyan">
                    <Code className="w-4 h-4" /> API Code Snippets
                  </div>
                  <div className="flex items-center gap-1.5">
                    {['curl', 'js', 'python'].map((lang) => (
                      <button
                        key={lang}
                        className={`snippet-tab-btn ${activeSnippetTab === lang ? 'active' : ''}`}
                        onClick={() => setActiveSnippetTab(lang)}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="snippet-code-container">
                  <textarea
                    readOnly
                    value={getSampleSnippet()}
                    className="snippet-textarea mono-font"
                  />
                  <button
                    className="snippet-copy-btn"
                    onClick={() => {
                      navigator.clipboard.writeText(getSampleSnippet());
                      setCopiedSnippet(true);
                      setTimeout(() => setCopiedSnippet(false), 2000);
                    }}
                  >
                    {copiedSnippet ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSnippet ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
