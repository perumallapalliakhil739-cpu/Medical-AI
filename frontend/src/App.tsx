import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ConfigProvider } from './context/ConfigContext';
import { AppLayout } from './layouts/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { Reports } from './pages/Reports';
import { Patients } from './pages/Patients';
import { VerificationCenter } from './pages/VerificationCenter';
import { SideBySideVerification } from './pages/SideBySideVerification';
import { ConflictCenter } from './pages/ConflictCenter';
import { ReportComparison } from './pages/ReportComparison';
import { PatientTimeline } from './pages/PatientTimeline';
import { Provenance } from './pages/Provenance';
import { Settings } from './pages/Settings';
import { SystemHealth } from './pages/SystemHealth';

export const App: React.FC = () => {
  return (
    <ConfigProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="patients" element={<Patients />} />
              <Route path="reports" element={<Reports />} />
              <Route path="reports/compare" element={<ReportComparison />} />
              <Route path="reports/:id/verify" element={<SideBySideVerification />} />
              <Route path="verification" element={<VerificationCenter />} />
              <Route path="conflicts" element={<ConflictCenter />} />
              <Route path="timeline" element={<PatientTimeline />} />
              <Route path="provenance" element={<Provenance />} />
              <Route path="settings" element={<Settings />} />
              <Route path="system-health" element={<SystemHealth />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ConfigProvider>
  );
};

export default App;
