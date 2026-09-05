import React from 'react';
import { Shield, AlertCircle } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto text-xs text-slate-500 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-600">
            <Shield className="w-4 h-4 text-clinical-600" />
            <span className="font-semibold text-slate-800">
              MedLens — AI-Powered Clinical Information Intelligence
            </span>
            <span>• System Foundation v0.1.0</span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            <span>
              Assistive clinical organization platform. Does not replace professional healthcare judgments.
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
