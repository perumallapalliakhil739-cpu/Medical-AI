import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  CheckSquare,
  AlertTriangle,
  ArrowLeft,
  Sparkles,
  Edit2,
  Check,
  X,
  RefreshCw,
  Eye,
  CheckCircle2,
  Info,
  ShieldCheck,
  ExternalLink,
  Save
} from 'lucide-react';
import {
  getReport,
  updateLabResult,
  acceptVerificationItem,
  rejectVerificationItem,
  verifyEntireReport,
  fetchAiSummary
} from '../services/api';
import { MedicalReport, LabResult } from '../types';
import { ConfidenceBadge } from '../components/common/ConfidenceBadge';
import { ReferenceFlagBadge } from '../components/common/ReferenceFlagBadge';
import { SourceTag } from '../components/common/SourceTag';
import { useAuth } from '../context/AuthContext';

export const SideBySideVerification: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, role } = useAuth();

  const [report, setReport] = useState<MedicalReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [highlightedLine, setHighlightedLine] = useState<number | null>(null);

  // Inline editing state
  const [editingResultId, setEditingResultId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    test_name: string;
    raw_value: string;
    unit: string;
    reference_range: string;
    correction_notes: string;
  }>({
    test_name: '',
    raw_value: '',
    unit: '',
    reference_range: '',
    correction_notes: '',
  });

  // Rejection modal state
  const [rejectingResultId, setRejectingResultId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // AI Summary refresh state
  const [refreshingSummary, setRefreshingSummary] = useState(false);

  const loadReport = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getReport(id);
      setReport(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [id]);

  const handleStartEdit = (lab: LabResult) => {
    setEditingResultId(lab.id);
    setEditForm({
      test_name: lab.test_name,
      raw_value: lab.raw_value,
      unit: lab.unit || '',
      reference_range: lab.reference_range || '',
      correction_notes: lab.correction_notes || 'Corrected based on original source report inspection.',
    });
  };

  const handleSaveEdit = async (resultId: string) => {
    if (!id) return;
    try {
      await updateLabResult(id, resultId, editForm);
      setEditingResultId(null);
      await loadReport();
    } catch (err: any) {
      alert(err.message || 'Failed to save correction');
    }
  };

  const handleAcceptItem = async (resultId: string) => {
    try {
      await acceptVerificationItem(resultId);
      await loadReport();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingResultId || !rejectionReason.trim()) return;
    try {
      await rejectVerificationItem(rejectingResultId, rejectionReason.trim());
      setRejectingResultId(null);
      setRejectionReason('');
      await loadReport();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleVerifyAll = async () => {
    if (!id) return;
    try {
      await verifyEntireReport(id);
      await loadReport();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRefreshSummary = async () => {
    if (!id) return;
    setRefreshingSummary(true);
    try {
      const res = await fetchAiSummary({ report_id: id });
      if (report) {
        setReport({ ...report, ai_summary: res.summary });
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setRefreshingSummary(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-400">Loading document verification interface...</div>;
  }

  if (!report) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
        <h3 className="text-sm font-bold text-slate-800 mb-2">Report Not Found</h3>
        <Link to="/reports" className="text-teal-600 text-xs font-semibold">
          Return to Reports
        </Link>
      </div>
    );
  }

  const labResults = report.lab_results || [];
  const textLines = (report.extracted_text || 'No document text extracted.').split('\n');

  return (
    <div className="space-y-4">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
            title="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">{report.title}</h1>
              <span className="bg-slate-100 text-slate-700 font-mono text-[10px] uppercase px-2 py-0.5 rounded font-semibold">
                {report.report_type}
              </span>
              <span className="text-xs text-slate-400">• {report.report_date || 'Undated'}</span>
            </div>
            <p className="text-xs text-slate-500">
              Side-by-Side Source Verification &amp; Traceability Center (Step 13)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleVerifyAll}
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3 py-1.5 rounded-lg shadow-xs transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Verify All Items</span>
          </button>

          <a
            href={`/api/v1/export/patient/${report.patient_id}/html`}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-xs rounded-lg transition-colors"
          >
            Print Dossier
          </a>
        </div>
      </div>

      {/* AI Generated Clinical Summary (Step 9 & 21) */}
      <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-4 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-purple-200 text-purple-800 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
              AI Generated Summary
            </span>
            <span className="text-xs text-purple-900 font-semibold">Patient-Friendly Finding Description</span>
          </div>
          <button
            onClick={handleRefreshSummary}
            disabled={refreshingSummary}
            className="text-purple-700 hover:text-purple-900 text-xs font-semibold inline-flex items-center gap-1"
          >
            <RefreshCw className={`w-3 h-3 ${refreshingSummary ? 'animate-spin' : ''}`} />
            <span>Regenerate Summary</span>
          </button>
        </div>

        <p className="text-xs text-purple-950 leading-relaxed font-normal">
          {report.ai_summary ||
            'AI summary is being formulated according to non-diagnostic safety guardrails.'}
        </p>

        <div className="text-[11px] text-purple-700/80 italic flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
          <span>Notice: AI summary uses strictly cautious language and never formulates diagnoses or treatment advice.</span>
        </div>
      </div>

      {/* Split-Pane: Left Source Document vs Right Structured Data (Step 13) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
        {/* Left Pane (5 Cols): Original Medical Report Document Viewer */}
        <div className="lg:col-span-5 bg-slate-900 text-slate-200 rounded-xl border border-slate-800 shadow-md flex flex-col overflow-hidden">
          <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-400" />
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Original Medical Report
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 truncate max-w-[180px]">
              {report.source_filename}
            </span>
          </div>

          <div className="bg-slate-950/60 p-2.5 border-b border-slate-800 text-[11px] text-slate-400 flex items-center justify-between shrink-0 font-mono">
            <span>SHA-256 Checksum:</span>
            <span className="text-[10px] text-teal-300 truncate max-w-[200px]" title={report.checksum}>
              {report.checksum.slice(0, 24)}...
            </span>
          </div>

          <div className="p-4 flex-1 overflow-y-auto font-mono text-xs leading-relaxed space-y-1 bg-slate-900/90 select-text">
            {textLines.map((line, idx) => {
              const isTargetLine = highlightedLine === idx + 1;
              return (
                <div
                  key={idx}
                  className={`flex gap-3 px-2 py-0.5 rounded transition-colors ${
                    isTargetLine
                      ? 'bg-teal-500/30 text-teal-200 border-l-2 border-teal-400 font-bold'
                      : 'hover:bg-slate-800/60 text-slate-300'
                  }`}
                >
                  <span className="text-slate-600 select-none text-[11px] w-6 text-right shrink-0">
                    {idx + 1}
                  </span>
                  <span className="whitespace-pre-wrap break-all">{line || ' '}</span>
                </div>
              );
            })}
          </div>

          <div className="bg-slate-950 p-2.5 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between shrink-0">
            <span>Status: Verified Ground Truth</span>
            <span className="text-slate-500">{textLines.length} document lines</span>
          </div>
        </div>

        {/* Right Pane (7 Cols): Structured Medical Records with Provenance & Inline Edits */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
            <div>
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Structured Medical Information ({labResults.length} Analytes)
              </h2>
              <p className="text-[11px] text-slate-500">
                All extracted fields are editable. Strict reference ranges enforced without hallucination.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <ConfidenceBadge score={report.extraction_confidence} />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {labResults.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                No structured records extracted. Click "Re-run AI extraction pipeline" from the reports view.
              </div>
            ) : (
              labResults.map((lab) => {
                const isEditing = editingResultId === lab.id;

                return (
                  <div
                    key={lab.id}
                    className={`rounded-xl border transition-all p-3.5 space-y-2.5 ${
                      lab.verification_status === 'verified'
                        ? 'bg-emerald-50/20 border-emerald-200'
                        : lab.verification_status === 'corrected'
                        ? 'bg-teal-50/20 border-teal-200'
                        : lab.verification_status === 'rejected'
                        ? 'bg-rose-50/20 border-rose-200 opacity-60'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {isEditing ? (
                      /* Inline Edit Form (Step 4 & 15) */
                      <div className="space-y-3 bg-slate-50 p-3 rounded-lg border border-teal-200 text-xs">
                        <div className="flex items-center justify-between font-bold text-slate-800">
                          <span>Correcting Measurement for {lab.test_name}</span>
                          <span className="text-[10px] text-slate-400">Pre-correction value: {lab.raw_value}</span>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Value</label>
                            <input
                              type="text"
                              value={editForm.raw_value}
                              onChange={(e) => setEditForm({ ...editForm, raw_value: e.target.value })}
                              className="w-full p-1.5 bg-white border border-slate-300 rounded font-mono text-xs focus:ring-2 focus:ring-teal-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Unit</label>
                            <input
                              type="text"
                              value={editForm.unit}
                              onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                              className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-2 focus:ring-teal-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Reference Range</label>
                            <input
                              type="text"
                              value={editForm.reference_range}
                              onChange={(e) => setEditForm({ ...editForm, reference_range: e.target.value })}
                              className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-2 focus:ring-teal-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Clinician Correction Notes / Audit Reason *
                          </label>
                          <input
                            type="text"
                            required
                            value={editForm.correction_notes}
                            onChange={(e) => setEditForm({ ...editForm, correction_notes: e.target.value })}
                            placeholder="State rationale based on original source report..."
                            className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-2 focus:ring-teal-500"
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setEditingResultId(null)}
                            className="px-2.5 py-1 bg-slate-200 text-slate-700 rounded text-xs font-medium"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(lab.id)}
                            className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded text-xs font-semibold inline-flex items-center gap-1 shadow-xs"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>Save Correction</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Standard Row View */
                      <>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-900">{lab.test_name}</span>
                              <ReferenceFlagBadge flag={lab.flag} />
                              <ConfidenceBadge score={lab.confidence_score} />
                            </div>

                            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                              <SourceTag source={lab.source_type} size="sm" />
                              <span>•</span>
                              <span>Source: {lab.source_document || report.source_filename}</span>
                              <span>•</span>
                              <span>Page {lab.provenance_page || 1}</span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1">
                            {lab.verification_status !== 'verified' && (
                              <button
                                onClick={() => handleAcceptItem(lab.id)}
                                className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded text-[11px] font-semibold transition-colors inline-flex items-center gap-1"
                                title="Accept extracted measurement"
                              >
                                <Check className="w-3 h-3" />
                                <span>Accept</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleStartEdit(lab)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium transition-colors inline-flex items-center gap-1"
                              title="Edit test value or reference range"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>

                            {lab.verification_status !== 'rejected' && (
                              <button
                                onClick={() => setRejectingResultId(lab.id)}
                                className="px-2 py-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded text-[11px] font-medium transition-colors inline-flex items-center gap-1"
                                title="Reject erroneous extraction"
                              >
                                <X className="w-3 h-3" />
                                <span>Reject</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Measurement Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-lg text-xs font-mono">
                          <div>
                            <span className="text-slate-400 block text-[10px] font-sans font-semibold">Value:</span>
                            <span className="font-bold text-slate-900 text-sm">{lab.raw_value}</span>
                          </div>

                          <div>
                            <span className="text-slate-400 block text-[10px] font-sans font-semibold">Unit:</span>
                            <span className="text-slate-700">{lab.unit || '—'}</span>
                          </div>

                          <div className="col-span-2">
                            <span className="text-slate-400 block text-[10px] font-sans font-semibold">
                              Report Reference Range (Step 5):
                            </span>
                            <span className="text-slate-800 font-medium truncate block">
                              {lab.reference_range || 'Reference Range: Not provided in source report'}
                            </span>
                          </div>
                        </div>

                        {/* Audit / Provenance Trail & Correction Note */}
                        {lab.original_ai_value && (
                          <div className="text-[11px] bg-amber-50 border border-amber-200 p-2 rounded text-amber-900">
                            <strong>Audit History:</strong> AI original extraction: <code className="font-mono font-bold">{lab.original_ai_value}</code>.
                            {lab.correction_notes && <span className="ml-1">Correction: {lab.correction_notes}</span>}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {rejectingResultId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
              Reject AI Extraction
            </h3>
            <p className="text-xs text-slate-600">
              Please enter the clinical rationale for rejecting this extraction. This action is permanently logged in the audit trail.
            </p>
            <input
              type="text"
              required
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Artifact on scanned image, not a true test analyte"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectingResultId(null)}
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
