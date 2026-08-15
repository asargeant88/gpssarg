import React from 'react';

/**
 * SargGeo Brand Logo Component
 * Renders "SargGe" + custom interactive 3D Blue Globe vector for the "O"
 */
export default function SargGeoLogo({ size = 'medium', iconOnly = false, className = '' }) {
  const globeSvg = (
    <svg
      viewBox="0 0 100 100"
      className="sarggeo-globe-svg"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Outer Atmosphere Glow Filter */}
        <filter id="atmosphere-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        {/* Globe Sphere Gradient */}
        <radialGradient id="globe-body" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="40%" stopColor="#0284c7" />
          <stop offset="85%" stopColor="#092d54" />
          <stop offset="100%" stopColor="#031124" />
        </radialGradient>

        {/* Grid Line Glow Gradient */}
        <linearGradient id="grid-line-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#0284c7" stopOpacity="0.4" />
        </linearGradient>

        {/* Ring Axis Gradient */}
        <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.1" />
          <stop offset="50%" stopColor="#34d399" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.1" />
        </linearGradient>
      </defs>

      {/* Atmospheric Outer Halo Ring */}
      <circle
        cx="50"
        cy="50"
        r="46"
        fill="none"
        stroke="#38bdf8"
        strokeWidth="1.5"
        strokeOpacity="0.4"
        filter="url(#atmosphere-glow)"
      />

      {/* Main Sphere Body */}
      <circle cx="50" cy="50" r="40" fill="url(#globe-body)" />

      {/* Continent Vector Shapes */}
      <g fill="#38bdf8" fillOpacity="0.35">
        <path d="M 22 30 C 26 24, 38 22, 42 28 C 45 34, 38 42, 32 44 C 26 46, 20 38, 22 30 Z" />
        <path d="M 34 48 C 40 48, 44 56, 40 68 C 36 74, 32 72, 30 62 Z" />
        <path d="M 52 24 C 64 22, 78 28, 76 38 C 72 44, 60 40, 56 32 Z" />
        <path d="M 54 44 C 62 42, 68 50, 64 62 C 58 68, 52 60, 54 44 Z" />
      </g>

      {/* Latitudinal Arcs */}
      <g stroke="url(#grid-line-grad)" strokeWidth="1.2" fill="none">
        <ellipse cx="50" cy="50" rx="40" ry="12" />
        <ellipse cx="50" cy="32" rx="35" ry="9" strokeDasharray="3,2" />
        <ellipse cx="50" cy="68" rx="35" ry="9" strokeDasharray="3,2" />
        <ellipse cx="50" cy="18" rx="24" ry="5" opacity="0.6" />
        <ellipse cx="50" cy="82" rx="24" ry="5" opacity="0.6" />
      </g>

      {/* Longitudinal Arcs */}
      <g stroke="url(#grid-line-grad)" strokeWidth="1.2" fill="none">
        <ellipse cx="50" cy="50" rx="12" ry="40" />
        <ellipse cx="50" cy="50" rx="28" ry="40" strokeDasharray="4,2" />
        <line x1="50" y1="10" x2="50" y2="90" strokeWidth="1.5" strokeOpacity="0.8" />
      </g>

      {/* Dynamic Orbital Axis Ring with Pulsing Node */}
      <g transform="rotate(-22 50 50)">
        <ellipse
          cx="50"
          cy="50"
          rx="46"
          ry="14"
          fill="none"
          stroke="url(#ring-grad)"
          strokeWidth="1.8"
        />
        <circle cx="96" cy="50" r="3.5" fill="#34d399" filter="url(#atmosphere-glow)" />
      </g>
    </svg>
  );

  if (iconOnly) {
    return (
      <div className={`sarggeo-globe-wrapper ${size} ${className}`} title="SargGeo Spatial Globe">
        {globeSvg}
      </div>
    );
  }

  return (
    <div className={`sarggeo-logo-container ${size} ${className}`}>
      <span className="sarggeo-brand-text">SargGe</span>
      <div className="sarggeo-globe-wrapper" title="SargGeo Spatial Globe">
        {globeSvg}
      </div>
    </div>
  );
}
