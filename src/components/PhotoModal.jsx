import React from 'react';
import { X, MapPin, Calendar, Compass, Camera, ExternalLink, Download } from 'lucide-react';
import { formatAllCoordinates } from '../utils/coordinateConverter';

export default function PhotoModal({ photo, onClose, onFlyTo }) {
  if (!photo) return null;

  const coords = formatAllCoordinates(photo.lat, photo.lng);

  return (
    <div className="photo-modal-backdrop" onClick={onClose}>
      <div className="photo-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header Bar */}
        <div className="photo-modal-header">
          <div className="modal-title-box">
            <Camera className="w-5 h-5 text-purple-400 mr-2.5" />
            <div>
              <h3 className="modal-title-text">{photo.title || 'Geotagged Photo'}</h3>
              <span className="modal-subtitle">{photo.filename || 'IMG_SPATIAL_EXIF.JPG'}</span>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body Grid */}
        <div className="photo-modal-body">
          {/* Main Photo Preview Area */}
          <div className="photo-preview-container">
            <img src={photo.url} alt={photo.title} className="photo-modal-img" />
          </div>

          {/* Sidebar Metadata & Spatial Info Panel */}
          <div className="photo-metadata-panel">
            <h4 className="meta-section-title">Geospatial EXIF Data</h4>

            <div className="meta-card">
              <div className="meta-item">
                <MapPin className="meta-icon text-cyan-400" />
                <div className="meta-details">
                  <span className="meta-label">Lat / Lng (DD)</span>
                  <span className="meta-val mono">{coords.dd.formatted}</span>
                </div>
              </div>

              <div className="meta-item">
                <Compass className="meta-icon text-emerald-400" />
                <div className="meta-details">
                  <span className="meta-label">UTM Grid</span>
                  <span className="meta-val mono">{coords.utm.formatted}</span>
                </div>
              </div>

              <div className="meta-item">
                <Compass className="meta-icon text-violet-400" />
                <div className="meta-details">
                  <span className="meta-label">MGRS Zone</span>
                  <span className="meta-val mono">{coords.mgrs}</span>
                </div>
              </div>

              <div className="meta-item">
                <Calendar className="meta-icon text-amber-400" />
                <div className="meta-details">
                  <span className="meta-label">Date Taken</span>
                  <span className="meta-val">{photo.date || '2026-08-13 14:22:08 UTC'}</span>
                </div>
              </div>
            </div>

            <h4 className="meta-section-title mt-4">Camera & Elevation</h4>
            <div className="meta-card">
              <div className="meta-grid-2">
                <div>
                  <span className="meta-label">Altitude</span>
                  <span className="meta-val">{photo.altitude || '142m MSL'}</span>
                </div>
                <div>
                  <span className="meta-label">Heading</span>
                  <span className="meta-val">{photo.heading || '245° SW'}</span>
                </div>
                <div>
                  <span className="meta-label">Device</span>
                  <span className="meta-val">{photo.camera || 'SargGeo Mobile'}</span>
                </div>
                <div>
                  <span className="meta-label">Accuracy</span>
                  <span className="meta-val">± 1.2 meters</span>
                </div>
              </div>
            </div>

            <div className="modal-actions-box">
              <button
                className="modal-action-btn primary"
                onClick={() => {
                  onFlyTo(photo.lat, photo.lng);
                  onClose();
                }}
              >
                <MapPin className="w-4 h-4 mr-2" /> Zoom Map To Location
              </button>
              <a
                href={photo.url}
                download={photo.filename || 'geotagged_photo.jpg'}
                className="modal-action-btn secondary"
                target="_blank"
                rel="noreferrer"
              >
                <Download className="w-4 h-4 mr-2" /> Download Original
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
