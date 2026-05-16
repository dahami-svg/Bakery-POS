/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { PosPage } from './pages/PosPage';
import { KdsPage } from './pages/KdsPage';
import { InventoryPage } from './pages/InventoryPage';

export default function App() {
  return (
    <Router>
      <div className="flex bg-surface h-screen w-full overflow-hidden">
        <Sidebar />
        <main className="flex-1 min-w-0 h-full">
          <Routes>
            <Route path="/" element={<AnalyticsPage />} />
            <Route path="/pos" element={<PosPage />} />
            <Route path="/kds" element={<KdsPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
