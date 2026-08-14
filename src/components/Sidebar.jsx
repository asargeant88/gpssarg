import React, { useState, useRef, useEffect } from 'react';
import ExifReader from 'exifreader';
import {
  Search,
  RefreshCw,
  Layers,
  Ruler,
  Camera,
  Bookmark,
  Copy,
  Check,
  Plus,
  Trash2,
  Download,
  MapPin,
  Upload,
  Folder,
  Crown,
  User,
  Key,
  ChevronLeft,
  Globe
} from 'lucide-react';
import SargGeoLogo from './SargGeoLogo';
import { formatAllCoordinates, parseLocationInput, fetchDlsPolygons } from '../utils/coordinateConverter';

export default function Sidebar({
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed,
  basemap,
  setBasemap,
  showGridLines,
  setShowGridLines,
  waypoints,
  onAddWaypoint,
  onDeleteWaypoint,
  photos,
  onUploadPhoto,
  onSelectPhoto,
  onFlyTo,
  measurePoints,
  onStartMeasure,
  onClearMeasure,
  activeCursorPos,
  autoAddOnClick,
  setAutoAddOnClick,
  onOpenBatchModal,
  user,
  subscriptionTier,
  conversionsUsed,
  onOpenAuthModal,
  onOpenUpgradeModal,
  onOpenAccountModal,
  onOpenProjectsModal,
  onOpenApiKeyModal,
  onOpenUserSettingsModal,
  onOpenConverterModal,
  onOpenJsonImportModal,
  onSignOut,
  projects = [],
  activeProject,
  onSelectProject,
  onCreateProject,
  onDeleteProject
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchError, setSearchError] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const initialLat = activeCursorPos ? activeCursorPos.lat : 51.0447;
  const initialLng = activeCursorPos ? activeCursorPos.lng : -114.0719;
  const [converterInput, setConverterInput] = useState(`${initialLat.toFixed(6)}, ${initialLng.toFixed(6)}`);
  const [converterCoords, setConverterCoords] = useState(formatAllCoordinates(initialLat, initialLng));
  const [copiedKey, setCopiedKey] = useState(null);

  useEffect(() => {
    if (!activeCursorPos || activeCursorPos.lat == null || activeCursorPos.lng == null) return;
    const lat = activeCursorPos.lat;
    const lng = activeCursorPos.lng;
    setConverterInput(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    const coords = formatAllCoordinates(lat, lng);
    setConverterCoords(coords);

    let isCurrent = true;
    fetchDlsPolygons(lat, lng)
      .then(res => {
        if (isCurrent && res && res.dls) {
          setConverterCoords(prev => ({ ...prev, dls: res.dls }));
        }
      })
      .catch(() => {});

    return () => { isCurrent = false; };
  }, [activeCursorPos?.lat, activeCursorPos?.lng]);

  const [newWpTitle, setNewWpTitle] = useState('');
  const [newWpNotes, setNewWpNotes] = useState('');
  const [newWpColor, setNewWpColor] = useState('#1d6fa4');

  const fileInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessingExif, setIsProcessingExif] = useState(false);
  const [uploadStatusMsg, setUploadStatusMsg] = useState('');

  const processFilesForExif = async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    setIsProcessingExif(true);
    setUploadStatusMsg('Extracting EXIF metadata...');
    let addedCount = 0;

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (!file.type.startsWith('image/')) continue;

      let lat = null;
      let lng = null;
      let altitude = 'Ground level';
      let hasExifGps = false;

      try {
        const tags = await ExifReader.load(file);
        if (tags && tags.GPSLatitude && tags.GPSLongitude) {
          const latVal = tags.GPSLatitude.description;
          const lngVal = tags.GPSLongitude.description;
          lat = typeof latVal === 'number' ? latVal : parseFloat(latVal);
          lng = typeof lngVal === 'number' ? lngVal : parseFloat(lngVal);
          if (tags.GPSLatitudeRef && (tags.GPSLatitudeRef.value[0] === 'S' || tags.GPSLatitudeRef.value === 'South')) lat = -Math.abs(lat);
          if (tags.GPSLongitudeRef && (tags.GPSLongitudeRef.value[0] === 'W' || tags.GPSLongitudeRef.value === 'West')) lng = -Math.abs(lng);
          if (tags.GPSAltitude) altitude = `${tags.GPSAltitude.description}m MSL`;
          hasExifGps = true;
        }
      } catch (err) {}

      if (lat == null || isNaN(lat) || lng == null || isNaN(lng)) {
        lat = activeCursorPos ? activeCursorPos.lat : 51.0447;
        lng = activeCursorPos ? activeCursorPos.lng : -114.0719;
      }

      const imageUrl = URL.createObjectURL(file);
      const newPhoto = {
        id: Date.now() + i,
        title: file.name.replace(/\.[^/.]+$/, ""),
        filename: file.name,
        url: imageUrl,
        lat, lng,
        date: new Date(file.lastModified).toLocaleString(),
        altitude,
        heading: '0° N',
        camera: hasExifGps ? 'EXIF Embedded GPS' : 'Tagged to Map Cursor (No EXIF)'
      };

      if (onUploadPhoto) { onUploadPhoto(newPhoto); addedCount++; }
      if (i === 0) onFlyTo(lat, lng);
    }

    setIsProcessingExif(false);
    setUploadStatusMsg(`Added ${addedCount} photo(s)!`);
    setTimeout(() => setUploadStatusMsg(''), 3500);
  };

  const handleDrop = (e) => { e.preventDefault(); setIsDragOver(false); if (e.dataTransfer.files?.length > 0) processFilesForExif(e.dataTransfer.files); };
  const handleDragOver = (e) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragOver(false); };
  const handleFileSelect = (e) => { if (e.target.files?.length > 0) processFilesForExif(e.target.files); };

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchError('');
    setIsSearching(true);
    const parsed = parseLocationInput(searchQuery);
    if (parsed && (parsed.type === 'dd' || parsed.type === 'mgrs' || parsed.type === 'dls')) {
      onFlyTo(parsed.lat, parsed.lng);
      setIsSearching(false);
      return;
    }
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        onFlyTo(parseFloat(data[0].lat), parseFloat(data[0].lon));
      } else {
        setSearchError('Location not found. Try Lat/Lng or MGRS format.');
      }
    } catch (err) {
      setSearchError('Error looking up location. Check network connection.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleConverterChange = (val) => {
    setConverterInput(val);
    const parsed = parseLocationInput(val);
    if (parsed && (parsed.type === 'dd' || parsed.type === 'mgrs')) {
      setConverterCoords(formatAllCoordinates(parsed.lat, parsed.lng));
    }
  };

  const sampleLocations = [
    { name: 'Calgary (16-15-024-01W5)', lat: 51.0447, lng: -114.0719 },
    { name: 'Edmonton (04-12-053-24W4)', lat: 53.5461, lng: -113.4938 },
    { name: 'San Francisco', lat: 37.7749, lng: -122.4194 },
    { name: 'London', lat: 51.5074, lng: -0.1278 },
    { name: 'Tokyo', lat: 35.6762, lng: 139.6503 }
  ];

  const handleCreateWaypointSubmit = (e) => {
    e.preventDefault();
    if (!activeCursorPos) return;
    onAddWaypoint({
      id: Date.now(),
      title: newWpTitle || 'Custom Waypoint',
      notes: newWpNotes,
      color: newWpColor,
      lat: activeCursorPos.lat,
      lng: activeCursorPos.lng,
      category: 'User Point'
    });
    setNewWpTitle('');
    setNewWpNotes('');
  };

  const handleExportGeoJSON = () => {
    const geojson = {
      type: 'FeatureCollection',
      features: waypoints.map((wp) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [wp.lng, wp.lat] },
        properties: { title: wp.title, notes: wp.notes, category: wp.category }
      }))
    };
    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sarggeo_waypoints.geojson';
    a.click();
  };

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Toggle: clicking active tab collapses panel
  const handleTabClick = (tab) => {
    if (activeTab === tab && !isCollapsed) {
      setIsCollapsed(true);
    } else {
      setActiveTab(tab);
      setIsCollapsed(false);
    }
  };

  const navItems = [
    { id: 'search',    icon: <Search className="w-5 h-5" />,    label: 'Search'    },
    { id: 'converter', icon: <RefreshCw className="w-5 h-5" />, label: 'Converter' },
    { id: 'layers',    icon: <Layers className="w-5 h-5" />,    label: 'Layers'    },
    { id: 'saved',     icon: <Bookmark className="w-5 h-5" />,  label: 'Waypoints' },
    { id: 'photos',    icon: <Camera className="w-5 h-5" />,    label: 'Media'     },
    { id: 'tools',     icon: <Ruler className="w-5 h-5" />,     label: 'Tools'     },
  ];

  return (
    <div className="sarggeo-shell">
      {/* ICON DOCK */}
      <aside className="sarggeo-icon-dock">
        {/* Logo at top */}
        <div className="dock-logo flex items-center justify-center py-2">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-600 shadow-2xs">
            <Globe className="w-5 h-5" />
          </div>
        </div>

        {/* Nav icon buttons */}
        <nav className="dock-nav">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`dock-icon-btn ${activeTab === item.id && !isCollapsed ? 'active' : ''}`}
              onClick={() => handleTabClick(item.id)}
              title={item.label}
            >
              {item.icon}
              <span className="dock-icon-label">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="dock-bottom">
          <button
            className="dock-icon-btn"
            onClick={onOpenProjectsModal}
            title="Cloud Projects"
          >
            <Folder className="w-5 h-5" />
            <span className="dock-icon-label">Projects</span>
          </button>
          <button
            className="dock-icon-btn"
            onClick={onOpenJsonImportModal}
            title="Import JSON"
          >
            <Upload className="w-5 h-5" />
            <span className="dock-icon-label">Import</span>
          </button>
          <button
            className="dock-icon-btn"
            onClick={onOpenApiKeyModal}
            title="API Keys"
          >
            <Key className="w-5 h-5" />
            <span className="dock-icon-label">API</span>
          </button>
          <button
            className={`dock-icon-btn dock-user-btn ${user ? 'signed-in' : ''}`}
            onClick={user ? onOpenUserSettingsModal : onOpenAuthModal}
            title={user ? `${user.email} — Settings` : 'Sign In'}
          >
            <User className="w-5 h-5" />
            <span className="dock-icon-label">{user ? (user.firstName || 'Me') : 'Login'}</span>
          </button>
        </div>
      </aside>

      {/* CONTENT PANEL */}
      {!isCollapsed && (
        <aside className="sarggeo-content-panel">
          {/* Panel header */}
          <div className="content-panel-header">
            <div>
              <div className="content-panel-title">
                {navItems.find(n => n.id === activeTab)?.label || 'Panel'}
              </div>
              {subscriptionTier === 'pro' ? (
                <span className="badge-pro" style={{ fontSize: '0.6rem', padding: '2px 6px' }}>
                  <Crown className="w-3 h-3" style={{ display: 'inline', marginRight: 3 }} />
                  PRO UNLIMITED
                </span>
              ) : (
                <span style={{ fontSize: '0.65rem', color: '#f59e0b', fontWeight: 600 }}>
                  FREE · {conversionsUsed}/3 used
                </span>
              )}
            </div>
            <button
              className="content-panel-close"
              onClick={() => setIsCollapsed(true)}
              title="Close Panel"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Panel content area */}
          <div className="sidebar-content-area">

            {/* TAB: SEARCH */}
            {activeTab === 'search' && (
              <div className="tab-pane">
                <h3 className="pane-title">Search & Universal Locator</h3>
                <p className="pane-desc">Search by Address, Decimal Degrees, MGRS, DLS, or UTM coordinates.</p>

                <form onSubmit={handleSearchSubmit} className="search-form-box">
                  <div className="search-input-wrapper">
                    <Search className="search-icon" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="e.g. 37.7749, -122.4194 or 10SEG50008000"
                      className="search-input"
                    />
                  </div>
                  <button type="submit" className="pane-btn primary full" disabled={isSearching}>
                    {isSearching ? 'Searching...' : 'Locate Position'}
                  </button>
                </form>

                {searchError && <div className="error-alert">{searchError}</div>}

                <div className="quick-samples-section">
                  <span className="section-label">Quick Jump Preset Locations:</span>
                  <div className="quick-chip-grid">
                    {sampleLocations.map((loc) => (
                      <button key={loc.name} className="quick-chip" onClick={() => onFlyTo(loc.lat, loc.lng)}>
                        <MapPin className="w-3.5 h-3.5 mr-1" style={{ color: 'var(--accent-cyan)' }} />
                        {loc.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: CONVERTER */}
            {activeTab === 'converter' && (
              <div className="tab-pane">
                <h3 className="pane-title">Multi-Grid Coordinate Converter</h3>
                <p className="pane-desc">Real-time translation across standard spatial reference formats.</p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                  <button className="pane-btn secondary small" style={{ fontSize: '0.75rem' }} onClick={onOpenConverterModal}>
                    <Layers className="w-3.5 h-3.5 mr-1" style={{ color: '#f59e0b' }} /> Popup Converter
                  </button>
                  <button className="pane-btn secondary small" style={{ fontSize: '0.75rem' }} onClick={onOpenBatchModal}
                    style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#0f172a', fontWeight: 700, fontSize: '0.75rem', padding: '6px 10px', borderRadius: 8, border: 'none', cursor: 'pointer' }}>
                    Batch Convert
                  </button>
                </div>

                <div className="converter-input-box">
                  <label className="field-label">INPUT LOCATION / COORDINATE</label>
                  <input
                    type="text"
                    value={converterInput}
                    onChange={(e) => handleConverterChange(e.target.value)}
                    className="search-input"
                    placeholder="Enter DD / MGRS / UTM"
                  />
                </div>

                <div className="converted-results-list">
                  {[
                    { key: 'conv_dls', label: 'Legal Subdivision (DLS / ATS)', value: converterCoords.dls.formatted, accent: true },
                    { key: 'conv_nts', label: 'NTS BC Grid Reference', value: converterCoords.nts.formatted },
                    { key: 'conv_dd',  label: 'Decimal Degrees (DD)',          value: converterCoords.dd.formatted  },
                    { key: 'conv_dms', label: 'Degrees Minutes Seconds (DMS)', value: converterCoords.dms.formatted },
                    { key: 'conv_utm', label: 'UTM Grid',                      value: converterCoords.utm.formatted },
                    { key: 'conv_mgrs',label: 'MGRS Code',                     value: converterCoords.mgrs         },
                    { key: 'conv_hash',label: 'Geohash',                       value: converterCoords.geohash      },
                  ].map(row => (
                    <div key={row.key} className={`result-card ${row.accent ? 'highlight-dls' : ''}`}>
                      <div className="result-header">
                        <span className="result-title" style={row.accent ? { color: '#d97706' } : {}}>{row.label}</span>
                        <button className="copy-btn" onClick={() => handleCopy(row.value, row.key)}>
                          {copiedKey === row.key ? <Check className="w-3.5 h-3.5" style={{ color: '#16795a' }} /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <div className="result-val mono" style={row.accent ? { color: '#d97706' } : {}}>{row.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: LAYERS */}
            {activeTab === 'layers' && (
              <div className="tab-pane">
                <h3 className="pane-title">Map Basemaps & Grid Overlays</h3>
                <p className="pane-desc">Select high-definition map layer styles and grid overlays.</p>

                <div className="basemap-grid">
                  {[
                    { id: 'dark', label: 'Carto Dark Canvas', cls: 'dark-theme' },
                    { id: 'satellite', label: 'Esri Satellite', cls: 'satellite-theme' },
                    { id: 'street', label: 'OpenStreetMap', cls: 'street-theme' },
                    { id: 'topo', label: 'OpenTopoMap', cls: 'topo-theme' },
                  ].map(bm => (
                    <div key={bm.id} className={`basemap-card ${basemap === bm.id ? 'selected' : ''}`} onClick={() => setBasemap(bm.id)}>
                      <div className={`basemap-preview ${bm.cls}`}></div>
                      <span className="basemap-name">{bm.label}</span>
                    </div>
                  ))}
                </div>

                <div className="grid-toggle-box" style={{ marginTop: 24 }}>
                  <span className="field-label">GRID OVERLAYS</span>
                  <label className="toggle-switch-row">
                    <span>Lat/Long & UTM Grid Lines</span>
                    <input type="checkbox" checked={showGridLines} onChange={(e) => setShowGridLines(e.target.checked)} />
                  </label>
                </div>
              </div>
            )}

            {/* TAB: TOOLS */}
            {activeTab === 'tools' && (
              <div className="tab-pane">
                <h3 className="pane-title">Spatial Measurement & Pinning</h3>
                <p className="pane-desc">Measure distances between points or drop custom map waypoints.</p>

                <div className="tools-card" style={{ marginBottom: 16 }}>
                  <h4 className="tools-card-title">Mouse Selection & Point Drop</h4>
                  <p className="field-subtext" style={{ marginBottom: 8 }}>Clicking anywhere on the map places an inspection pin with DLS/LSD & coordinate info.</p>
                  <label className="toggle-switch-row">
                    <span>Direct Click Mode: Instant Add Point</span>
                    <input type="checkbox" checked={autoAddOnClick} onChange={(e) => setAutoAddOnClick(e.target.checked)} />
                  </label>
                </div>

                <div className="tools-card">
                  <h4 className="tools-card-title">Distance Measurement</h4>
                  <div className="tool-btn-row">
                    <button className="pane-btn secondary" onClick={onStartMeasure}><Ruler className="w-4 h-4" style={{ marginRight: 6 }} /> Measure Line</button>
                    <button className="pane-btn danger" onClick={onClearMeasure}>Clear Path</button>
                  </div>
                  {measurePoints?.length > 0 && <div className="measure-result-badge">Points: {measurePoints.length}</div>}
                </div>

                <form onSubmit={handleCreateWaypointSubmit} className="tools-card" style={{ marginTop: 16 }}>
                  <h4 className="tools-card-title">Drop New Waypoint</h4>
                  <p className="field-subtext">Drops marker at current cursor position on map.</p>
                  <div className="form-group">
                    <label className="field-label">POINT TITLE</label>
                    <input type="text" value={newWpTitle} onChange={(e) => setNewWpTitle(e.target.value)} placeholder="e.g. Survey Station Alpha" className="search-input" />
                  </div>
                  <div className="form-group">
                    <label className="field-label">NOTES / DESCRIPTION</label>
                    <textarea value={newWpNotes} onChange={(e) => setNewWpNotes(e.target.value)} placeholder="Add observations..." className="search-textarea" />
                  </div>
                  <div className="form-group">
                    <label className="field-label">PIN COLOR ACCENT</label>
                    <div className="color-picker-row">
                      {['#1d6fa4', '#16795a', '#6d28d9', '#d97706', '#dc2626'].map((col) => (
                        <div key={col} className={`color-dot ${newWpColor === col ? 'active' : ''}`} style={{ backgroundColor: col }} onClick={() => setNewWpColor(col)} />
                      ))}
                    </div>
                  </div>
                  <button type="submit" className="pane-btn primary full" style={{ marginTop: 8 }}><Plus className="w-4 h-4" style={{ marginRight: 6 }} /> Save Waypoint</button>
                </form>
              </div>
            )}

            {/* TAB: MEDIA */}
            {activeTab === 'photos' && (
              <div className="tab-pane">
                <h3 className="pane-title">Geotagged Photo Gallery</h3>
                <p className="pane-desc">Inspect photos geotagged with spatial EXIF coordinates.</p>

                <input type="file" ref={fileInputRef} accept="image/*" multiple onChange={handleFileSelect} style={{ display: 'none' }} />

                <div
                  className={`upload-box ${isDragOver ? 'drag-over' : ''}`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <Upload className="w-8 h-8" style={{ color: 'var(--accent-cyan)', marginBottom: 8 }} />
                  <span className="upload-title">Drop Geotagged Photos</span>
                  <span className="upload-desc">Supports EXIF Lat/Lng auto-extraction (or click to select)</span>
                  {isProcessingExif && <div className="upload-status" style={{ color: 'var(--accent-cyan)' }}>Extracting EXIF metadata...</div>}
                  {uploadStatusMsg && !isProcessingExif && <div className="upload-status" style={{ color: 'var(--accent-emerald)' }}>{uploadStatusMsg}</div>}
                </div>

                <div className="photo-list-grid" style={{ marginTop: 16 }}>
                  {photos.length === 0 ? (
                    <div className="empty-state">
                      <Camera className="w-8 h-8" style={{ color: '#8596ab', marginBottom: 8 }} />
                      <span>No geotagged photos added yet. Drop or select image files above.</span>
                    </div>
                  ) : (
                    photos.map((ph) => (
                      <div key={ph.id} className="photo-card" onClick={() => onSelectPhoto(ph)}>
                        <img src={ph.url} alt={ph.title} className="photo-card-img" />
                        <div className="photo-card-info">
                          <span className="photo-card-title">{ph.title}</span>
                          <span className="photo-card-coords mono">{ph.lat.toFixed(4)}, {ph.lng.toFixed(4)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB: SAVED WAYPOINTS */}
            {activeTab === 'saved' && (
              <div className="tab-pane">
                <div className="pane-header-row">
                  <h3 className="pane-title">Saved Waypoints ({waypoints.length})</h3>
                  <button className="pane-btn secondary small" onClick={handleExportGeoJSON} title="Export GeoJSON File">
                    <Download className="w-3.5 h-3.5" style={{ marginRight: 4 }} /> Export
                  </button>
                </div>

                <div className="waypoints-list" style={{ marginTop: 16 }}>
                  {waypoints.length === 0 ? (
                    <div className="empty-state">
                      <Bookmark className="w-8 h-8" style={{ color: '#8596ab', marginBottom: 8 }} />
                      <span>No saved waypoints yet. Use the Spatial Tools or click on the map to add one.</span>
                    </div>
                  ) : (
                    waypoints.map((wp) => (
                      <div key={wp.id} className="waypoint-item-card">
                        <div className="wp-color-indicator" style={{ backgroundColor: wp.color || '#1d6fa4' }} />
                        <div className="wp-info" onClick={() => onFlyTo(wp.lat, wp.lng)}>
                          <span className="wp-title">{wp.title}</span>
                          <span className="wp-coords mono">{wp.lat.toFixed(5)}, {wp.lng.toFixed(5)}</span>
                        </div>
                        <button className="wp-delete-btn" onClick={() => onDeleteWaypoint(wp.id)} title="Delete Waypoint">
                          <Trash2 className="w-4 h-4" style={{ color: '#8596ab' }} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

          </div>
        </aside>
      )}
    </div>
  );
}
