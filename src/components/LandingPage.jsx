import React, { useState } from 'react';
import {
  Globe,
  MapPin,
  FileSpreadsheet,
  UploadCloud,
  Download,
  Key,
  Camera,
  Layers,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Zap,
  Compass,
  FileText,
  Scale,
  Database
} from 'lucide-react';
import SargGeoLogo from './SargGeoLogo';

export default function LandingPage({ onLaunchApp, onOpenAuthModal, onOpenUpgradeModal, onOpenTosModal }) {
  const [activeFeatureTab, setActiveFeatureTab] = useState('dls');

  return (
    <div className="landing-page-container">
      {/* LANDING HEADER BAR */}
      <header className="landing-header">
        <div className="landing-header-content">
          <div className="flex items-center gap-3">
            <SargGeoLogo size="small" />
            <span className="top-bar-pipe">|</span>
            <span className="top-bar-subtitle">Spatial Intelligence</span>
          </div>

          <nav className="landing-nav">
            <a href="#features" className="nav-link">Capabilities</a>
            <a href="#pro" className="nav-link">Pro Tier</a>
            <a href="#developer" className="nav-link">Developer API</a>
            <button type="button" className="nav-link-btn" onClick={onOpenTosModal}>
              Legal Disclaimers
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="custom-btn secondary text-xs px-4 py-2"
              onClick={onOpenAuthModal}
            >
              Sign In
            </button>

            <button
              type="button"
              className="custom-btn primary text-xs px-5 py-2 font-black"
              onClick={onLaunchApp}
            >
              Launch Live App <ArrowRight className="w-4 h-4 ml-1 inline" />
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="hero-section">
        <div className="hero-badge">
          <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          <span>DOMINION LAND SURVEY & SPATIAL INTELLIGENCE PLATFORM</span>
        </div>

        <h1 className="hero-title">
          Enterprise Spatial Intelligence & Grid Atlas for Energy, Land Surveyors & GIS Engineers
        </h1>

        <p className="hero-subtitle">
          Instant Alberta DLS / ATS Dominion Land Survey conversions, 3D DEM terrain elevation lookup, multi-format KMZ/KML/GeoJSON import & export, geotagged media mapping, and developer REST APIs.
        </p>

        <div className="hero-cta-group">
          <button
            type="button"
            className="custom-btn primary text-sm font-black px-8 py-3.5 shadow-lg flex items-center justify-center gap-2"
            onClick={onLaunchApp}
          >
            <Compass className="w-5 h-5 text-cyan-200" />
            <span>Launch Interactive Map App</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          <button
            type="button"
            className="custom-btn amber-pro-btn text-sm font-black px-7 py-3.5 shadow-md flex items-center justify-center gap-2"
            onClick={onOpenUpgradeModal}
          >
            <Sparkles className="w-5 h-5 text-amber-500" />
            <span>Upgrade to Pro ($15/mo)</span>
          </button>
        </div>

        {/* HERO APP DEMO SHOWCASE CARD */}
        <div className="hero-showcase-container">
          <div className="hero-showcase-header">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <div className="w-3 h-3 rounded-full bg-amber-400"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
              <span className="text-xs font-bold text-slate-400 ml-2">SargGeo Interactive Spatial Workspace v2.5</span>
            </div>
            <div className="text-xs font-mono text-cyan-400 bg-cyan-950/80 px-3 py-1 rounded-full border border-cyan-800">
              ● LIVE PLATFORM ENGINE
            </div>
          </div>

          <div className="hero-showcase-body">
            <div className="showcase-grid">
              <div className="showcase-card">
                <div className="showcase-card-icon cyan">
                  <MapPin className="w-6 h-6" />
                </div>
                <h3 className="showcase-card-title">Dominion Land Survey (DLS / ATS)</h3>
                <p className="showcase-card-text">
                  Precision Section, Township, Range, Meridian, and LSD boundary polygon lookup across Western Canada.
                </p>
                <div className="showcase-tag">16-29-44-4 W4 • LSD 16</div>
              </div>

              <div className="showcase-card">
                <div className="showcase-card-icon amber">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <h3 className="showcase-card-title">Project Data Spreadsheet Grid</h3>
                <p className="showcase-card-text">
                  Full 1240px spreadsheet view with sortable columns, live search, DEM elevation in meters & feet, and single/batch point addition.
                </p>
                <div className="showcase-tag amber">629m (2063.6ft) DEM Elev</div>
              </div>

              <div className="showcase-card">
                <div className="showcase-card-icon emerald">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <h3 className="showcase-card-title">KMZ / KML / GeoJSON / CSV Importer</h3>
                <p className="showcase-card-text">
                  Drag & drop KML Placemarks, KMZ archives, GeoJSON features, or CSV rows straight to active project databases.
                </p>
                <div className="showcase-tag emerald">KML / KMZ / GeoJSON / SHP</div>
              </div>

              <div className="showcase-card">
                <div className="showcase-card-icon purple">
                  <Key className="w-6 h-6" />
                </div>
                <h3 className="showcase-card-title">Developer REST API Portal</h3>
                <p className="showcase-card-text">
                  Generate secure API keys for Python data pipelines, cURL scripts, and custom enterprise GIS software.
                </p>
                <div className="showcase-tag purple">x-api-key Authentication</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE CAPABILITIES SECTION */}
      <section id="features" className="capabilities-section">
        <div className="section-header">
          <span className="section-subtitle">PLATFORM CAPABILITIES</span>
          <h2 className="section-title">Built specifically for Canadian Energy & GIS Engineering Workflows</h2>
        </div>

        <div className="capabilities-grid">
          <div className="capability-box">
            <div className="capability-icon">
              <Globe className="w-6 h-6 text-cyan-600" />
            </div>
            <h3>Universal Coordinate Engine</h3>
            <p>
              Simultaneous real-time conversion across DLS/ATS, UTM Grid, MGRS Code, Decimal Degrees (DD), Degrees Minutes Seconds (DMS), and NTS Topo references.
            </p>
          </div>

          <div className="capability-box">
            <div className="capability-icon">
              <Camera className="w-6 h-6 text-emerald-600" />
            </div>
            <h3>EXIF Geotagged Media Mapping</h3>
            <p>
              Drag & drop drone photos and field inspection imagery. SargGeo automatically parses embedded EXIF GPS tags and maps image markers instantly.
            </p>
          </div>

          <div className="capability-box">
            <div className="capability-icon">
              <Layers className="w-6 h-6 text-amber-600" />
            </div>
            <h3>Multi-Layer Basemaps</h3>
            <p>
              Seamlessly switch between ESRI World Imagery Satellite, OpenStreetMap, Topographic Terrain Contours, and Dark Vector Canvas.
            </p>
          </div>

          <div className="capability-box">
            <div className="capability-icon">
              <Download className="w-6 h-6 text-blue-600" />
            </div>
            <h3>Multi-Format Data Exporter</h3>
            <p>
              Export saved survey waypoints and project grids to KMZ (Google Earth Zip), KML, GeoJSON, CSV, JSON, and ESRI Shapefiles.
            </p>
          </div>

          <div className="capability-box">
            <div className="capability-icon">
              <Database className="w-6 h-6 text-purple-600" />
            </div>
            <h3>Cloud Project Sync & Storage</h3>
            <p>
              Organize survey points into dedicated hosted cloud projects. Sync seamlessly across devices with secure user authentication.
            </p>
          </div>

          <div className="capability-box">
            <div className="capability-icon">
              <ShieldCheck className="w-6 h-6 text-emerald-700" />
            </div>
            <h3>High-Accuracy DEM Elevations</h3>
            <p>
              Automatic high-resolution terrain DEM elevation lookup for every single point in meters and feet (90m/30m DEM resolution).
            </p>
          </div>
        </div>
      </section>

      {/* PRO TIER PRICING COMPARISON */}
      <section id="pro" className="pricing-section">
        <div className="section-header">
          <span className="section-subtitle">PRO SUBSCRIPTION TIER</span>
          <h2 className="section-title">Transparent, Flat-Rate Pricing for Professionals</h2>
        </div>

        <div className="pricing-cards-container">
          {/* FREE PLAN */}
          <div className="pricing-card">
            <div className="pricing-card-header">
              <h3 className="plan-name">Free Starter</h3>
              <div className="plan-price">$0 <span>/ month</span></div>
              <p className="plan-desc">For quick coordinate lookups and basic map inspection.</p>
            </div>
            <ul className="plan-features">
              <li><CheckCircle2 className="w-4 h-4 text-emerald-600" /> 3 Free Conversions per Session</li>
              <li><CheckCircle2 className="w-4 h-4 text-emerald-600" /> DLS / ATS & UTM Map View</li>
              <li><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Basic Waypoint Saving</li>
              <li className="text-slate-400 line-through">Batch Coordinate Converter</li>
              <li className="text-slate-400 line-through">Project Data Spreadsheet Grid</li>
              <li className="text-slate-400 line-through">Developer REST API Keys</li>
            </ul>
            <button type="button" className="custom-btn secondary full py-3 font-extrabold" onClick={onLaunchApp}>
              Launch Free App
            </button>
          </div>

          {/* PRO PLAN */}
          <div className="pricing-card featured">
            <div className="pricing-badge">RECOMMENDED FOR GIS PROFESSIONALS</div>
            <div className="pricing-card-header">
              <h3 className="plan-name">Pro Unlimited</h3>
              <div className="plan-price">$15 <span>/ month</span></div>
              <p className="plan-desc">Complete spatial intelligence suite for energy & land survey professionals.</p>
            </div>
            <ul className="plan-features">
              <li><CheckCircle2 className="w-4 h-4 text-emerald-600" /> <strong>Unlimited Coordinate Conversions</strong></li>
              <li><CheckCircle2 className="w-4 h-4 text-emerald-600" /> <strong>Coordinate King Batch Converter</strong></li>
              <li><CheckCircle2 className="w-4 h-4 text-emerald-600" /> <strong>Project Data Spreadsheet Grid</strong></li>
              <li><CheckCircle2 className="w-4 h-4 text-emerald-600" /> <strong>Multi-Format KMZ/KML/GeoJSON Importer & Exporter</strong></li>
              <li><CheckCircle2 className="w-4 h-4 text-emerald-600" /> <strong>EXIF Geotagged Media Drone Mapping</strong></li>
              <li><CheckCircle2 className="w-4 h-4 text-emerald-600" /> <strong>Developer REST API Keys & Portal</strong></li>
            </ul>
            <button type="button" className="custom-btn amber-pro-btn full py-3.5 font-extrabold shadow-lg" onClick={onOpenUpgradeModal}>
              Upgrade to Pro ($15/mo)
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer">
        <div className="landing-footer-content">
          <div className="footer-left">
            <SargGeoLogo size="small" />
            <p className="text-xs text-slate-500 mt-2">
              Enterprise Spatial Intelligence & Dominion Land Survey Grid Atlas.
            </p>
          </div>

          <div className="footer-links">
            <button type="button" className="footer-link" onClick={onOpenTosModal}>
              Terms of Service
            </button>
            <button type="button" className="footer-link" onClick={onOpenTosModal}>
              Spatial Accuracy Disclaimer
            </button>
            <button type="button" className="footer-link" onClick={onOpenTosModal}>
              Privacy Policy
            </button>
          </div>

          <div className="footer-right">
            <span className="text-xs text-slate-500 font-medium">
              © {new Date().getFullYear()} SargGeo Inc. All rights reserved.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
