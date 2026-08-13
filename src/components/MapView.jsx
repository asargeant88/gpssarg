import React, { useEffect, useState, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Polygon,
  useMapEvents,
  useMap
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Copy, Plus, Check } from 'lucide-react';
import { formatAllCoordinates, getDlsPolygons, fetchDlsPolygons } from '../utils/coordinateConverter';

// Fix default icon paths in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Official Alberta ATS grid overlay using the government's ArcGIS MapServer
// This renders the exact surveyed grid lines that roads were built on.
// Only visible at zoom >= 13 to avoid cluttering at large scales.
function AlbertaATSGridLayer() {
  const map = useMap();
  useEffect(() => {
    const ATS_URL = 'https://geospatial.alberta.ca/titan/rest/services/base/alberta_township_system/MapServer';

    const atsLayer = L.tileLayer(
      '', // URL built dynamically per tile
      {
        minZoom: 12,
        maxZoom: 19,
        opacity: 0.7,
        attribution: 'ATS Grid &copy; Government of Alberta',
        bounds: L.latLngBounds([48.9, -120.5], [60.1, -96.0]),
        tileSize: 512,
      }
    );

    // Custom getTileUrl to inject bbox per tile (ArcGIS REST requires lat/lng bbox)
    atsLayer.getTileUrl = function(coords) {
      const tileBounds = this._tileCoordsToBounds(coords);
      const sw = tileBounds.getSouthWest();
      const ne = tileBounds.getNorthEast();
      const bbox = `${sw.lng},${sw.lat},${ne.lng},${ne.lat}`;
      return (
        `${ATS_URL}/export?` +
        `bbox=${encodeURIComponent(bbox)}&bboxSR=4326&` +
        `layers=show:0,1,2,3&` +
        `size=512,512&imageSR=3857&` +
        `transparent=true&format=png32&f=image`
      );
    };

    atsLayer.addTo(map);
    return () => { map.removeLayer(atsLayer); };
  }, [map]);

  return null;
}

// Custom neon SVG pin marker builder for waypoints
const createCustomPinIcon = (color = '#38bdf8') => {
  const svgHtml = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="32" height="48">
      <defs>
        <filter id="pin-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#000000" flood-opacity="0.6"/>
        </filter>
      </defs>
      <path d="M 12 0 C 5.37 0 0 5.37 0 12 C 0 21 12 36 12 36 C 12 36 24 21 24 12 C 24 5.37 18.63 0 12 0 Z" fill="${color}" stroke="#ffffff" stroke-width="1.5" filter="url(#pin-shadow)"/>
      <circle cx="12" cy="12" r="4.5" fill="#0f172a"/>
    </svg>
  `;
  return L.divIcon({
    html: svgHtml,
    className: 'sarggeo-custom-pin',
    iconSize: [32, 48],
    iconAnchor: [16, 48],
    popupAnchor: [0, -44]
  });
};

// Custom Inspection Pin icon (White pin matching photo style)
const createInspectionIcon = () => {
  const svgHtml = `
    <div style="
      width: 16px;
      height: 16px;
      background: #ffffff;
      border: 3px solid #64748b;
      border-radius: 50%;
      box-shadow: 0 4px 10px rgba(0,0,0,0.4);
    "></div>
  `;
  return L.divIcon({
    html: svgHtml,
    className: 'sarggeo-photo-lsd-pin',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -12]
  });
};

// Custom photo marker icon
const createPhotoIcon = () => {
  const svgHtml = `
    <div className="photo-marker-wrapper" style="
      background: linear-gradient(135deg, #a855f7, #6366f1);
      border: 2px solid #ffffff;
      border-radius: 50%;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 14px rgba(168, 85, 247, 0.5);
    ">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
        <circle cx="12" cy="13" r="3"></circle>
      </svg>
    </div>
  `;
  return L.divIcon({
    html: svgHtml,
    className: 'sarggeo-photo-pin',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20]
  });
};

// Component to programmatically center/fly map when target location changes
function MapFlyHandler({ flyTarget }) {
  const map = useMap();
  useEffect(() => {
    if (flyTarget && flyTarget.lat != null && flyTarget.lng != null) {
      map.flyTo([flyTarget.lat, flyTarget.lng], flyTarget.zoom || 14, {
        duration: 1.8
      });
    }
  }, [flyTarget, map]);
  return null;
}

// Component to capture mouse hover and click events
function MapEventsHandler({ onCursorMove, onMapClick, onZoomChange }) {
  const map = useMapEvents({
    mousemove(e) {
      onCursorMove({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
    click(e) {
      onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
    zoomend() {
      onZoomChange(map.getZoom());
    }
  });

  useEffect(() => {
    onZoomChange(map.getZoom());
  }, [map, onZoomChange]);

  return null;
}

export default function MapView({
  basemap,
  showGridLines,
  waypoints,
  photos,
  flyTarget,
  inspectedPoint,
  measurePoints,
  onCursorMove,
  onMapClick,
  onZoomChange,
  onSaveWaypoint,
  onSelectPhoto
}) {
  const [addressLabel, setAddressLabel] = useState('Fetching location...');
  const [copiedKey, setCopiedKey] = useState(null);

  // Tile URLs
  const basemapUrls = {
    dark: {
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; CARTO &copy; OpenStreetMap'
    },
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Tiles &copy; Esri'
    },
    street: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; OpenStreetMap'
    },
    topo: {
      url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      attribution: 'Map data: &copy; OpenStreetMap'
    }
  };

  const currentTile = basemapUrls[basemap] || basemapUrls.dark;

  // Reverse geocode when inspectedPoint changes
  useEffect(() => {
    if (inspectedPoint) {
      setAddressLabel('Geocoding coordinates...');
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${inspectedPoint.lat}&lon=${inspectedPoint.lng}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.display_name) {
            const parts = data.display_name.split(',');
            const shortName = parts.slice(0, 3).join(', ');
            setAddressLabel(shortName);
          } else {
            setAddressLabel(`Point (${inspectedPoint.lat.toFixed(4)}, ${inspectedPoint.lng.toFixed(4)})`);
          }
        })
        .catch(() => {
          setAddressLabel(`Point (${inspectedPoint.lat.toFixed(4)}, ${inspectedPoint.lng.toFixed(4)})`);
        });
    }
  }, [inspectedPoint]);

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // dlsPolygons: fetch official government-certified boundaries directly to avoid visual jump
  const [dlsPolygons, setDlsPolygons] = useState(null);
  useEffect(() => {
    if (!inspectedPoint) { setDlsPolygons(null); return; }
    let isCurrent = true;
    fetchDlsPolygons(inspectedPoint.lat, inspectedPoint.lng)
      .then(polys => {
        if (isCurrent && polys) setDlsPolygons(polys);
      })
      .catch(() => {
        if (isCurrent) setDlsPolygons(getDlsPolygons(inspectedPoint.lat, inspectedPoint.lng));
      });
    return () => { isCurrent = false; };
  }, [inspectedPoint]);

  return (
    <div className="map-view-wrapper">
      <MapContainer
        center={[52.635911, -110.217777]}
        zoom={12}
        zoomControl={false}
        className="leaflet-map-canvas"
      >
        <TileLayer
          url={currentTile.url}
          attribution={currentTile.attribution}
          maxZoom={19}
        />

        {/* Official Alberta Government ATS Grid Overlay */}
        {/* This renders the exact surveyed section/LSD grid lines the roads were built on */}
        <AlbertaATSGridLayer />

        <MapFlyHandler flyTarget={flyTarget} />

        <MapEventsHandler
          onCursorMove={onCursorMove}
          onMapClick={onMapClick}
          onZoomChange={onZoomChange}
        />

        {/* Dynamic Blue Border Highlights for Selected LSD Location */}
        {dlsPolygons && (
          <>
            {/* 1. Big Section Blue Border (1x1 mile square) */}
            <Polygon
              positions={dlsPolygons.sectionBounds}
              pathOptions={{
                color: '#0284c7',
                weight: 2,
                fill: false,
                dashArray: '6, 6'
              }}
            />

            {/* 2. Quarter Section Blue Border (1/2 x 1/2 mile square) */}
            <Polygon
              positions={dlsPolygons.quarterBounds}
              pathOptions={{
                color: '#38bdf8',
                weight: 2.5,
                fillColor: '#0284c7',
                fillOpacity: 0.15
              }}
            />

            {/* 3. Sub-section LSD Blue Border (1/4 x 1/4 mile square) */}
            <Polygon
              positions={dlsPolygons.lsdBounds}
              pathOptions={{
                color: '#00f0ff',
                weight: 3.5,
                fillColor: '#38bdf8',
                fillOpacity: 0.35
              }}
            />
          </>
        )}

        {/* Measurement Polyline */}
        {measurePoints && measurePoints.length > 1 && (
          <Polyline
            positions={measurePoints.map(p => [p.lat, p.lng])}
            color="#34d399"
            weight={3}
            dashArray="6, 6"
          />
        )}

        {/* Interactive Inspected Point Marker & Photo-Style Popup */}
        {inspectedPoint && (
          <Marker
            position={[inspectedPoint.lat, inspectedPoint.lng]}
            icon={createInspectionIcon()}
          >
            <Popup
              className="sarggeo-popup photo-lsd-popup"
              autoPan={true}
            >
              {(() => {
                const coords = formatAllCoordinates(inspectedPoint.lat, inspectedPoint.lng);
                const lsdHeader = coords.dls.isValid
                  ? coords.dls.shortFormatted
                  : `${inspectedPoint.lat.toFixed(4)}, ${inspectedPoint.lng.toFixed(4)}`;

                return (
                  <div className="photo-lsd-card">
                    {/* Top Header Bar matching user's photo */}
                    <div className="photo-lsd-header">
                      <span>{lsdHeader}</span>
                    </div>

                    {/* Location Name / Address Subheader */}
                    <div className="photo-lsd-location">
                      {addressLabel}
                    </div>

                    <div className="photo-lsd-divider" />

                    {/* Details List matching photo format */}
                    <div className="photo-lsd-details">
                      {coords.dls.isValid && (
                        <>
                          <div className="photo-lsd-row highlight">
                            <span className="lsd-blue-badge">LSD</span>
                            <span className="mono bold-val">{coords.dls.shortFormatted}</span>
                          </div>
                          <div className="photo-lsd-row sub">
                            <span className="mono text-muted-val">{coords.dls.quarterFormatted}</span>
                          </div>
                        </>
                      )}

                      <div className="photo-lsd-row">
                        <span className="mono">{coords.utm.formatted}</span>
                      </div>

                      <div className="photo-lsd-row">
                        <span className="mono">{coords.dd.lat}°, {coords.dd.lng}°</span>
                      </div>

                      <div className="photo-lsd-row">
                        <span className="mono">{coords.dms.lat}, {coords.dms.lng}</span>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="photo-lsd-actions">
                      <button
                        className="photo-popup-btn primary"
                        onClick={() => {
                          onSaveWaypoint({
                            id: Date.now(),
                            title: lsdHeader,
                            notes: addressLabel,
                            lat: inspectedPoint.lat,
                            lng: inspectedPoint.lng,
                            color: '#38bdf8',
                            category: 'LSD Point'
                          });
                        }}
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" /> Add Point
                      </button>
                      <button
                        className="photo-popup-btn secondary"
                        onClick={() => handleCopy(coords.dd.formatted, 'lsd_popup_copy')}
                      >
                        {copiedKey === 'lsd_popup_copy' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                        Copy Coords
                      </button>
                    </div>
                  </div>
                );
              })()}
            </Popup>
          </Marker>
        )}

        {/* Saved Waypoint Markers */}
        {waypoints.map((wp) => {
          const coords = formatAllCoordinates(wp.lat, wp.lng);
          return (
            <Marker
              key={wp.id}
              position={[wp.lat, wp.lng]}
              icon={createCustomPinIcon(wp.color || '#38bdf8')}
            >
              <Popup className="sarggeo-popup">
                <div className="popup-card">
                  <div className="popup-header">
                    <span className="popup-title">{wp.title || 'Saved Point'}</span>
                    <span className="popup-badge">{wp.category || 'Waypoint'}</span>
                  </div>
                  {wp.notes && <p className="popup-notes">{wp.notes}</p>}
                  
                  <div className="popup-coords-box">
                    {coords.dls.isValid && (
                      <div className="popup-coord-row">
                        <span className="popup-label text-amber-400">DLS / LSD:</span>
                        <span className="popup-value mono text-amber-300">{coords.dls.shortFormatted}</span>
                      </div>
                    )}
                    <div className="popup-coord-row">
                      <span className="popup-label">Lat/Lng:</span>
                      <span className="popup-value mono">{coords.dd.formatted}</span>
                    </div>
                    <div className="popup-coord-row">
                      <span className="popup-label">UTM:</span>
                      <span className="popup-value mono">{coords.utm.formatted}</span>
                    </div>
                  </div>

                  <div className="popup-footer">
                    <button
                      className="popup-action-btn"
                      onClick={() => handleCopy(coords.dd.formatted, `wp_${wp.id}`)}
                    >
                      {copiedKey === `wp_${wp.id}` ? <Check className="w-3 h-3 text-emerald-400 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                      Copy Coords
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Photo Markers */}
        {photos.map((photo) => (
          <Marker
            key={photo.id}
            position={[photo.lat, photo.lng]}
            icon={createPhotoIcon()}
            eventHandlers={{
              click: () => onSelectPhoto(photo)
            }}
          >
            <Popup className="sarggeo-popup">
              <div className="popup-photo-card">
                <img src={photo.url} alt={photo.title} className="popup-photo-img" />
                <div className="popup-photo-info">
                  <span className="popup-title">{photo.title}</span>
                  <span className="popup-date">{photo.date}</span>
                </div>
                <button
                  className="popup-action-btn full"
                  onClick={() => onSelectPhoto(photo)}
                >
                  View Full Media Details
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
