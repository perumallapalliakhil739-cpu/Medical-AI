import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Sliders,
  Sparkles,
  Shield,
  ToggleLeft,
  ToggleRight,
  Save,
  CheckCircle2,
  RefreshCw,
  Palette,
  FileCheck
} from 'lucide-react';
import { useConfig } from '../context/ConfigContext';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

export const Settings: React.FC = () => {
  const { settings, updateSettings, isLoading } = useConfig();
  const { role, setRole, user } = useAuth();

  const [form, setForm] = useState({
    app_name: settings.app_name,
    tagline: settings.tagline,
    theme_color: settings.theme_color,
    confidence_threshold_high: settings.confidence_threshold_high,
    confidence_threshold_medium: settings.confidence_threshold_medium,
    ai_summary_instructions: settings.ai_summary_instructions,
    feature_toggles: { ...settings.feature_toggles },
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleToggle = (key: keyof typeof form.feature_toggles) => {
    setForm((prev) => ({
      ...prev,
      feature_toggles: {
        ...prev.feature_toggles,
        [key]: !prev.feature_toggles[key],
      },
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettings(form);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save settings');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-teal-600" />
            System Settings &amp; Dynamic Customization (Step 24 &amp; 30)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Runtime customization of application branding, confidence thresholds, AI prompts, and modular feature toggles.
          </p>
        </div>

        {savedSuccess && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Settings Saved Successfully</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* 1. Branding & Theme */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
            <Palette className="w-4 h-4 text-teal-600" />
            <span>Application Branding &amp; Visual Identity</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Application Name</label>
              <input
                type="text"
                value={form.app_name}
                onChange={(e) => setForm({ ...form, app_name: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tagline</label>
              <input
                type="text"
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
        </div>

        {/* 2. Confidence Thresholds (Step 14) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
            <Sliders className="w-4 h-4 text-amber-600" />
            <span>Extraction Confidence Scoring Thresholds (Step 14)</span>
          </div>

          <p className="text-slate-500 text-xs">
            Determines the categorization of extracted laboratory measurements and triggers automated routing to the Human Verification Center.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">High Confidence Threshold (🟢)</span>
                <span className="font-mono font-bold text-teal-700">
                  {Math.round(form.confidence_threshold_high * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.75"
                max="0.99"
                step="0.01"
                value={form.confidence_threshold_high}
                onChange={(e) =>
                  setForm({ ...form, confidence_threshold_high: parseFloat(e.target.value) })
                }
                className="w-full accent-teal-600 cursor-pointer"
              />
              <span className="text-[11px] text-slate-400 block">
                Extractions at or above this score are classified as High Confidence.
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">Medium Confidence Threshold (🟡)</span>
                <span className="font-mono font-bold text-amber-700">
                  {Math.round(form.confidence_threshold_medium * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.50"
                max="0.85"
                step="0.01"
                value={form.confidence_threshold_medium}
                onChange={(e) =>
                  setForm({ ...form, confidence_threshold_medium: parseFloat(e.target.value) })
                }
                className="w-full accent-amber-500 cursor-pointer"
              />
              <span className="text-[11px] text-slate-400 block">
                Extractions below this score (🔴) are automatically routed to the Verification Center.
              </span>
            </div>
          </div>
        </div>

        {/* 3. AI Safety & Summary Instructions (Step 9 & 21) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>Responsible AI Prompt Instructions &amp; Safety Guardrails (Step 9 &amp; 21)</span>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              System Instruction for AI Patient-Friendly Summaries
            </label>
            <textarea
              rows={3}
              value={form.ai_summary_instructions}
              onChange={(e) => setForm({ ...form, ai_summary_instructions: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs leading-relaxed focus:ring-2 focus:ring-teal-500"
            />
            <span className="text-[11px] text-slate-400 block mt-1">
              Under medical safety policies, AI instructions must always restrict diagnoses, prescriptions, or dosage changes.
            </span>
          </div>
        </div>

        {/* 4. Modular Feature Toggles (Step 24) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
            <Shield className="w-4 h-4 text-indigo-600" />
            <span>Modular Feature Toggles</span>
          </div>

          <p className="text-slate-500 text-xs">
            Enable or disable major application features dynamically without code refactoring.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(form.feature_toggles).map(([key, enabled]) => (
              <div
                key={key}
                onClick={() => handleToggle(key as any)}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <div>
                  <span className="font-semibold text-slate-800 capitalize block">
                    {key.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {enabled ? 'Active and accessible' : 'Disabled'}
                  </span>
                </div>

                <div className={enabled ? 'text-teal-600' : 'text-slate-300'}>
                  {enabled ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7" />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Active User Role Persona (Step 17) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
            Active Clinical Role Persona (Access Control Testing)
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(['clinician', 'admin', 'auditor', 'viewer'] as UserRole[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`p-2.5 rounded-lg border text-center transition-all capitalize font-semibold ${
                  role === r
                    ? 'bg-teal-50 text-teal-800 border-teal-300 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};
