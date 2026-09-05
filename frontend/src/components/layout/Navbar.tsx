import React from 'react';
import { Activity, Database, Server, ExternalLink, ShieldCheck } from 'lucide-react';
import { useHealthCheck } from '../../hooks/useHealthCheck';

export const Navbar: React.FC = () => {
  const { data, loading, error } = useHealthCheck(15000);

  const isConnected = !error && data?.status === 'healthy';
  const dbConnected = data?.database?.status === 'connected';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-clinical-600 to-navy-800 flex items-center justify-center text-white shadow-md shadow-clinical-500/20">
              <Activity className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-slate-900">
                  Med<span className="text-clinical-600">Lens</span>
                </span>
                <span className="bg-clinical-50 text-clinical-700 border border-clinical-200 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Foundation
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Clinical Information Intelligence Platform
              </p>
            </div>
          </div>

          {/* System Telemetry & Live Indicators */}
          <div className="flex items-center gap-3">
            {/* Backend API Status Badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium bg-slate-50 border-slate-200">
              <Server className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-600">Backend:</span>
              {loading && !data ? (
                <span className="text-slate-400">Connecting...</span>
              ) : isConnected ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active (v{data?.version})
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-rose-600 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  Offline
                </span>
              )}
            </div>

            {/* Database Engine Badge */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium bg-slate-50 border-slate-200">
              <Database className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-600">DB:</span>
              {loading && !data ? (
                <span className="text-slate-400">Checking...</span>
              ) : dbConnected ? (
                <span className="text-clinical-700 font-semibold">
                  {data?.database.engine.split(' ')[0]} ({data?.database.latency_ms}ms)
                </span>
              ) : (
                <span className="text-rose-600 font-semibold">Disconnected</span>
              )}
            </div>

            {/* API Docs Link */}
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-clinical-600 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors shadow-sm"
              title="Open FastAPI Swagger Interactive Documentation"
            >
              <span>API Docs</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            {/* Safety Protocol Indicator */}
            <div className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="hidden lg:inline">Safety Guard Active</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
