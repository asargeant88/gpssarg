import React, { useState, useEffect } from 'react';
import {
  X,
  FileSpreadsheet,
  Download,
  MapPin,
  Trash2,
  Copy,
  Check,
  Search,
  Plus,
  Globe,
  Layers,
  Sparkles,
  ArrowUpDown
} from 'lucide-react';
import { formatAllCoordinates } from '../utils/coordinateConverter';
import { exportPoints } from '../utils/exporter';

export default function ProjectSpreadsheetModal({
  isOpen,
  onClose,
  activeProject,
  projectPoints = [],
  onFlyTo,
  onAddPointToProject,
  onDeleteProjectPoint
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [sortField, setSortField] = useState('id');
  const [sortDirection, setSortDirection] = useState('asc');

  // New point form state
  const [newTitle, setNewTitle] = useState('');
  const [newDls, setNewDls] = useState('');
  const [newLat, setNewLat] = useState('');
  const [newLng, setNewLng] = useState('');
  const [newElev, setNewElev] = useState('');
  const [newNotes, setNewNotes] = useState('');

  if (!isOpen || !activeProject) return null;

  // Filter points based on search query
  const filteredPoints = projectPoints.filter((pt) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const coords = formatAllCoordinates(pt.lat, pt.lng);
    return (
      (pt.title && pt.title.toLowerCase().includes(term)) ||
      (pt.dls && pt.dls.toLowerCase().includes(term)) ||
      (coords.dls.formatted && coords.dls.formatted.toLowerCase().includes(term)) ||
      (coords.utm.formatted && coords.utm.formatted.toLowerCase().includes(term)) ||
      (pt.notes && pt.notes.toLowerCase().includes(term)) ||
      pt.lat.toString().includes(term) ||
      pt.lng.toString().includes(term)
    );
  });

  // Sort points
  const sortedPoints = [...filteredPoints].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleCopyRow = (id, pt) => {
    const coords = formatAllCoordinates(pt.lat, pt.lng);
    const rowText = `Title: ${pt.title || 'Point'} | DLS: ${pt.dls || coords.dls.shortFormatted} | Lat: ${pt.lat.toFixed(6)} | Lng: ${pt.lng.toFixed(6)} | Elev: ${pt.elevation || 'N/A'} | UTM: ${coords.utm.formatted}`;
    navigator.clipboard.writeText(rowText);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateRow = (e) => {
    e.preventDefault();
    const parsedLat = parseFloat(newLat);
    const parsedLng = parseFloat(newLng);

    if (isNaN(parsedLat) || isNaN(parsedLng)) {
      alert('Please enter valid numerical Latitude and Longitude values.');
      return;
    }

    if (onAddPointToProject) {
      onAddPointToProject({
        title: newTitle.trim() || 'Spreadsheet Point',
        dls: newDls.trim(),
        lat: parsedLat,
        lng: parsedLng,
        elevation: newElev.trim() ? parseFloat(newElev) : null,
        notes: newNotes.trim(),
        category: 'Spreadsheet'
      });

      setNewTitle('');
      setNewDls('');
      setNewLat('');
      setNewLng('');
      setNewElev('');
      setNewNotes('');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="custom-modal-card spreadsheet-modal-width" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="custom-modal-header">
          <div className="modal-header-left">
            <div className="modal-icon-badge amber">
              <FileSpreadsheet className="w-5 h-5 text-amber" />
            </div>
            <div>
              <h2 className="modal-header-title">Project Data Spreadsheet Grid — {activeProject.name}</h2>
              <p className="modal-header-subtitle">
                {projectPoints.length} Saved Survey Points & Elevation Records • Hosted PostgreSQL DB
              </p>
            </div>
          </div>
          <button className="modal-close-icon-btn" onClick={onClose}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar Bar */}
        <div className="spreadsheet-toolbar">
          <div className="flex items-center gap-2 flex-1">
            <div className="input-icon-wrapper max-w-xs">
              <Search className="input-inner-icon" />
              <input
                type="text"
                className="custom-modal-input text-xs"
                placeholder="Search spreadsheet points, DLS, UTM..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <span className="text-xs font-bold text-slate-500">
              Showing {sortedPoints.length} of {projectPoints.length} rows
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="custom-btn secondary text-xs"
              onClick={() => exportPoints(projectPoints, 'csv', activeProject.name)}
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
            <button
              className="custom-btn secondary text-xs"
              onClick={() => exportPoints(projectPoints, 'kml', activeProject.name)}
            >
              <Globe className="w-3.5 h-3.5 text-cyan" /> Export KML
            </button>
            <button
              className="custom-btn secondary text-xs"
              onClick={() => exportPoints(projectPoints, 'geojson', activeProject.name)}
            >
              <Layers className="w-3.5 h-3.5 text-amber" /> Export GeoJSON
            </button>
          </div>
        </div>

        {/* Modal Body / Table Grid */}
        <div className="custom-modal-body p-0 space-y-0 overflow-hidden flex-1">
          {/* Quick Add Row Form */}
          <form onSubmit={handleCreateRow} className="spreadsheet-add-row-form">
            <span className="add-row-label">+ ADD ROW:</span>
            <input
              type="text"
              className="rhs-input text-xs"
              placeholder="Title (e.g. Wellhead #12)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <input
              type="text"
              className="rhs-input text-xs"
              placeholder="DLS/ATS Format"
              value={newDls}
              onChange={(e) => setNewDls(e.target.value)}
            />
            <input
              type="text"
              required
              className="rhs-input text-xs"
              placeholder="Latitude (DD)"
              value={newLat}
              onChange={(e) => setNewLat(e.target.value)}
            />
            <input
              type="text"
              required
              className="rhs-input text-xs"
              placeholder="Longitude (DD)"
              value={newLng}
              onChange={(e) => setNewLng(e.target.value)}
            />
            <input
              type="text"
              className="rhs-input text-xs"
              placeholder="Elevation (m)"
              value={newElev}
              onChange={(e) => setNewElev(e.target.value)}
            />
            <input
              type="text"
              className="rhs-input text-xs"
              placeholder="Notes"
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
            />
            <button type="submit" className="custom-btn primary text-xs shrink-0 py-1.5 px-3">
              <Plus className="w-3.5 h-3.5" /> Add Point
            </button>
          </form>

          {/* Table Container */}
          <div className="spreadsheet-table-wrapper">
            <table className="spreadsheet-table">
              <thead>
                <tr>
                  <th className="w-10">#</th>
                  <th onClick={() => handleSort('title')} className="cursor-pointer">
                    <div className="flex items-center gap-1">
                      <span>Point Title</span>
                      <ArrowUpDown className="w-3 h-3 opacity-60" />
                    </div>
                  </th>
                  <th onClick={() => handleSort('dls')} className="cursor-pointer">
                    <div className="flex items-center gap-1">
                      <span>DLS / ATS Location</span>
                      <ArrowUpDown className="w-3 h-3 opacity-60" />
                    </div>
                  </th>
                  <th>Latitude (DD)</th>
                  <th>Longitude (DD)</th>
                  <th>Elevation</th>
                  <th>UTM Grid Reference</th>
                  <th>MGRS Code</th>
                  <th>Notes / Description</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedPoints.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="text-center py-12 text-slate-400 font-medium">
                      No points match your spreadsheet search or no points saved in this project yet.
                    </td>
                  </tr>
                ) : (
                  sortedPoints.map((pt, idx) => {
                    const coords = formatAllCoordinates(pt.lat, pt.lng);
                    const elevationM = pt.elevation || pt.altitude || (pt.elev ? parseFloat(pt.elev) : null);
                    const elevationFt = elevationM != null ? (elevationM * 3.28084).toFixed(1) : null;

                    return (
                      <tr key={pt.id || idx} className="spreadsheet-row">
                        <td className="row-num">{idx + 1}</td>
                        <td className="font-extrabold text-slate-900">{pt.title || 'Survey Point'}</td>
                        <td className="mono-font text-amber-900 font-bold">{pt.dls || coords.dls.shortFormatted}</td>
                        <td className="mono-font text-slate-800">{pt.lat.toFixed(6)}°</td>
                        <td className="mono-font text-slate-800">{pt.lng.toFixed(6)}°</td>
                        <td>
                          {elevationM != null ? (
                            <span className="elevation-pill">
                              <strong>{elevationM}m</strong> ({elevationFt}ft)
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">N/A</span>
                          )}
                        </td>
                        <td className="mono-font text-sky-900 font-medium text-xs">{coords.utm.formatted}</td>
                        <td className="mono-font text-emerald-900 font-medium text-xs">{coords.mgrs}</td>
                        <td className="text-slate-600 text-xs truncate max-w-[150px]">{pt.notes || '-'}</td>
                        <td className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              className="point-icon-btn"
                              onClick={() => handleCopyRow(pt.id, pt)}
                              title="Copy Row Data"
                            >
                              {copiedId === pt.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              className="point-icon-btn"
                              onClick={() => {
                                onFlyTo(pt.lat, pt.lng, 15);
                                onClose();
                              }}
                              title="Fly to on Map Canvas"
                            >
                              <MapPin className="w-3.5 h-3.5 text-cyan-600" />
                            </button>
                            {onDeleteProjectPoint && (
                              <button
                                className="point-icon-btn danger"
                                onClick={() => onDeleteProjectPoint(pt.id)}
                                title="Delete Row"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="custom-modal-footer">
          <div className="footer-engine-badge">
            <Sparkles className="w-4 h-4 text-amber" />
            <span>Project Grid Active — {projectPoints.length} Records</span>
          </div>
          <div className="footer-action-buttons">
            <button className="custom-btn secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
