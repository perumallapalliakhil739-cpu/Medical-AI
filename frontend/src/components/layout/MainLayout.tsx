import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { ClinicalSafetyBanner } from '../safety/ClinicalSafetyBanner';

export const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top Clinical Safety Policy Banner */}
      <ClinicalSafetyBanner />

      {/* Global Application Navbar */}
      <Navbar />

      {/* Workspace Shell */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <main className="flex-1 p-6 lg:p-8 min-w-0">
          <Outlet />
        </main>
      </div>

      {/* Global Footer with Regulatory Notes */}
      <Footer />
    </div>
  );
};
