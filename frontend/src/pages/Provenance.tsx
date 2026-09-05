import React, { useState, useEffect } from 'react';
import {
  GitBranch,
  ShieldCheck,
  Search,
  Filter,
  FileCheck,
  Clock,
  User,
  ExternalLink,
  Lock,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import { apiRequest } from '../services/api';

interface AuditEntry {
  id: string;
  user_id?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: string;
  created_at: string;
}

export const Provenance: React.FC = () => {
  const [logs, setLogs] = useState<AuditEntry[]>([
    {
      id: 'audit-001',
      action: 'CORRECT',
      entity_type: 'lab_result',
      entity_id: 'lr-hemo-01',
      details: JSON.stringify({
        test_name: 'Hemoglobin',
        previous_value: '12.6',
        new_value: '13.2',
        notes: 'Corrected based on original source report inspection.',
      }),
      created_at: new Date().toISOString(),
    },
    {
      id: 'audit-002',
      action: 'AI_EXTRACT',
      entity_type: 'report',
      entity_id: 'rep-cbc-01',
      details: JSON.stringify({
        report_title: 'Complete Blood Count Panel',
        tests_extracted: 5,
        confidence: 0.96,
      }),
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'audit-003',
      action: 'RESOLVE_CONFLICT',
      entity_type: 'conflict',
      entity_id: 'conf-age-01',
      details: JSON.stringify({
        conflict_type: 'demographic_age_mismatch',
        resolution_action: 'resolved',
        resolution_notes: 'Verified with patient government ID and clinic intake documentation.',
      }),
      created_at: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: 'audit-004',
      action: 'CREATE',
      entity_type: 'patient',
      entity_id: 'pat-sj-01',
      details: JSON.stringify({
        name: 'Sarah Jenkins',
        patient_identifier: 'PT-2026-SJ01',
      }),
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
  ]);

  const [filterAction, setFilterAction] = useState<string>('');

  const filteredLogs = logs.filter((l) => {
    if (!filterAction) return true;
    return l.action === filterAction;
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CORRECT':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'VERIFY':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'REJECT':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'RESOLVE_CONFLICT':
        return 'bg-teal-100 text-teal-800 border-teal-300';
      case 'AI_EXTRACT':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <GitBranch className="w-6 h-6 text-teal-600" />
            Source Provenance &amp; Immutable Audit Trail (Step 6 &amp; 16)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            End-to-end traceability of all clinical data creations, AI extractions, reference range evaluations, and clinician corrections.
          </p>
        </div>
      </div>

      {/* Provenance Principle Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-5 shadow-sm border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="space-y-1">
          <span className="font-bold text-teal-400 block uppercase tracking-wider text-[10px]">
            Strict Traceability
          </span>
          <p className="text-slate-300">
            Every clinical value explicitly documents source document, page, extraction method, and timestamp.
          </p>
        </div>

        <div className="space-y-1">
          <span className="font-bold text-teal-400 block uppercase tracking-wider text-[10px]">
            Zero Unlabeled AI
          </span>
          <p className="text-slate-300">
            AI extractions are permanently demarcated. AI summaries are labeled "AI Generated Summary".
          </p>
        </div>

        <div className="space-y-1">
          <span className="font-bold text-teal-400 block uppercase tracking-wider text-[10px]">
            Immutable History
          </span>
          <p className="text-slate-300">
            When clinicians correct an extracted measurement, previous and new values are retained in audit history.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="font-bold text-slate-700">Filter Action:</span>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800"
          >
            <option value="">All Audit Actions ({logs.length})</option>
            <option value="CORRECT">Clinician Corrections (CORRECT)</option>
            <option value="VERIFY">Human Verifications (VERIFY)</option>
            <option value="RESOLVE_CONFLICT">Conflict Resolutions (RESOLVE)</option>
            <option value="AI_EXTRACT">AI Ingestion Pipeline (AI_EXTRACT)</option>
            <option value="CREATE">Entity Creation (CREATE)</option>
          </select>
        </div>

        <span className="text-[11px] text-slate-400 font-mono">HIPAA &amp; Governance Audit Ready</span>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="py-2.5 px-4">Action &amp; Target</th>
                <th className="py-2.5 px-3">Entity Type</th>
                <th className="py-2.5 px-3">Change Details &amp; Clinician Notes</th>
                <th className="py-2.5 px-4 text-right">Timestamp (UTC)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => {
                let parsed: any = {};
                try {
                  parsed = log.details ? JSON.parse(log.details) : {};
                } catch {
                  parsed = {};
                }

                return (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${getActionBadge(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                        <span className="font-mono text-slate-600 text-[11px]">{log.entity_id}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3 uppercase font-semibold text-slate-700 text-[11px]">
                      {log.entity_type}
                    </td>

                    <td className="py-3 px-3">
                      {log.action === 'CORRECT' ? (
                        <div className="space-y-0.5">
                          <div className="font-semibold text-slate-900">
                            {parsed.test_name}:{' '}
                            <span className="text-slate-400 line-through mr-1 font-mono">
                              {parsed.previous_value}
                            </span>
                            → <span className="text-teal-700 font-mono font-bold">{parsed.new_value}</span>
                          </div>
                          {parsed.notes && <div className="text-slate-500 text-[11px]">{parsed.notes}</div>}
                        </div>
                      ) : log.action === 'RESOLVE_CONFLICT' ? (
                        <div>
                          <div className="font-semibold text-slate-800">{parsed.conflict_type}</div>
                          <div className="text-slate-500 text-[11px]">{parsed.resolution_notes}</div>
                        </div>
                      ) : log.action === 'AI_EXTRACT' ? (
                        <div className="text-slate-700">
                          {parsed.report_title}: Extracted {parsed.tests_extracted} measurements (Confidence:{' '}
                          {Math.round((parsed.confidence || 0.9) * 100)}%)
                        </div>
                      ) : (
                        <div className="font-mono text-slate-600 text-[11px] truncate max-w-md">
                          {log.details || '—'}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-slate-500 text-[11px]">
                      {new Date(log.created_at).toLocaleString('en-US')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
