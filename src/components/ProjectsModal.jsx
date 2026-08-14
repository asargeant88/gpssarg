import React, { useState } from 'react';
import { X, Folder, Plus, Trash2, CheckCircle2, User, Database, Sparkles } from 'lucide-react';

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
      <div className="batch-modal-content" style={{ width: '680px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <div className="modal-icon-badge" style={{ background: 'rgba(56, 189, 248, 0.15)', borderColor: 'rgba(56, 189, 248, 0.3)' }}>
              <Folder className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="modal-title">Hosted Cloud Projects Manager</h2>
              <p className="modal-subtitle">Cloud database storage on Neon PostgreSQL</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto" style={{ maxHeight: '75vh' }}>
          {!user ? (
            <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-xl text-center space-y-4">
              <Database className="w-10 h-10 text-cyan-400 mx-auto" />
              <div>
                <h3 className="text-sm font-bold text-white">Sign In Required for Hosted Cloud Storage</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Create a free account to save map progress, survey points, and waypoints to your personal PostgreSQL database.
                </p>
              </div>
              <button
                className="pane-btn primary full py-2.5 text-xs font-bold"
                onClick={() => {
                  onClose();
                  if (onOpenAuthModal) onOpenAuthModal();
                }}
              >
                <User className="w-4 h-4 mr-1.5 inline" /> Sign In / Create Account
              </button>
            </div>
          ) : (
            <>
              {/* Create Project Card */}
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
                <label className="field-label text-cyan-400">CREATE NEW HOSTED PROJECT</label>
                <form onSubmit={handleSubmit} className="space-y-3">
                  <input
                    type="text"
                    required
                    className="modal-input text-xs"
                    placeholder="Project Name (e.g. Wainwright Land Survey 2026)"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="modal-input text-xs flex-1"
                      placeholder="Description / Notes (Optional)"
                      value={newProjectDesc}
                      onChange={(e) => setNewProjectDesc(e.target.value)}
                    />
                    <button type="submit" className="pane-btn primary text-xs shrink-0 px-4 font-bold">
                      <Plus className="w-4 h-4 mr-1 inline" /> Create
                    </button>
                  </div>
                </form>
              </div>

              {/* Projects List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="field-label text-slate-400">YOUR CLOUD PROJECTS ({projects.length})</label>
                  {activeProject && (
                    <span className="text-[11px] text-cyan-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Active: {activeProject.name}
                    </span>
                  )}
                </div>

                {projects.length === 0 ? (
                  <div className="empty-state py-8 bg-slate-900/40 border border-slate-800/60 rounded-xl">
                    <Folder className="w-10 h-10 text-slate-600 mb-2" />
                    <span className="text-xs text-slate-400">No hosted projects created yet. Create one above to save map progress!</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2.5">
                    {projects.map((proj) => {
                      const isActive = activeProject && activeProject.id === proj.id;
                      return (
                        <div
                          key={proj.id}
                          className={`p-3.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                            isActive
                              ? 'bg-cyan-950/50 border-cyan-500/70 shadow-lg shadow-cyan-950/40'
                              : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                          }`}
                          onClick={() => {
                            if (onSelectProject) onSelectProject(proj);
                            onClose();
                          }}
                        >
                          <div className="truncate flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isActive ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300' : 'bg-slate-800 text-slate-400'}`}>
                              <Folder className="w-5 h-5" />
                            </div>
                            <div className="truncate">
                              <div className="font-bold text-xs text-slate-200 truncate flex items-center gap-2">
                                <span>{proj.name}</span>
                                {isActive && <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded font-extrabold">ACTIVE</span>}
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                {proj.waypoint_count || 0} saved waypoints • Created {new Date(proj.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              className="pane-btn secondary small text-[11px] py-1 px-2.5"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onSelectProject) onSelectProject(proj);
                                onClose();
                              }}
                            >
                              {isActive ? 'Active' : 'Load Project'}
                            </button>
                            <button
                              className="p-1.5 text-slate-500 hover:text-red-400 rounded"
                              onClick={(e) => {
                                e.stopPropagation();
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
