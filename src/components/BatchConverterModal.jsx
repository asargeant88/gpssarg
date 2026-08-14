import React, { useState, useEffect } from 'react';
import { X, Layers, Download, Copy, Check, MapPin, Play, RefreshCw, FileText, Globe, Compass } from 'lucide-react';
import { formatAllCoordinates, parseLocationInput, dlsToDd } from '../utils/coordinateConverter';

const SAMPLE_BATCHES = {
  dls: `16-29-44-4 W4
8-29-44-4 W4
5-27-43-1 W4
11-20-42-3 W4
1-1-1-4 W4
12-36-50-25 W4`,
  dd: `52.819823, -110.539182
52.731429, -110.074108
52.632377, -110.405860
51.0447, -114.0719
53.5461, -113.4938`,
  utm: `12N 540211E 5831543N
12N 531492E 5851208N
12N 562521E 5842797N
11N 705200E 5659000N`,
  mixed: `8-29-44-4 W4
52.731429, -110.074108
12N 540211E 5831543N
52° 37' 57" N, 110° 24' 21" W
11-20-42-3 W4`
};

export default function BatchConverterModal({ isOpen, onClose, onAddWaypointsBatch, onFlyTo, onCheckConversionLimit }) {
  const [rawInput, setRawInput] = useState(SAMPLE_BATCHES.dls);
  const [results, setResults] = useState([]);
  const [copied, setCopied] = useState(false);

  // Convert lines whenever rawInput changes
  useEffect(() => {
    if (!isOpen) return;

    if (onCheckConversionLimit) {
      const allowed = onCheckConversionLimit(1);
      if (!allowed) return;
    }

    const lines = rawInput.split('\n').map(l => l.trim()).filter(Boolean);
    let isCurrent = true;

    const initialList = lines.map((line, idx) => {
      // 1. Try DLS parser
      const dlsParsed = dlsToDd(line);
      if (dlsParsed && dlsParsed.isValid) {
        const coords = formatAllCoordinates(dlsParsed.lat, dlsParsed.lng);
        return {
          id: idx + 1,
          rawInput: line,
          lat: dlsParsed.lat,
          lng: dlsParsed.lng,
          dlsStr: coords.dls.isValid ? coords.dls.shortFormatted : line.toUpperCase(),
          ddStr: coords.dd.formatted,
          dmsStr: coords.dms.formatted,
          utmStr: coords.utm.formatted,
          mgrsStr: coords.mgrs,
          isValid: true
        };
      }

      // 2. Try general location parser (DD, MGRS, UTM, etc)
      const parsed = parseLocationInput(line);
      if (parsed && (parsed.lat != null && parsed.lng != null)) {
        const coords = formatAllCoordinates(parsed.lat, parsed.lng);
        return {
          id: idx + 1,
          rawInput: line,
          lat: parsed.lat,
          lng: parsed.lng,
          dlsStr: coords.dls.isValid ? coords.dls.shortFormatted : 'N/A',
          ddStr: coords.dd.formatted,
          dmsStr: coords.dms.formatted,
          utmStr: coords.utm.formatted,
          mgrsStr: coords.mgrs,
          isValid: true
        };
      }

      return {
        id: idx + 1,
        rawInput: line,
        lat: null,
        lng: null,
        dlsStr: 'Invalid Format',
        ddStr: 'N/A',
        dmsStr: 'N/A',
        utmStr: 'N/A',
        mgrsStr: 'N/A',
        isValid: false
      };
    });

    setResults(initialList);

    // Asynchronously fetch official government ATS DLS attributes for all valid batch coordinates
    Promise.all(
      initialList.map(async (item) => {
        if (!item.isValid || item.lat == null || item.lng == null) return item;
        try {
          const res = await fetchDlsPolygons(item.lat, item.lng);
          if (res && res.dls && res.dls.isValid) {
            return {
              ...item,
              dlsStr: res.dls.shortFormatted,
              officialDls: res.dls
            };
          }
        } catch (e) {}
        return item;
      })
    ).then((officialList) => {
      if (isCurrent) setResults(officialList);
    });

    return () => { isCurrent = false; };
  }, [rawInput, isOpen]);

  if (!isOpen) return null;

  const validResults = results.filter(r => r.isValid);

  // Export CSV
  const handleExportCSV = () => {
    if (results.length === 0) return;
    const header = 'ID,Input,DLS_LSD,Latitude,Longitude,DMS,UTM,MGRS\n';
    const rows = results.map(r => 
      `"${r.id}","${r.rawInput}","${r.dlsStr}","${r.lat || ''}","${r.lng || ''}","${r.dmsStr}","${r.utmStr}","${r.mgrsStr}"`
    ).join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SargGeo_Batch_Coordinates_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export GeoJSON
  const handleExportGeoJSON = () => {
    if (validResults.length === 0) return;
    const features = validResults.map(r => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [r.lng, r.lat]
      },
      properties: {
        id: r.id,
        input: r.rawInput,
        dls: r.dlsStr,
        dms: r.dmsStr,
        utm: r.utmStr,
        mgrs: r.mgrsStr
      }
    }));

    const geojson = {
      type: 'FeatureCollection',
      features
    };

    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SargGeo_Batch_Points_${Date.now()}.geojson`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy CSV to clipboard
  const handleCopyCSV = () => {
    const header = 'Input\tDLS/LSD\tLatitude\tLongitude\tUTM\tMGRS\n';
    const text = header + results.map(r => 
      `${r.rawInput}\t${r.dlsStr}\t${r.lat || 'N/A'}\t${r.lng || 'N/A'}\t${r.utmStr}\t${r.mgrsStr}`
    ).join('\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Plot all valid batch points onto map
  const handlePlotAllOnMap = () => {
    if (validResults.length === 0) return;

    const newWaypoints = validResults.map(r => ({
      id: Date.now() + Math.random(),
      title: r.dlsStr !== 'N/A' ? `LSD ${r.dlsStr}` : `Batch Point ${r.id}`,
      notes: `Batch converted from '${r.rawInput}' (${r.ddStr})`,
      lat: r.lat,
      lng: r.lng,
      dls: r.officialDls,
      color: '#38bdf8',
      category: 'Batch Converted'
    }));

    if (onAddWaypointsBatch) {
      onAddWaypointsBatch(newWaypoints);
    }

    // Fly to first point
    if (validResults[0] && onFlyTo) {
      onFlyTo(validResults[0].lat, validResults[0].lng, 12);
    }

    onClose();
  };

  return (
    <div className="photo-modal-backdrop" onClick={onClose}>
      <div className="batch-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="photo-modal-header">
          <div className="modal-title-box">
            <Layers className="w-5 h-5 text-amber-400 mr-2.5" />
            <div>
              <h3 className="modal-title-text">Coordinate King — Batch Converter</h3>
              <span className="modal-subtitle">Batch convert DLS/ATS, DD, DMS, UTM, & MGRS coordinates in real time</span>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="batch-modal-body">
          {/* Left Column: Multi-line Input & Sample Controls */}
          <div className="batch-input-column">
            <div className="flex items-center justify-between mb-2">
              <label className="field-label text-cyan-400">BATCH INPUT DATA (ONE PER LINE)</label>
              <span className="text-xs text-slate-400 font-mono">{results.length} items ({validResults.length} valid)</span>
            </div>

            <textarea
              className="batch-textarea mono"
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              placeholder="Paste list of DLS (e.g. 16-29-44-4 W4) or Lat, Lng coordinates..."
              rows={12}
            />

            <div className="batch-samples-row mt-3">
              <span className="text-xs text-slate-400 font-semibold block mb-1">LOAD SAMPLE PRESETS:</span>
              <div className="flex gap-2 flex-wrap">
                <button
                  className="pane-btn secondary small"
                  onClick={() => setRawInput(SAMPLE_BATCHES.dls)}
                >
                  <FileText className="w-3.5 h-3.5 mr-1 text-amber-400" /> Alberta ATS / DLS List
                </button>
                <button
                  className="pane-btn secondary small"
                  onClick={() => setRawInput(SAMPLE_BATCHES.dd)}
                >
                  <Globe className="w-3.5 h-3.5 mr-1 text-cyan-400" /> Lat / Lng Decimal Degrees
                </button>
                <button
                  className="pane-btn secondary small"
                  onClick={() => setRawInput(SAMPLE_BATCHES.utm)}
                >
                  <Compass className="w-3.5 h-3.5 mr-1 text-purple-400" /> UTM Grid Strings
                </button>
                <button
                  className="pane-btn secondary small"
                  onClick={() => setRawInput(SAMPLE_BATCHES.mixed)}
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Mixed Formats
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Real-time Converted Table Results */}
          <div className="batch-results-column">
            <div className="flex items-center justify-between mb-2">
              <label className="field-label text-emerald-400">CONVERTED MULTI-GRID RESULTS</label>
              <div className="flex gap-1.5">
                <button
                  className="pane-btn secondary small"
                  onClick={handleCopyCSV}
                  title="Copy formatted table"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  className="pane-btn secondary small"
                  onClick={handleExportCSV}
                  title="Export to CSV Spreadsheet"
                >
                  <Download className="w-3.5 h-3.5 mr-1" /> CSV
                </button>
                <button
                  className="pane-btn secondary small"
                  onClick={handleExportGeoJSON}
                  title="Export to GeoJSON"
                >
                  <Download className="w-3.5 h-3.5 mr-1" /> GeoJSON
                </button>
              </div>
            </div>

            <div className="batch-table-container">
              <table className="batch-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Input String</th>
                    <th>DLS / ATS</th>
                    <th>Lat, Lng (DD)</th>
                    <th>UTM Grid</th>
                    <th>MGRS Code</th>
                  </tr>
                </thead>
                <tbody>
                  {results.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center text-slate-500 py-6">
                        Paste coordinates or load a sample batch to convert.
                      </td>
                    </tr>
                  ) : (
                    results.map((r) => (
                      <tr key={r.id} className={r.isValid ? 'valid-row' : 'invalid-row'}>
                        <td className="mono text-slate-400">{r.id}</td>
                        <td className="mono font-semibold text-slate-200">{r.rawInput}</td>
                        <td className="mono text-amber-300 font-bold">{r.dlsStr}</td>
                        <td className="mono text-cyan-300">{r.ddStr}</td>
                        <td className="mono text-emerald-300">{r.utmStr}</td>
                        <td className="mono text-slate-300">{r.mgrsStr}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="photo-lsd-actions flex items-center justify-between p-4 bg-slate-900 border-t border-slate-800">
          <div className="text-xs text-slate-400">
            Ready to plot <strong className="text-cyan-300">{validResults.length}</strong> valid converted point(s) onto map.
          </div>
          <div className="flex gap-2">
            <button className="pane-btn secondary" onClick={onClose}>
              Close
            </button>
            <button
              className="pane-btn primary"
              onClick={handlePlotAllOnMap}
              disabled={validResults.length === 0}
            >
              <MapPin className="w-4 h-4 mr-1.5" /> Plot All ({validResults.length}) on Map
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
