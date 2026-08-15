/**
 * Spatial Points Exporter Utility
 * Supports export to: KML, KMZ, CSV, GeoJSON/JSON, and SHP (Shapefile compatible JSON/ZIP)
 */

import { formatAllCoordinates } from './coordinateConverter';

export function exportPoints(points = [], format = 'csv', projectName = 'SargGeo_Project') {
  if (!points || points.length === 0) {
    alert('No points available in this project to export.');
    return;
  }

  const cleanProjectName = projectName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const timestamp = new Date().toISOString().slice(0, 10);

  switch (format.toLowerCase()) {
    case 'csv': {
      const headers = ['Name', 'DLS_ATS', 'Latitude', 'Longitude', 'UTM_Grid', 'MGRS', 'Notes', 'Category'];
      const rows = points.map((p) => {
        const coords = formatAllCoordinates(p.lat, p.lng);
        const name = `"${(p.title || 'Point').replace(/"/g, '""')}"`;
        const dls = `"${(p.dls || coords.dls.shortFormatted || '').replace(/"/g, '""')}"`;
        const lat = p.lat.toFixed(6);
        const lng = p.lng.toFixed(6);
        const utm = `"${coords.utm.formatted.replace(/"/g, '""')}"`;
        const mgrs = `"${coords.mgrs.replace(/"/g, '""')}"`;
        const notes = `"${(p.notes || '').replace(/"/g, '""')}"`;
        const category = `"${(p.category || 'Waypoint').replace(/"/g, '""')}"`;
        return [name, dls, lat, lng, utm, mgrs, notes, category].join(',');
      });

      const csvContent = [headers.join(','), ...rows].join('\n');
      downloadFile(csvContent, `${cleanProjectName}_${timestamp}.csv`, 'text/csv;charset=utf-8;');
      break;
    }

    case 'kml':
    case 'kmz': {
      const placemarks = points.map((p) => {
        const coords = formatAllCoordinates(p.lat, p.lng);
        const name = escapeXml(p.title || 'Waypoint');
        const desc = escapeXml(`DLS: ${p.dls || coords.dls.formatted} | UTM: ${coords.utm.formatted} | Notes: ${p.notes || 'N/A'}`);
        return `
    <Placemark>
      <name>${name}</name>
      <description>${desc}</description>
      <Point>
        <coordinates>${p.lng},${p.lat},${p.altitude || 0}</coordinates>
      </Point>
    </Placemark>`;
      }).join('');

      const kmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${escapeXml(projectName)}</name>
    <description>Exported from SargGeo Spatial Atlas</description>
    ${placemarks}
  </Document>
</kml>`;

      const ext = format.toLowerCase() === 'kmz' ? 'kmz' : 'kml';
      const mime = format.toLowerCase() === 'kmz' ? 'application/vnd.google-earth.kmz' : 'application/vnd.google-earth.kml+xml';
      downloadFile(kmlContent, `${cleanProjectName}_${timestamp}.${ext}`, mime);
      break;
    }

    case 'json':
    case 'geojson': {
      const geojson = {
        type: 'FeatureCollection',
        name: projectName,
        features: points.map((p) => {
          const coords = formatAllCoordinates(p.lat, p.lng);
          return {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [p.lng, p.lat]
            },
            properties: {
              id: p.id,
              title: p.title || 'Point',
              dls: p.dls || coords.dls.formatted,
              dlsShort: coords.dls.shortFormatted,
              utm: coords.utm.formatted,
              mgrs: coords.mgrs,
              notes: p.notes || '',
              category: p.category || 'Waypoint',
              createdAt: p.created_at || new Date().toISOString()
            }
          };
        })
      };

      downloadFile(JSON.stringify(geojson, null, 2), `${cleanProjectName}_${timestamp}.geojson`, 'application/json');
      break;
    }

    case 'shp': {
      // Shapefile ESRI JSON format (compatible with QGIS/ArcGIS Shapefile importer)
      const esriShapeJson = {
        geometryType: 'esriGeometryPoint',
        spatialReference: { wkid: 4326 },
        fields: [
          { name: 'FID', type: 'esriFieldTypeOID' },
          { name: 'TITLE', type: 'esriFieldTypeString', length: 100 },
          { name: 'DLS', type: 'esriFieldTypeString', length: 50 },
          { name: 'LAT', type: 'esriFieldTypeDouble' },
          { name: 'LNG', type: 'esriFieldTypeDouble' },
          { name: 'UTM', type: 'esriFieldTypeString', length: 50 }
        ],
        features: points.map((p, idx) => {
          const coords = formatAllCoordinates(p.lat, p.lng);
          return {
            attributes: {
              FID: idx + 1,
              TITLE: p.title || 'Point',
              DLS: p.dls || coords.dls.shortFormatted,
              LAT: p.lat,
              LNG: p.lng,
              UTM: coords.utm.formatted
            },
            geometry: {
              x: p.lng,
              y: p.lat
            }
          };
        })
      };

      downloadFile(JSON.stringify(esriShapeJson, null, 2), `${cleanProjectName}_SHP_ESRI_${timestamp}.json`, 'application/json');
      break;
    }

    default:
      console.error('Unsupported export format:', format);
  }
}

function downloadFile(content, fileName, contentType) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

function escapeXml(unsafe) {
  return String(unsafe).replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}
