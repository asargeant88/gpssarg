import React, { useState, useEffect } from 'react';
import { Copy, Check, MapPin, Layers, Mountain } from 'lucide-react';
import { formatAllCoordinates, fetchDlsPolygons } from '../utils/coordinateConverter';

export default function CoordinateHUD({
  cursorPos,
  zoomLevel,
  activeBasemap,
  showGridLines,
  onToggleGridLines,
  onPinCurrentLocation,
  elevation
}) {
  const [copiedKey, setCopiedKey] = useState(null);
  const [officialDls, setOfficialDls] = useState(null);

  useEffect(() => {
    if (!cursorPos || cursorPos.lat == null || cursorPos.lng == null) return;
    let isCurrent = true;
    fetchDlsPolygons(cursorPos.lat, cursorPos.lng)
      .then(res => {
        if (isCurrent && res && res.dls) setOfficialDls(res.dls);
      })
      .catch(() => {});
    return () => { isCurrent = false; };
  }, [cursorPos?.lat, cursorPos?.lng]);

  if (!cursorPos) return null;

  const formatted = formatAllCoordinates(cursorPos.lat, cursorPos.lng);
  const dlsDisplay = officialDls || formatted.dls;

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const elevText = elevation != null ? `${Math.round(elevation)} m` : '— m';

  return (
    <div className="sarggeo-status-bar">
      {/* Left: Live indicator */}
      <div className="status-bar-section status-live">
        <span className="live-dot" />
        <span className="status-label">LIVE</span>
      </div>

      <div className="status-bar-divider" />

      {/* DLS / ATS */}
      <div
        className="status-bar-section status-clickable"
        onClick={() => handleCopy(dlsDisplay.formatted, 'dls')}
        title="Click to copy DLS"
      >
        <span className="status-label">DLS</span>
        <span className="status-value status-accent">
          {dlsDisplay.isValid ? dlsDisplay.shortFormatted : 'N/A'}
        </span>
        {copiedKey === 'dls' ? <Check className="w-3 h-3" style={{ color: '#16795a' }} /> : null}
      </div>

      <div className="status-bar-divider" />

      {/* Lat / Lng */}
      <div
        className="status-bar-section status-clickable"
        onClick={() => handleCopy(formatted.dd.formatted, 'dd')}
        title="Click to copy Lat/Lng"
      >
        <span className="status-label">LAT</span>
        <span className="status-value mono">{cursorPos.lat.toFixed(6)}</span>
        <span className="status-label" style={{ marginLeft: 8 }}>LNG</span>
        <span className="status-value mono">{cursorPos.lng.toFixed(6)}</span>
        {copiedKey === 'dd' ? <Check className="w-3 h-3" style={{ color: '#16795a', marginLeft: 4 }} /> : null}
      </div>

      <div className="status-bar-divider" />

      {/* Elevation */}
      <div className="status-bar-section" title="Elevation at clicked point">
        <Mountain className="w-3.5 h-3.5" style={{ color: 'var(--accent-emerald)', marginRight: 4 }} />
        <span className="status-label">ELEV</span>
        <span className="status-value" style={{ color: 'var(--accent-emerald)' }}>{elevText}</span>
      </div>

      <div className="status-bar-divider" />

      {/* UTM */}
      <div
        className="status-bar-section status-clickable"
        onClick={() => handleCopy(formatted.utm.formatted, 'utm')}
        title="Click to copy UTM"
      >
        <span className="status-label">UTM</span>
        <span className="status-value mono">{formatted.utm.formatted}</span>
        {copiedKey === 'utm' ? <Check className="w-3 h-3" style={{ color: '#16795a', marginLeft: 4 }} /> : null}
      </div>

      <div className="status-bar-divider" />

      {/* MGRS */}
      <div
        className="status-bar-section status-clickable"
        onClick={() => handleCopy(formatted.mgrs, 'mgrs')}
        title="Click to copy MGRS"
      >
        <span className="status-label">MGRS</span>
        <span className="status-value mono">{formatted.mgrs}</span>
        {copiedKey === 'mgrs' ? <Check className="w-3 h-3" style={{ color: '#16795a', marginLeft: 4 }} /> : null}
      </div>

      <div className="status-bar-divider" />

      {/* Zoom */}
      <div className="status-bar-section">
        <span className="status-label">ZOOM</span>
        <span className="status-value">{zoomLevel}</span>
      </div>

      {/* Right: actions */}
      <div className="status-bar-right">
        <button
          className={`status-action-btn ${showGridLines ? 'active' : ''}`}
          onClick={onToggleGridLines}
          title="Toggle Grid Overlay"
        >
          <Layers className="w-3.5 h-3.5" />
          Grid {showGridLines ? 'ON' : 'OFF'}
        </button>
        <button
          className="status-action-btn primary"
          onClick={onPinCurrentLocation}
          title="Drop Pin at Current Cursor"
        >
          <MapPin className="w-3.5 h-3.5" />
          Drop Pin
        </button>
        <span className="status-label" style={{ marginLeft: 8 }}>WGS84 (EPSG:4326)</span>
      </div>
    </div>
  );
}
