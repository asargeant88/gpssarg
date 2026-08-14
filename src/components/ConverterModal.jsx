import React, { useState } from 'react';
import { X, Layers, Copy, Check, MapPin, Search, Sparkles } from 'lucide-react';
import { formatAllCoordinates, parseLocationInput, dlsToDd, utmToDd } from '../utils/coordinateConverter';

export default function ConverterModal({
  isOpen,
  onClose,
  onFlyTo,
  onCheckConversionLimit
}) {
  const [inputVal, setInputVal] = useState('16-29-44-4 W4');
  const [activeTabFormat, setActiveTabFormat] = useState('dls');
  const [copiedFormat, setCopiedFormat] = useState('');
  const [converted, setConverted] = useState(() => formatAllCoordinates(52.827063, -110.538848));

  const handleInputChange = async (val) => {
    setInputVal(val);
    if (!val || !val.trim()) return;

    if (onCheckConversionLimit) {
      const allowed = await onCheckConversionLimit(1);
      if (!allowed) return;
    }

    let lat = null;
    let lng = null;

    const dlsParsed = dlsToDd(val);
    if (dlsParsed && dlsParsed.isValid) {
      lat = dlsParsed.lat;
      lng = dlsParsed.lng;
    } else {
      const utmParsed = utmToDd(val);
      if (utmParsed) {
        lat = utmParsed.lat;
        lng = utmParsed.lng;
      } else {
        const parsed = parseLocationInput(val);
        if (parsed && parsed.lat != null && parsed.lng != null) {
          lat = parsed.lat;
          lng = parsed.lng;
        }
      }
    }

    if (lat != null && lng != null) {
      setConverted(formatAllCoordinates(lat, lng));
    }
  };

  const handleCopyText = (fmt, text) => {
    navigator.clipboard.writeText(text);
    setCopiedFormat(fmt);
    setTimeout(() => setCopiedFormat(''), 2000);
  };

  const handleGoToMap = () => {
    if (converted && converted.dd) {
      onFlyTo(parseFloat(converted.dd.lat), parseFloat(converted.dd.lng), 14);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="batch-modal-content" style={{ width: '740px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <div className="modal-icon-badge" style={{ background: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
              <Layers className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="modal-title">Multi-Grid Spatial Coordinate Converter</h2>
              <p className="modal-subtitle">Translate across DLS, UTM, MGRS, DD, DMS, and NTS formats in real time.</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto" style={{ maxHeight: '75vh' }}>
          {/* Main Input Box */}
          <div className="space-y-2">
            <label className="field-label text-amber-400">ENTER COORDINATE OR DLS LOCATION</label>
            <div className="relative">
              <input
                type="text"
                className="modal-input mono text-sm bg-slate-950 border-slate-800 text-amber-300 p-3 pl-10"
                placeholder="e.g. 16-29-44-4 W4 or 52.827063, -110.538848 or 12N 531072E 5853133N"
                value={inputVal}
                onChange={(e) => handleInputChange(e.target.value)}
              />
              <Search className="w-5 h-5 text-slate-500 absolute left-3 top-3.5" />
            </div>
          </div>

          {/* Real-time Converted Results Cards */}
          {converted && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {/* DLS / ATS */}
                <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">ALBERTA ATS / DLS</span>
                    <button
                      className="text-xs text-amber-400 hover:text-white flex items-center gap-1"
                      onClick={() => handleCopyText('dls', converted.dls.formatted)}
                    >
                      {copiedFormat === 'dls' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedFormat === 'dls' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <div className="text-sm font-extrabold text-amber-300">{converted.dls.formatted}</div>
                  <div className="text-xs text-slate-400">Short: <span className="mono text-white">{converted.dls.shortFormatted}</span></div>
                </div>

                {/* UTM Grid */}
                <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">UTM GRID REFERENCE</span>
                    <button
                      className="text-xs text-cyan-400 hover:text-white flex items-center gap-1"
                      onClick={() => handleCopyText('utm', converted.utm.formatted)}
                    >
                      {copiedFormat === 'utm' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedFormat === 'utm' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <div className="text-sm font-extrabold text-cyan-300 mono">{converted.utm.formatted}</div>
                  <div className="text-xs text-slate-400">Zone: <span className="mono text-white">{converted.utm.zone}</span></div>
                </div>

                {/* MGRS */}
                <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">MILITARY GRID (MGRS)</span>
                    <button
                      className="text-xs text-emerald-400 hover:text-white flex items-center gap-1"
                      onClick={() => handleCopyText('mgrs', converted.mgrs)}
                    >
                      {copiedFormat === 'mgrs' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedFormat === 'mgrs' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <div className="text-sm font-extrabold text-emerald-300 mono">{converted.mgrs}</div>
                </div>

                {/* Decimal Degrees */}
                <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">DECIMAL DEGREES (DD)</span>
                    <button
                      className="text-xs text-indigo-400 hover:text-white flex items-center gap-1"
                      onClick={() => handleCopyText('dd', converted.dd.formatted)}
                    >
                      {copiedFormat === 'dd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedFormat === 'dd' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <div className="text-sm font-extrabold text-indigo-300 mono">{converted.dd.formatted}</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  className="pane-btn primary text-xs font-bold px-6 py-2.5 shadow-lg"
                  onClick={handleGoToMap}
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#0f172a' }}
                >
                  <MapPin className="w-4 h-4 mr-1.5 inline" /> Target Location on Map Canvas
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
