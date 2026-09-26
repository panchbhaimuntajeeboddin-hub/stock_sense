import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  LayoutDashboard,
  Package,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Building2,
  RefreshCw,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  Layers,
  History,
  Ban,
  Boxes
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { DataTable } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';

export const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Data States
  const [summary, setSummary] = useState({
    totalProducts: 0,
    totalStockUnits: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    pendingReceipts: 0,
    pendingDeliveries: 0,
    scheduledTransfers: 0,
    totalWarehouses: 0
  });

  const [charts, setCharts] = useState({
    incomingOverTime: [],
    outgoingOverTime: [],
    stockMovement: [],
    stockByCategory: [],
    stockByWarehouse: []
  });

  const [sections, setSections] = useState({
    lowStockProducts: [],
    recentMovements: [],
    pendingReceipts: [],
    pendingDeliveries: []
  });

  // Metadata for filter dropdowns
  const [categories, setCategories] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [locations, setLocations] = useState([]);

  // Filter States
  const [warehouseFilter, setWarehouseFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchMetadata = async () => {
    try {
      const [catRes, whRes] = await Promise.all([
        api.get('/categories'),
        api.get('/warehouses')
      ]);
      setCategories(catRes.data.data || []);
      setWarehouses(whRes.data.data || []);
    } catch (e) {
      console.error('Error fetching metadata dropdowns', e);
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        warehouseId: warehouseFilter !== 'All' ? warehouseFilter : undefined,
        locationId: locationFilter !== 'All' ? locationFilter : undefined,
        categoryId: categoryFilter !== 'All' ? categoryFilter : undefined,
        type: typeFilter !== 'All' ? typeFilter : undefined,
        status: statusFilter !== 'All' ? statusFilter : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      };

      const res = await api.get('/dashboard', { params });
      const data = res.data.data;

      if (data) {
        if (data.summary) setSummary(data.summary);
        if (data.charts) setCharts(data.charts);
        if (data.sections) setSections(data.sections);
      }

      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch dashboard metrics');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [warehouseFilter, locationFilter, categoryFilter, typeFilter, statusFilter, startDate, endDate]);

  const handleWarehouseFilterChange = async (whId) => {
    setWarehouseFilter(whId);
    setLocationFilter('All');
    if (whId === 'All') {
      setLocations([]);
      return;
    }
    const wh = warehouses.find((w) => w.id === whId);
    if (wh && wh.locations?.length > 0) {
      setLocations(wh.locations);
    } else {
      try {
        const res = await api.get(`/warehouses/${whId}/locations`);
        setLocations(res.data.data || []);
      } catch (e) {
        setLocations([]);
      }
    }
  };

  const resetFilters = () => {
    setWarehouseFilter('All');
    setLocationFilter('All');
    setCategoryFilter('All');
    setTypeFilter('All');
    setStatusFilter('All');
    setStartDate('');
    setEndDate('');
  };

  if (loading && !summary.totalProducts) {
    return (
      <div className="py-20">
        <LoadingSpinner message="Aggregating real-time database metrics..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-6 rounded-2xl backdrop-blur-xl">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-purple-400" /> Executive Inventory Dashboard
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time analytics aggregated directly from PostgreSQL database inventory operations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" icon={RefreshCw} onClick={fetchDashboardData} size="sm">
            Refresh Metrics
          </Button>
        </div>
      </div>

      {/* GLOBAL FILTERS PANEL */}
      <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Filter className="w-4 h-4 text-purple-400" /> Dashboard Aggregation Filters
          </span>
          <button
            onClick={resetFilters}
            className="text-xs text-purple-400 hover:text-purple-300 font-semibold"
          >
            Reset Filters
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
          <Select label="Warehouse" value={warehouseFilter} onChange={(e) => handleWarehouseFilterChange(e.target.value)}>
            <option value="All">All Warehouses</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </Select>

          <Select label="Location" value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}>
            <option value="All">All Locations</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </Select>

          <Select label="Category" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="All">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>

          <Select label="Movement Type" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="All">All Types</option>
            <option value="RECEIPT">RECEIPT</option>
            <option value="DELIVERY">DELIVERY</option>
            <option value="TRANSFER_IN">TRANSFER_IN</option>
            <option value="TRANSFER_OUT">TRANSFER_OUT</option>
            <option value="ADJUSTMENT">ADJUSTMENT</option>
          </Select>

          <Select label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All Statuses</option>
            <option value="DRAFT">DRAFT</option>
            <option value="WAITING">WAITING</option>
            <option value="READY">READY</option>
            <option value="DONE">DONE</option>
          </Select>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>
      </div>

      {/* 7 MANDATORY KPI CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {/* KPI 1: Total Products */}
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
              <Package className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">
              Catalog
            </span>
          </div>
          <h3 className="text-xl font-extrabold text-white">{summary.totalProducts}</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Total Products</p>
          <span className="text-[10px] text-purple-300 font-mono font-bold block mt-1">
            {summary.totalStockUnits} units in stock
          </span>
        </div>

        {/* KPI 2: Low Stock Items */}
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
              Warning
            </span>
          </div>
          <h3 className="text-xl font-extrabold text-white">{summary.lowStockItems}</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Low Stock Items</p>
          <span className="text-[10px] text-amber-400 font-bold block mt-1">Reorder Required</span>
        </div>

        {/* KPI 3: Out of Stock Items */}
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
              <Ban className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full">
              Critical
            </span>
          </div>
          <h3 className="text-xl font-extrabold text-white">{summary.outOfStockItems}</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Out of Stock</p>
          <span className="text-[10px] text-rose-400 font-bold block mt-1">Zero Stock Units</span>
        </div>

        {/* KPI 4: Pending Receipts */}
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              Incoming
            </span>
          </div>
          <h3 className="text-xl font-extrabold text-white">{summary.pendingReceipts}</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Pending Receipts</p>
          <span className="text-[10px] text-emerald-400 font-bold block mt-1">Inbound Goods</span>
        </div>

        {/* KPI 5: Pending Deliveries */}
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full">
              Outgoing
            </span>
          </div>
          <h3 className="text-xl font-extrabold text-white">{summary.pendingDeliveries}</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Pending Deliveries</p>
          <span className="text-[10px] text-cyan-400 font-bold block mt-1">Outbound Goods</span>
        </div>

        {/* KPI 6: Scheduled Transfers */}
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
              Relocation
            </span>
          </div>
          <h3 className="text-xl font-extrabold text-white">{summary.scheduledTransfers}</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Scheduled Transfers</p>
          <span className="text-[10px] text-indigo-400 font-bold block mt-1">Internal Move</span>
        </div>

        {/* KPI 7: Total Warehouses */}
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
              <Building2 className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">
              Facilities
            </span>
          </div>
          <h3 className="text-xl font-extrabold text-white">{summary.totalWarehouses}</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Total Warehouses</p>
          <span className="text-[10px] text-purple-300 font-bold block mt-1">Active Storage</span>
        </div>
      </div>

      {/* RECHARTS VISUALIZATION GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 1: INCOMING & OUTGOING TRENDS OVER TIME */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl backdrop-blur-xl">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" /> Incoming Stock Volume Over Time
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.incomingOverTime}>
                <defs>
                  <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
                <Area type="monotone" dataKey="quantity" stroke="#10b981" fillOpacity={1} fill="url(#colorInc)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: OUTGOING STOCK VOLUME OVER TIME */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl backdrop-blur-xl">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-amber-400" /> Outgoing Stock Volume Over Time
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.outgoingOverTime}>
                <defs>
                  <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
                <Area type="monotone" dataKey="quantity" stroke="#f59e0b" fillOpacity={1} fill="url(#colorOut)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 3: STOCK MOVEMENT BREAKDOWN */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl backdrop-blur-xl">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <History className="w-4 h-4 text-purple-400" /> Stock Movement Volume by Type
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.stockMovement}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="type" stroke="#64748b" tick={{ fontSize: 9 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {charts.stockMovement?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill || '#a855f7'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 4: STOCK BY CATEGORY */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl backdrop-blur-xl">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" /> Stock Volume by Category
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.stockByCategory} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis dataKey="category" type="category" stroke="#64748b" tick={{ fontSize: 10 }} width={100} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
                <Bar dataKey="stock" fill="#06b6d4" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* CHART 5: STOCK BY WAREHOUSE */}
      <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl backdrop-blur-xl">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-indigo-400" /> Total Inventory Units Distribution Across Warehouses
        </h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={charts.stockByWarehouse}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="warehouse" stroke="#64748b" tick={{ fontSize: 10 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
              <Bar dataKey="stock" fill="#818cf8" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4 MANDATORY SECTIONS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION 1: LOW STOCK PRODUCTS */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Low / Out of Stock Products
            </h3>
            <span className="text-[10px] bg-rose-500/20 text-rose-300 font-bold px-2 py-0.5 rounded-full">
              {sections.lowStockProducts?.length || 0} Alerts
            </span>
          </div>

          <DataTable
            columns={[
              {
                header: 'Product',
                accessor: 'name',
                render: (row) => (
                  <div>
                    <p className="font-bold text-white text-xs">{row.name}</p>
                    <span className="font-mono text-[10px] text-slate-400">{row.sku}</span>
                  </div>
                )
              },
              {
                header: 'Current Stock',
                accessor: 'currentStock',
                render: (row) => (
                  <span className={`font-mono font-bold ${row.currentStock === 0 ? 'text-rose-400' : 'text-amber-400'}`}>
                    {row.currentStock} {row.unit}
                  </span>
                )
              },
              {
                header: 'Reorder Level',
                accessor: 'reorderLevel',
                render: (row) => <span className="font-mono text-slate-400 text-xs">{row.reorderLevel}</span>
              },
              {
                header: 'Status',
                accessor: 'status',
                render: (row) => (
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      row.status === 'Out of Stock'
                        ? 'bg-rose-600/20 text-rose-400 border border-rose-600/30'
                        : 'bg-amber-600/20 text-amber-400 border border-amber-600/30'
                    }`}
                  >
                    {row.status}
                  </span>
                )
              }
            ]}
            data={sections.lowStockProducts || []}
            emptyTitle="All Stock Levels Healthy"
            emptyDescription="There are currently no low-stock or out-of-stock items requiring reorder."
          />
        </div>

        {/* SECTION 2: RECENT STOCK MOVEMENTS */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
              <History className="w-4 h-4" /> Recent Stock Movements
            </h3>
            <span className="text-[10px] bg-purple-500/20 text-purple-300 font-bold px-2 py-0.5 rounded-full">
              Latest 10 Logs
            </span>
          </div>

          <DataTable
            columns={[
              {
                header: 'Ref / Type',
                accessor: 'referenceId',
                render: (row) => (
                  <div>
                    <span className="font-mono text-amber-400 font-bold text-xs">{row.referenceId}</span>
                    <span className="block text-[9px] text-slate-400 font-bold">{row.type}</span>
                  </div>
                )
              },
              {
                header: 'Product',
                accessor: 'product',
                render: (row) => (
                  <div>
                    <p className="font-bold text-white text-xs">{row.product?.name || 'Product'}</p>
                    <span className="font-mono text-[10px] text-purple-400">{row.product?.sku}</span>
                  </div>
                )
              },
              {
                header: 'Qty Change',
                accessor: 'quantity',
                render: (row) => {
                  const q = row.quantity;
                  return (
                    <span className={`font-mono font-bold text-xs ${q > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {q > 0 ? `+${q}` : q}
                    </span>
                  );
                }
              },
              {
                header: 'Timestamp',
                accessor: 'createdAt',
                render: (row) => (
                  <span className="text-[10px] font-mono text-slate-400">
                    {new Date(row.createdAt).toLocaleTimeString()}
                  </span>
                )
              }
            ]}
            data={sections.recentMovements || []}
            emptyTitle="No Recent Movements"
            emptyDescription="Stock movement history logs will display here as inventory operations occur."
          />
        </div>

        {/* SECTION 3: PENDING RECEIPTS */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <ArrowDownLeft className="w-4 h-4" /> Active Pending Receipts
            </h3>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full">
              Inbound Goods
            </span>
          </div>

          <DataTable
            columns={[
              {
                header: 'Reference',
                accessor: 'referenceNumber',
                render: (row) => <span className="font-mono font-bold text-emerald-400 text-xs">{row.referenceNumber}</span>
              },
              {
                header: 'Supplier',
                accessor: 'supplier',
                render: (row) => <span className="font-bold text-white text-xs">{row.supplier?.name || 'Vendor'}</span>
              },
              {
                header: 'Destination',
                accessor: 'destinationWarehouse',
                render: (row) => <span className="text-slate-300 text-xs">{row.destinationWarehouse?.name}</span>
              },
              {
                header: 'Status',
                accessor: 'status',
                render: (row) => <StatusBadge status={row.status} />
              }
            ]}
            data={sections.pendingReceipts || []}
            emptyTitle="No Pending Vendor Receipts"
            emptyDescription="All incoming vendor shipments have been validated."
          />
        </div>

        {/* SECTION 4: PENDING DELIVERIES */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4" /> Active Pending Deliveries
            </h3>
            <span className="text-[10px] bg-cyan-500/20 text-cyan-300 font-bold px-2 py-0.5 rounded-full">
              Outbound Shipments
            </span>
          </div>

          <DataTable
            columns={[
              {
                header: 'Reference',
                accessor: 'referenceNumber',
                render: (row) => <span className="font-mono font-bold text-cyan-400 text-xs">{row.referenceNumber}</span>
              },
              {
                header: 'Customer',
                accessor: 'customerName',
                render: (row) => <span className="font-bold text-white text-xs">{row.customerName}</span>
              },
              {
                header: 'Source Facility',
                accessor: 'sourceWarehouse',
                render: (row) => <span className="text-slate-300 text-xs">{row.sourceWarehouse?.name}</span>
              },
              {
                header: 'Status',
                accessor: 'status',
                render: (row) => <StatusBadge status={row.status} />
              }
            ]}
            data={sections.pendingDeliveries || []}
            emptyTitle="No Pending Customer Deliveries"
            emptyDescription="All outgoing customer shipment orders have been shipped."
          />
        </div>
      </div>
    </div>
  );
};
