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
      <div className="batch-modal-content" style={{ width: '740px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <div className="modal-icon-badge" style={{ background: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
              <Key className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="modal-title">Developer API Portal & Keys</h2>
              <p className="modal-subtitle">Generate API keys linked to your subscription status.</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto" style={{ maxHeight: '75vh' }}>
          {subscriptionTier !== 'pro' ? (
            <div className="p-5 bg-gradient-to-br from-amber-950/40 to-slate-900 border border-amber-500/40 rounded-xl space-y-3">
              <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <span>Pro Subscription Required for API Access</span>
              </div>
              <p className="text-xs text-amber-100/80">
                Developer API keys allow integration into GIS software, custom web applications, and python scripts. Upgrade to Pro ($15/mo) to unlock API keys.
              </p>
              <button
                className="pane-btn primary full py-2.5 text-xs font-black"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#0f172a' }}
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
              {/* Newly Created Key Alert (Shown once) */}
              {createdRawKey && (
                <div className="p-4 bg-emerald-950/60 border border-emerald-500/60 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-emerald-300 uppercase tracking-wide">API KEY GENERATED — SAVE THIS NOW</span>
                    <button className="text-emerald-400 hover:text-white" onClick={() => setCreatedRawKey(null)}>
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-[11px] text-emerald-200/80">
                    This raw secret key is only displayed once. Please copy and store it securely.
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      readOnly
                      value={createdRawKey}
                      className="modal-input mono text-xs font-bold text-emerald-300 bg-black/60 border-emerald-500/40"
                    />
                    <button
                      className="pane-btn primary text-xs px-3 py-2 shrink-0 font-bold"
                      onClick={handleCopyRawKey}
                    >
                      {copiedKey ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4 mr-1 inline" />}
                      {copiedKey ? 'Copied!' : 'Copy Key'}
                    </button>
                  </div>
                </div>
              )}

              {/* Generate New Key Form */}
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
                <label className="field-label text-cyan-400">GENERATE NEW DEVELOPER API KEY</label>
                {error && <div className="error-alert text-xs">{error}</div>}
                <form onSubmit={handleGenerateKey} className="flex gap-2">
                  <input
                    type="text"
                    className="modal-input text-xs flex-1"
                    placeholder="Key Label (e.g. GIS Pipeline Worker, Mobile App)"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                  />
                  <button type="submit" disabled={loading} className="pane-btn primary text-xs shrink-0 px-4 font-bold">
                    <Plus className="w-4 h-4 mr-1 inline" /> {loading ? 'Generating...' : 'Generate Key'}
                  </button>
                </form>
              </div>

              {/* Active API Keys List */}
              <div className="space-y-3">
                <label className="field-label text-slate-400">YOUR API KEYS ({keys.length})</label>
                {keys.length === 0 ? (
                  <div className="empty-state py-6 bg-slate-900/40 border border-slate-800/60 rounded-xl">
                    <Key className="w-8 h-8 text-slate-600 mb-2" />
                    <span className="text-xs text-slate-400">No API keys created yet. Generate one above to start building integrations!</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {keys.map((k) => {
                      const isExpired = k.status !== 'active' || (k.expires_at && new Date(k.expires_at) < new Date());
                      return (
                        <div
                          key={k.id}
                          className="p-3 bg-slate-900/50 border border-slate-800 rounded-xl flex items-center justify-between gap-3"
                        >
                          <div className="truncate space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-white">{k.name}</span>
                              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${isExpired ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'}`}>
                                {isExpired ? 'EXPIRED / REVOKED' : 'ACTIVE'}
                              </span>
                            </div>
                            <div className="text-xs mono text-cyan-400">{k.key_prefix}</div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-2">
                              <span>Created: {new Date(k.created_at).toLocaleDateString()}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                Expires: {k.expires_at ? new Date(k.expires_at).toLocaleDateString() : 'Active with Subscription'}
                              </span>
                            </div>
                          </div>

                          <button
                            className="p-1.5 text-slate-500 hover:text-red-400 rounded"
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
              <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Code className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-slate-200 uppercase">API Code Snippets</span>
                  </div>
                  <div className="flex gap-1">
                    {['curl', 'js', 'python'].map((lang) => (
                      <button
                        key={lang}
                        className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded transition-all ${activeSnippetTab === lang ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                        onClick={() => setActiveSnippetTab(lang)}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    readOnly
                    value={getSampleSnippet()}
                    className="modal-input mono text-xs bg-black/80 border-slate-800 text-cyan-300 p-3 h-28 resize-none"
                  />
                  <button
                    className="absolute right-2 top-2 pane-btn secondary small text-[10px] py-1 px-2"
                    onClick={() => {
                      navigator.clipboard.writeText(getSampleSnippet());
                      setCopiedSnippet(true);
                      setTimeout(() => setCopiedSnippet(false), 2000);
                    }}
                  >
                    {copiedSnippet ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
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
