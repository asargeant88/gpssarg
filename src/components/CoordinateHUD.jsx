import React, { useState } from 'react';
import { Copy, Check, Crosshair, MapPin, Compass, Layers } from 'lucide-react';
import { formatAllCoordinates } from '../utils/coordinateConverter';

export default function CoordinateHUD({
  cursorPos,
  zoomLevel,
  activeBasemap,
  showGridLines,
  onToggleGridLines,
  onPinCurrentLocation
}) {
  const [copiedKey, setCopiedKey] = useState(null);

  if (!cursorPos) return null;

  const formatted = formatAllCoordinates(cursorPos.lat, cursorPos.lng);

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="coordinate-hud-container">
      <div className="hud-glass-card">
        {/* Header Badges */}
        <div className="hud-header">
          <div className="hud-badge active-badge">
            <span className="live-dot"></span>
            LIVE TICKER
          </div>
          <div className="hud-badge info-badge">
            <Compass className="w-3.5 h-3.5 mr-1" />
            WGS84 (EPSG:4326)
          </div>
          <div className="hud-badge info-badge">
            ZOOM {zoomLevel}
          </div>
        </div>

        {/* Primary Ticker Grid */}
        <div className="hud-metrics-row">
          {/* DLS / LSD */}
          <div className="hud-metric-item highlight-dls" onClick={() => handleCopy(formatted.dls.formatted, 'dls')}>
            <span className="hud-label text-amber-400">DLS / LSD (ATS)</span>
            <span className="hud-value mono text-amber-300">{formatted.dls.isValid ? formatted.dls.shortFormatted : 'N/A'}</span>
            <button className="hud-copy-btn" title="Copy DLS">
              {copiedKey === 'dls' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Decimal Degrees */}
          <div className="hud-metric-item" onClick={() => handleCopy(formatted.dd.formatted, 'dd')}>
            <span className="hud-label">LAT / LNG (DD)</span>
            <span className="hud-value mono">{formatted.dd.formatted}</span>
            <button className="hud-copy-btn" title="Copy Lat/Lng">
              {copiedKey === 'dd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* UTM */}
          <div className="hud-metric-item" onClick={() => handleCopy(formatted.utm.formatted, 'utm')}>
            <span className="hud-label">UTM GRID</span>
            <span className="hud-value mono">{formatted.utm.formatted}</span>
            <button className="hud-copy-btn" title="Copy UTM">
              {copiedKey === 'utm' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* MGRS */}
          <div className="hud-metric-item" onClick={() => handleCopy(formatted.mgrs, 'mgrs')}>
            <span className="hud-label">MGRS CODE</span>
            <span className="hud-value mono">{formatted.mgrs}</span>
            <button className="hud-copy-btn" title="Copy MGRS">
              {copiedKey === 'mgrs' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* DMS */}
          <div className="hud-metric-item" onClick={() => handleCopy(formatted.dms.formatted, 'dms')}>
            <span className="hud-label">DMS FORMAT</span>
            <span className="hud-value mono">{formatted.dms.lat}</span>
            <button className="hud-copy-btn" title="Copy DMS">
              {copiedKey === 'dms' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="hud-actions">
          <button
            className={`hud-action-btn ${showGridLines ? 'active' : ''}`}
            onClick={onToggleGridLines}
            title="Toggle Grid Overlay"
          >
            <Layers className="w-4 h-4 mr-1.5" />
            Grid Lines {showGridLines ? 'ON' : 'OFF'}
          </button>

          <button
            className="hud-action-btn primary"
            onClick={onPinCurrentLocation}
            title="Drop Pin at Current Cursor"
          >
            <MapPin className="w-4 h-4 mr-1.5" />
            Drop Waypoint
          </button>
        </div>
      </div>
    </div>
  );
}
