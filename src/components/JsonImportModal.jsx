import React, { useState } from 'react';
import { X, Upload, FileJson, Check, AlertCircle, MapPin, Database, Eye, Code, Layers } from 'lucide-react';
import { formatAllCoordinates, dlsToDd, utmToDd, parseLocationInput } from '../utils/coordinateConverter';

export default function JsonImportModal({
  isOpen,
  onClose,
  onAddWaypointsBatch,
  onFlyTo,
  activeProject,
  user
}) {
  const [jsonText, setJsonText] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [importType, setImportType] = useState(null); // 'geojson', 'waypoints', 'project', 'profile'
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const parseAndValidateJson = (content) => {
    setError('');
    setSuccessMsg('');
    setParsedData(null);
    setImportType(null);

    if (!content || !content.trim()) return;

    try {
      const obj = JSON.parse(content);

      // 1. GeoJSON FeatureCollection
      if (obj.type === 'FeatureCollection' && Array.isArray(obj.features)) {
        const points = [];
        obj.features.forEach((feat, idx) => {
          if (feat.geometry && feat.geometry.type === 'Point' && Array.isArray(feat.geometry.coordinates)) {
            const [lng, lat] = feat.geometry.coordinates;
            const props = feat.properties || {};
            const coords = formatAllCoordinates(lat, lng);
            points.push({
              title: props.title || props.name || `GeoJSON Point ${idx + 1}`,
              notes: props.description || props.notes || 'Imported from GeoJSON',
              lat,
              lng,
              dls: coords.dls.formatted,
              category: props.category || 'GeoJSON'
            });
          }
        });

        if (points.length === 0) throw new Error('No valid Point geometries found in GeoJSON FeatureCollection.');
        setParsedData(points);
        setImportType('geojson');
        return;
      }

      // 2. SargGeo Waypoints JSON Array or Wrapped JSON
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
              dls: coords.dls.formatted,
              category: item.category || 'Imported'
            });
          }
        });

        if (points.length === 0) throw new Error('No valid coordinate objects found in JSON array.');
        setParsedData(points);
        setImportType('waypoints');
        return;
      }

      // 3. User Profile Config JSON
      if (obj.email || obj.defaultSpatialFormat || obj.defaultBasemap) {
        setParsedData([obj]);
        setImportType('profile');
        return;
      }

      throw new Error('Unrecognized JSON structure. Provide GeoJSON or an array of waypoint objects with lat/lng.');
    } catch (err) {
      setError(`JSON Parsing Error: ${err.message}`);
    }
  };

  const handleFileUpload = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      setJsonText(content);
      parseAndValidateJson(content);
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

  const handleImportToMap = () => {
    if (!parsedData || parsedData.length === 0) return;

    if (importType === 'geojson' || importType === 'waypoints') {
      if (onAddWaypointsBatch) onAddWaypointsBatch(parsedData);
      if (onFlyTo && parsedData[0]) {
        onFlyTo(parsedData[0].lat, parsedData[0].lng, 13);
      }
      setSuccessMsg(`Successfully imported ${parsedData.length} points onto the map canvas!`);
      setTimeout(() => onClose(), 1500);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="batch-modal-content" style={{ width: '720px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <div className="modal-icon-badge" style={{ background: 'rgba(56, 189, 248, 0.15)', borderColor: 'rgba(56, 189, 248, 0.3)' }}>
              <FileJson className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="modal-title">JSON Data Importer</h2>
              <p className="modal-subtitle">Import GeoJSON features, Waypoint arrays, and Project JSON bundles.</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto" style={{ maxHeight: '75vh' }}>
          {/* Drag and Drop Zone */}
          <div
            className={`p-6 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all ${
              isDragging ? 'border-cyan-400 bg-cyan-950/30' : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('json-file-input').click()}
          >
            <input
              type="file"
              id="json-file-input"
              accept=".json,.geojson"
              className="hidden"
              onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0])}
            />
            <Upload className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
            <span className="text-xs font-bold text-slate-200">Drag & Drop `.json` or `.geojson` file here</span>
            <p className="text-[11px] text-slate-400 mt-1">Or click to select file from disk</p>
          </div>

          {/* Paste JSON Raw Input */}
          <div className="space-y-2">
            <label className="field-label text-cyan-400">OR PASTE RAW JSON TEXT</label>
            <textarea
              className="modal-input mono text-xs bg-slate-950 border-slate-800 text-cyan-300 p-3 h-28 resize-none"
              placeholder='[ { "title": "Well 1", "lat": 52.827, "lng": -110.538, "dls": "16-29-44-4 W4" } ]'
              value={jsonText}
              onChange={(e) => {
                setJsonText(e.target.value);
                parseAndValidateJson(e.target.value);
              }}
            />
          </div>

          {error && <div className="error-alert text-xs">{error}</div>}
          {successMsg && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-500/60 rounded-xl text-emerald-300 text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" /> {successMsg}
            </div>
          )}

          {/* Parsed JSON Preview Table */}
          {parsedData && parsedData.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-slate-200 uppercase">
                    JSON PREVIEW — {parsedData.length} {importType === 'geojson' ? 'GeoJSON Points' : 'Waypoints'} DETECTED
                  </span>
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {importType?.toUpperCase()} FORMAT
                </span>
              </div>

              <div className="border border-slate-800 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-bold sticky top-0">
                    <tr>
                      <th className="p-2">Title</th>
                      <th className="p-2">Latitude</th>
                      <th className="p-2">Longitude</th>
                      <th className="p-2">DLS / ATS Location</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    {parsedData.map((pt, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/60">
                        <td className="p-2 font-bold text-cyan-300">{pt.title}</td>
                        <td className="p-2 mono">{pt.lat ? pt.lat.toFixed(6) : '-'}</td>
                        <td className="p-2 mono">{pt.lng ? pt.lng.toFixed(6) : '-'}</td>
                        <td className="p-2 text-amber-300">{pt.dls || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  className="pane-btn primary text-xs font-bold px-5 py-2.5 shadow-lg"
                  onClick={handleImportToMap}
                  style={{ background: 'linear-gradient(135deg, #0284c7, #0369a1)', color: '#ffffff' }}
                >
                  <MapPin className="w-4 h-4 mr-1.5 inline" /> Import & Plot {parsedData.length} Points on Map
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
