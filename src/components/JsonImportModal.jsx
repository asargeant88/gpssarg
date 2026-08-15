import React, { useState, useEffect } from 'react';
import { X, Upload, FileCode, Check, AlertCircle, MapPin, FolderPlus, Eye, Folder, ChevronDown } from 'lucide-react';
import { formatAllCoordinates, dlsToDd } from '../utils/coordinateConverter';

export default function JsonImportModal({
  isOpen,
  onClose,
  onAddWaypointsBatch,
  onAddPointToProject,
  onFlyTo,
  activeProject,
  projects = [],
  onSelectProject,
  user
}) {
  const [inputText, setInputText] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [importFormat, setImportFormat] = useState(null); // KML, KMZ, GeoJSON, CSV, JSON
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isSavingToProject, setIsSavingToProject] = useState(false);
  const [targetProject, setTargetProject] = useState(activeProject);

  useEffect(() => {
    if (activeProject) setTargetProject(activeProject);
    else if (projects && projects.length > 0) setTargetProject(projects[0]);
  }, [activeProject, projects]);

  // KML / KMZ XML Parser
  const parseKmlContent = (xmlString) => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
      const placemarks = xmlDoc.getElementsByTagName('Placemark');
      const points = [];

      for (let i = 0; i < placemarks.length; i++) {
        const pm = placemarks[i];
        const nameNode = pm.getElementsByTagName('name')[0];
        const name = nameNode ? nameNode.textContent.trim() : `KML Point ${i + 1}`;
        const descNode = pm.getElementsByTagName('description')[0];
        const desc = descNode ? descNode.textContent.trim() : '';

        const coordsNode = pm.getElementsByTagName('coordinates')[0];
        if (coordsNode) {
          const rawCoords = coordsNode.textContent.trim().split(/\s+/);
          for (const coordStr of rawCoords) {
            const parts = coordStr.split(',');
            if (parts.length >= 2) {
              const lng = parseFloat(parts[0]);
              const lat = parseFloat(parts[1]);
              const elev = parts[2] ? parseFloat(parts[2]) : null;

              if (!isNaN(lat) && !isNaN(lng)) {
                const coords = formatAllCoordinates(lat, lng);
                points.push({
                  title: name,
                  notes: desc || 'Imported from KML/KMZ',
                  lat,
                  lng,
                  elevation: elev,
                  dls: coords.dls.shortFormatted,
                  category: 'KML/KMZ Import'
                });
              }
            }
          }
        }
      }
      return points;
    } catch (e) {
      return [];
    }
  };

  const parseInputData = (content, fileName = '') => {
    setError('');
    setSuccessMsg('');
    setParsedData(null);
    setImportFormat(null);

    if (!content || !content.trim()) return;

    // 1. Try KML / KMZ XML parsing first if string contains <kml or <Placemark
    if (content.includes('<kml') || content.includes('<Placemark') || fileName.endsWith('.kml') || fileName.endsWith('.kmz')) {
      const kmlPoints = parseKmlContent(content);
      if (kmlPoints.length > 0) {
        setParsedData(kmlPoints);
        setImportFormat(fileName.endsWith('.kmz') ? 'KMZ' : 'KML');
        return;
      }
    }

    // 2. Try JSON / GeoJSON
    try {
      const obj = JSON.parse(content);

      // GeoJSON FeatureCollection
      if (obj.type === 'FeatureCollection' && Array.isArray(obj.features)) {
        const points = [];
        obj.features.forEach((feat, idx) => {
          if (feat.geometry && feat.geometry.type === 'Point' && Array.isArray(feat.geometry.coordinates)) {
            const [lng, lat, elev] = feat.geometry.coordinates;
            const props = feat.properties || {};
            const coords = formatAllCoordinates(lat, lng);
            points.push({
              title: props.title || props.name || `GeoJSON Point ${idx + 1}`,
              notes: props.description || props.notes || 'Imported from GeoJSON',
              lat,
              lng,
              elevation: elev || null,
              dls: coords.dls.shortFormatted,
              category: props.category || 'GeoJSON'
            });
          }
        });

        if (points.length === 0) throw new Error('No valid Point geometries found in GeoJSON FeatureCollection.');
        setParsedData(points);
        setImportFormat('GeoJSON');
        return;
      }

      // Waypoint JSON Array
      let rawList = Array.isArray(obj) ? obj : (obj.waypoints || obj.points || obj.data);
      if (Array.isArray(rawList)) {
        const points = [];
        rawList.forEach((item, idx) => {
          let lat = parseFloat(item.lat || item.latitude);
          let lng = parseFloat(item.lng || item.longitude || item.lon);
          let dlsStr = item.dls || item.location || '';

          if ((isNaN(lat) || isNaN(lng)) && dlsStr) {
            const dlsParsed = dlsToDd(dlsStr);
            if (dlsParsed && dlsParsed.isValid) {
              lat = dlsParsed.lat;
              lng = dlsParsed.lng;
            }
          }

          if (!isNaN(lat) && !isNaN(lng)) {
            const coords = formatAllCoordinates(lat, lng);
            points.push({
              title: item.title || item.name || `Waypoint ${idx + 1}`,
              notes: item.notes || item.description || '',
              lat,
              lng,
              elevation: item.elevation || item.elev || null,
              dls: item.dls || coords.dls.shortFormatted,
              category: item.category || 'Imported'
            });
          }
        });

        if (points.length === 0) throw new Error('No valid coordinate objects found in JSON array.');
        setParsedData(points);
        setImportFormat('JSON');
        return;
      }
    } catch (e) {}

    // 3. Try Multi-Line DLS / CSV parsing
    const lines = content.split('\n');
    const csvPoints = [];
    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      const parts = trimmed.split(/,|\t/);
      let title = `Point ${idx + 1}`;
      let locStr = trimmed;

      if (parts.length >= 2) {
        title = parts[0].trim();
        locStr = parts[1].trim();
      }

      const dlsParsed = dlsToDd(locStr);
      if (dlsParsed && dlsParsed.isValid) {
        csvPoints.push({
          title,
          notes: parts[3] ? parts[3].trim() : 'CSV Multi-Line Import',
          lat: dlsParsed.lat,
          lng: dlsParsed.lng,
          dls: dlsParsed.formattedDls,
          category: 'CSV Import'
        });
      }
    });

    if (csvPoints.length > 0) {
      setParsedData(csvPoints);
      setImportFormat('CSV / DLS');
      return;
    }

    setError('Could not parse file. Please select a valid KML, KMZ, GeoJSON, CSV, or JSON file.');
  };

  const handleFileUpload = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      setInputText(content);
      parseInputData(content, file.name);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handlePlotOnMap = () => {
    if (!parsedData || parsedData.length === 0) return;

    if (onAddWaypointsBatch) onAddWaypointsBatch(parsedData);
    if (onFlyTo && parsedData[0]) {
      onFlyTo(parsedData[0].lat, parsedData[0].lng, 13);
    }
    setSuccessMsg(`Successfully plotted ${parsedData.length} points onto map!`);
    setTimeout(() => onClose(), 1500);
  };

  const handleSaveToProject = async () => {
    if (!parsedData || parsedData.length === 0) return;

    const projToUse = targetProject || activeProject;
    if (!projToUse) {
      setError('Please select or create a target project first.');
      return;
    }

    if (onSelectProject && projToUse.id !== activeProject?.id) {
      onSelectProject(projToUse);
    }

    setIsSavingToProject(true);
    let count = 0;
    for (const pt of parsedData) {
      if (onAddPointToProject) {
        await onAddPointToProject({
          title: pt.title,
          dls: pt.dls,
          lat: pt.lat,
          lng: pt.lng,
          notes: pt.notes,
          elevation: pt.elevation || null,
          category: pt.category || 'Spatial Import'
        });
        count++;
      }
    }
    setIsSavingToProject(false);
    setSuccessMsg(`Successfully saved ${count} imported points to project "${projToUse.name}"!`);
    setTimeout(() => onClose(), 1800);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="custom-modal-card import-modal-width" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="custom-modal-header">
          <div className="modal-header-left">
            <div className="modal-icon-badge cyan">
              <FileCode className="w-5 h-5 text-cyan" />
            </div>
            <div>
              <h2 className="modal-header-title">Spatial Data Importer</h2>
              <p className="modal-header-subtitle">Import KMZ, KML, GeoJSON, CSV & JSON files directly to project or map canvas.</p>
            </div>
          </div>
          <button className="modal-close-icon-btn" onClick={onClose}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="custom-modal-body space-y-4">
          {/* Target Project Selector Banner */}
          <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Folder className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="font-extrabold text-slate-800">Target Save Project:</span>
              {targetProject ? (
                <span className="font-black text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded text-[11px]">
                  {targetProject.name}
                </span>
              ) : (
                <span className="text-slate-500 italic">No active project</span>
              )}
            </div>

            {projects && projects.length > 0 && (
              <select
                className="custom-modal-input text-xs py-1 px-2.5 max-w-[210px] font-bold text-slate-800"
                value={targetProject ? targetProject.id : ''}
                onChange={(e) => {
                  const found = projects.find((p) => String(p.id) === String(e.target.value));
                  if (found) {
                    setTargetProject(found);
                    if (onSelectProject) onSelectProject(found);
                  }
                }}
              >
                <option value="" disabled>Select Target Project...</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    📁 {p.name} ({p.waypoints_count || 0} points)
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Drag & Drop File Zone */}
          <div
            className={`p-6 border-2 border-dashed rounded-xl text-center transition-all ${
              isDragging ? 'border-cyan-600 bg-cyan-50' : 'border-slate-300 bg-slate-50 hover:border-slate-400'
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="spatial-data-file-input"
              accept=".kml,.kmz,.geojson,.json,.csv,.txt"
              style={{ display: 'none' }}
              onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0])}
            />
            <Upload className="w-8 h-8 text-cyan-700 mx-auto mb-2" />
            <div className="text-xs font-black text-slate-900 mb-1">
              Drag & Drop <span className="text-cyan-800 font-mono">.kml, .kmz, .geojson, .csv, .json</span> file here
            </div>
            <button
              type="button"
              className="custom-btn secondary text-xs px-4 py-1.5 mt-2"
              onClick={() => document.getElementById('spatial-data-file-input').click()}
            >
              Browse Files...
            </button>
          </div>

          {/* Paste Raw Data */}
          <div>
            <label className="custom-field-label">OR PASTE RAW KML, GEOJSON, OR CSV TEXT</label>
            <textarea
              className="custom-modal-input mono-font text-xs h-28 resize-none"
              placeholder='Paste KML XML string, GeoJSON FeatureCollection, or multi-line DLS points...'
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                parseInputData(e.target.value);
              }}
            />
          </div>

          {error && (
            <div className="alert-box error text-xs p-3">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="alert-box success text-xs p-3">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Parsed Preview Table */}
          {parsedData && parsedData.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-slate-700" />
                  <span className="text-xs font-black text-slate-900 uppercase">
                    PARSED PREVIEW — {parsedData.length} POINTS DETECTED
                  </span>
                </div>
                <span className="text-[11px] font-black uppercase px-2.5 py-0.5 rounded bg-cyan-100 text-cyan-900 border border-cyan-200">
                  {importFormat} FORMAT
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-44 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-black sticky top-0">
                    <tr>
                      <th className="p-2.5">Title</th>
                      <th className="p-2.5">Latitude</th>
                      <th className="p-2.5">Longitude</th>
                      <th className="p-2.5">DLS / Location</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800">
                    {parsedData.map((pt, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-slate-900">{pt.title}</td>
                        <td className="p-2.5 mono-font">{pt.lat ? pt.lat.toFixed(6) : '-'}</td>
                        <td className="p-2.5 mono-font">{pt.lng ? pt.lng.toFixed(6) : '-'}</td>
                        <td className="p-2.5 mono-font text-amber-900 font-bold">{pt.dls || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-2">
                <div className="text-[11px] text-slate-500 font-medium">
                  {targetProject ? (
                    <span>Click amber button to save all {parsedData.length} points to <strong className="text-slate-800">{targetProject.name}</strong></span>
                  ) : (
                    <span>Select target project above to enable project saving</span>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={isSavingToProject || !targetProject}
                    className="custom-btn amber-pro-btn text-xs font-extrabold px-4 py-2.5"
                    onClick={handleSaveToProject}
                  >
                    <FolderPlus className="w-4 h-4 mr-1.5" />
                    {isSavingToProject
                      ? 'Saving to Project...'
                      : targetProject
                      ? `Save ${parsedData.length} Points to ${targetProject.name}`
                      : 'Select Target Project First'}
                  </button>

                  <button
                    type="button"
                    className="custom-btn primary text-xs font-extrabold px-5 py-2.5"
                    onClick={handlePlotOnMap}
                  >
                    <MapPin className="w-4 h-4 mr-1.5" /> Plot All ({parsedData.length}) on Map
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
