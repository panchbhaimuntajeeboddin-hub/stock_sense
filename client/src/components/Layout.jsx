import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './ui/Sidebar';
import { Navbar } from './ui/Navbar';
import { AIAssistantWidget } from './ui/AIAssistantWidget';

export const Layout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-purple-500 selection:text-white">
      {/* Sidebar */}
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <Navbar searchQuery={searchQuery} onSearchChange={setSearchQuery} />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-8">
          <Outlet context={{ searchQuery }} />
        </main>
      </div>

      {/* Floating AI Assistant Widget */}
      <AIAssistantWidget />
    </div>
  );
};
