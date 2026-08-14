import React, { useState, useRef, useEffect } from 'react';
import ExifReader from 'exifreader';
import {
  Search,
  RefreshCw,
  Layers,
  Ruler,
  Camera,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Plus,
  Trash2,
  Download,
  MapPin,
  Compass,
  Globe,
  Upload,
  Info,
  Folder,
  Crown,
  User,
  LogOut,
  Key
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
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchError, setSearchError] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Converter state - dynamically synced to active map location
  const initialLat = activeCursorPos ? activeCursorPos.lat : 51.0447;
  const initialLng = activeCursorPos ? activeCursorPos.lng : -114.0719;
  const [converterInput, setConverterInput] = useState(`${initialLat.toFixed(6)}, ${initialLng.toFixed(6)}`);
  const [converterCoords, setConverterCoords] = useState(formatAllCoordinates(initialLat, initialLng));
  const [copiedKey, setCopiedKey] = useState(null);

  // Sync converter tab when active map location changes
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

  // Waypoint form state
  const [newWpTitle, setNewWpTitle] = useState('');
  const [newWpNotes, setNewWpNotes] = useState('');
  const [newWpColor, setNewWpColor] = useState('#38bdf8');

  // Media / Photo EXIF Upload state & refs
  const fileInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessingExif, setIsProcessingExif] = useState(false);
  const [uploadStatusMsg, setUploadStatusMsg] = useState('');

  // Process files for EXIF GPS metadata
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
        console.log('EXIF tags extracted for', file.name, tags);

        if (tags && tags.GPSLatitude && tags.GPSLongitude) {
          const latVal = tags.GPSLatitude.description;
          const lngVal = tags.GPSLongitude.description;

          lat = typeof latVal === 'number' ? latVal : parseFloat(latVal);
          lng = typeof lngVal === 'number' ? lngVal : parseFloat(lngVal);

          if (tags.GPSLatitudeRef && (tags.GPSLatitudeRef.value[0] === 'S' || tags.GPSLatitudeRef.value === 'South')) {
            lat = -Math.abs(lat);
          }
          if (tags.GPSLongitudeRef && (tags.GPSLongitudeRef.value[0] === 'W' || tags.GPSLongitudeRef.value === 'West')) {
            lng = -Math.abs(lng);
          }

          if (tags.GPSAltitude) {
            altitude = `${tags.GPSAltitude.description}m MSL`;
          }

          hasExifGps = true;
        }
      } catch (err) {
        console.warn('EXIF read error for file', file.name, err);
      }

      // If no GPS tags present in file header, tag to active cursor/map position
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
        lat,
        lng,
        date: new Date(file.lastModified).toLocaleString(),
        altitude,
        heading: '0° N',
        camera: hasExifGps ? 'EXIF Embedded GPS' : 'Tagged to Map Cursor (No EXIF)'
      };

      if (onUploadPhoto) {
        onUploadPhoto(newPhoto);
        addedCount++;
      }

      if (i === 0) {
        onFlyTo(lat, lng);
      }
    }

    setIsProcessingExif(false);
    setUploadStatusMsg(`Added ${addedCount} photo(s)!`);
    setTimeout(() => setUploadStatusMsg(''), 3500);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFilesForExif(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFilesForExif(e.target.files);
    }
  };

  // Handle Search Submission
  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearchError('');
    setIsSearching(true);

    const parsed = parseLocationInput(searchQuery);

    if (parsed) {
      if (parsed.type === 'dd' || parsed.type === 'mgrs' || parsed.type === 'dls') {
        onFlyTo(parsed.lat, parsed.lng);
        setIsSearching(false);
        return;
      }
    }

    // Fallback: Geocode via OpenStreetMap Nominatim
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
      );
      const data = await res.json();

      if (data && data.length > 0) {
        const first = data[0];
        onFlyTo(parseFloat(first.lat), parseFloat(first.lon));
      } else {
        setSearchError('Location not found. Try Lat/Lng or MGRS format.');
      }
    } catch (err) {
      setSearchError('Error looking up location. Check network connection.');
    } finally {
      setIsSearching(false);
    }
  };

  // Handle Converter Input Change
  const handleConverterChange = (val) => {
    setConverterInput(val);
    const parsed = parseLocationInput(val);
    if (parsed && (parsed.type === 'dd' || parsed.type === 'mgrs')) {
      setConverterCoords(formatAllCoordinates(parsed.lat, parsed.lng));
    }
  };

  // Sample quick locations
  const sampleLocations = [
    { name: 'Calgary (16-15-024-01W5)', lat: 51.0447, lng: -114.0719 },
    { name: 'Edmonton (04-12-053-24W4)', lat: 53.5461, lng: -113.4938 },
    { name: 'San Francisco', lat: 37.7749, lng: -122.4194 },
    { name: 'London', lat: 51.5074, lng: -0.1278 },
    { name: 'Tokyo', lat: 35.6762, lng: 139.6503 }
  ];

  // Handle Waypoint Creation
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

  // Export Waypoints to GeoJSON
  const handleExportGeoJSON = () => {
    const geojson = {
      type: 'FeatureCollection',
      features: waypoints.map((wp) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [wp.lng, wp.lat]
        },
        properties: {
          title: wp.title,
          notes: wp.notes,
          category: wp.category
        }
      }))
    };

    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sarggeo_waypoints.geojson';
    a.click();
  };

  // Copy helper
  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <aside className={`sarggeo-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <div className="sidebar-brand-box">
          <SargGeoLogo size={isCollapsed ? 'small' : 'medium'} />
          {!isCollapsed && (
            <div className="sidebar-tagline">
              <span>SPATIAL & GRID ATLAS</span>
              {subscriptionTier === 'pro' ? (
                <span className="badge-pro flex items-center gap-1">
                  <Crown className="w-3 h-3 text-slate-900" /> PRO UNLIMITED
                </span>
              ) : (
                <span className="live-status-pill text-amber-400 border-amber-500/40">
                  FREE ({conversionsUsed}/3)
                </span>
              )}
            </div>
          )}
        </div>

        <button
          className="sidebar-collapse-toggle"
          onClick={() => setIsCollapsed(!isCollapsed)}
        title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* User Auth, Settings, JSON Import & Projects Quick Bar */}
      {!isCollapsed && (
        <div className="p-2 bg-slate-900/90 border-b border-slate-800 grid grid-cols-4 gap-1">
          <button
            className="pane-btn secondary small text-[11px] flex items-center justify-center gap-1 py-1.5 px-1 font-bold"
            onClick={user ? onOpenUserSettingsModal : onOpenAuthModal}
            title="User Profile & Settings"
          >
            <User className="w-3.5 h-3.5 text-cyan-400" />
            <span className="truncate">{user ? (user.firstName || user.email.split('@')[0]) : 'Sign In'}</span>
          </button>

          <button
            className="pane-btn secondary small text-[11px] flex items-center justify-center gap-1 py-1.5 px-1 font-bold"
            onClick={onOpenJsonImportModal}
            title="Import JSON / GeoJSON Data"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>JSON</span>
          </button>

          <button
            className="pane-btn secondary small text-[11px] flex items-center justify-center gap-1 py-1.5 px-1 font-bold"
            onClick={onOpenProjectsModal}
            title="Manage Hosted Projects"
          >
            <Folder className="w-3.5 h-3.5 text-amber-400" />
            <span>Projects</span>
          </button>

          <button
            className="pane-btn secondary small text-[11px] flex items-center justify-center gap-1 py-1.5 px-1 font-bold"
            onClick={onOpenApiKeyModal}
            title="Developer API Keys"
          >
            <Key className="w-3.5 h-3.5 text-emerald-400" />
            <span>API Keys</span>
          </button>
        </div>
      )}

      {/* Navigation Tabs Bar */}
      <nav className="sidebar-nav-tabs">
        <button
          className={`nav-tab-btn ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
          title="Search & Navigate"
        >
          <Search className="w-5 h-5" />
          {!isCollapsed && <span>Search</span>}
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'converter' ? 'active' : ''}`}
          onClick={() => setActiveTab('converter')}
          title="Coordinate Converter"
        >
          <RefreshCw className="w-5 h-5" />
          {!isCollapsed && <span>Converter</span>}
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'layers' ? 'active' : ''}`}
          onClick={() => setActiveTab('layers')}
          title="Basemaps & Grids"
        >
          <Layers className="w-5 h-5" />
          {!isCollapsed && <span>Layers</span>}
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'tools' ? 'active' : ''}`}
          onClick={() => setActiveTab('tools')}
          title="Spatial Tools"
        >
          <Ruler className="w-5 h-5" />
          {!isCollapsed && <span>Tools</span>}
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'photos' ? 'active' : ''}`}
          onClick={() => setActiveTab('photos')}
          title="Geotagged Media"
        >
          <Camera className="w-5 h-5" />
          {!isCollapsed && <span>Media</span>}
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'saved' ? 'active' : ''}`}
          onClick={() => setActiveTab('saved')}
          title="Saved Waypoints"
        >
          <Bookmark className="w-5 h-5" />
          {!isCollapsed && <span>Saved</span>}
        </button>
      </nav>

      {/* Tab Panel Contents (Only when expanded) */}
      {!isCollapsed && (
        <div className="sidebar-content-area">
          {/* TAB 1: SEARCH & NAVIGATE */}
          {activeTab === 'search' && (
            <div className="tab-pane">
              <h3 className="pane-title">Search & Universal Locator</h3>
              <p className="pane-desc">
                Search by Address, Decimal Degrees, MGRS, or UTM coordinates.
              </p>

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
                    <button
                      key={loc.name}
                      className="quick-chip"
                      onClick={() => onFlyTo(loc.lat, loc.lng)}
                    >
                      <MapPin className="w-3.5 h-3.5 mr-1 text-cyan-400" />
                      {loc.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}



          {/* TAB 2: COORDINATE CONVERTER */}
          {activeTab === 'converter' && (
            <div className="tab-pane">
              <h3 className="pane-title">Multi-Grid Coordinate Converter</h3>
              <p className="pane-desc">
                Real-time translation across standard spatial reference formats.
              </p>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  className="pane-btn secondary small text-xs flex items-center justify-center gap-1.5 py-2 font-bold"
                  onClick={onOpenConverterModal}
                >
                  <Layers className="w-3.5 h-3.5 text-amber-400" /> Center Popup Converter
                </button>
                <button
                  className="pane-btn secondary small text-xs flex items-center justify-center gap-1.5 py-2 font-bold"
                  onClick={onOpenJsonImportModal}
                >
                  <Upload className="w-3.5 h-3.5 text-cyan-400" /> Import JSON
                </button>
              </div>

              <button
                className="pane-btn primary full mb-4"
                onClick={onOpenBatchModal}
                style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#0f172a', fontWeight: 700 }}
              >
                <Layers className="w-4 h-4 mr-1.5" /> Coordinate King (Batch Converter)
              </button>

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
                {/* DLS / ATS (Alberta Township System / LSD) Result */}
                <div className="result-card highlight-dls">
                  <div className="result-header">
                    <span className="result-title text-amber-400">Legal Subdivision (DLS / ATS)</span>
                    <button
                      className="copy-btn"
                      onClick={() => handleCopy(converterCoords.dls.formatted, 'conv_dls')}
                    >
                      {copiedKey === 'conv_dls' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="result-val mono text-amber-300">{converterCoords.dls.formatted}</div>
                  {converterCoords.dls.isValid && (
                    <span className="field-subtext mt-1 text-slate-400">Format: {converterCoords.dls.shortFormatted}</span>
                  )}
                </div>

                {/* NTS BC Grid Result */}
                <div className="result-card">
                  <div className="result-header">
                    <span className="result-title">NTS BC Grid Reference</span>
                    <button
                      className="copy-btn"
                      onClick={() => handleCopy(converterCoords.nts.formatted, 'conv_nts')}
                    >
                      {copiedKey === 'conv_nts' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="result-val mono">{converterCoords.nts.formatted}</div>
                </div>

                {/* DD Result */}
                <div className="result-card">
                  <div className="result-header">
                    <span className="result-title">Decimal Degrees (DD)</span>
                    <button
                      className="copy-btn"
                      onClick={() => handleCopy(converterCoords.dd.formatted, 'conv_dd')}
                    >
                      {copiedKey === 'conv_dd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="result-val mono">{converterCoords.dd.formatted}</div>
                </div>

                {/* DMS Result */}
                <div className="result-card">
                  <div className="result-header">
                    <span className="result-title">Degrees Minutes Seconds (DMS)</span>
                    <button
                      className="copy-btn"
                      onClick={() => handleCopy(converterCoords.dms.formatted, 'conv_dms')}
                    >
                      {copiedKey === 'conv_dms' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="result-val mono">{converterCoords.dms.formatted}</div>
                </div>

                {/* UTM Result */}
                <div className="result-card">
                  <div className="result-header">
                    <span className="result-title">Universal Transverse Mercator (UTM)</span>
                    <button
                      className="copy-btn"
                      onClick={() => handleCopy(converterCoords.utm.formatted, 'conv_utm')}
                    >
                      {copiedKey === 'conv_utm' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="result-val mono">{converterCoords.utm.formatted}</div>
                </div>

                {/* MGRS Result */}
                <div className="result-card">
                  <div className="result-header">
                    <span className="result-title">Military Grid Reference System (MGRS)</span>
                    <button
                      className="copy-btn"
                      onClick={() => handleCopy(converterCoords.mgrs, 'conv_mgrs')}
                    >
                      {copiedKey === 'conv_mgrs' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="result-val mono">{converterCoords.mgrs}</div>
                </div>

                {/* Geohash Result */}
                <div className="result-card">
                  <div className="result-header">
                    <span className="result-title">Geohash Code</span>
                    <button
                      className="copy-btn"
                      onClick={() => handleCopy(converterCoords.geohash, 'conv_hash')}
                    >
                      {copiedKey === 'conv_hash' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="result-val mono">{converterCoords.geohash}</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LAYERS & GRID OVERLAYS */}
          {activeTab === 'layers' && (
            <div className="tab-pane">
              <h3 className="pane-title">Map Basemaps & Grid Overlays</h3>
              <p className="pane-desc">Select high-definition map layer styles and grid overlays.</p>

              <div className="basemap-grid">
                <div
                  className={`basemap-card ${basemap === 'dark' ? 'selected' : ''}`}
                  onClick={() => setBasemap('dark')}
                >
                  <div className="basemap-preview dark-theme"></div>
                  <span className="basemap-name">Carto Dark Canvas</span>
                </div>

                <div
                  className={`basemap-card ${basemap === 'satellite' ? 'selected' : ''}`}
                  onClick={() => setBasemap('satellite')}
                >
                  <div className="basemap-preview satellite-theme"></div>
                  <span className="basemap-name">Esri Satellite</span>
                </div>

                <div
                  className={`basemap-card ${basemap === 'street' ? 'selected' : ''}`}
                  onClick={() => setBasemap('street')}
                >
                  <div className="basemap-preview street-theme"></div>
                  <span className="basemap-name">OpenStreetMap</span>
                </div>

                <div
                  className={`basemap-card ${basemap === 'topo' ? 'selected' : ''}`}
                  onClick={() => setBasemap('topo')}
                >
                  <div className="basemap-preview topo-theme"></div>
                  <span className="basemap-name">OpenTopoMap</span>
                </div>
              </div>

              <div className="grid-toggle-box mt-6">
                <span className="field-label">GRID OVERLAYS</span>
                <label className="toggle-switch-row">
                  <span>Lat/Long & UTM Grid Lines</span>
                  <input
                    type="checkbox"
                    checked={showGridLines}
                    onChange={(e) => setShowGridLines(e.target.checked)}
                  />
                </label>
              </div>
            </div>
          )}

          {/* TAB 4: SPATIAL TOOLS & MEASUREMENT */}
          {activeTab === 'tools' && (
            <div className="tab-pane">
              <h3 className="pane-title">Spatial Measurement & Pinning</h3>
              <p className="pane-desc">Measure distances between points or drop custom map waypoints.</p>

              <div className="tools-card mb-4">
                <h4 className="tools-card-title">Mouse Selection & Point Drop</h4>
                <p className="field-subtext mb-2">Clicking anywhere on the map places an inspection pin with DLS/LSD & coordinate info.</p>

                <label className="toggle-switch-row">
                  <span>Direct Click Mode: Instant Add Point</span>
                  <input
                    type="checkbox"
                    checked={autoAddOnClick}
                    onChange={(e) => setAutoAddOnClick(e.target.checked)}
                  />
                </label>
              </div>

              <div className="tools-card">
                <h4 className="tools-card-title">Distance Measurement</h4>
                <div className="tool-btn-row">
                  <button
                    className="pane-btn secondary"
                    onClick={onStartMeasure}
                  >
                    <Ruler className="w-4 h-4 mr-1.5" /> Measure Line
                  </button>
                  <button
                    className="pane-btn danger"
                    onClick={onClearMeasure}
                  >
                    Clear Path
                  </button>
                </div>
                {measurePoints && measurePoints.length > 0 && (
                  <div className="measure-result-badge">
                    Points: {measurePoints.length}
                  </div>
                )}
              </div>

              <form onSubmit={handleCreateWaypointSubmit} className="tools-card mt-4">
                <h4 className="tools-card-title">Drop New Waypoint</h4>
                <p className="field-subtext">Drops marker at current cursor position on map.</p>

                <div className="form-group">
                  <label className="field-label">POINT TITLE</label>
                  <input
                    type="text"
                    value={newWpTitle}
                    onChange={(e) => setNewWpTitle(e.target.value)}
                    placeholder="e.g. Survey Station Alpha"
                    className="search-input"
                  />
                </div>

                <div className="form-group">
                  <label className="field-label">NOTES / DESCRIPTION</label>
                  <textarea
                    value={newWpNotes}
                    onChange={(e) => setNewWpNotes(e.target.value)}
                    placeholder="Add observations..."
                    className="search-textarea"
                  />
                </div>

                <div className="form-group">
                  <label className="field-label">PIN COLOR ACCENT</label>
                  <div className="color-picker-row">
                    {['#38bdf8', '#34d399', '#a855f7', '#f59e0b', '#ef4444'].map((col) => (
                      <div
                        key={col}
                        className={`color-dot ${newWpColor === col ? 'active' : ''}`}
                        style={{ backgroundColor: col }}
                        onClick={() => setNewWpColor(col)}
                      />
                    ))}
                  </div>
                </div>

                <button type="submit" className="pane-btn primary full mt-2">
                  <Plus className="w-4 h-4 mr-1.5" /> Save Waypoint
                </button>
              </form>
            </div>
          )}

          {/* TAB 5: GEOTAGGED MEDIA */}
          {activeTab === 'photos' && (
            <div className="tab-pane">
              <h3 className="pane-title">Geotagged Photo Gallery</h3>
              <p className="pane-desc">Inspect photos geotagged with spatial EXIF coordinates.</p>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />

              <div
                className={`upload-box ${isDragOver ? 'drag-over' : ''}`}
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                title="Click or drag photos here to extract EXIF location tags"
              >
                <Upload className="w-8 h-8 text-cyan-400 mb-2" />
                <span className="upload-title">Drop Geotagged Photos</span>
                <span className="upload-desc">Supports EXIF Lat/Lng auto-extraction (or click to select)</span>
                {isProcessingExif && (
                  <div className="upload-status text-cyan-400 mt-2 text-xs font-semibold">
                    Extracting EXIF metadata...
                  </div>
                )}
                {uploadStatusMsg && !isProcessingExif && (
                  <div className="upload-status text-emerald-400 mt-2 text-xs font-semibold">
                    {uploadStatusMsg}
                  </div>
                )}
              </div>

              <div className="photo-list-grid mt-4">
                {photos.length === 0 ? (
                  <div className="empty-state">
                    <Camera className="w-8 h-8 text-slate-500 mb-2" />
                    <span>No geotagged photos added yet. Drop or select image files above to extract EXIF coordinates and view them on the map.</span>
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

          {/* TAB 6: SAVED WAYPOINTS & EXPORT */}
          {activeTab === 'saved' && (
            <div className="tab-pane">
              <div className="pane-header-row">
                <h3 className="pane-title">Saved Waypoints ({waypoints.length})</h3>
                <button
                  className="pane-btn secondary small"
                  onClick={handleExportGeoJSON}
                  title="Export GeoJSON File"
                >
                  <Download className="w-3.5 h-3.5 mr-1" /> Export
                </button>
              </div>

              <div className="waypoints-list mt-4">
                {waypoints.length === 0 ? (
                  <div className="empty-state">
                    <Bookmark className="w-8 h-8 text-slate-500 mb-2" />
                    <span>No saved waypoints yet. Use the Spatial Tools or click on the map to add one.</span>
                  </div>
                ) : (
                  waypoints.map((wp) => (
                    <div key={wp.id} className="waypoint-item-card">
                      <div className="wp-color-indicator" style={{ backgroundColor: wp.color || '#38bdf8' }} />
                      <div className="wp-info" onClick={() => onFlyTo(wp.lat, wp.lng)}>
                        <span className="wp-title">{wp.title}</span>
                        <span className="wp-coords mono">{wp.lat.toFixed(5)}, {wp.lng.toFixed(5)}</span>
                      </div>
                      <button
                        className="wp-delete-btn"
                        onClick={() => onDeleteWaypoint(wp.id)}
                        title="Delete Waypoint"
                      >
                        <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-400" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
