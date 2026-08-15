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
  ArrowUpDown,
  UploadCloud,
  FileText
} from 'lucide-react';
import { formatAllCoordinates, parseLocationInput } from '../utils/coordinateConverter';
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

  // Single row form state
  const [newTitle, setNewTitle] = useState('');
  const [newDls, setNewDls] = useState('');
  const [newLat, setNewLat] = useState('');
  const [newLng, setNewLng] = useState('');
  const [newElev, setNewElev] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Batch paste state
  const [showBatchSection, setShowBatchSection] = useState(false);
  const [batchInputText, setBatchInputText] = useState('');
  const [batchParsedResults, setBatchParsedResults] = useState([]);
  const [isImportingBatch, setIsImportingBatch] = useState(false);
  const [importSuccessMsg, setImportSuccessMsg] = useState('');

  if (!isOpen || !activeProject) return null;

  // Live parse batch input text
  const handleBatchParse = (text) => {
    setBatchInputText(text);
    if (!text.trim()) {
      setBatchParsedResults([]);
      return;
    }

    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    const parsedList = lines.map((line, idx) => {
      // 1. Try parsing comma/tab separated row (Title, DLS/Lat, Lng, Elev, Notes)
      const parts = line.split(/[,;\t]+/).map((p) => p.trim());
      if (parts.length >= 2) {
        const titlePart = parts[0];
        const coordPart1 = parts[1];
        const coordPart2 = parts[2];

        // Check if parts[1] and parts[2] are numerical Lat, Lng
        const numLat = parseFloat(coordPart1);
        const numLng = parseFloat(coordPart2);
        if (!isNaN(numLat) && !isNaN(numLng) && numLat >= 48 && numLat <= 60 && numLng >= -120 && numLng <= -100) {
          const coords = formatAllCoordinates(numLat, numLng);
          return {
            id: idx + 1,
            title: titlePart || 'Batch Point',
            lat: numLat,
            lng: numLng,
            dls: coords.dls.shortFormatted,
            elevation: parts[3] ? parseFloat(parts[3]) || null : null,
            notes: parts.slice(4).join(', ') || 'CSV Batch Import',
            isValid: true
          };
        }

        // Try parsing parts[1] as DLS or coordinate string
        const parsedDls = parseLocationInput(coordPart1);
        if (parsedDls) {
          const coords = formatAllCoordinates(parsedDls.lat, parsedDls.lng);
          return {
            id: idx + 1,
            title: titlePart || 'Batch Point',
            lat: parsedDls.lat,
            lng: parsedDls.lng,
            dls: coords.dls.shortFormatted,
            elevation: parts[2] ? parseFloat(parts[2]) || null : null,
            notes: parts.slice(3).join(', ') || 'CSV Batch Import',
            isValid: true
          };
        }
      }

      // 2. Try parsing entire line as single location string (DLS or Lat/Lng pair)
      const parsedSingle = parseLocationInput(line);
      if (parsedSingle) {
        const coords = formatAllCoordinates(parsedSingle.lat, parsedSingle.lng);
        return {
          id: idx + 1,
          title: line,
          lat: parsedSingle.lat,
          lng: parsedSingle.lng,
          dls: coords.dls.shortFormatted,
          elevation: null,
          notes: 'Batch Multi-Line Import',
          isValid: true
        };
      }

      return {
        id: idx + 1,
        rawInput: line,
        isValid: false
      };
    });

    setBatchParsedResults(parsedList);
  };

  // Submit Batch Import to Project
  const handleExecuteBatchImport = async () => {
    const validItems = batchParsedResults.filter((r) => r.isValid);
    if (validItems.length === 0) {
      alert('No valid parsed points found to import into project.');
      return;
    }

    setIsImportingBatch(true);
    setImportSuccessMsg('');

    try {
      for (const item of validItems) {
        if (onAddPointToProject) {
          await onAddPointToProject({
            title: item.title,
            dls: item.dls,
            lat: item.lat,
            lng: item.lng,
            elevation: item.elevation,
            notes: item.notes,
            category: 'Batch Import'
          });
        }
      }
      setImportSuccessMsg(`Successfully imported ${validItems.length} batch points to project!`);
      setBatchInputText('');
      setBatchParsedResults([]);
      setTimeout(() => setImportSuccessMsg(''), 4000);
    } catch (e) {
      alert('Failed to import some batch points.');
    } finally {
      setIsImportingBatch(false);
    }
  };

  // Preset Handlers
  const handleLoadPresetDls = () => {
    const sample = `16-29-44-4 W4
04-12-53-24 W4
12-15-52-1 W5
08-16-45-2 W4
01-05-50-22 W4`;
    handleBatchParse(sample);
  };

  const handleLoadPresetCsv = () => {
    const sample = `Wellhead Site A, 16-29-44-4 W4, 645, Main Alberta Field
Compressor Station 3, 04-12-53-24 W4, 712, Northern Access
Pipeline Marker 109, 52.827063, -110.538848, 650, Inspection Marker`;
    handleBatchParse(sample);
  };

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

  const validBatchCount = batchParsedResults.filter((r) => r.isValid).length;

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
              className={`custom-btn text-xs font-extrabold ${showBatchSection ? 'primary' : 'amber-pro-btn'}`}
              onClick={() => setShowBatchSection(!showBatchSection)}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>{showBatchSection ? 'Hide Batch Import' : 'Batch Add Multi-Points'}</span>
            </button>
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

        {/* BATCH PASTE DRAWER / CONTAINER */}
        {showBatchSection && (
          <div className="batch-import-container">
            <div className="batch-import-header">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-cyan-800" />
                <span className="batch-import-title">
                  BATCH ADD POINTS TO PROJECT ({activeProject.name})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="preset-label">Paste Presets:</span>
                <button
                  type="button"
                  className="preset-btn"
                  onClick={handleLoadPresetDls}
                >
                  DLS Preset
                </button>
                <button
                  type="button"
                  className="preset-btn"
                  onClick={handleLoadPresetCsv}
                >
                  CSV Row Preset
                </button>
              </div>
            </div>

            {importSuccessMsg && (
              <div className="alert-box success py-2 px-3">
                <Check className="w-4 h-4 text-emerald-600" /> {importSuccessMsg}
              </div>
            )}

            <div className="batch-import-body">
              <div className="batch-textarea-wrapper">
                <textarea
                  className="batch-textarea mono-font"
                  placeholder="Paste multi-line points (one per line):&#10;16-29-44-4 W4&#10;04-12-53-24 W4&#10;OR CSV: Wellhead Site A, 16-29-44-4 W4, 645m, Notes"
                  value={batchInputText}
                  onChange={(e) => handleBatchParse(e.target.value)}
                />
              </div>

              <div className="batch-status-panel">
                <div>
                  <div className="status-panel-title">PARSED PREVIEW STATUS</div>
                  <div className="status-row">
                    <span>Total Lines:</span>
                    <strong>{batchParsedResults.length}</strong>
                  </div>
                  <div className="status-row valid">
                    <span>Valid Spatial Points:</span>
                    <strong>{validBatchCount}</strong>
                  </div>
                  <div className="status-row invalid">
                    <span>Invalid Lines:</span>
                    <strong>{batchParsedResults.length - validBatchCount}</strong>
                  </div>
                </div>

                <button
                  type="button"
                  className="custom-btn primary full text-xs py-2 justify-center"
                  disabled={validBatchCount === 0 || isImportingBatch}
                  onClick={handleExecuteBatchImport}
                >
                  <Plus className="w-4 h-4" />
                  <span>{isImportingBatch ? 'Importing Batch...' : `Import ${validBatchCount} Valid Points to Project`}</span>
                </button>
              </div>
            </div>
          </div>
        )}

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
                      No points match your spreadsheet search or no points saved in this project yet. Use 'Batch Add Multi-Points' above to paste points in bulk!
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
