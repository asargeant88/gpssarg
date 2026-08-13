import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import MapView from './components/MapView';
import CoordinateHUD from './components/CoordinateHUD';
import PhotoModal from './components/PhotoModal';
import { formatAllCoordinates } from './utils/coordinateConverter';

export default function App() {
  // Sidebar states
  const [activeTab, setActiveTab] = useState('search');
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Map states
  const [basemap, setBasemap] = useState('dark');
  const [showGridLines, setShowGridLines] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(12);
  const [activeCursorPos, setActiveCursorPos] = useState({ lat: 51.0447, lng: -114.0719 });
  const [inspectedPoint, setInspectedPoint] = useState({ lat: 51.0447, lng: -114.0719 });
  const [flyTarget, setFlyTarget] = useState(null);

  // Tools & Measure state
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [measurePoints, setMeasurePoints] = useState([]);
  const [autoAddOnClick, setAutoAddOnClick] = useState(false);

  // Waypoints state
  const [waypoints, setWaypoints] = useState([
    {
      id: 1,
      title: 'Calgary Tower Benchmark',
      notes: 'Urban spatial reference node',
      lat: 51.0447,
      lng: -114.0719,
      color: '#38bdf8',
      category: 'Benchmark'
    },
    {
      id: 2,
      title: 'Edmonton Capital Station',
      notes: 'Alberta Provincial Capital Station',
      lat: 53.5461,
      lng: -113.4938,
      color: '#34d399',
      category: 'Survey'
    },
    {
      id: 3,
      title: 'Golden Gate Observation Pt',
      notes: 'High elevation vista over SF Bay',
      lat: 37.8199,
      lng: -122.4783,
      color: '#a855f7',
      category: 'Landmark'
    }
  ]);

  // Geotagged Media state
  const [photos, setPhotos] = useState([
    {
      id: 101,
      title: 'Golden Gate Viewpoint',
      filename: 'IMG_2026_SF_BAY.JPG',
      url: 'https://images.unsplash.com/photo-1506146332389-18140dc7b2fb?q=80&w=800&auto=format&fit=crop',
      lat: 37.8199,
      lng: -122.4783,
      date: '2026-08-12 16:45:10',
      altitude: '65m MSL',
      heading: '210° SW',
      camera: 'SargGeo Spatial Cam'
    },
    {
      id: 102,
      title: 'Downtown Skyline Survey',
      filename: 'IMG_2026_SKYLINE.JPG',
      url: 'https://images.unsplash.com/photo-1477959858617-67f30ac4ce71?q=80&w=800&auto=format&fit=crop',
      lat: 37.7952,
      lng: -122.4028,
      date: '2026-08-11 11:20:30',
      altitude: '180m MSL',
      heading: '095° E',
      camera: 'SargGeo Spatial Cam'
    }
  ]);

  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // Actions
  const handleFlyTo = (lat, lng, zoom = 14) => {
    setFlyTarget({ lat, lng, zoom, timestamp: Date.now() });
    setActiveCursorPos({ lat, lng });
    setInspectedPoint({ lat, lng });
  };

  const handleMapClick = (coords) => {
    setActiveCursorPos(coords);
    setInspectedPoint(coords);

    if (isMeasuring) {
      setMeasurePoints((prev) => [...prev, coords]);
    }

    if (autoAddOnClick) {
      const formatted = formatAllCoordinates(coords.lat, coords.lng);
      const title = formatted.dls.isValid
        ? `Point (${formatted.dls.shortFormatted})`
        : `Point (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`;

      handleAddWaypoint({
        id: Date.now(),
        title,
        notes: `Clicked at ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`,
        lat: coords.lat,
        lng: coords.lng,
        color: '#34d399',
        category: 'Mouse Selection'
      });
    }
  };

  const handleAddWaypoint = (newWp) => {
    setWaypoints((prev) => [newWp, ...prev]);
  };

  const handleDeleteWaypoint = (id) => {
    setWaypoints((prev) => prev.filter((wp) => wp.id !== id));
  };

  const handleStartMeasure = () => {
    setIsMeasuring(true);
    setMeasurePoints([]);
  };

  const handleClearMeasure = () => {
    setIsMeasuring(false);
    setMeasurePoints([]);
  };

  const handlePinCurrentLocation = () => {
    const target = inspectedPoint || activeCursorPos;
    if (!target) return;
    const formatted = formatAllCoordinates(target.lat, target.lng);
    const newWp = {
      id: Date.now(),
      title: formatted.dls.isValid
        ? `Pinned LSD (${formatted.dls.shortFormatted})`
        : `Pinned Point (${target.lat.toFixed(4)}, ${target.lng.toFixed(4)})`,
      notes: `DLS: ${formatted.dls.formatted}`,
      lat: target.lat,
      lng: target.lng,
      color: '#f59e0b',
      category: 'Selected Point'
    };
    handleAddWaypoint(newWp);
    setActiveTab('saved');
  };

  return (
    <div className="sarggeo-app-container">
      {/* Sidebar Control Panel (GridAtlas style) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        basemap={basemap}
        setBasemap={setBasemap}
        showGridLines={showGridLines}
        setShowGridLines={setShowGridLines}
        waypoints={waypoints}
        onAddWaypoint={handleAddWaypoint}
        onDeleteWaypoint={handleDeleteWaypoint}
        photos={photos}
        onSelectPhoto={(ph) => setSelectedPhoto(ph)}
        onFlyTo={handleFlyTo}
        measurePoints={measurePoints}
        onStartMeasure={handleStartMeasure}
        onClearMeasure={handleClearMeasure}
        activeCursorPos={activeCursorPos}
        autoAddOnClick={autoAddOnClick}
        setAutoAddOnClick={setAutoAddOnClick}
      />

      {/* Main Map Workspace */}
      <MapView
        basemap={basemap}
        showGridLines={showGridLines}
        waypoints={waypoints}
        photos={photos}
        flyTarget={flyTarget}
        inspectedPoint={inspectedPoint}
        measurePoints={measurePoints}
        onCursorMove={setActiveCursorPos}
        onMapClick={handleMapClick}
        onZoomChange={setZoomLevel}
        onSaveWaypoint={handleAddWaypoint}
        onSelectPhoto={(ph) => setSelectedPhoto(ph)}
      />

      {/* Real-time Coordinate HUD Ticker */}
      <CoordinateHUD
        cursorPos={inspectedPoint || activeCursorPos}
        zoomLevel={zoomLevel}
        activeBasemap={basemap}
        showGridLines={showGridLines}
        onToggleGridLines={() => setShowGridLines(!showGridLines)}
        onPinCurrentLocation={handlePinCurrentLocation}
      />

      {/* Geotagged Photo Modal */}
      <PhotoModal
        photo={selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        onFlyTo={handleFlyTo}
      />
    </div>
  );
}
