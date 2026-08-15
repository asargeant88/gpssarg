import React, { useState } from 'react';
import { X, ShieldCheck, FileText, Lock, AlertTriangle, Scale, CheckCircle2, FileCheck, Building2, Gavel } from 'lucide-react';

export default function TosModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('tos'); // 'tos' | 'disclaimer' | 'privacy'

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="custom-modal-card legal-modal-width" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="custom-modal-header">
          <div className="modal-header-left">
            <div className="modal-icon-badge cyan">
              <Scale className="w-5 h-5 text-cyan" />
            </div>
            <div>
              <h2 className="modal-header-title">Master Terms of Service & Legal Framework</h2>
              <p className="modal-header-subtitle">Official spatial accuracy disclaimers, platform terms of service & data security compliance.</p>
            </div>
          </div>
          <button className="modal-close-icon-btn" onClick={onClose}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Subnav Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-100/70 px-6 pt-3 gap-2">
          <button
            type="button"
            className={`legal-tab-btn ${activeTab === 'tos' ? 'active' : ''}`}
            onClick={() => setActiveTab('tos')}
          >
            Terms of Service
          </button>
          <button
            type="button"
            className={`legal-tab-btn ${activeTab === 'disclaimer' ? 'active' : ''}`}
            onClick={() => setActiveTab('disclaimer')}
          >
            Spatial Accuracy Disclaimer
          </button>
          <button
            type="button"
            className={`legal-tab-btn ${activeTab === 'privacy' ? 'active' : ''}`}
            onClick={() => setActiveTab('privacy')}
          >
            Privacy Policy & Data Security
          </button>
        </div>

        {/* Modal Body */}
        <div className="custom-modal-body space-y-5 overflow-y-auto max-h-[65vh] text-xs text-slate-700 leading-relaxed p-6">
          {activeTab === 'tos' && (
            <div className="space-y-5">
              <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-xl flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-cyan-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-black text-cyan-950 text-sm">SargGeo Enterprise Master Services Agreement (MSA)</div>
                  <p className="text-cyan-900 text-xs">
                    This Master Terms of Service ("Agreement") constitutes a legally binding contract between SargGeo Inc. ("SargGeo", "Company", "We") and any entity or individual ("User", "Licensee", "You") accessing or utilizing the SargGeo Spatial Intelligence Platform, Dominion Land Survey Atlas, Batch Converters, Project Databases, and Developer REST APIs.
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-black text-slate-900 text-sm mb-1.5 flex items-center gap-2">
                  <Gavel className="w-4 h-4 text-cyan-800" /> 1. Platform Grant & Authorized Scope
                </h3>
                <p className="mb-2">
                  Subject to full compliance with this Agreement and payment of applicable fees (including Pro Subscription fees of $15/month), SargGeo grants User a non-exclusive, non-transferable, revocable, worldwide license to access web mapping interfaces, spatial coordinate conversion engines, DEM elevation lookup tools, and project management workspaces.
                </p>
                <p>
                  User agrees not to re-sell, sub-license, host as a white-label third-party service, or exploit platform infrastructure beyond authorized personal, corporate, or GIS engineering workflows.
                </p>
              </div>

              <div>
                <h3 className="font-black text-slate-900 text-sm mb-1.5 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-cyan-800" /> 2. Developer REST API Portal & Rate Limiting
                </h3>
                <p className="mb-2">
                  Pro Subscription accounts are provisioned with unique Developer API Keys (`x-api-key`). User agrees to protect API credentials with enterprise secrecy. Shared, public, or embedded key exposure in public repositories is strictly prohibited.
                </p>
                <p>
                  SargGeo reserves the absolute right to throttle, rate-limit, or instantly revoke API keys demonstrating malicious traffic patterns, automated denial-of-service attempts, unauthorized scrapers, or excessive non-standard queries.
                </p>
              </div>

              <div>
                <h3 className="font-black text-slate-900 text-sm mb-1.5 flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-cyan-800" /> 3. Subscriptions, Payments & Self-Serve Cancellation
                </h3>
                <p className="mb-2">
                  Pro Unlimited Subscriptions are billed on a recurring monthly cycle ($15.00 USD/CAD per month). Subscriptions automatically renew at the beginning of each billing period unless canceled by the User prior to the renewal date.
                </p>
                <p>
                  Users may cancel subscriptions at any time via Account Settings. Upon cancellation, Pro features (including unlimited conversions and developer API keys) remain active until the conclusion of the paid billing cycle.
                </p>
              </div>

              <div>
                <h3 className="font-black text-slate-900 text-sm mb-1.5">4. Intellectual Property & Algorithmic Math</h3>
                <p>
                  All coordinate transformation mathematical models, Dominion Land Survey (DLS/ATS) section bounding algorithms, user interface components, software source code, branding assets, and vector icons are the exclusive intellectual property of SargGeo Inc. Unauthorized duplication or reverse engineering is punishable under international IP statutes.
                </p>
              </div>

              <div>
                <h3 className="font-black text-slate-900 text-sm mb-1.5">5. Indemnification & Limitation of Liability</h3>
                <p>
                  To the maximum extent permitted by applicable law, in no event shall SargGeo Inc., its directors, employees, partners, or agents be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, land value depreciation, drilling misalignments, or field survey operational costs.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'disclaimer' && (
            <div className="space-y-5">
              <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-black text-amber-950 text-sm">Mandatory Spatial Accuracy Legal Disclaimer</div>
                  <p className="text-amber-900 text-xs font-semibold">
                    READ CAREFULLY: SargGeo spatial transformations, Dominion Land Survey (DLS/ATS) conversions, Legal Subdivision (LSD) bounding boxes, and Digital Elevation Model (DEM) terrain lookups are strictly intended for exploratory planning, desktop GIS analysis, and reference purposes.
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-black text-slate-900 text-sm mb-1.5">1. Not a Substitute for Licensed Legal Land Surveys</h3>
                <p className="mb-2">
                  Calculations, boundary overlays, and coordinates generated by SargGeo DO NOT constitute official legal land surveys. Under provincial statutes (including the Alberta Land Surveyors Act) and Canadian federal laws, legal land boundaries can ONLY be established by a licensed Alberta Land Surveyor (ALS) or registered professional surveyor holding valid provincial licensure.
                </p>
                <p>
                  User agrees NEVER to utilize SargGeo coordinates as an official replacement for stamped legal survey plans, property boundary markers, physical field monuments, or legal conveyance documents.
                </p>
              </div>

              <div>
                <h3 className="font-black text-slate-900 text-sm mb-1.5">2. DEM Elevation Margin of Error & Terrain Dynamics</h3>
                <p className="mb-2">
                  Terrain elevation figures displayed in meters and feet are fetched automatically via Open-Meteo elevation APIs (derived from global 30-meter and 90-meter shuttle radar topography mission DEM grids).
                </p>
                <p>
                  Elevations represent satellite-model estimations and DO NOT account for local earthwork grading, trench excavations, micro-topography shifts, or barometric pressure variances. Critical engineering, pipeline hydraulics, or foundation designs MUST perform physical field elevation measurements.
                </p>
              </div>

              <div>
                <h3 className="font-black text-slate-900 text-sm mb-1.5">3. Complete Release & Field Liability Waiver</h3>
                <p>
                  By using SargGeo, User explicitly releases SargGeo Inc., its software architects, and data providers from any liability or financial loss stemming from drilling errors, boundary trespass, construction site misalignments, fence line placements, or pipeline routing decisions.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-5">
              <div className="p-4 bg-slate-100 border border-slate-300 rounded-xl flex items-start gap-3">
                <Lock className="w-5 h-5 text-slate-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-black text-slate-950 text-sm">Enterprise Data Privacy & Security Governance</div>
                  <p className="text-slate-800 text-xs">
                    SargGeo enforces strict data isolation, enterprise encryption standards, and complete customer spatial dataset ownership. We treat your spatial survey data as confidential corporate assets.
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-black text-slate-900 text-sm mb-1.5">1. Information Collection & Telemetry</h3>
                <p className="mb-2">
                  To provide cloud project synchronization and developer authentication, SargGeo collects minimal necessary user information:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-700">
                  <li>Account Email Credentials & Salted Passwords (`bcrypt`)</li>
                  <li>User Profile Names & Subscription Tier Status</li>
                  <li>User-Saved Cloud Projects, Survey Waypoints & DEM Elevation Metadata</li>
                  <li>Geotagged Field Photo EXIF Metadata (Latitude, Longitude, Altitude, Timestamp)</li>
                  <li>Developer REST API Usage Metrics & Query Volume Logs</li>
                </ul>
              </div>

              <div>
                <h3 className="font-black text-slate-900 text-sm mb-1.5">2. 100% User Dataset Ownership & No Data Selling</h3>
                <p className="mb-2 font-extrabold text-slate-900">
                  You retain 100% intellectual property and commercial ownership of all waypoints, survey points, KMZ/KML archives, and geotagged field photos saved to SargGeo.
                </p>
                <p>
                  SargGeo DOES NOT sell, trade, rent, or commercialize user spatial datasets, company survey waypoints, or project databases to third-party brokers, advertisers, or competitor platforms under any circumstances.
                </p>
              </div>

              <div>
                <h3 className="font-black text-slate-900 text-sm mb-1.5">3. Enterprise Encryption & Cloud Database Security</h3>
                <p className="mb-2">
                  User passwords are hashed using salted `bcrypt` algorithms. Cloud project databases enforce strict row-level security (RLS) ensuring project data is isolated per authenticated user session.
                </p>
                <p>
                  All data in transit is protected using TLS 1.3 HTTPS encryption, and stored database assets are protected with AES-256 cloud encryption.
                </p>
              </div>

              <div>
                <h3 className="font-black text-slate-900 text-sm mb-1.5">4. Session Storage & Security Cookies</h3>
                <p>
                  SargGeo utilizes secure, HTTP-only session tokens (`jwt`) and browser local storage strictly for maintaining user login authorization states and spatial workspace preferences.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] text-slate-600 font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Iron-Clad Legal Protection • SargGeo Enterprise Compliance Standards</span>
          </div>
          <button className="custom-btn primary text-xs font-extrabold px-6 py-2.5 shadow-md" onClick={onClose}>
            I Accept & Agree to Legal Terms
          </button>
        </div>
      </div>
    </div>
  );
}
