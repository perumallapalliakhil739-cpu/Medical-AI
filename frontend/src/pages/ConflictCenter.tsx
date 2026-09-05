import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  HelpCircle,
  FileText,
  User,
  RefreshCw,
  X,
  Check,
  Filter
} from 'lucide-react';
import { fetchConflicts, resolveConflict, fetchPatients } from '../services/api';
import { Conflict, Patient } from '../types';

export const ConflictCenter: React.FC = () => {
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('detected');

  // Resolution Modal State
  const [resolvingConflict, setResolvingConflict] = useState<Conflict | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolutionAction, setResolutionAction] = useState<'resolved' | 'dismissed'>('resolved');

  const loadConflicts = async () => {
    setLoading(true);
    try {
      const [confData, patData] = await Promise.all([
        fetchConflicts(undefined, statusFilter || undefined),
        fetchPatients('', 1, 100),
      ]);
      setConflicts(confData);
      setPatients(patData.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConflicts();
  }, [statusFilter]);

  const handleOpenResolve = (conflict: Conflict, action: 'resolved' | 'dismissed') => {
    setResolvingConflict(conflict);
    setResolutionAction(action);
    setResolutionNotes(
      action === 'resolved'
        ? 'Verified with patient and primary care records; profile updated.'
        : 'Reviewed and confirmed as benign or non-clinical discrepancy.'
    );
  };

  const handleConfirmResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingConflict || !resolutionNotes.trim()) return;
    try {
      await resolveConflict(resolvingConflict.id, resolutionNotes.trim(), resolutionAction);
      setResolvingConflict(null);
      loadConflicts();
    } catch (err: any) {
      alert(err.message || 'Failed to resolve conflict');
    }
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'high':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'medium':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-rose-600" />
            Conflict &amp; Inconsistency Detection Center (Step 7)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Identifies discrepancies across medical documents and patient profiles without autonomous guessing.
          </p>
        </div>

        <button
          onClick={loadConflicts}
          className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-3 py-2 rounded-xl border border-slate-200 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Re-scan Inconsistencies</span>
        </button>
      </div>

      {/* Mandatory Safety Notice (Step 7 Rule) */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 space-y-1">
        <div className="font-bold flex items-center gap-1.5 text-amber-950">
          <ShieldAlert className="w-4 h-4 text-amber-600" />
          <span>Responsible AI Clinical Mandate:</span>
        </div>
        <p className="leading-relaxed">
          The AI system <strong>must NOT</strong> arbitrarily decide which conflicting piece of information is accurate.
          It identifies discrepancies and alerts human clinicians to verify the authentic medical truth.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 text-xs font-semibold">
        <button
          onClick={() => setStatusFilter('detected')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            statusFilter === 'detected'
              ? 'bg-rose-50 text-rose-800 border border-rose-200 font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Active Conflicts
        </button>
        <button
          onClick={() => setStatusFilter('resolved')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            statusFilter === 'resolved'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Resolved Inconsistencies
        </button>
        <button
          onClick={() => setStatusFilter('')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            statusFilter === ''
              ? 'bg-slate-100 text-slate-900 font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          All Records
        </button>
      </div>

      {/* Conflict Cards */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Scanning for contradictions...</div>
      ) : conflicts.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-dashed border-slate-200 space-y-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto opacity-80" />
          <h3 className="font-bold text-sm text-slate-800">Zero Active Conflicts</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            All reports and demographic data align consistently without discrepancies.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {conflicts.map((c) => (
            <div
              key={c.id}
              className={`bg-white rounded-xl border p-5 shadow-xs space-y-3 transition-all ${
                c.status === 'detected'
                  ? 'border-rose-200 bg-rose-50/10'
                  : 'border-slate-200 opacity-80'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-rose-900 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      Information Conflict Detected
                    </span>
                    <span
                      className={`uppercase text-[10px] font-bold px-2 py-0.5 rounded-full border ${getSeverityStyle(
                        c.severity
                      )}`}
                    >
                      {c.severity} Severity
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 uppercase bg-slate-100 px-2 py-0.5 rounded">
                      {c.conflict_type.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 mt-1">
                    Patient: <span className="font-bold text-slate-900">{c.patient_name || 'Patient'}</span>
                  </div>
                </div>

                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full uppercase text-[10px] ${
                    c.status === 'detected'
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {c.status}
                </span>
              </div>

              {/* Description & Highlight */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs text-slate-800 leading-relaxed font-medium">
                {c.description}
              </div>

              {/* Resolution Action Note if resolved */}
              {c.resolution_notes && (
                <div className="text-xs bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg text-emerald-900">
                  <strong>Clinician Resolution Record:</strong> {c.resolution_notes}
                </div>
              )}

              {/* Action Call to Action (Step 7 requirement) */}
              {c.status === 'detected' && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                  <div className="text-xs font-bold text-rose-700">
                    Action Required: Please verify the correct information with the patient or medical record.
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleOpenResolve(c, 'resolved')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors"
                    >
                      Verify &amp; Document Resolution
                    </button>
                    <button
                      onClick={() => handleOpenResolve(c, 'dismissed')}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Resolution Modal */}
      {resolvingConflict && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Document Clinical Conflict Resolution</h3>
              <button onClick={() => setResolvingConflict(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmResolve} className="space-y-3 text-xs">
              <p className="text-slate-600">
                Please enter the clinician verification findings to resolve this information discrepancy:
              </p>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Resolution Action</label>
                <select
                  value={resolutionAction}
                  onChange={(e) => setResolutionAction(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 font-medium"
                >
                  <option value="resolved">Mark Resolved (Verified Authentic Record)</option>
                  <option value="dismissed">Dismiss Conflict (Benign / Inconsequential)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Clinician Documentation Notes *</label>
                <textarea
                  rows={3}
                  required
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="e.g. Confirmed true patient birthdate from hospital ID card. Profile corrected."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResolvingConflict(null)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg text-xs shadow-xs"
                >
                  Save Resolution Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
