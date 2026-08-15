import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  Folder,
  Plus,
  Trash2,
  Download,
  MapPin,
  Copy,
  Check,
  Globe,
  Database,
  Layers,
  FileSpreadsheet,
  FileCode,
  Share2
} from 'lucide-react';
import { formatAllCoordinates } from '../utils/coordinateConverter';
import { exportPoints } from '../utils/exporter';

export default function RightProjectPanel({
  activeProject,
  projectPoints = [],
  onOpenProjectsModal,
  onAddPointToProject,
  onDeleteProjectPoint,
  onFlyTo,
  inspectedPoint
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [exportFormat, setExportFormat] = useState('csv');

  const inspectedCoords = inspectedPoint ? formatAllCoordinates(inspectedPoint.lat, inspectedPoint.lng) : null;

  const handleSaveCurrentPoint = (e) => {
    e.preventDefault();
    if (!inspectedPoint) return;

    const titleToSave = newTitle.trim() || (inspectedCoords ? inspectedCoords.dls.shortFormatted : 'Survey Point');
    if (onAddPointToProject) {
      onAddPointToProject({
        title: titleToSave,
        notes: newNotes.trim(),
        lat: inspectedPoint.lat,
        lng: inspectedPoint.lng,
        dls: inspectedCoords ? inspectedCoords.dls.shortFormatted : '',
        category: 'Project Point'
      });
      setNewTitle('');
      setNewNotes('');
    }
  };

  const handleCopyCoords = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExport = () => {
    exportPoints(projectPoints, exportFormat, activeProject?.name || 'SargGeo_Project');
  };

  return (
    <div className={`rhs-project-panel ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Collapse / Expand Toggle Button */}
      <button
        className="rhs-toggle-btn"
        onClick={() => setIsCollapsed(!isCollapsed)}
        title={isCollapsed ? 'Expand Project Panel' : 'Collapse Project Panel'}
      >
        {isCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>

      {!isCollapsed && (
        <div className="rhs-panel-inner">
          {/* Header */}
          <div className="rhs-header">
            <div className="rhs-header-top">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-600">
                  <Folder className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="rhs-project-name truncate">{activeProject ? activeProject.name : 'No Active Project'}</h3>
                  <span className="rhs-project-sub">{projectPoints.length} Points Saved</span>
                </div>
              </div>
              <button className="rhs-change-project-btn" onClick={onOpenProjectsModal}>
                Switch
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="rhs-body">
            {!activeProject ? (
              <div className="rhs-empty-project">
                <Database className="w-8 h-8 text-cyan-600 mb-2" />
                <span className="text-xs font-bold text-slate-800">Select or Create a Hosted Project</span>
                <p className="text-[11px] text-slate-500 mt-1">
                  Save survey points, DLS locations, and map waypoints to your cloud project.
                </p>
                <button className="custom-btn primary text-xs mt-3" onClick={onOpenProjectsModal}>
                  <Folder className="w-3.5 h-3.5" /> Manage Projects
                </button>
              </div>
            ) : (
              <>
                {/* Save Current Inspected Point Card */}
                <div className="rhs-add-point-card">
                  <div className="card-title-label">SAVE POINT TO PROJECT</div>
                  {inspectedCoords && (
                    <div className="inspected-coords-badge">
                      <MapPin className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                      <span className="mono-font text-xs font-bold text-slate-900">{inspectedCoords.dls.shortFormatted}</span>
                      <span className="text-[10px] text-slate-500">({inspectedPoint.lat.toFixed(4)}, {inspectedPoint.lng.toFixed(4)})</span>
                    </div>
                  )}

                  <form onSubmit={handleSaveCurrentPoint} className="space-y-2 mt-2">
                    <input
                      type="text"
                      className="rhs-input"
                      placeholder="Point Name (e.g. Wellhead #4)"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                    />
                    <input
                      type="text"
                      className="rhs-input"
                      placeholder="Notes / Field Ref (Optional)"
                      value={newNotes}
                      onChange={(e) => setNewNotes(e.target.value)}
                    />
                    <button type="submit" className="custom-btn amber-primary full text-xs py-2">
                      <Plus className="w-3.5 h-3.5" /> Save Point to Project
                    </button>
                  </form>
                </div>

                {/* Points List */}
                <div className="rhs-points-list-container">
                  <div className="list-header-row">
                    <span className="list-title">SAVED POINTS ({projectPoints.length})</span>
                  </div>

                  {projectPoints.length === 0 ? (
                    <div className="rhs-empty-list">
                      <MapPin className="w-6 h-6 text-slate-400 mb-1" />
                      <span>No points saved in this project yet. Click anywhere on map and click 'Save Point'.</span>
                    </div>
                  ) : (
                    <div className="rhs-points-scroll-list">
                      {projectPoints.map((pt) => {
                        const coords = formatAllCoordinates(pt.lat, pt.lng);
                        return (
                          <div key={pt.id} className="rhs-point-card">
                            <div className="point-card-header">
                              <div className="flex items-center gap-1.5 truncate">
                                <div className="w-2 h-2 rounded-full bg-cyan-600" />
                                <span className="point-title">{pt.title || 'Survey Point'}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  className="point-icon-btn"
                                  onClick={() => handleCopyCoords(pt.id, `${pt.lat.toFixed(6)}, ${pt.lng.toFixed(6)}`)}
                                  title="Copy Lat/Lng"
                                >
                                  {copiedId === pt.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                                <button
                                  className="point-icon-btn"
                                  onClick={() => onFlyTo(pt.lat, pt.lng, 15)}
                                  title="Fly to on Map"
                                >
                                  <MapPin className="w-3.5 h-3.5 text-cyan-600" />
                                </button>
                                {onDeleteProjectPoint && (
                                  <button
                                    className="point-icon-btn danger"
                                    onClick={() => onDeleteProjectPoint(pt.id)}
                                    title="Delete Point"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="point-card-body">
                              <div className="point-dls mono-font">{pt.dls || coords.dls.shortFormatted}</div>
                              <div className="point-coords mono-font">{pt.lat.toFixed(5)}, {pt.lng.toFixed(5)}</div>
                              {pt.notes && <div className="point-notes">{pt.notes}</div>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Multi-Format Export Toolbar */}
                <div className="rhs-export-toolbar">
                  <div className="card-title-label">EXPORT PROJECT DATA</div>
                  <div className="flex gap-2 mt-1.5">
                    <select
                      className="rhs-select flex-1"
                      value={exportFormat}
                      onChange={(e) => setExportFormat(e.target.value)}
                    >
                      <option value="csv">CSV Spreadsheet (.csv)</option>
                      <option value="kmz">Google Earth KMZ (.kmz)</option>
                      <option value="kml">Google Earth KML (.kml)</option>
                      <option value="geojson">GeoJSON File (.geojson)</option>
                      <option value="shp">ESRI Shapefile JSON (.json/.shp)</option>
                    </select>
                    <button className="custom-btn primary text-xs px-3" onClick={handleExport}>
                      <Download className="w-3.5 h-3.5" /> Export
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
