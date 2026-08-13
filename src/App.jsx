import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import MapView from './components/MapView';
import CoordinateHUD from './components/CoordinateHUD';
import PhotoModal from './components/PhotoModal';
import BatchConverterModal from './components/BatchConverterModal';
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

  // Batch Converter modal state
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

  // Tools & Measure state
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [measurePoints, setMeasurePoints] = useState([]);
  const [autoAddOnClick, setAutoAddOnClick] = useState(false);

  // Waypoints state
  const [waypoints, setWaypoints] = useState([]);

  // Geotagged Media state
  const [photos, setPhotos] = useState([]);

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

  const handleAddWaypointsBatch = (newWaypoints) => {
    setWaypoints((prev) => [...newWaypoints, ...prev]);
    setActiveTab('saved');
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

  const handleUploadPhoto = (newPhoto) => {
    setPhotos((prev) => [newPhoto, ...prev]);
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
        onUploadPhoto={handleUploadPhoto}
        onSelectPhoto={(ph) => setSelectedPhoto(ph)}
        onFlyTo={handleFlyTo}
        measurePoints={measurePoints}
        onStartMeasure={handleStartMeasure}
        onClearMeasure={handleClearMeasure}
        activeCursorPos={activeCursorPos}
        autoAddOnClick={autoAddOnClick}
        setAutoAddOnClick={setAutoAddOnClick}
        onOpenBatchModal={() => setIsBatchModalOpen(true)}
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

      {/* Coordinate King — Batch Converter Modal */}
      <BatchConverterModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        onAddWaypointsBatch={handleAddWaypointsBatch}
        onFlyTo={handleFlyTo}
      />
    </div>
  );
}
