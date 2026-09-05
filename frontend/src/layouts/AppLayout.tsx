import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  Activity,
  Server,
  Database,
  ExternalLink,
  ShieldCheck,
  Menu,
  X,
  LayoutDashboard,
  FileText,
  Users,
  GitBranch,
  ActivitySquare,
  CheckSquare,
  AlertTriangle,
  GitCompare,
  Clock,
  Settings as SettingsIcon,
  Search,
  UserCheck,
  RefreshCw,
  Sliders
} from 'lucide-react';
import { useHealthCheck } from '../hooks/useHealthCheck';
import { useAuth } from '../context/AuthContext';
import { useConfig } from '../context/ConfigContext';
import { ClinicalSafetyBanner } from '../components/safety/ClinicalSafetyBanner';
import { Footer } from '../components/layout/Footer';
import { checkDemoStatus, seedDemoData } from '../services/api';
import { UserRole } from '../types';

export const AppLayout: React.FC = () => {
  const { data, loading, error } = useHealthCheck(15000);
  const { user, role, setRole } = useAuth();
  const { settings } = useConfig();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [counts, setCounts] = useState<{
    pendingVerifications: number;
    conflictCount: number;
  }>({ pendingVerifications: 0, conflictCount: 0 });
  const [isSeeding, setIsSeeding] = useState(false);

  const isConnected = !error && (data?.status === 'ok' || data?.status === 'healthy');
  const dbConnected = data?.database?.status === 'connected';

  const loadCounts = async () => {
    try {
      const st = await checkDemoStatus();
      setCounts({
        pendingVerifications: st.pending_verifications || 0,
        conflictCount: st.conflict_count || 0,
      });
    } catch {
      // Offline fallback
    }
  };

  useEffect(() => {
    loadCounts();
    const interval = setInterval(loadCounts, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (globalSearch.trim()) {
      navigate(`/patients?search=${encodeURIComponent(globalSearch.trim())}`);
    }
  };

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      await seedDemoData();
      await loadCounts();
      window.location.reload();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSeeding(false);
    }
  };

  const navItems = [
    { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { name: 'Patient Registry', to: '/patients', icon: Users },
    { name: 'Medical Reports', to: '/reports', icon: FileText },
    {
      name: 'Verification Center',
      to: '/verification',
      icon: CheckSquare,
      badge: counts.pendingVerifications > 0 ? String(counts.pendingVerifications) : undefined,
      badgeColor: 'bg-amber-100 text-amber-800 border border-amber-300',
    },
    {
      name: 'Conflict Center',
      to: '/conflicts',
      icon: AlertTriangle,
      badge: counts.conflictCount > 0 ? String(counts.conflictCount) : undefined,
      badgeColor: 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse',
    },
    { name: 'Report Comparison', to: '/reports/compare', icon: GitCompare },
    { name: 'Patient Timeline', to: '/timeline', icon: Clock },
    { name: 'Provenance & Audit', to: '/provenance', icon: GitBranch },
    { name: 'Settings & Config', to: '/settings', icon: SettingsIcon },
    { name: 'System Diagnostics', to: '/system-health', icon: ActivitySquare },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* 1. Clinical Safety Policy Banner */}
      <ClinicalSafetyBanner />

      {/* 2. Global Accessible Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Left: Brand Logo & Title */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <NavLink to="/dashboard" className="flex items-center gap-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 rounded-lg p-1">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-600 to-slate-900 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
                  <Activity className="w-5 h-5 text-teal-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold tracking-tight text-slate-900">
                      Med<span className="text-teal-600">Lens</span>
                    </span>
                    <span className="bg-teal-50 text-teal-700 border border-teal-200 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider hidden sm:inline">
                      Clinical AI
                    </span>
                  </div>
                </div>
              </NavLink>
            </div>

            {/* Middle: Global Search (Step 12) */}
            <form onSubmit={handleGlobalSearch} className="hidden md:flex items-center flex-1 max-w-md mx-2">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search patients, MRN, lab tests, medications..."
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-xs text-slate-800 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
              </div>
            </form>

            {/* Right: Quick Role Switcher, Seed Demo, & Telemetry */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Seed Demo Data Button */}
              <button
                onClick={handleSeed}
                disabled={isSeeding}
                className="hidden xl:inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 transition-colors"
                title="Populate synthetic patients, reports, and conflicts for demonstration"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-teal-600 ${isSeeding ? 'animate-spin' : ''}`} />
                <span>Reset Demo Data</span>
              </button>

              {/* Role Switcher (Step 17 Access Control) */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
                <UserCheck className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="bg-transparent text-slate-800 text-xs font-medium focus:outline-none cursor-pointer pr-1"
                  title="Switch user role persona to test permissions"
                >
                  <option value="clinician">Clinician (Reviewer)</option>
                  <option value="admin">Administrator</option>
                  <option value="auditor">Auditor</option>
                  <option value="viewer">Viewer (Read-Only)</option>
                </select>
              </div>

              {/* Safety Badge */}
              <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="hidden md:inline">Safety Guard Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg max-h-[80vh] overflow-y-auto">
            {/* Mobile Search */}
            <form onSubmit={handleGlobalSearch} className="mb-3">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search patients, tests..."
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-100 text-xs text-slate-800 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </form>

            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium ${
                    isActive
                      ? 'bg-teal-50 text-teal-800 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4 text-slate-500" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        )}
      </header>

      {/* 3. Workspace Shell */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop Left Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 shrink-0 min-h-[calc(100vh-8rem)]">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Clinical Intelligence
            </span>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
              v0.1.0
            </span>
          </div>

          <nav className="flex-1 p-3 space-y-1" aria-label="Sidebar Navigation">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-teal-50 text-teal-800 font-semibold border-l-4 border-teal-600 pl-2'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4 text-slate-500" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Persona Card */}
          <div className="p-3 border-t border-slate-100 bg-slate-50 m-3 rounded-xl border border-slate-200">
            <div className="text-xs font-semibold text-slate-800 mb-0.5">
              {user?.name || 'Dr. Elena Watson, MD'}
            </div>
            <div className="text-[11px] text-slate-500 mb-2">
              Role: <span className="font-semibold text-teal-700 capitalize">{role}</span>
            </div>
            <div className="text-[10px] text-slate-400">
              Institution: {user?.institution || 'Metropolitan Center'}
            </div>
          </div>
        </aside>

        {/* 4. Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0" id="main-content">
          <Outlet />
        </main>
      </div>

      {/* 5. Global Footer */}
      <Footer />
    </div>
  );
};
