import React from 'react';
import { X, MapPin, Calendar, Compass, Camera, ExternalLink, Download } from 'lucide-react';
import { formatAllCoordinates } from '../utils/coordinateConverter';

export default function PhotoModal({ photo, onClose, onFlyTo }) {
  if (!photo) return null;

  const coords = formatAllCoordinates(photo.lat, photo.lng);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="custom-modal-card converter-modal-width" onClick={(e) => e.stopPropagation()}>
        {/* Header Bar */}
        <div className="custom-modal-header">
          <div className="modal-header-left">
            <div className="modal-icon-badge cyan">
              <Camera className="w-5 h-5 text-cyan" />
            </div>
            <div>
              <h2 className="modal-header-title">{photo.title || 'Geotagged Media Viewer'}</h2>
              <p className="modal-header-subtitle">{photo.filename || 'IMG_SPATIAL_EXIF.JPG'}</p>
            </div>
          </div>
          <button className="modal-close-icon-btn" onClick={onClose}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body Grid */}
        <div className="grid grid-cols-[1fr_300px] overflow-hidden max-h-[75vh] bg-white">
          {/* Main Photo Preview Area */}
          <div className="photo-preview-container flex items-center justify-center p-4 bg-slate-950 overflow-hidden">
            <img src={photo.url} alt={photo.title} className="photo-modal-img max-h-[60vh] max-w-full object-contain rounded-xl shadow-lg" />
          </div>

          {/* Sidebar Metadata & Spatial Info Panel */}
          <div className="p-4 bg-slate-50 border-l border-slate-200 overflow-y-auto space-y-4">
            <div className="card-title-label">GEOSPATIAL EXIF DATA</div>

            <div className="space-y-2 p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyan-600 shrink-0" />
                <div>
                  <div className="text-[10px] font-bold text-slate-500">Lat / Lng (DD)</div>
                  <div className="text-xs font-mono font-bold text-slate-900">{coords.dd.formatted}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <div className="text-[10px] font-bold text-slate-500">UTM Grid</div>
                  <div className="text-xs font-mono font-bold text-slate-900">{coords.utm.formatted}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-indigo-600 shrink-0" />
                <div>
                  <div className="text-[10px] font-bold text-slate-500">MGRS Code</div>
                  <div className="text-xs font-mono font-bold text-slate-900">{coords.mgrs}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
                <div>
                  <div className="text-[10px] font-bold text-slate-500">Date Captured</div>
                  <div className="text-xs font-bold text-slate-900">{photo.date || '2026-08-13 14:22:08 UTC'}</div>
                </div>
              </div>
            </div>

            <div className="card-title-label">CAMERA & ELEVATION</div>
            <div className="p-3.5 bg-white border border-slate-200 rounded-xl grid grid-cols-2 gap-2 text-xs shadow-2xs">
              <div>
                <div className="text-[10px] font-bold text-slate-500">Altitude</div>
                <div className="font-bold text-slate-900">{photo.altitude || '142m MSL'}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-500">Heading</div>
                <div className="font-bold text-slate-900">{photo.heading || '245° SW'}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-500">Device</div>
                <div className="font-bold text-slate-900 truncate">{photo.camera || 'SargGeo Mobile'}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-500">Accuracy</div>
                <div className="font-bold text-slate-900">± 1.2 meters</div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                className="custom-btn primary full text-xs py-2"
                onClick={() => {
                  onFlyTo(photo.lat, photo.lng);
                  onClose();
                }}
              >
                <MapPin className="w-4 h-4" /> Zoom Map To Location
              </button>
              <a
                href={photo.url}
                download={photo.filename || 'geotagged_photo.jpg'}
                className="custom-btn secondary full text-xs py-2 justify-center"
                target="_blank"
                rel="noreferrer"
              >
                <Download className="w-4 h-4" /> Download Original
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
