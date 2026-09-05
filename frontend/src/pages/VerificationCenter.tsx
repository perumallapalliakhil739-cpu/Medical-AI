import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  Edit2,
  Check,
  X,
  RefreshCw,
  Search,
  FileCheck
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  fetchVerificationQueue,
  acceptVerificationItem,
  editVerificationItem,
  rejectVerificationItem,
  fetchPatients
} from '../services/api';
import { VerificationQueueItem, Patient } from '../types';
import { ConfidenceBadge } from '../components/common/ConfidenceBadge';
import { ReferenceFlagBadge } from '../components/common/ReferenceFlagBadge';
import { SourceTag } from '../components/common/SourceTag';

export const VerificationCenter: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || 'pending';

  const [queue, setQueue] = useState<VerificationQueueItem[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [patientFilter, setPatientFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Edit Modal State
  const [editingItem, setEditingItem] = useState<VerificationQueueItem | null>(null);
  const [editForm, setEditForm] = useState({
    corrected_value: '',
    corrected_unit: '',
    corrected_range: '',
    correction_notes: '',
  });

  // Reject Modal State
  const [rejectingItem, setRejectingItem] = useState<VerificationQueueItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const loadQueue = async () => {
    setLoading(true);
    try {
      const [queueData, patientData] = await Promise.all([
        fetchVerificationQueue(statusFilter || undefined, patientFilter || undefined),
        fetchPatients('', 1, 100),
      ]);
      setQueue(queueData);
      setPatients(patientData.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, [statusFilter, patientFilter]);

  const handleAccept = async (id: string) => {
    try {
      await acceptVerificationItem(id);
      setQueue((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const openEditModal = (item: VerificationQueueItem) => {
    setEditingItem(item);
    setEditForm({
      corrected_value: item.raw_value,
      corrected_unit: item.unit || '',
      corrected_range: item.reference_range || '',
      correction_notes: 'Corrected based on original source report inspection.',
    });
  };

  const handleConfirmEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    try {
      await editVerificationItem(editingItem.id, editForm);
      setEditingItem(null);
      loadQueue();
    } catch (err: any) {
      alert(err.message || 'Failed to submit correction');
    }
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingItem || !rejectionReason.trim()) return;
    try {
      await rejectVerificationItem(rejectingItem.id, rejectionReason.trim());
      setRejectingItem(null);
      setRejectionReason('');
      loadQueue();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Client-side search filtering
  const filteredItems = queue.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.test_name.toLowerCase().includes(q) ||
      (item.patient_name && item.patient_name.toLowerCase().includes(q)) ||
      (item.report_title && item.report_title.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-teal-600" />
            Human Verification Center (Step 8)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Dedicated practitioner review queue. Verify, correct, or reject AI-extracted laboratory measurements.
          </p>
        </div>

        <button
          onClick={loadQueue}
          className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-3 py-2 rounded-xl border border-slate-200 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Filter Tabs & Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
            {[
              { id: 'pending', label: 'Pending Review' },
              { id: 'corrected', label: 'Corrected' },
              { id: 'verified', label: 'Verified' },
              { id: '', label: 'All Records' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  statusFilter === tab.id
                    ? 'bg-white text-teal-800 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Patient Selector */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Patient:</span>
            <select
              value={patientFilter}
              onChange={(e) => setPatientFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Patients ({patients.length})</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter queue by test analyte name, patient name, or report title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 text-xs text-slate-800 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Verification Queue Cards */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading review queue...</div>
      ) : filteredItems.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-dashed border-slate-200 space-y-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto opacity-80" />
          <h3 className="font-bold text-sm text-slate-800">Review Queue Clear</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            There are no items matching your filter criteria requiring clinical verification.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 p-4 shadow-xs space-y-3 transition-all"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{item.test_name}</span>
                    <ReferenceFlagBadge flag={item.flag} />
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Patient: <span className="font-semibold text-slate-800">{item.patient_name || 'Patient'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <ConfidenceBadge score={item.confidence_score} />
                </div>
              </div>

              {/* Measurement Values & Reference Range */}
              <div className="bg-slate-50 p-3 rounded-lg grid grid-cols-2 gap-2 text-xs font-mono">
                <div>
                  <span className="text-[10px] font-sans text-slate-400 uppercase font-semibold block">
                    Extracted Value
                  </span>
                  <span className="font-bold text-base text-slate-900">
                    {item.raw_value} {item.unit || ''}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-sans text-slate-400 uppercase font-semibold block">
                    Source Range (Step 5)
                  </span>
                  <span className="font-medium text-slate-700 block truncate" title={item.reference_range || ''}>
                    {item.reference_range || 'Not provided in report'}
                  </span>
                </div>
              </div>

              {/* Source Document & Context */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                <span className="truncate max-w-[200px]" title={item.source_document || item.report_title}>
                  Doc: {item.source_document || item.report_title}
                </span>
                <Link
                  to={`/reports/${item.report_id}/verify`}
                  className="text-teal-600 hover:text-teal-700 font-semibold inline-flex items-center gap-1"
                >
                  <span>Side-by-Side</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              {/* Audit trail if corrected */}
              {item.original_ai_value && (
                <div className="text-[11px] bg-amber-50 border border-amber-200 p-2 rounded text-amber-900">
                  <strong>Correction Audit:</strong> Original AI extraction was{' '}
                  <code className="font-bold">{item.original_ai_value}</code>. {item.correction_notes}
                </div>
              )}

              {/* Verification Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-1">
                {item.verification_status !== 'verified' && (
                  <button
                    onClick={() => handleAccept(item.id)}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Accept Extraction</span>
                  </button>
                )}

                <button
                  onClick={() => openEditModal(item)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit / Correct</span>
                </button>

                {item.verification_status !== 'rejected' && (
                  <button
                    onClick={() => setRejectingItem(item)}
                    className="px-2.5 py-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-medium transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit / Correction Modal (Step 8 & 15) */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Correct Measurement for {editingItem.test_name}
              </h3>
              <button onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmEdit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Corrected Value *</label>
                  <input
                    type="text"
                    required
                    value={editForm.corrected_value}
                    onChange={(e) => setEditForm({ ...editForm, corrected_value: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unit</label>
                  <input
                    type="text"
                    value={editForm.corrected_unit}
                    onChange={(e) => setEditForm({ ...editForm, corrected_unit: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reference Range (from Source Report)</label>
                <input
                  type="text"
                  value={editForm.corrected_range}
                  onChange={(e) => setEditForm({ ...editForm, corrected_range: e.target.value })}
                  placeholder="e.g. 13.0-17.0"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Clinician Correction Rationale *</label>
                <textarea
                  rows={2}
                  required
                  value={editForm.correction_notes}
                  onChange={(e) => setEditForm({ ...editForm, correction_notes: e.target.value })}
                  placeholder="Enter audit rationale for correcting AI extraction..."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg text-xs shadow-xs"
                >
                  Save &amp; Mark Corrected
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingItem && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
              Reject AI Extraction
            </h3>
            <p className="text-xs text-slate-600">
              State why this measurement for <strong>{rejectingItem.test_name}</strong> is rejected:
            </p>
            <input
              type="text"
              required
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Scanning artifact or unverified handwriting"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectingItem(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={!rejectionReason.trim()}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white font-semibold rounded-lg text-xs"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
