import React, { useState, useEffect } from 'react';
import {
  Users,
  FileText,
  CheckSquare,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Plus,
  Upload,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  FileCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  fetchPatients,
  fetchReports,
  fetchVerificationQueue,
  fetchConflicts,
  seedDemoData,
  acceptVerificationItem,
} from '../services/api';
import { Patient, MedicalReport, VerificationQueueItem, Conflict } from '../types';
import { ConfidenceBadge } from '../components/common/ConfidenceBadge';
import { ReferenceFlagBadge } from '../components/common/ReferenceFlagBadge';
import { SourceTag } from '../components/common/SourceTag';
import { useAuth } from '../context/AuthContext';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [queue, setQueue] = useState<VerificationQueueItem[]>([]);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      setRefreshing(true);
      const [patRes, repRes, queueRes, confRes] = await Promise.allSettled([
        fetchPatients('', 1, 10),
        fetchReports(),
        fetchVerificationQueue('pending'),
        fetchConflicts(undefined, 'detected'),
      ]);

      if (patRes.status === 'fulfilled') setPatients(patRes.value.items || []);
      if (repRes.status === 'fulfilled') setReports(repRes.value.items || []);
      if (queueRes.status === 'fulfilled') setQueue(queueRes.value || []);
      if (confRes.status === 'fulfilled') setConflicts(confRes.value || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleQuickAccept = async (id: string) => {
    try {
      await acceptVerificationItem(id);
      setQueue((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const lowConfidenceCount = queue.filter(
    (q) => q.confidence_score !== null && q.confidence_score !== undefined && q.confidence_score < 0.70
  ).length;

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Welcome */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-500/20 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-teal-500/20 text-teal-300 border border-teal-400/30 text-xs font-semibold px-3 py-1 rounded-full mb-3">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            Clinical Intelligence Engine Active
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
            MedLens Clinical Intelligence Dashboard
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
            Multi-source medical document organization, reference-range verification, and inconsistency detection.
            Transforming fragmented laboratory records into verifiable structured patient records.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/reports"
              className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs px-4 py-2 rounded-xl shadow-sm transition-all"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Medical Report</span>
            </Link>

            <Link
              to="/patients"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-medium text-xs px-4 py-2 rounded-xl border border-white/20 transition-all"
            >
              <Plus className="w-4 h-4 text-teal-300" />
              <span>Register Patient</span>
            </Link>

            <button
              onClick={loadData}
              disabled={refreshing}
              className="inline-flex items-center gap-2 text-slate-300 hover:text-white text-xs px-3 py-2 rounded-xl hover:bg-white/10 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-teal-400' : ''}`} />
              <span>Refresh Telemetry</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Discrepancy / Conflict Alert Banner (Step 7) */}
      {conflicts.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-rose-100 text-rose-700 shrink-0">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-rose-900">
                Information Conflict Detected ({conflicts.length} Inconsistencies Flagged)
              </h3>
              <p className="text-xs text-rose-700 mt-0.5 max-w-2xl">
                The automated detection engine identified demographic, medication, or test inconsistencies between patient profiles and uploaded reports.
                <span className="font-semibold ml-1">Human clinician review is required.</span>
              </p>
            </div>
          </div>
          <Link
            to="/conflicts"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-lg transition-colors shrink-0 shadow-xs"
          >
            <span>Resolve Conflicts</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* 3. Core KPI Telemetry Cards (Step 18) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total Patients */}
        <Link
          to="/patients"
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-teal-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Patients</span>
            <Users className="w-4 h-4 text-teal-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{patients.length}</div>
          <div className="text-[11px] text-teal-600 flex items-center gap-1 mt-1 font-medium">
            <span>View Registry</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </Link>

        {/* Total Reports */}
        <Link
          to="/reports"
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-teal-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Total Reports</span>
            <FileText className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{reports.length}</div>
          <div className="text-[11px] text-indigo-600 flex items-center gap-1 mt-1 font-medium">
            <span>Structured Ingestion</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </Link>

        {/* Pending Verification */}
        <Link
          to="/verification"
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-amber-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Pending Review</span>
            <CheckSquare className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-amber-600">{queue.length}</div>
          <div className="text-[11px] text-amber-700 flex items-center gap-1 mt-1 font-medium">
            <span>Verification Queue</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </Link>

        {/* Conflicts */}
        <Link
          to="/conflicts"
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-rose-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Conflicts Flagged</span>
            <AlertTriangle className="w-4 h-4 text-rose-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-rose-600">{conflicts.length}</div>
          <div className="text-[11px] text-rose-700 flex items-center gap-1 mt-1 font-medium">
            <span>Needs Resolution</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </Link>

        {/* Low Confidence */}
        <Link
          to="/verification?min_confidence=0&max_confidence=0.70"
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-purple-300 hover:shadow-md transition-all group col-span-2 sm:col-span-1"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Low Confidence</span>
            <ShieldAlert className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-purple-700">{lowConfidenceCount}</div>
          <div className="text-[11px] text-purple-700 flex items-center gap-1 mt-1 font-medium">
            <span>Score &lt; 70%</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </Link>
      </div>

      {/* 4. Dual Columns: Verification Queue & Recent Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Verification Queue Preview */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-teal-600" />
                Human Verification Queue (Pending Review)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                AI extractions requiring practitioner review and acceptance before finalization.
              </p>
            </div>
            <Link
              to="/verification"
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {queue.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs bg-slate-50 rounded-lg border border-dashed border-slate-200">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
              All clinical laboratory extractions have been reviewed and verified.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="pb-2.5 font-medium">Test & Patient</th>
                    <th className="pb-2.5 font-medium">Extracted Value</th>
                    <th className="pb-2.5 font-medium">Source Range</th>
                    <th className="pb-2.5 font-medium">Confidence</th>
                    <th className="pb-2.5 font-medium text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {queue.slice(0, 5).map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3">
                        <div className="font-semibold text-slate-900">{item.test_name}</div>
                        <div className="text-[11px] text-slate-500">{item.patient_name || 'Patient'}</div>
                      </td>
                      <td className="py-3 font-mono font-medium">
                        {item.raw_value} {item.unit || ''}
                      </td>
                      <td className="py-3 text-slate-600">
                        {item.reference_range || 'Not provided in report'}
                      </td>
                      <td className="py-3">
                        <ConfidenceBadge score={item.confidence_score} />
                      </td>
                      <td className="py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleQuickAccept(item.id)}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded font-semibold text-[11px] transition-colors"
                            title="Accept AI extraction verbatim"
                          >
                            Accept
                          </button>
                          <Link
                            to={`/reports/${item.report_id}/verify`}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium text-[11px] transition-colors"
                          >
                            Inspect
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Col: Recent Medical Reports */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                Recent Reports
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Ingested clinical documents</p>
            </div>
            <Link
              to="/reports"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <span>All</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {reports.slice(0, 5).map((rep) => (
              <div
                key={rep.id}
                className="p-3 rounded-lg border border-slate-100 hover:border-slate-300 hover:bg-slate-50/50 transition-all flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <Link
                    to={`/reports/${rep.id}/verify`}
                    className="font-semibold text-xs text-slate-900 hover:text-teal-600 truncate block"
                  >
                    {rep.title}
                  </Link>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                    <span className="uppercase font-mono text-[10px] bg-slate-100 px-1.5 py-0.2 rounded">
                      {rep.report_type}
                    </span>
                    <span>•</span>
                    <span>{rep.report_date || 'Undated'}</span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <ConfidenceBadge score={rep.extraction_confidence} showPercentage={false} />
                  <Link
                    to={`/reports/${rep.id}/verify`}
                    className="p-1 rounded text-slate-400 hover:text-teal-600 hover:bg-slate-100"
                    title="Open Side-by-Side Source View"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Comparison Shortcut */}
          <div className="pt-3 border-t border-slate-100">
            <Link
              to="/reports/compare"
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors"
            >
              <TrendingUp className="w-4 h-4 text-teal-600" />
              <span>Launch Current vs Previous Comparison</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
