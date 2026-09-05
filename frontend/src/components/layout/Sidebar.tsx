import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  GitBranch, 
  ActivitySquare, 
  ShieldCheck,
  FolderGit2
} from 'lucide-react';

interface NavItem {
  name: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  statusBadge?: string;
}

const navItems: NavItem[] = [
  { name: 'System Overview', to: '/', icon: LayoutDashboard },
  { name: 'Medical Reports', to: '/reports', icon: FileText, statusBadge: 'Next' },
  { name: 'Patient Registry', to: '/patients', icon: Users, statusBadge: 'Next' },
  { name: 'Provenance & Audit', to: '/provenance', icon: GitBranch, statusBadge: 'Next' },
  { name: 'System Diagnostics', to: '/system-health', icon: ActivitySquare },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      {/* Platform Title */}
      <div className="p-4 border-b border-slate-100">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Intelligence Workspace
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-clinical-50 text-clinical-800 font-semibold border-l-4 border-clinical-600 pl-2'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`
            }
          >
            <div className="flex items-center gap-3">
              <item.icon className="w-4 h-4 text-slate-500" />
              <span>{item.name}</span>
            </div>
            {item.statusBadge && (
              <span className="text-[10px] uppercase font-semibold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                {item.statusBadge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Monorepo Foundation Badge */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50 m-3 rounded-xl border">
        <div className="flex items-center gap-2 text-slate-700 text-xs font-semibold mb-1">
          <FolderGit2 className="w-4 h-4 text-clinical-600" />
          <span>Foundation Monorepo</span>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Full-stack React, FastAPI, and SQLAlchemy architecture initialized.
        </p>
        <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Zero-AI Baseline</span>
        </div>
      </div>
    </aside>
  );
};
