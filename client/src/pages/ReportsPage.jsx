import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  BarChart3,
  Download,
  Filter,
  RefreshCw,
  Package,
  ArrowLeftRight,
  AlertTriangle,
  Building2,
  TrendingUp,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { DataTable } from '../components/ui/DataTable';

export const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState('current-stock');
  const [reportData, setReportData] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  // Dropdown Metadata
  const [categories, setCategories] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);

  // Filter States
  const [warehouseFilter, setWarehouseFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [productFilter, setProductFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  const reportTabs = [
    { id: 'current-stock', label: '1. Current Stock Report', icon: Package },
    { id: 'stock-movement', label: '2. Stock Movement Report', icon: ArrowLeftRight },
    { id: 'low-stock', label: '3. Low Stock Report', icon: AlertTriangle },
    { id: 'warehouse-stock', label: '4. Warehouse Stock Report', icon: Building2 },
    { id: 'product-movement', label: '5. Product Movement Report', icon: TrendingUp }
  ];

  const fetchMetadata = async () => {
    try {
      const [catRes, whRes, prodRes] = await Promise.all([
        api.get('/categories'),
        api.get('/warehouses'),
        api.get('/products')
      ]);
      setCategories(catRes.data.data || []);
      setWarehouses(whRes.data.data || []);
      setProducts(prodRes.data.data || []);
    } catch (e) {
      console.error('Error fetching report metadata', e);
    }
  };

  const fetchReport = async (currentPage = page) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        limit: 20,
        warehouseId: warehouseFilter !== 'All' ? warehouseFilter : undefined,
        categoryId: categoryFilter !== 'All' ? categoryFilter : undefined,
        productId: productFilter !== 'All' ? productFilter : undefined,
        type: typeFilter !== 'All' ? typeFilter : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      };

      const res = await api.get(`/reports/${activeTab}`, { params });
      setReportData(res.data.data || []);
      if (res.data.pagination) {
        setPagination(res.data.pagination);
      }
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate report data');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchReport(page);
  }, [activeTab, page, warehouseFilter, categoryFilter, productFilter, typeFilter, startDate, endDate]);

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const params = {
        warehouseId: warehouseFilter !== 'All' ? warehouseFilter : undefined,
        categoryId: categoryFilter !== 'All' ? categoryFilter : undefined,
        productId: productFilter !== 'All' ? productFilter : undefined,
        type: typeFilter !== 'All' ? typeFilter : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      };

      const response = await api.get(`/reports/${activeTab}/export`, {
        params,
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `StockSense_${activeTab}_Report.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      alert('Failed to export CSV report');
    } finally {
      setIsExporting(false);
    }
  };

  const resetFilters = () => {
    setWarehouseFilter('All');
    setCategoryFilter('All');
    setProductFilter('All');
    setTypeFilter('All');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  // Render Table Columns dynamically based on active report tab
  const getColumns = () => {
    switch (activeTab) {
      case 'current-stock':
        return [
          { header: 'Product Name', accessor: 'productName', render: (row) => <span className="font-bold text-white text-xs">{row.productName}</span> },
          { header: 'SKU', accessor: 'sku', render: (row) => <span className="font-mono text-purple-400 font-bold text-xs">{row.sku}</span> },
          { header: 'Category', accessor: 'category', render: (row) => <span className="text-slate-300 text-xs">{row.category}</span> },
          { header: 'Current Stock', accessor: 'currentStock', render: (row) => <span className="font-mono font-bold text-emerald-400 text-xs">{row.currentStock} {row.unit}</span> },
          { header: 'Reorder Level', accessor: 'reorderLevel', render: (row) => <span className="font-mono text-slate-400 text-xs">{row.reorderLevel} {row.unit}</span> },
          { header: 'Valuation ($)', accessor: 'valuation', render: (row) => <span className="font-mono font-bold text-cyan-400 text-xs">${row.valuation?.toFixed(2)}</span> },
          {
            header: 'Status',
            accessor: 'status',
            render: (row) => (
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                row.status === 'OUT_OF_STOCK' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                row.status === 'LOW_STOCK' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}>
                {row.status}
              </span>
            )
          }
        ];

      case 'stock-movement':
        return [
          { header: 'Date & Time', accessor: 'date', render: (row) => <span className="font-mono text-slate-300 text-[11px]">{row.date}</span> },
          { header: 'Reference', accessor: 'referenceId', render: (row) => <span className="font-mono font-bold text-amber-400 text-xs">{row.referenceId}</span> },
          { header: 'Type', accessor: 'type', render: (row) => <span className="px-2 py-0.5 bg-slate-800 text-purple-300 rounded font-bold text-[10px]">{row.type}</span> },
          { header: 'Product', accessor: 'productName', render: (row) => <span className="font-bold text-white text-xs">{row.productName} ({row.sku})</span> },
          { header: 'Facility', accessor: 'warehouseName', render: (row) => <span className="text-slate-300 text-xs">{row.warehouseName} ({row.locationName})</span> },
          { header: 'Quantity', accessor: 'quantity', render: (row) => <span className={`font-mono font-bold text-xs ${row.quantity > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{row.quantity > 0 ? `+${row.quantity}` : row.quantity}</span> },
          { header: 'Prev / New Stock', accessor: 'previousQuantity', render: (row) => <span className="font-mono text-slate-400 text-xs">{row.previousQuantity} → <strong className="text-cyan-400">{row.newQuantity}</strong></span> }
        ];

      case 'low-stock':
        return [
          { header: 'Product', accessor: 'productName', render: (row) => <span className="font-bold text-white text-xs">{row.productName}</span> },
          { header: 'SKU', accessor: 'sku', render: (row) => <span className="font-mono text-purple-400 font-bold text-xs">{row.sku}</span> },
          { header: 'Category', accessor: 'category', render: (row) => <span className="text-slate-300 text-xs">{row.category}</span> },
          { header: 'Current Stock', accessor: 'currentStock', render: (row) => <span className={`font-mono font-bold text-xs ${row.currentStock === 0 ? 'text-rose-400 font-extrabold' : 'text-amber-400'}`}>{row.currentStock} {row.unit}</span> },
          { header: 'Reorder Level', accessor: 'reorderLevel', render: (row) => <span className="font-mono text-slate-400 text-xs">{row.reorderLevel} {row.unit}</span> },
          { header: 'Deficit Qty', accessor: 'deficit', render: (row) => <span className="font-mono font-bold text-rose-400 text-xs">-{row.deficit} {row.unit}</span> },
          {
            header: 'Alert Status',
            accessor: 'status',
            render: (row) => (
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${row.status === 'OUT_OF_STOCK' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                {row.status}
              </span>
            )
          }
        ];

      case 'warehouse-stock':
        return [
          { header: 'Warehouse', accessor: 'warehouseName', render: (row) => <span className="font-bold text-white text-xs">{row.warehouseName} ({row.warehouseCode})</span> },
          { header: 'Storage Location', accessor: 'locationName', render: (row) => <span className="font-bold text-purple-400 text-xs">{row.locationName}</span> },
          { header: 'Product Types Stored', accessor: 'totalProducts', render: (row) => <span className="font-bold text-slate-300 text-xs">{row.totalProducts} Items</span> },
          { header: 'Total Quantity Stored', accessor: 'totalStockUnits', render: (row) => <span className="font-mono font-bold text-emerald-400 text-xs">{row.totalStockUnits} units</span> },
          { header: 'Location Stock Valuation ($)', accessor: 'valuation', render: (row) => <span className="font-mono font-bold text-cyan-400 text-xs">${row.valuation?.toFixed(2)}</span> }
        ];

      case 'product-movement':
        return [
          { header: 'Date & Time', accessor: 'date', render: (row) => <span className="font-mono text-slate-300 text-[11px]">{row.date}</span> },
          { header: 'Product & SKU', accessor: 'productName', render: (row) => <span className="font-bold text-white text-xs">{row.productName} ({row.sku})</span> },
          { header: 'Reference', accessor: 'referenceId', render: (row) => <span className="font-mono font-bold text-amber-400 text-xs">{row.referenceId}</span> },
          { header: 'Movement Type', accessor: 'type', render: (row) => <span className="px-2 py-0.5 bg-slate-800 text-purple-300 rounded font-bold text-[10px]">{row.type}</span> },
          { header: 'Location', accessor: 'warehouseName', render: (row) => <span className="text-slate-300 text-xs">{row.warehouseName} ({row.locationName})</span> },
          { header: 'Net Change', accessor: 'change', render: (row) => <span className={`font-mono font-bold text-xs ${row.change > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{row.change > 0 ? `+${row.change}` : row.change}</span> },
          { header: 'Stock Progression', accessor: 'previousStock', render: (row) => <span className="font-mono text-slate-400 text-xs">{row.previousStock} → <strong className="text-cyan-400">{row.newStock}</strong></span> }
        ];

      default:
        return [];
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-6 rounded-2xl backdrop-blur-xl">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-purple-400" /> Inventory Analytics & Reports
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Server-side queries for current stock valuation, movement audit trails, low stock deficits, and warehouse distribution.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" icon={RefreshCw} onClick={() => fetchReport(page)} size="sm">
            Refresh
          </Button>
          <Button variant="primary" icon={Download} onClick={handleExportCSV} isLoading={isExporting} size="sm">
            Export to CSV
          </Button>
        </div>
      </div>

      {/* 5 REPORT NAVIGATION TABS */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        {reportTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setPage(1);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SERVER-SIDE FILTERS PANEL */}
      <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Filter className="w-4 h-4 text-purple-400" /> Server Query Filters
          </span>
          <button
            onClick={resetFilters}
            className="text-xs text-purple-400 hover:text-purple-300 font-semibold"
          >
            Reset Filters
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          <Select label="Warehouse" value={warehouseFilter} onChange={(e) => { setWarehouseFilter(e.target.value); setPage(1); }}>
            <option value="All">All Warehouses</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </Select>

          <Select label="Category" value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}>
            <option value="All">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>

          <Select label="Product" value={productFilter} onChange={(e) => { setProductFilter(e.target.value); setPage(1); }}>
            <option value="All">All Products</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>

          <Select label="Movement Type" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}>
            <option value="All">All Types</option>
            <option value="RECEIPT">RECEIPT</option>
            <option value="DELIVERY">DELIVERY</option>
            <option value="TRANSFER_IN">TRANSFER_IN</option>
            <option value="TRANSFER_OUT">TRANSFER_OUT</option>
            <option value="ADJUSTMENT">ADJUSTMENT</option>
          </Select>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>
      </div>

      {/* REPORT DATA TABLE */}
      <DataTable
        columns={getColumns()}
        data={reportData}
        isLoading={loading}
        error={error}
        emptyTitle="No Report Records Found"
        emptyDescription="Adjust your filter selections to load report dataset from the server."
      />

      {/* SERVER-SIDE PAGINATION CONTROLS */}
      {pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
          <span className="text-xs text-slate-400 font-medium">
            Showing <strong className="text-white">{reportData.length}</strong> of{' '}
            <strong className="text-white">{pagination.total}</strong> report entries
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={ChevronLeft}
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              Previous Page
            </Button>

            <span className="text-xs font-mono font-bold text-purple-400 px-3 py-1 bg-slate-950 border border-slate-800 rounded-lg">
              Page {pagination.page} of {pagination.totalPages}
            </span>

            <Button
              variant="secondary"
              size="sm"
              icon={ChevronRight}
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((prev) => Math.min(pagination.totalPages, prev + 1))}
            >
              Next Page
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
