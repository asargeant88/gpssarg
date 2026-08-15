import React, { useState } from 'react';
import { X, Folder, Plus, Trash2, CheckCircle2, User, Database, Check } from 'lucide-react';

export default function ProjectsModal({
  isOpen,
  onClose,
  user,
  projects = [],
  activeProject,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
  onOpenAuthModal
}) {
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newProjectName.trim() && onCreateProject) {
      onCreateProject(newProjectName.trim(), newProjectDesc.trim());
      setNewProjectName('');
      setNewProjectDesc('');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="custom-modal-card settings-modal-width" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="custom-modal-header">
          <div className="modal-header-left">
            <div className="modal-icon-badge cyan">
              <Folder className="w-5 h-5 text-cyan" />
            </div>
            <div>
              <h2 className="modal-header-title">Hosted Cloud Projects Manager</h2>
              <p className="modal-header-subtitle">Cloud database storage on Neon PostgreSQL</p>
            </div>
          </div>
          <button className="modal-close-icon-btn" onClick={onClose}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="custom-modal-body space-y-4">
          {!user ? (
            <div className="rhs-empty-project space-y-3">
              <Database className="w-10 h-10 text-cyan-600 mb-1" />
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Sign In Required for Cloud Database Storage</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Create a free account to save map progress, survey points, and waypoints to your personal PostgreSQL database.
                </p>
              </div>
              <button
                className="custom-btn primary text-xs font-extrabold px-5 py-2.5"
                onClick={() => {
                  onClose();
                  if (onOpenAuthModal) onOpenAuthModal();
                }}
              >
                <User className="w-4 h-4" /> Sign In / Create Free Account
              </button>
            </div>
          ) : (
            <>
              {/* Create Project Card */}
              <div className="settings-section-card">
                <div className="section-card-title cyan">
                  <Plus className="w-4 h-4" /> Create New Hosted Project
                </div>
                <form onSubmit={handleSubmit} className="space-y-2.5">
                  <input
                    type="text"
                    required
                    className="custom-modal-input text-xs"
                    placeholder="Project Name (e.g. Wainwright Land Survey 2026)"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="custom-modal-input text-xs flex-1"
                      placeholder="Description / Notes (Optional)"
                      value={newProjectDesc}
                      onChange={(e) => setNewProjectDesc(e.target.value)}
                    />
                    <button type="submit" className="custom-btn primary text-xs shrink-0 px-4">
                      <Plus className="w-4 h-4" /> Create
                    </button>
                  </div>
                </form>
              </div>

              {/* Projects List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="card-title-label">YOUR CLOUD PROJECTS ({projects.length})</span>
                  {activeProject && (
                    <span className="text-xs font-extrabold text-cyan-700 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-cyan-600" /> Active: {activeProject.name}
                    </span>
                  )}
                </div>

                {projects.length === 0 ? (
                  <div className="rhs-empty-list py-6">
                    <Folder className="w-8 h-8 text-slate-400 mb-2" />
                    <span>No hosted projects created yet. Create one above to start saving map progress!</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {projects.map((proj) => {
                      const isActive = activeProject && activeProject.id === proj.id;
                      return (
                        <div
                          key={proj.id}
                          className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between shadow-2xs transition hover:bg-slate-100/70"
                        >
                          <div className="flex items-center gap-3 truncate">
                            <div className="w-9 h-9 rounded-lg bg-cyan-100 border border-cyan-300 flex items-center justify-center text-cyan-800 shrink-0">
                              <Folder className="w-5 h-5" />
                            </div>
                            <div className="truncate">
                              <div className="font-extrabold text-xs text-slate-900 truncate flex items-center gap-2">
                                <span>{proj.name}</span>
                                {isActive && <span className="text-[10px] bg-cyan-700 text-white px-2 py-0.5 rounded-md font-black">ACTIVE</span>}
                              </div>
                              <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                                {proj.waypoint_count || 0} saved points • Created {new Date(proj.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              className={`custom-btn text-xs py-1.5 px-3.5 ${isActive ? 'primary' : 'secondary'}`}
                              onClick={() => {
                                if (onSelectProject) onSelectProject(proj);
                                onClose();
                              }}
                            >
                              {isActive ? 'Active' : 'Load Project'}
                            </button>
                            <button
                              className="point-icon-btn danger"
                              onClick={() => {
                                if (onDeleteProject) onDeleteProject(proj.id);
                              }}
                              title="Delete Project"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
