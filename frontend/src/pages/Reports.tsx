import React, { useState, useEffect } from 'react';
import {
  FileText,
  Upload,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Trash2,
  X,
  FileCheck,
  ChevronRight,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  fetchReports,
  uploadReport,
  deleteReport,
  reprocessReport,
  fetchPatients
} from '../services/api';
import { MedicalReport, Patient } from '../types';
import { ConfidenceBadge } from '../components/common/ConfidenceBadge';
import { useAuth } from '../context/AuthContext';

export const Reports: React.FC = () => {
  const [searchParams] = useSearchParams();
  const filterPatientId = searchParams.get('patient_id') || '';

  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatientId, setSelectedPatientId] = useState<string>(filterPatientId);

  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [reportTitle, setReportTitle] = useState('');
  const [reportType, setReportType] = useState('cbc');
  const [targetPatientId, setTargetPatientId] = useState('');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [uploading, setUploading] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const WORKFLOW_STEPS = [
    'Document Validation & Integrity Checksum',
    'OCR / Raw Text Extraction',
    'AI Entity & Laboratory Measurement Identification',
    'Structured Data Normalization & Analyte Mapping',
    'Strict Reference-Range Analysis (Zero-Hallucination Policy)',
    'Extraction Confidence Scoring Calculation',
    'Automated Multi-Source Conflict & Anomaly Detection',
    'Human Verification Routing',
    'Final Structured Medical Record Persistence',
  ];

  const loadData = async () => {
    setLoading(true);
    try {
      const [repRes, patRes] = await Promise.all([
        fetchReports(selectedPatientId || undefined),
        fetchPatients('', 1, 100),
      ]);
      setReports(repRes.items || []);
      setPatients(patRes.items || []);
      if (patRes.items?.length && !targetPatientId) {
        setTargetPatientId(patRes.items[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedPatientId]);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const f = e.dataTransfer.files[0];
      setFileToUpload(f);
      if (!reportTitle) setReportTitle(f.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setFileToUpload(f);
      if (!reportTitle) setReportTitle(f.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '));
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileToUpload) return;

    setUploading(true);
    setCurrentStepIndex(0);

    // Simulate animated workflow progression for clinical visualizer
    const stepInterval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < WORKFLOW_STEPS.length - 1) return prev + 1;
        return prev;
      });
    }, 400);

    try {
      const formData = new FormData();
      formData.append('file', fileToUpload);
      formData.append('title', reportTitle || fileToUpload.name);
      formData.append('report_type', reportType);
      if (targetPatientId) formData.append('patient_id', targetPatientId);
      formData.append('report_date', reportDate);

      await uploadReport(formData);

      clearInterval(stepInterval);
      setCurrentStepIndex(WORKFLOW_STEPS.length - 1);
      setTimeout(() => {
        setUploading(false);
        setShowUploadModal(false);
        setFileToUpload(null);
        setReportTitle('');
        loadData();
      }, 500);
    } catch (err: any) {
      clearInterval(stepInterval);
      setUploading(false);
      alert(err.message || 'Upload failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this report and all extracted lab results?')) return;
    try {
      await deleteReport(id);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleReprocess = async (id: string) => {
    try {
      await reprocessReport(id);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-teal-600" />
            Medical Reports &amp; Ingestion
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Ingest lab panels, PDF scans, and clinical documents through the 10-step AI structuring pipeline.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all shrink-0"
        >
          <Upload className="w-4 h-4" />
          <span>Upload New Report</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-700">Filter by Patient:</span>
        </div>

        <select
          value={selectedPatientId}
          onChange={(e) => setSelectedPatientId(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg p-1.5 focus:ring-2 focus:ring-teal-500 font-medium"
        >
          <option value="">All Patients ({patients.length})</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.patient_identifier})
            </option>
          ))}
        </select>

        {selectedPatientId && (
          <button
            onClick={() => setSelectedPatientId('')}
            className="text-slate-400 hover:text-slate-600 font-semibold"
          >
            Clear Filter
          </button>
        )}
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Ingested Documents ({reports.length})
          </span>
          <span className="text-[11px] text-slate-500">Click a report to launch Side-by-Side Verification</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading documents...</div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No medical reports found. Click "Upload New Report" to ingest a document.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-2.5 px-4">Document Title / File</th>
                  <th className="py-2.5 px-3">Patient</th>
                  <th className="py-2.5 px-3">Type &amp; Date</th>
                  <th className="py-2.5 px-3">Extraction Confidence</th>
                  <th className="py-2.5 px-3">Review Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((rep) => {
                  const patient = patients.find((p) => p.id === rep.patient_id);
                  return (
                    <tr key={rep.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <Link
                          to={`/reports/${rep.id}/verify`}
                          className="font-bold text-slate-900 hover:text-teal-600 block text-xs"
                        >
                          {rep.title}
                        </Link>
                        <div className="text-[11px] text-slate-400 font-mono">{rep.source_filename}</div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800">
                          {patient ? patient.name : 'Unassigned Patient'}
                        </div>
                        {patient && (
                          <div className="text-[11px] font-mono text-teal-700">{patient.patient_identifier}</div>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <span className="uppercase font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-semibold mr-1.5">
                          {rep.report_type}
                        </span>
                        <span className="text-slate-600">{rep.report_date || 'N/A'}</span>
                      </td>

                      <td className="py-3 px-3">
                        <ConfidenceBadge score={rep.extraction_confidence} />
                      </td>

                      <td className="py-3 px-3">
                        {rep.verification_status === 'verified' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px] font-semibold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Verified
                          </span>
                        ) : rep.verification_status === 'corrected' ? (
                          <span className="inline-flex items-center gap-1 text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded text-[11px] font-semibold">
                            Corrected
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[11px] font-semibold">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Pending Review
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <Link
                            to={`/reports/${rep.id}/verify`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded font-semibold text-[11px] transition-colors"
                            title="Side-by-Side Source View (Step 13)"
                          >
                            <span>Inspect</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>

                          <button
                            onClick={() => handleReprocess(rep.id)}
                            className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-100"
                            title="Re-run AI extraction pipeline"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDelete(rep.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100"
                            title="Delete Report"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upload & 10-Step Animated Pipeline Modal (Step 3) */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Upload className="w-5 h-5 text-teal-600" />
                Upload Clinical Medical Report
              </h3>
              {!uploading && (
                <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {uploading ? (
              /* Step 3: Progress Visualizer */
              <div className="space-y-4 py-4">
                <div className="text-center space-y-1">
                  <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-2 animate-bounce">
                    <Sparkles className="w-6 h-6 text-teal-600" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">Processing Clinical Report</h4>
                  <p className="text-xs text-slate-500">
                    Executing 10-step AI extraction, reference-range awareness, and conflict detection...
                  </p>
                </div>

                <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                  {WORKFLOW_STEPS.map((step, idx) => {
                    const isDone = idx < currentStepIndex;
                    const isCurrent = idx === currentStepIndex;
                    return (
                      <div
                        key={idx}
                        className={`flex items-center gap-2 transition-all ${
                          isDone
                            ? 'text-emerald-700 font-semibold'
                            : isCurrent
                            ? 'text-teal-700 font-bold'
                            : 'text-slate-400'
                        }`}
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : isCurrent ? (
                          <span className="w-4 h-4 rounded-full border-2 border-teal-600 border-t-transparent animate-spin shrink-0" />
                        ) : (
                          <span className="w-4 h-4 rounded-full bg-slate-200 text-[10px] text-slate-600 flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                        )}
                        <span className="text-[11px] truncate">{step}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Upload Form */
              <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
                {/* Drag and drop zone */}
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileDrop}
                  className="border-2 border-dashed border-slate-300 hover:border-teal-500 bg-slate-50/60 p-6 rounded-xl text-center cursor-pointer transition-colors"
                  onClick={() => document.getElementById('file-upload-input')?.click()}
                >
                  <input
                    id="file-upload-input"
                    type="file"
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg,.txt,.json,.csv"
                    onChange={handleFileSelect}
                  />
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  {fileToUpload ? (
                    <div>
                      <div className="font-bold text-slate-800 text-sm">{fileToUpload.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {(fileToUpload.size / 1024).toFixed(1)} KB • Click to change file
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="font-semibold text-slate-700">
                        Drag &amp; drop clinical document here, or browse
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Supports PDF lab sheets, scanned images, text reports, or JSON
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Report Title</label>
                    <input
                      type="text"
                      required
                      value={reportTitle}
                      onChange={(e) => setReportTitle(e.target.value)}
                      placeholder="e.g. Complete Blood Count"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Assign to Patient</label>
                    <select
                      value={targetPatientId}
                      onChange={(e) => setTargetPatientId(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500"
                    >
                      {patients.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.patient_identifier})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Report Category</label>
                    <select
                      value={reportType}
                      onChange={(e) => setReportType(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="cbc">Complete Blood Count (CBC)</option>
                      <option value="lipid">Lipid Profile Panel</option>
                      <option value="metabolic">Comprehensive Metabolic Panel (CMP)</option>
                      <option value="pathology">Pathology / Biopsy Report</option>
                      <option value="radiology">Radiology / Imaging</option>
                      <option value="general_lab">General Clinical Laboratory</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Report Date</label>
                    <input
                      type="date"
                      value={reportDate}
                      onChange={(e) => setReportDate(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!fileToUpload}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white font-semibold rounded-lg text-xs shadow-xs transition-all"
                  >
                    Initiate Processing Pipeline
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
