import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  AlertTriangle,
  PackageCheck,
  Brain,
  Search,
  Filter,
  ArrowRight,
  Sparkles,
  Info,
  Clock,
  ShieldAlert,
  RefreshCw,
  PlusCircle
} from 'lucide-react';

export const ReorderPredictionsPage = () => {
  const navigate = useNavigate();
  const [predictions, setPredictions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [disclaimer, setDisclaimer] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRisk, setSelectedRisk] = useState('ALL');
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');

  const fetchPredictions = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('stocksense_token');
      let url = '/api/ai/reorder-predictions?';
      if (selectedRisk !== 'ALL') url += `riskLevel=${selectedRisk}&`;
      if (selectedWarehouse) url += `warehouseId=${selectedWarehouse}&`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (response.ok) {
        setPredictions(data.data || []);
        setSummary(data.summary || null);
        setDisclaimer(data.disclaimer || '');
      } else {
        setError(data.message || 'Failed to load reorder predictions');
      }
    } catch (err) {
      setError('Network error loading AI reorder predictions');
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const token = localStorage.getItem('stocksense_token');
      const res = await fetch('/api/warehouses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setWarehouses(data.data || []);
      }
    } catch (e) {
      // Ignore background error
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  useEffect(() => {
    fetchPredictions();
  }, [selectedRisk, selectedWarehouse]);

  const filteredPredictions = predictions.filter((p) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      p.name.toLowerCase().includes(query) ||
      p.sku.toLowerCase().includes(query) ||
      p.categoryName.toLowerCase().includes(query)
    );
  });

  const getRiskBadge = (risk) => {
    switch (risk) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <ShieldAlert className="w-3.5 h-3.5 animate-pulse" />
            CRITICAL
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3.5 h-3.5" />
            HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
            <Clock className="w-3.5 h-3.5" />
            MEDIUM
          </span>
        );
      case 'LOW':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <PackageCheck className="w-3.5 h-3.5" />
            LOW
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            <Info className="w-3.5 h-3.5" />
            INSUFFICIENT DATA
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
              <Brain className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight">
              AI Demand & Reorder Recommendations
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20">
              AI ESTIMATE
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">
            Predictive stockout analysis based on historical StockLedger consumption rates.
          </p>
        </div>

        <button
          onClick={fetchPredictions}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Forecast
        </button>
      </div>

      {/* DISCLAIMER BANNER */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-purple-950/40 border border-purple-500/20 text-purple-200 text-xs leading-relaxed">
        <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
        <div>
          <strong className="font-semibold text-purple-300">Statistical AI Estimation Disclaimer:</strong>{' '}
          {disclaimer || 'Predictions and suggested reorder quantities are statistical estimates derived from historical StockLedger delivery records.'}
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/40 border border-rose-500/20 backdrop-blur-xl">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
              <span>Critical Stockouts</span>
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-bold text-rose-400">{summary.criticalRiskCount}</div>
            <p className="text-[11px] text-slate-500 mt-1">Stock depleted or &le; 3 days left</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/40 border border-amber-500/20 backdrop-blur-xl">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
              <span>High Risk Items</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-400">{summary.highRiskCount}</div>
            <p className="text-[11px] text-slate-500 mt-1">&le; Reorder level or &le; 7 days left</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/40 border border-purple-500/20 backdrop-blur-xl">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
              <span>Suggested Reorders</span>
              <TrendingUp className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-purple-400">
              {summary.totalSuggestedReorderQty.toLocaleString()} <span className="text-xs font-normal text-slate-400">units</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Total recommended replenishment</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 backdrop-blur-xl">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
              <span>Evaluated Products</span>
              <Brain className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-slate-100">{summary.totalProducts}</div>
            <p className="text-[11px] text-slate-500 mt-1">Active inventory items analyzed</p>
          </div>
        </div>
      )}

      {/* FILTER CONTROLS */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/40 border border-slate-800">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by product name, SKU, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INSUFFICIENT_DATA'].map((risk) => (
              <button
                key={risk}
                onClick={() => setSelectedRisk(risk)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedRisk === risk
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {risk.replace('_', ' ')}
              </button>
            ))}
          </div>

          {warehouses.length > 0 && (
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-purple-500"
            >
              <option value="">All Warehouses</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* PREDICTIONS TABLE */}
      <div className="bg-slate-900/40 rounded-2xl border border-slate-800 overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-4">Product & SKU</th>
                <th className="p-4">Category</th>
                <th className="p-4 text-center">Current Stock</th>
                <th className="p-4 text-center">Avg Daily Usage</th>
                <th className="p-4 text-center">Est. Days Left</th>
                <th className="p-4 text-center">Reorder Level</th>
                <th className="p-4 text-center">Suggested Reorder</th>
                <th className="p-4 text-center">Risk Level</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan="9" className="p-8 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-3">
                      <RefreshCw className="w-5 h-5 animate-spin text-purple-400" />
                      <span>Analyzing historical StockLedger delivery logs...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredPredictions.length === 0 ? (
                <tr>
                  <td colSpan="9" className="p-12 text-center text-slate-400">
                    <Brain className="w-10 h-10 mx-auto text-slate-600 mb-3" />
                    <p className="text-sm font-semibold text-slate-300">No predictions matching filters</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Try resetting your search query or risk level filter.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPredictions.map((item) => (
                  <tr key={item.productId} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-100">{item.name}</div>
                      <div className="text-[11px] font-mono text-slate-500">{item.sku}</div>
                    </td>

                    <td className="p-4 text-slate-400">{item.categoryName}</td>

                    <td className="p-4 text-center font-bold">
                      <span className={item.currentStock === 0 ? 'text-rose-400' : 'text-slate-100'}>
                        {item.currentStock.toLocaleString()} {item.unit}
                      </span>
                    </td>

                    <td className="p-4 text-center font-mono">
                      {item.averageDailyUsage > 0 ? (
                        <span className="text-purple-300 font-semibold">
                          {item.averageDailyUsage} <span className="text-[10px] text-slate-500">/day</span>
                        </span>
                      ) : (
                        <span className="text-slate-500">0.00</span>
                      )}
                    </td>

                    <td className="p-4 text-center font-bold">
                      {item.estimatedDaysRemaining !== null ? (
                        <span
                          className={
                            item.estimatedDaysRemaining <= 3
                              ? 'text-rose-400 font-extrabold'
                              : item.estimatedDaysRemaining <= 7
                              ? 'text-amber-400 font-extrabold'
                              : 'text-slate-200'
                          }
                        >
                          {item.estimatedDaysRemaining} days
                        </span>
                      ) : (
                        <span className="text-slate-500 font-normal">N/A (No sales)</span>
                      )}
                    </td>

                    <td className="p-4 text-center text-slate-400">{item.reorderLevel}</td>

                    <td className="p-4 text-center">
                      {item.suggestedReorderQuantity > 0 ? (
                        <span className="inline-flex items-center gap-1 font-bold text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-lg border border-purple-500/20">
                          +{item.suggestedReorderQuantity.toLocaleString()} {item.unit}
                        </span>
                      ) : (
                        <span className="text-slate-500">0</span>
                      )}
                    </td>

                    <td className="p-4 text-center">{getRiskBadge(item.riskLevel)}</td>

                    <td className="p-4 text-right">
                      {item.suggestedReorderQuantity > 0 ? (
                        <button
                          onClick={() => navigate('/receipts')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/20"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          Reorder
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-500">Stock Optimal</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
