import React, { useState, useEffect } from 'react';
import {
  Clock,
  Calendar,
  Filter,
  FileText,
  Activity,
  User,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  Building,
  UserCheck
} from 'lucide-react';
import { useSearchParams, Link } from 'react-router-dom';
import { fetchPatients, fetchPatientTimeline } from '../services/api';
import { Patient, TimelineEvent } from '../types';

export const PatientTimeline: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialPatientId = searchParams.get('patient_id') || '';

  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>(initialPatientId);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  useEffect(() => {
    const loadPatients = async () => {
      try {
        const res = await fetchPatients('', 1, 100);
        setPatients(res.items || []);
        if (res.items?.length && !selectedPatientId) {
          setSelectedPatientId(res.items[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadPatients();
  }, []);

  useEffect(() => {
    if (!selectedPatientId) return;
    const loadTimeline = async () => {
      setLoading(true);
      try {
        const events = await fetchPatientTimeline(
          selectedPatientId,
          eventTypeFilter || undefined,
          sortOrder
        );
        setTimelineEvents(events);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadTimeline();
  }, [selectedPatientId, eventTypeFilter, sortOrder]);

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  const getEventBadge = (type: string) => {
    switch (type) {
      case 'cbc':
      case 'lipid':
      case 'metabolic':
      case 'lab_test':
        return { bg: 'bg-teal-50 text-teal-700 border-teal-200', label: 'Laboratory' };
      case 'radiology':
        return { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', label: 'Radiology' };
      case 'consultation':
        return { bg: 'bg-purple-50 text-purple-700 border-purple-200', label: 'Consultation' };
      default:
        return { bg: 'bg-slate-100 text-slate-700 border-slate-200', label: type.toUpperCase() };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Clock className="w-6 h-6 text-teal-600" />
            Patient Chronological Timeline (Step 11)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Chronological aggregation of medical reports, diagnostic panels, and clinical encounters.
          </p>
        </div>
      </div>

      {/* Filter & Selector Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <User className="w-4 h-4 text-slate-400" />
            <span className="font-bold text-slate-700">Patient:</span>
          </div>
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500"
          >
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.patient_identifier})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          {/* Event Type Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={eventTypeFilter}
              onChange={(e) => setEventTypeFilter(e.target.value)}
              className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium"
            >
              <option value="">All Event Categories</option>
              <option value="lab_test">Laboratory Panels</option>
              <option value="cbc">Complete Blood Count</option>
              <option value="lipid">Lipid Panels</option>
              <option value="consultation">Consultations / Visits</option>
            </select>
          </div>

          {/* Chronological Sorting */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setSortOrder('desc')}
              className={`px-2 py-1 rounded text-[11px] font-semibold transition-all ${
                sortOrder === 'desc' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600'
              }`}
            >
              Newest First
            </button>
            <button
              onClick={() => setSortOrder('asc')}
              className={`px-2 py-1 rounded text-[11px] font-semibold transition-all ${
                sortOrder === 'asc' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600'
              }`}
            >
              Oldest First
            </button>
          </div>
        </div>
      </div>

      {/* Selected Patient Dossier Banner */}
      {selectedPatient && (
        <div className="bg-slate-100/70 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Patient Record</span>
              <span className="font-bold text-slate-900 text-sm">{selectedPatient.name}</span>
            </div>
            <div className="hidden sm:block">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Age &amp; Sex</span>
              <span className="font-medium text-slate-700">
                {selectedPatient.age} yrs • {selectedPatient.sex}
              </span>
            </div>
            <div className="hidden md:block">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Conditions</span>
              <span className="font-medium text-slate-700 truncate max-w-xs block">
                {selectedPatient.medical_conditions || 'None documented'}
              </span>
            </div>
          </div>

          <Link
            to={`/reports?patient_id=${selectedPatient.id}`}
            className="text-teal-700 hover:text-teal-800 font-semibold inline-flex items-center gap-1 text-xs"
          >
            <span>View Reports</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Chronological Timeline Stream */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading chronological timeline...</div>
      ) : timelineEvents.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
          No historical timeline events recorded for this patient.
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 space-y-6 before:content-[''] before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {timelineEvents.map((ev) => {
            const badge = getEventBadge(ev.event_type);
            const eventDate = new Date(ev.event_date);

            return (
              <div key={ev.id} className="relative group">
                {/* Node Bullet */}
                <div className="absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 rounded-full bg-white border-2 border-teal-600 flex items-center justify-center text-teal-600 shadow-xs group-hover:scale-110 transition-transform">
                  <Activity className="w-3 h-3" />
                </div>

                {/* Event Card */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-2 hover:border-teal-200 transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{ev.title}</span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${badge.bg}`}>
                        {badge.label}
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-slate-500 font-mono">
                      {eventDate.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                  </div>

                  {ev.summary && (
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      {ev.summary}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                    <div className="flex items-center gap-3">
                      {ev.facility && (
                        <span className="flex items-center gap-1 text-slate-600">
                          <Building className="w-3 h-3 text-slate-400" />
                          {ev.facility}
                        </span>
                      )}
                      {ev.clinician_name && (
                        <span className="flex items-center gap-1 text-slate-600">
                          <UserCheck className="w-3 h-3 text-slate-400" />
                          {ev.clinician_name}
                        </span>
                      )}
                    </div>

                    {ev.source_report_id && (
                      <Link
                        to={`/reports/${ev.source_report_id}/verify`}
                        className="text-teal-600 hover:text-teal-700 font-semibold inline-flex items-center gap-1"
                      >
                        <span>Inspect Source Document</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
