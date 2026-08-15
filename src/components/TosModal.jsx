import React, { useState } from 'react';
import { X, ShieldCheck, FileText, Lock, AlertTriangle, Scale, CheckCircle2 } from 'lucide-react';

export default function TosModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('tos'); // 'tos' | 'privacy' | 'disclaimer'

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="custom-modal-card import-modal-width" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="custom-modal-header">
          <div className="modal-header-left">
            <div className="modal-icon-badge cyan">
              <Scale className="w-5 h-5 text-cyan" />
            </div>
            <div>
              <h2 className="modal-header-title">Terms of Service & Legal Protection</h2>
              <p className="modal-header-subtitle">Legal disclaimers, spatial accuracy terms, privacy & data protection policies.</p>
            </div>
          </div>
          <button className="modal-close-icon-btn" onClick={onClose}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2 text-xs font-extrabold">
          <button
            type="button"
            className={`pb-2.5 px-4 rounded-t-lg transition-all cursor-pointer outline-none border-0 ${
              activeTab === 'tos'
                ? 'bg-white text-cyan-900 shadow-xs border-t-2 border-cyan-600 font-black'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
            }`}
            onClick={() => setActiveTab('tos')}
          >
            Terms of Service
          </button>
          <button
            type="button"
            className={`pb-2.5 px-4 rounded-t-lg transition-all cursor-pointer outline-none border-0 ${
              activeTab === 'disclaimer'
                ? 'bg-white text-cyan-900 shadow-xs border-t-2 border-cyan-600 font-black'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
            }`}
            onClick={() => setActiveTab('disclaimer')}
          >
            Spatial Accuracy Disclaimer
          </button>
          <button
            type="button"
            className={`pb-2.5 px-4 rounded-t-lg transition-all cursor-pointer outline-none border-0 ${
              activeTab === 'privacy'
                ? 'bg-white text-cyan-900 shadow-xs border-t-2 border-cyan-600 font-black'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
            }`}
            onClick={() => setActiveTab('privacy')}
          >
            Privacy Policy
          </button>
        </div>

        {/* Modal Body */}
        <div className="custom-modal-body space-y-4 overflow-y-auto max-h-[60vh] text-xs text-slate-700 leading-relaxed p-6">
          {activeTab === 'tos' && (
            <div className="space-y-4">
              <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 font-black text-cyan-900 text-sm">
                  <ShieldCheck className="w-5 h-5 text-cyan-700" />
                  <span>SargGeo Platform Legal Agreement</span>
                </div>
                <p className="text-cyan-800">
                  By accessing or using SargGeo Spatial Intelligence & Grid Atlas, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you may not use the platform or developer API services.
                </p>
              </div>

              <div>
                <h3 className="font-extrabold text-slate-900 text-sm mb-1">1. License & Scope of Service</h3>
                <p>
                  SargGeo grants users a non-exclusive, non-transferable, revocable license to access spatial coordinate conversion tools, Dominion Land Survey (DLS/ATS) calculations, elevation lookups, mapping layers, and project management tools.
                </p>
              </div>

              <div>
                <h3 className="font-extrabold text-slate-900 text-sm mb-1">2. Account Credentials & Security</h3>
                <p>
                  Users are responsible for maintaining the confidentiality of account credentials and Developer API keys. You are fully responsible for all activities, coordinate transformations, and data saved under your account.
                </p>
              </div>

              <div>
                <h3 className="font-extrabold text-slate-900 text-sm mb-1">3. Developer API Usage & Rate Limits</h3>
                <p>
                  Developer API access provided under the Pro Subscription tier ($15/month) is restricted to legitimate GIS integration, automated land data pipelines, and internal web applications. Reverse engineering or attempting to overload platform servers is strictly prohibited.
                </p>
              </div>

              <div>
                <h3 className="font-extrabold text-slate-900 text-sm mb-1">4. Subscriptions & Billing</h3>
                <p>
                  Pro Subscriptions are billed monthly. Users may cancel subscriptions at any time via Account Settings. Access to Pro features remains active until the end of the current billing cycle.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'disclaimer' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 font-black text-amber-900 text-sm">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <span>Official Surveying Legal Disclaimer</span>
                </div>
                <p className="text-amber-800 font-medium">
                  SargGeo spatial calculations, DLS/ATS conversions, and elevation DEM lookups ARE NOT official legal land surveys. They must not be used as legal boundary determinations or engineering stamp replacements.
                </p>
              </div>

              <div>
                <h3 className="font-extrabold text-slate-900 text-sm mb-1">1. Educational & Visualization Purpose Only</h3>
                <p>
                  All coordinate transformations (DLS, ATS, UTM, MGRS, DD, DMS, NTS) and DEM terrain elevation figures provided by SargGeo are generated for analytical visualization, exploratory planning, and spatial reference.
                </p>
              </div>

              <div>
                <h3 className="font-extrabold text-slate-900 text-sm mb-1">2. No Substitute for Licensed Land Surveyors</h3>
                <p>
                  Legal land boundaries in Alberta and Western Canada can only be legally established by a registered Alberta Land Surveyor (ALS) or authorized professional land surveyor under provincial statute.
                </p>
              </div>

              <div>
                <h3 className="font-extrabold text-slate-900 text-sm mb-1">3. Limitation of Liability</h3>
                <p>
                  SargGeo, its creators, developers, and operators expressly disclaim all warranties, express or implied. Under no circumstances shall SargGeo be liable for any financial losses, drilling errors, construction misalignments, or property disputes resulting from coordinate data usage.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-100 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
                  <Lock className="w-5 h-5 text-cyan-700" />
                  <span>Privacy & Data Security Policy</span>
                </div>
                <p className="text-slate-600">
                  Your privacy and spatial data security are paramount. SargGeo enforces strict data isolation and industry-standard encryption for all hosted project datasets.
                </p>
              </div>

              <div>
                <h3 className="font-extrabold text-slate-900 text-sm mb-1">1. Information We Collect</h3>
                <p>
                  We collect account email credentials, subscription status, saved project survey waypoints, and user configuration preferences necessary to provide cloud project synchronization.
                </p>
              </div>

              <div>
                <h3 className="font-extrabold text-slate-900 text-sm mb-1">2. Data Ownership & Storage Isolation</h3>
                <p>
                  Users maintain 100% ownership of all uploaded KML/KMZ files, geotagged media, and project spreadsheet waypoints. We never sell or share user spatial data with third parties.
                </p>
              </div>

              <div>
                <h3 className="font-extrabold text-slate-900 text-sm mb-1">3. Security Controls</h3>
                <p>
                  Project datasets are stored in encrypted cloud database clusters. Account authentication utilizes secure salted password hashing and JWT token authorization.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Protected by SargGeo Legal Framework & Encryption Standard</span>
          </div>
          <button className="custom-btn primary text-xs font-extrabold px-6 py-2" onClick={onClose}>
            I Understand & Agree
          </button>
        </div>
      </div>
    </div>
  );
}
