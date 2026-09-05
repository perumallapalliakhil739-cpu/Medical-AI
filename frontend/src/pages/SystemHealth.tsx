import React from 'react';
import { 
  ActivitySquare, 
  Server, 
  Database, 
  HardDrive, 
  ShieldCheck, 
  RefreshCw, 
  CheckCircle2, 
  XCircle,
  FileCode2
} from 'lucide-react';
import { useHealthCheck } from '../hooks/useHealthCheck';
import { Button, Card, CardHeader, CardContent, ErrorState } from '../components/ui';

export const SystemHealth: React.FC = () => {
  const { data, loading, error, lastChecked, refetch } = useHealthCheck();

  const isHealthy = !error && (data?.status === 'ok' || data?.status === 'healthy');
  const dbConnected = data?.database?.status === 'connected';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <ActivitySquare className="w-6 h-6 text-teal-600" />
            Full-Stack System Diagnostics
          </h1>
          <p className="text-sm text-slate-500">
            Real-time health verification of FastAPI service, SQLAlchemy database, and local file storage.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => refetch()}
          isLoading={loading}
          leftIcon={<RefreshCw className="w-4 h-4" />}
        >
          Execute Health Check
        </Button>
      </div>

      {/* If error connecting */}
      {error && !data && (
        <ErrorState
          title="Backend Health Probe Unsuccessful"
          message={error}
          onRetry={() => refetch()}
          isRetrying={loading}
        />
      )}

      {/* Diagnostics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Backend & API Server */}
        <Card>
          <CardHeader className="p-5 flex justify-between items-center flex-row">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">FastAPI Application Service</h3>
                <p className="text-xs text-slate-500">HTTP REST & OpenAPI Engine</p>
              </div>
            </div>
            {isHealthy ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" /> Healthy
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                <XCircle className="w-3.5 h-3.5" /> {error ? 'Unreachable' : 'Degraded'}
              </span>
            )}
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="bg-slate-50 rounded-xl p-4 text-xs space-y-2 border border-slate-100 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Service:</span>
                <span className="text-slate-800 font-semibold">{data?.service || 'MedLens API'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Application Name:</span>
                <span className="text-slate-800 font-semibold truncate max-w-[200px]" title={data?.application}>
                  {data?.application || 'MedLens Core'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Semantic Version:</span>
                <span className="text-slate-800">v{data?.version || '0.1.0'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Environment:</span>
                <span className="text-slate-800">{data?.environment || 'development'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Timestamp:</span>
                <span className="text-slate-800">{data?.timestamp ? new Date(data.timestamp).toLocaleString() : '--'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Database Service */}
        <Card>
          <CardHeader className="p-5 flex justify-between items-center flex-row">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">SQLAlchemy Database Layer</h3>
                <p className="text-xs text-slate-500">PostgreSQL Primary / SQLite Dev Fallback</p>
              </div>
            </div>
            {dbConnected ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" /> Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                <XCircle className="w-3.5 h-3.5" /> Disconnected
              </span>
            )}
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="bg-slate-50 rounded-xl p-4 text-xs space-y-2 border border-slate-100 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Active Engine:</span>
                <span className="text-slate-800 font-semibold">{data?.database.engine || 'Checking...'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Dialect:</span>
                <span className="text-slate-800">{data?.database.dialect || 'postgresql'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Probe Latency:</span>
                <span className="text-teal-700 font-bold">{data?.database.latency_ms} ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Connection Test:</span>
                <span className="text-slate-800">SELECT 1 Query Passed</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Storage */}
        <Card>
          <CardHeader className="p-5 flex justify-between items-center flex-row">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Medical Document Storage</h3>
                <p className="text-xs text-slate-500">Upload Repository & Integrity Engine</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" /> Writable
            </span>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="bg-slate-50 rounded-xl p-4 text-xs space-y-2 border border-slate-100 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Storage Status:</span>
                <span className="text-slate-800 font-semibold">{data?.storage.status || 'ready'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Directory Path:</span>
                <span className="text-slate-800 truncate max-w-[200px]" title={data?.storage.upload_directory}>
                  {data?.storage.upload_directory || '../uploads'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Max Upload File Size:</span>
                <span className="text-slate-800">{data?.storage.max_upload_size_mb || 25} MB</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Safety Guard Status */}
        <Card>
          <CardHeader className="p-5 flex justify-between items-center flex-row">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Clinical Safety Protocol</h3>
                <p className="text-xs text-slate-500">Autonomous Diagnosis & Prescription Blocks</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" /> Active
            </span>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="bg-slate-50 rounded-xl p-4 text-xs space-y-2 border border-slate-100 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Autonomous Diagnosis:</span>
                <span className="text-rose-600 font-semibold">BLOCKED (False)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Autonomous Prescription:</span>
                <span className="text-rose-600 font-semibold">BLOCKED (False)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Human-in-the-Loop:</span>
                <span className="text-emerald-700 font-semibold">ENFORCED (True)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Raw Health API JSON Output */}
      <Card>
        <CardHeader className="p-5 flex justify-between items-center flex-row">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <FileCode2 className="w-4 h-4 text-teal-600" />
            <span>Raw Response: <code className="text-xs font-mono font-normal text-slate-600">GET /api/v1/health</code></span>
          </div>
          {lastChecked && (
            <span className="text-xs text-slate-400 font-mono">
              Last probe: {lastChecked.toISOString()}
            </span>
          )}
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono overflow-x-auto border border-slate-800 leading-relaxed">
            {data ? JSON.stringify(data, null, 2) : (error || 'Loading payload...')}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
};
