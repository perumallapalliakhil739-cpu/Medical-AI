import React, { useState } from 'react';
import { ShieldAlert, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

export const ClinicalSafetyBanner: React.FC = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-amber-50 border-b border-amber-200 text-amber-900 text-sm transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <span className="font-semibold text-amber-950 flex-shrink-0">
              Clinical Information Platform Notice:
            </span>
            <span className="text-amber-800 truncate hidden md:inline">
              MedLens does NOT diagnose diseases, prescribe medication, recommend dosage changes, or replace licensed clinicians.
            </span>
            <span className="text-amber-800 md:hidden truncate">
              Assistive tool only. Not for autonomous diagnosis.
            </span>
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs font-semibold text-amber-800 hover:text-amber-950 bg-amber-100/70 hover:bg-amber-200/70 px-2.5 py-1 rounded border border-amber-300 transition-colors flex-shrink-0"
          >
            <span>{expanded ? 'Hide Safety Policy' : 'Safety Rules'}</span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-amber-200/80 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-amber-900">
            <div className="bg-white/80 p-3 rounded-lg border border-amber-200">
              <div className="font-semibold text-amber-950 flex items-center gap-1.5 mb-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                Strict System Boundaries:
              </div>
              <ul className="space-y-1 list-disc list-inside text-amber-800">
                <li><strong>No Autonomous Diagnosis:</strong> Never suggests definitive medical conditions.</li>
                <li><strong>No Prescriptions:</strong> Does not generate medication or therapeutic orders.</li>
                <li><strong>No Dosage Adjustments:</strong> Does not modify or calculate drug dosages.</li>
                <li><strong>No Treatment Plans:</strong> Does not formulate treatment recommendations.</li>
              </ul>
            </div>

            <div className="bg-white/80 p-3 rounded-lg border border-amber-200">
              <div className="font-semibold text-amber-950 flex items-center gap-1.5 mb-1.5">
                <ShieldAlert className="w-4 h-4 text-clinical-600" />
                Intended Assistive Purpose:
              </div>
              <p className="text-amber-800 leading-relaxed">
                MedLens is engineered for <strong>clinical information organization</strong>: collecting patient records, extracting structured provenance-tracked data, detecting record inconsistencies, and comparing longitudinal reports. All clinical decisions remain exclusively with licensed healthcare professionals.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
