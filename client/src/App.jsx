import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';

import { DashboardPage } from './pages/DashboardPage';
import { AIAssistantPage } from './pages/AIAssistantPage';
import { ReorderPredictionsPage } from './pages/ReorderPredictionsPage';
import { ProductsPage } from './pages/ProductsPage';
import { LowStockPage } from './pages/LowStockPage';
import { ReceiptsPage } from './pages/ReceiptsPage';
import { DeliveriesPage } from './pages/DeliveriesPage';
import { TransfersPage } from './pages/TransfersPage';
import { AdjustmentsPage } from './pages/AdjustmentsPage';
import { LedgerPage } from './pages/LedgerPage';
import { WarehousesPage } from './pages/WarehousesPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';

import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { VerifyOtpPage } from './pages/VerifyOtpPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/verify-otp" element={<VerifyOtpPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Protected Application Routes */}
          <Route element={<Layout />}>
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/ai-assistant" element={<AIAssistantPage />} />
              <Route path="/reorder-predictions" element={<ReorderPredictionsPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/low-stock" element={<LowStockPage />} />
              <Route path="/receipts" element={<ReceiptsPage />} />
              <Route path="/deliveries" element={<DeliveriesPage />} />
              <Route path="/transfers" element={<TransfersPage />} />
              <Route path="/adjustments" element={<AdjustmentsPage />} />
              <Route path="/ledger" element={<LedgerPage />} />
              <Route path="/stock-ledger" element={<LedgerPage />} />
              <Route path="/move-history" element={<LedgerPage />} />
              <Route path="/warehouses" element={<WarehousesPage />} />
              <Route path="/reports" element={<ReportsPage />} />
            </Route>

            {/* Admin / Manager Only Route */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'INVENTORY_MANAGER']} />}>
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
