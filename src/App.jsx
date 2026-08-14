import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import MapView from './components/MapView';
import CoordinateHUD from './components/CoordinateHUD';
import PhotoModal from './components/PhotoModal';
import BatchConverterModal from './components/BatchConverterModal';
import AuthModal from './components/AuthModal';
import UpgradeModal from './components/UpgradeModal';
import AccountModal from './components/AccountModal';
import ProjectsModal from './components/ProjectsModal';
import { formatAllCoordinates } from './utils/coordinateConverter';

export default function App() {
  // Sidebar states
  const [activeTab, setActiveTab] = useState('search');
  const [isCollapsed, setIsCollapsed] = useState(false);

  // User Auth & Subscription state
  const [user, setUser] = useState(null);
  const [subscriptionTier, setSubscriptionTier] = useState('free'); // 'free' or 'pro'
  const [conversionsUsed, setConversionsUsed] = useState(0);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isProjectsModalOpen, setIsProjectsModalOpen] = useState(false);

  // Hosted Cloud Projects state
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);

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

  // Check auth & fetch user profile on load
  useEffect(() => {
    const token = localStorage.getItem('sarggeo_token');
    if (token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.authenticated && data.user) {
            setUser(data.user);
            setSubscriptionTier(data.user.subscriptionStatus || 'free');
            setConversionsUsed(data.user.conversionCount || 0);
            fetchProjects(token);
          }
        })
        .catch(() => {});
    }
  }, []);

  // Fetch Hosted Projects from PostgreSQL DB
  const fetchProjects = (authToken) => {
    const token = authToken || localStorage.getItem('sarggeo_token');
    if (!token) return;

    fetch('/api/projects', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.projects) setProjects(data.projects);
      })
      .catch(() => {});
  };

  // Create Project in PostgreSQL DB
  const handleCreateProject = async (name) => {
    const token = localStorage.getItem('sarggeo_token');
    if (!token) {
      setIsAuthModalOpen(true);
      return;
    }

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name })
      });
      const data = await res.json();
      if (data.project) {
        setProjects((prev) => [data.project, ...prev]);
        setActiveProject(data.project);
      }
    } catch (e) {}
  };

  // Delete Project in PostgreSQL DB
  const handleDeleteProject = async (id) => {
    const token = localStorage.getItem('sarggeo_token');
    if (!token) return;

    try {
      await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setProjects((prev) => prev.filter((p) => p.id !== id));
      if (activeProject && activeProject.id === id) setActiveProject(null);
    } catch (e) {}
  };

  // Select Project & load waypoints from DB
  const handleSelectProject = (project) => {
    setActiveProject(project);
    fetch(`/api/projects/${project.id}/waypoints`)
      .then((res) => res.json())
      .then((data) => {
        if (data.waypoints) {
          setWaypoints(
            data.waypoints.map((w) => ({
              id: w.id,
              title: w.title,
              notes: w.notes,
              lat: w.lat,
              lng: w.lng,
              color: w.color || '#38bdf8',
              category: w.category || 'Project Point'
            }))
          );
        }
      })
      .catch(() => {});
  };

  // Track Conversion Usage & Enforce 3 Test Limit
  const checkConversionLimit = async (delta = 1) => {
    if (subscriptionTier === 'pro') return true;

    if (conversionsUsed >= 3) {
      setIsUpgradeModalOpen(true);
      return false;
    }

    const token = localStorage.getItem('sarggeo_token');
    try {
      const res = await fetch('/api/conversion/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ countDelta: delta })
      });

      const data = await res.json();

      if (!res.ok || !data.allowed) {
        setIsUpgradeModalOpen(true);
        return false;
      }

      setConversionsUsed(data.conversionCount || conversionsUsed + delta);
      return true;
    } catch (e) {
      if (conversionsUsed + delta > 3) {
        setIsUpgradeModalOpen(true);
        return false;
      }
      setConversionsUsed((prev) => prev + delta);
      return true;
    }
  };

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

    // If active project is selected, save waypoint directly to PostgreSQL database
    const token = localStorage.getItem('sarggeo_token');
    if (activeProject && token) {
      fetch(`/api/projects/${activeProject.id}/waypoints`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newWp.title,
          notes: newWp.notes,
          lat: newWp.lat,
          lng: newWp.lng,
          color: newWp.color,
          category: newWp.category
        })
      }).catch(() => {});
    }
  };

  const handleAddWaypointsBatch = (newWaypoints) => {
    checkConversionLimit(newWaypoints.length).then((allowed) => {
      if (allowed) {
        setWaypoints((prev) => [...newWaypoints, ...prev]);
        setActiveTab('saved');
      }
    });
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

  const handleAuthSuccess = (userData, token) => {
    setUser(userData);
    setSubscriptionTier(userData.subscriptionStatus || 'free');
    setConversionsUsed(userData.conversionCount || 0);
    fetchProjects(token);
  };

  const handleUpgradeSuccess = (updatedUser) => {
    setUser(updatedUser);
    setSubscriptionTier('pro');
  };

  const handleSignOut = () => {
    localStorage.removeItem('sarggeo_token');
    setUser(null);
    setSubscriptionTier('free');
    setProjects([]);
    setActiveProject(null);
  };

  return (
    <div className="sarggeo-app-container">
      {/* Sidebar Control Panel */}
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
        onOpenBatchModal={() => {
          checkConversionLimit(1).then((allowed) => {
            if (allowed) setIsBatchModalOpen(true);
          });
        }}
        user={user}
        subscriptionTier={subscriptionTier}
        conversionsUsed={conversionsUsed}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
        onOpenAccountModal={() => setIsAccountModalOpen(true)}
        onOpenProjectsModal={() => setIsProjectsModalOpen(true)}
        onSignOut={handleSignOut}
        projects={projects}
        activeProject={activeProject}
        onSelectProject={handleSelectProject}
        onCreateProject={handleCreateProject}
        onDeleteProject={handleDeleteProject}
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
        onCheckConversionLimit={checkConversionLimit}
      />

      {/* User Login & Register Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* $15/Month Pro Upgrade Paywall Modal */}
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        user={user}
        onUpgradeSuccess={handleUpgradeSuccess}
        remainingFree={Math.max(0, 3 - conversionsUsed)}
      />

      {/* Account Profile & Credentials Modal */}
      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        user={user}
        subscriptionTier={subscriptionTier}
        conversionsUsed={conversionsUsed}
        onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
        onSignOut={handleSignOut}
      />

      {/* Hosted Cloud Projects Manager Modal */}
      <ProjectsModal
        isOpen={isProjectsModalOpen}
        onClose={() => setIsProjectsModalOpen(false)}
        user={user}
        projects={projects}
        activeProject={activeProject}
        onSelectProject={handleSelectProject}
        onCreateProject={handleCreateProject}
        onDeleteProject={handleDeleteProject}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />
    </div>
  );
}
