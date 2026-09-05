import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  FileText,
  Clock,
  Download,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  X,
  ExternalLink,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  fetchPatients,
  createPatient,
  updatePatient,
  deletePatient,
  getPatient
} from '../services/api';
import { Patient, PatientCreate, PatientUpdate, SourceLabel } from '../types';
import { SourceTag } from '../components/common/SourceTag';
import { useAuth } from '../context/AuthContext';

export const Patients: React.FC = () => {
  const { role } = useAuth();
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState(initialSearch);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<PatientCreate>({
    name: '',
    patient_identifier: '',
    date_of_birth: '',
    age: undefined,
    sex: 'Female',
    contact_information: '',
    symptoms: '',
    medical_conditions: '',
    allergies: '',
    current_medications: '',
    relevant_medical_history: '',
    family_history: '',
    other_information: '',
    field_sources: JSON.stringify({
      name: 'User Provided',
      age: 'User Provided',
      allergies: 'User Provided',
      current_medications: 'User Provided'
    })
  });

  const loadPatients = async (query = search) => {
    setLoading(true);
    try {
      const res = await fetchPatients(query);
      setPatients(res.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients(initialSearch);
  }, [initialSearch]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadPatients(search);
  };

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPatient(formData);
      setShowCreateModal(false);
      resetForm();
      loadPatients();
    } catch (err: any) {
      alert(err.message || 'Failed to create patient');
    }
  };

  const handleUpdatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    try {
      await updatePatient(selectedPatient.id, formData);
      setShowEditModal(false);
      loadPatients();
      // Reload active patient
      const updated = await getPatient(selectedPatient.id);
      setSelectedPatient(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to update patient');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePatient(id);
      setShowDeleteConfirm(null);
      if (selectedPatient?.id === id) setSelectedPatient(null);
      loadPatients();
    } catch (err: any) {
      alert(err.message || 'Failed to delete patient');
    }
  };

  const openEditModal = (p: Patient) => {
    setSelectedPatient(p);
    setFormData({
      name: p.name,
      patient_identifier: p.patient_identifier,
      date_of_birth: p.date_of_birth || '',
      age: p.age || undefined,
      sex: p.sex,
      contact_information: p.contact_information || '',
      symptoms: p.symptoms || '',
      medical_conditions: p.medical_conditions || '',
      allergies: p.allergies || '',
      current_medications: p.current_medications || '',
      relevant_medical_history: p.relevant_medical_history || '',
      family_history: p.family_history || '',
      other_information: p.other_information || '',
      field_sources: p.field_sources || ''
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      patient_identifier: '',
      date_of_birth: '',
      age: undefined,
      sex: 'Female',
      contact_information: '',
      symptoms: '',
      medical_conditions: '',
      allergies: '',
      current_medications: '',
      relevant_medical_history: '',
      family_history: '',
      other_information: '',
      field_sources: JSON.stringify({
        name: 'User Provided',
        age: 'User Provided',
        allergies: 'User Provided',
        current_medications: 'User Provided'
      })
    });
  };

  const parseFieldSources = (raw?: string | null): Record<string, string> => {
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-teal-600" />
            Patient Registry
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Comprehensive clinical records with per-field provenance tracking and longitudinal timeline mapping.
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowCreateModal(true);
          }}
          className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register New Patient</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search across patient name, MRN / Patient ID, symptoms, allergies, medications..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white text-xs text-slate-800 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-xs"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition-colors"
        >
          Search
        </button>
      </form>

      {/* Patient Registry Table & Detail Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Table List (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Enrolled Patients ({patients.length})
            </span>
            <span className="text-[11px] text-slate-500">Click a record to view dossier</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading patient records...</div>
          ) : patients.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No patients found. Click "Register New Patient" or reset demo data.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="py-2.5 px-4">Patient ID / Name</th>
                    <th className="py-2.5 px-3">Age &amp; Sex</th>
                    <th className="py-2.5 px-3">Allergies</th>
                    <th className="py-2.5 px-3">Current Medications</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {patients.map((p) => {
                    const isSelected = selectedPatient?.id === p.id;
                    return (
                      <tr
                        key={p.id}
                        onClick={() => setSelectedPatient(p)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-teal-50/60 font-medium' : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{p.name}</div>
                          <div className="text-[11px] font-mono text-teal-700">{p.patient_identifier}</div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="text-slate-800">{p.age ? `${p.age} yrs` : 'N/A'}</div>
                          <div className="text-[11px] text-slate-500">{p.sex}</div>
                        </td>
                        <td className="py-3 px-3 max-w-[140px] truncate" title={p.allergies || 'None'}>
                          {p.allergies ? (
                            <span className="text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded text-[11px]">
                              {p.allergies}
                            </span>
                          ) : (
                            <span className="text-slate-400">None documented</span>
                          )}
                        </td>
                        <td className="py-3 px-3 max-w-[150px] truncate text-slate-700" title={p.current_medications || ''}>
                          {p.current_medications || 'None documented'}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => openEditModal(p)}
                              className="p-1 rounded text-slate-400 hover:text-teal-600 hover:bg-slate-100"
                              title="Edit Patient Profile"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setShowDeleteConfirm(p.id)}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100"
                              title="Delete Patient Record"
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

        {/* Patient Detail Dossier Card (Right Col) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          {selectedPatient ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">{selectedPatient.name}</h2>
                  <div className="font-mono text-xs text-teal-700 mt-0.5">
                    ID: {selectedPatient.patient_identifier}
                  </div>
                </div>
                <button
                  onClick={() => openEditModal(selectedPatient)}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold inline-flex items-center gap-1"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              </div>

              {/* Demographics & Provenance */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">DOB / Age</span>
                  <span className="font-semibold text-slate-800">
                    {selectedPatient.date_of_birth || 'N/A'} ({selectedPatient.age} yrs)
                  </span>
                  <SourceTag source="User Provided" size="sm" className="mt-1" />
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Sex Designation</span>
                  <span className="font-semibold text-slate-800">{selectedPatient.sex}</span>
                </div>
              </div>

              {/* Contact */}
              {selectedPatient.contact_information && (
                <div className="text-xs">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Contact</span>
                  <span className="text-slate-700">{selectedPatient.contact_information}</span>
                </div>
              )}

              {/* Clinical Notes & History */}
              <div className="space-y-2.5 text-xs">
                <div>
                  <span className="text-slate-500 font-bold block text-[11px]">Reported Symptoms:</span>
                  <p className="text-slate-700 bg-slate-50/60 p-2 rounded border border-slate-100 mt-0.5">
                    {selectedPatient.symptoms || 'None documented'}
                  </p>
                </div>

                <div>
                  <span className="text-slate-500 font-bold block text-[11px]">Active Conditions:</span>
                  <p className="text-slate-700 bg-slate-50/60 p-2 rounded border border-slate-100 mt-0.5">
                    {selectedPatient.medical_conditions || 'None documented'}
                  </p>
                </div>

                <div>
                  <span className="text-slate-500 font-bold block text-[11px]">Documented Allergies:</span>
                  <div className="mt-0.5">
                    {selectedPatient.allergies ? (
                      <span className="text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded inline-block font-semibold">
                        {selectedPatient.allergies}
                      </span>
                    ) : (
                      <span className="text-slate-400">None documented</span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 font-bold block text-[11px]">Current Medications:</span>
                  <p className="text-slate-700 bg-slate-50/60 p-2 rounded border border-slate-100 mt-0.5">
                    {selectedPatient.current_medications || 'None documented'}
                  </p>
                </div>

                {selectedPatient.relevant_medical_history && (
                  <div>
                    <span className="text-slate-500 font-bold block text-[11px]">Medical History:</span>
                    <p className="text-slate-700 bg-slate-50/60 p-2 rounded border border-slate-100 mt-0.5">
                      {selectedPatient.relevant_medical_history}
                    </p>
                  </div>
                )}
              </div>

              {/* Direct Navigation Links */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <Link
                  to={`/timeline?patient_id=${selectedPatient.id}`}
                  className="w-full flex items-center justify-between p-2 bg-slate-50 hover:bg-teal-50 text-slate-700 hover:text-teal-800 text-xs font-semibold rounded-lg border border-slate-200 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-teal-600" />
                    Chronological Timeline
                  </span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>

                <Link
                  to={`/reports?patient_id=${selectedPatient.id}`}
                  className="w-full flex items-center justify-between p-2 bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-800 text-xs font-semibold rounded-lg border border-slate-200 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    Medical Reports on File
                  </span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>

                {/* Export Options (Step 23) */}
                <div className="pt-2 flex gap-2">
                  <a
                    href={`http://localhost:8000/api/v1/export/patient/${selectedPatient.id}/html`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 text-center py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] rounded-lg transition-colors border border-slate-200"
                  >
                    Print Dossier / PDF
                  </a>
                  <a
                    href={`http://localhost:8000/api/v1/export/patient/${selectedPatient.id}/csv`}
                    className="flex-1 text-center py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] rounded-lg transition-colors border border-slate-200"
                  >
                    Export CSV
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              Select a patient from the list to view profile, clinical notes, and records.
            </div>
          )}
        </div>
      </div>

      {/* Register Patient Modal (Step 2) */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-teal-600" />
                {showCreateModal ? 'Register New Patient Profile' : 'Edit Patient Profile'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={showCreateModal ? handleCreatePatient : handleUpdatePatient} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500"
                    placeholder="e.g. Eleanor Vance"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Custom Patient ID / MRN</label>
                  <input
                    type="text"
                    value={formData.patient_identifier || ''}
                    onChange={(e) => setFormData({ ...formData, patient_identifier: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500"
                    placeholder="Auto-generated if left blank"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.date_of_birth || ''}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Age (Years)</label>
                    <input
                      type="number"
                      value={formData.age || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          age: e.target.value ? parseInt(e.target.value) : undefined,
                        })
                      }
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Sex</label>
                    <select
                      value={formData.sex}
                      onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                      <option value="Not Specified">Not Specified</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Contact Information</label>
                <input
                  type="text"
                  value={formData.contact_information || ''}
                  onChange={(e) => setFormData({ ...formData, contact_information: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500"
                  placeholder="Phone, email, or guardian contact"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Primary Symptoms</label>
                  <textarea
                    rows={2}
                    value={formData.symptoms || ''}
                    onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500"
                    placeholder="Document chief clinical complaint..."
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Medical Conditions</label>
                  <textarea
                    rows={2}
                    value={formData.medical_conditions || ''}
                    onChange={(e) => setFormData({ ...formData, medical_conditions: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500"
                    placeholder="Prior diagnosed chronic or acute conditions..."
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Allergies (Critical for Conflict Engine)</label>
                  <input
                    type="text"
                    value={formData.allergies || ''}
                    onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500"
                    placeholder="e.g. Penicillin, Sulfa, Aspirin"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Current Medications</label>
                  <input
                    type="text"
                    value={formData.current_medications || ''}
                    onChange={(e) => setFormData({ ...formData, current_medications: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500"
                    placeholder="e.g. Metformin 500mg BID, Lisinopril 10mg"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg text-xs shadow-xs"
                >
                  {showCreateModal ? 'Register Patient' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertCircle className="w-6 h-6" />
              <h3 className="font-bold text-base text-slate-900">Confirm Deletion</h3>
            </div>
            <p className="text-xs text-slate-600">
              Are you sure you want to remove this patient profile and all associated laboratory records? This action is tracked in the immutable audit log.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg text-xs"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
