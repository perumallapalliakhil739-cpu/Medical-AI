import React, { useState, useEffect } from 'react';
import {
  GitCompare,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Filter,
  FileText,
  ShieldCheck,
  ArrowRight,
  Info,
  Activity
} from 'lucide-react';
import { fetchPatients, fetchReports, fetchReportComparison } from '../services/api';
import { Patient, MedicalReport, ReportComparisonData } from '../types';
import { ReferenceFlagBadge } from '../components/common/ReferenceFlagBadge';

export const ReportComparison: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [reports, setReports] = useState<MedicalReport[]>([]);

  const [currentReportId, setCurrentReportId] = useState<string>('');
  const [previousReportId, setPreviousReportId] = useState<string>('');
  const [comparisonData, setComparisonData] = useState<ReportComparisonData | null>(null);
  const [loading, setLoading] = useState(false);

  // Load patient list on mount
  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetchPatients('', 1, 100);
        setPatients(res.items || []);
        if (res.items?.length) {
          // Default to first patient with multiple reports
          setSelectedPatientId(res.items[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    init();
  }, []);

  // When selected patient changes, load their reports
  useEffect(() => {
    if (!selectedPatientId) return;
    const loadPatientReports = async () => {
      try {
        const res = await fetchReports(selectedPatientId);
        const patientReports = res.items || [];
        setReports(patientReports);

        if (patientReports.length >= 2) {
          // Default to latest and second latest
          setCurrentReportId(patientReports[0].id);
          setPreviousReportId(patientReports[1].id);
        } else if (patientReports.length === 1) {
          setCurrentReportId(patientReports[0].id);
          setPreviousReportId('');
        } else {
          setCurrentReportId('');
          setPreviousReportId('');
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadPatientReports();
  }, [selectedPatientId]);

  // When reports are selected, fetch comparison
  useEffect(() => {
    if (!currentReportId || !previousReportId) {
      setComparisonData(null);
      return;
    }

    const runComparison = async () => {
      setLoading(true);
      try {
        const data = await fetchReportComparison(currentReportId, previousReportId);
        setComparisonData(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    runComparison();
  }, [currentReportId, previousReportId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <GitCompare className="w-6 h-6 text-teal-600" />
            Current vs Previous Report Comparison (Step 10)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Compare matching laboratory analytes, calculate objective numerical shifts, and visualize longitudinal trends.
          </p>
        </div>
      </div>

      {/* Selectors Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div>
          <label className="block font-bold text-slate-700 mb-1">Select Patient</label>
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500"
          >
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.patient_identifier})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">Current Report (Latest)</label>
          <select
            value={currentReportId}
            onChange={(e) => setCurrentReportId(e.target.value)}
            disabled={reports.length === 0}
            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-teal-500"
          >
            {reports.map((r) => (
              <option key={r.id} value={r.id}>
                {r.title} ({r.report_date || 'Undated'})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">Previous Report (Baseline)</label>
          <select
            value={previousReportId}
            onChange={(e) => setPreviousReportId(e.target.value)}
            disabled={reports.length < 2}
            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-teal-500"
          >
            <option value="">Select Prior Report...</option>
            {reports
              .filter((r) => r.id !== currentReportId)
              .map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title} ({r.report_date || 'Undated'})
                </option>
              ))}
          </select>
        </div>
      </div>

      {reports.length < 2 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            This patient currently has {reports.length} report on file. At least 2 medical reports are required to perform a longitudinal delta comparison.
          </span>
        </div>
      )}

      {/* Comparison Results */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Calculating report shifts...</div>
      ) : comparisonData ? (
        <div className="space-y-6">
          {/* Comparison Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-teal-600" />
                Matching Analyte Delta Comparison
              </div>

              <div className="text-[11px] text-slate-500 font-mono">
                {comparisonData.previous_report.title} ({comparisonData.previous_report.date}) vs{' '}
                {comparisonData.current_report.title} ({comparisonData.current_report.date})
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="py-2.5 px-4">Test Name</th>
                    <th className="py-2.5 px-3">
                      Previous Value ({comparisonData.previous_report.date || 'Baseline'})
                    </th>
                    <th className="py-2.5 px-3">
                      Current Value ({comparisonData.current_report.date || 'Current'})
                    </th>
                    <th className="py-2.5 px-3">Numerical Change (Delta)</th>
                    <th className="py-2.5 px-3">Percentage Shift</th>
                    <th className="py-2.5 px-4 text-right">Trend Indicator</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {comparisonData.comparisons.map((c, idx) => {
                    const isPositive = c.change !== null && c.change !== undefined && c.change > 0;
                    const isNegative = c.change !== null && c.change !== undefined && c.change < 0;

                    return (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-sans font-bold text-slate-900">
                          {c.test_name}
                          <span className="text-slate-400 font-normal ml-1 font-mono text-[11px]">
                            ({c.unit})
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-700 font-semibold">{c.previous_value}</span>
                            {c.previous_flag && <ReferenceFlagBadge flag={c.previous_flag} />}
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-900 font-bold">{c.current_value}</span>
                            {c.current_flag && <ReferenceFlagBadge flag={c.current_flag} />}
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          {c.change !== null && c.change !== undefined ? (
                            <span
                              className={`font-bold ${
                                isPositive ? 'text-teal-700' : isNegative ? 'text-rose-700' : 'text-slate-600'
                              }`}
                            >
                              {isPositive ? `+${c.change}` : c.change} {c.unit}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-sans">N/A</span>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          {c.percent_change !== null && c.percent_change !== undefined ? (
                            <span
                              className={`font-bold ${
                                isPositive ? 'text-teal-700' : isNegative ? 'text-rose-700' : 'text-slate-600'
                              }`}
                            >
                              {isPositive ? `+${c.percent_change}%` : `${c.percent_change}%`}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-sans">—</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          {c.trend === 'increased' ? (
                            <span className="inline-flex items-center gap-1 text-teal-700 font-sans font-semibold bg-teal-50 px-2 py-0.5 rounded text-[11px] border border-teal-200">
                              <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
                              Increased
                            </span>
                          ) : c.trend === 'decreased' ? (
                            <span className="inline-flex items-center gap-1 text-rose-700 font-sans font-semibold bg-rose-50 px-2 py-0.5 rounded text-[11px] border border-rose-200">
                              <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                              Decreased
                            </span>
                          ) : c.trend === 'stable' ? (
                            <span className="inline-flex items-center gap-1 text-slate-600 font-sans font-medium bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                              <Minus className="w-3.5 h-3.5 text-slate-400" />
                              Stable
                            </span>
                          ) : (
                            <span className="text-slate-400 font-sans text-[11px]">Baseline Only</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Longitudinal Trend Chart Cards */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-600" />
              Historical Longitudinal Trajectory Preview
            </h3>
            <p className="text-xs text-slate-500">
              Chronological test values recorded across sequential clinical encounters.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {comparisonData.comparisons
                .filter((c) => c.current_numeric !== null && c.previous_numeric !== null)
                .slice(0, 6)
                .map((item, idx) => {
                  const prevVal = item.previous_numeric || 0;
                  const currVal = item.current_numeric || 0;
                  const maxVal = Math.max(prevVal, currVal) * 1.25 || 100;

                  return (
                    <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">{item.test_name}</span>
                        <span className="text-slate-500 font-mono text-[11px]">{item.unit}</span>
                      </div>

                      {/* SVG Clinical Sparkline */}
                      <div className="h-16 flex items-end justify-between px-6 pt-2 pb-1 border-b border-slate-200">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[10px] font-mono font-bold text-slate-600">{prevVal}</span>
                          <div
                            className="w-5 bg-slate-300 rounded-t"
                            style={{ height: `${Math.max(12, (prevVal / maxVal) * 50)}px` }}
                          />
                          <span className="text-[9px] text-slate-400">Baseline</span>
                        </div>

                        <div className="text-slate-400 text-xs font-bold">→</div>

                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[10px] font-mono font-bold text-teal-700">{currVal}</span>
                          <div
                            className="w-5 bg-teal-600 rounded-t"
                            style={{ height: `${Math.max(12, (currVal / maxVal) * 50)}px` }}
                          />
                          <span className="text-[9px] text-teal-700 font-semibold">Current</span>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-500 text-center">
                        Delta: <span className="font-bold text-slate-800 font-mono">{item.change ? `${item.change > 0 ? '+' : ''}${item.change}` : '0'}</span> {item.unit}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Mandatory Responsible AI Notice (Step 10 requirement) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-600 text-xs flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Clinical Guardrail (Step 10):</strong> {comparisonData.clinical_disclaimer}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
};
