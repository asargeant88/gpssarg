import React, { useState } from 'react';
import { X, Layers, Copy, Check, MapPin, Search, Globe } from 'lucide-react';
import { formatAllCoordinates, parseLocationInput, dlsToDd, utmToDd } from '../utils/coordinateConverter';

export default function ConverterModal({
  isOpen,
  onClose,
  onFlyTo,
  onCheckConversionLimit
}) {
  const [inputVal, setInputVal] = useState('16-29-44-4 W4');
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
      <div className="custom-modal-card converter-modal-width" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="custom-modal-header">
          <div className="modal-header-left">
            <div className="modal-icon-badge amber">
              <Layers className="w-5 h-5 text-amber" />
            </div>
            <div>
              <h2 className="modal-header-title">Multi-Grid Spatial Coordinate Converter</h2>
              <p className="modal-header-subtitle">Translate across DLS, UTM, MGRS, DD, DMS, and NTS formats in real time.</p>
            </div>
          </div>
          <button className="modal-close-icon-btn" onClick={onClose}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="custom-modal-body space-y-4">
          {/* Main Input Box */}
          <div className="input-group-box">
            <label className="input-group-label">ENTER COORDINATE OR DLS LOCATION</label>
            <div className="input-icon-wrapper">
              <Search className="input-inner-icon" />
              <input
                type="text"
                className="custom-modal-input mono-font"
                placeholder="e.g. 16-29-44-4 W4 or 52.827063, -110.538848 or 12N 531072E 5853133N"
                value={inputVal}
                onChange={(e) => handleInputChange(e.target.value)}
              />
            </div>
          </div>

          {/* Converted Results Grid */}
          {converted && (
            <div className="converter-results-grid">
              {/* DLS / ATS */}
              <div className="converter-result-card dls-card">
                <div className="card-top-row">
                  <span className="card-format-title dls">Alberta ATS / DLS</span>
                  <button
                    className="card-copy-btn dls"
                    onClick={() => handleCopyText('dls', converted.dls.formatted)}
                  >
                    {copiedFormat === 'dls' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedFormat === 'dls' ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
                <div className="card-primary-value dls">{converted.dls.formatted}</div>
                <div className="card-sub-info dls">Short: <span className="mono-font">{converted.dls.shortFormatted}</span></div>
              </div>

              {/* UTM Grid */}
              <div className="converter-result-card utm-card">
                <div className="card-top-row">
                  <span className="card-format-title utm">UTM Grid Reference</span>
                  <button
                    className="card-copy-btn utm"
                    onClick={() => handleCopyText('utm', converted.utm.formatted)}
                  >
                    {copiedFormat === 'utm' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedFormat === 'utm' ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
                <div className="card-primary-value utm">{converted.utm.formatted}</div>
                <div className="card-sub-info utm">Zone: <span className="mono-font">{converted.utm.zone}</span></div>
              </div>

              {/* MGRS */}
              <div className="converter-result-card mgrs-card">
                <div className="card-top-row">
                  <span className="card-format-title mgrs">Military Grid (MGRS)</span>
                  <button
                    className="card-copy-btn mgrs"
                    onClick={() => handleCopyText('mgrs', converted.mgrs)}
                  >
                    {copiedFormat === 'mgrs' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedFormat === 'mgrs' ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
                <div className="card-primary-value mgrs">{converted.mgrs}</div>
              </div>

              {/* Decimal Degrees */}
              <div className="converter-result-card dd-card">
                <div className="card-top-row">
                  <span className="card-format-title dd">Decimal Degrees (DD)</span>
                  <button
                    className="card-copy-btn dd"
                    onClick={() => handleCopyText('dd', converted.dd.formatted)}
                  >
                    {copiedFormat === 'dd' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedFormat === 'dd' ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
                <div className="card-primary-value dd">{converted.dd.formatted}</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Bar */}
        <div className="custom-modal-footer">
          <div className="footer-engine-badge">
            <Globe className="w-4 h-4 text-cyan" />
            <span>WGS84 Engine Active</span>
          </div>
          <div className="footer-action-buttons">
            <button className="custom-btn secondary" onClick={onClose}>
              Close
            </button>
            <button className="custom-btn amber-primary" onClick={handleGoToMap}>
              <MapPin className="w-4 h-4" /> Target Location on Map Canvas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
