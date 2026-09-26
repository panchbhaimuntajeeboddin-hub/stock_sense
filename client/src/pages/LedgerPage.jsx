import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  History,
  Download,
  Search,
  Filter,
  Calendar,
  RefreshCw,
  Eye,
  ChevronLeft,
  ChevronRight,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  SlidersHorizontal,
  Lock
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { DataTable } from '../components/ui/DataTable';
import { Modal } from '../components/ui/Modal';

export const LedgerPage = () => {
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [locations, setLocations] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewingEntry, setViewingEntry] = useState(null);

  // Filters State
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [productFilter, setProductFilter] = useState('All');
  const [warehouseFilter, setWarehouseFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });

  const fetchMetadata = async () => {
    try {
      const [prodRes, whRes] = await Promise.all([
        api.get('/products'),
        api.get('/warehouses')
      ]);
      setProducts(prodRes.data.data || []);
      setWarehouses(whRes.data.data || []);
    } catch (e) {
      console.error('Error fetching metadata', e);
    }
  };

  const fetchLedgerData = async (currentPage = page) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        limit,
        search: search.trim() || undefined,
        type: typeFilter !== 'All' ? typeFilter : undefined,
        productId: productFilter !== 'All' ? productFilter : undefined,
        warehouseId: warehouseFilter !== 'All' ? warehouseFilter : undefined,
        locationId: locationFilter !== 'All' ? locationFilter : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      };

      const res = await api.get('/stock-ledger', { params });
      setLedgerEntries(res.data.data || []);
      if (res.data.pagination) {
        setPagination(res.data.pagination);
      }
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch stock ledger entries');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchLedgerData(page);
  }, [page, typeFilter, productFilter, warehouseFilter, locationFilter, startDate, endDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLedgerData(1);
  };

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
    setSearch('');
    setTypeFilter('All');
    setProductFilter('All');
    setWarehouseFilter('All');
    setLocationFilter('All');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const renderMovementBadge = (type) => {
    switch (type) {
      case 'RECEIPT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <ArrowDownLeft className="w-3 h-3" /> RECEIPT
          </span>
        );
      case 'DELIVERY':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <ArrowUpRight className="w-3 h-3" /> DELIVERY
          </span>
        );
      case 'TRANSFER_IN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <ArrowLeftRight className="w-3 h-3" /> TRANSFER IN
          </span>
        );
      case 'TRANSFER_OUT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <ArrowLeftRight className="w-3 h-3" /> TRANSFER OUT
          </span>
        );
      case 'ADJUSTMENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <SlidersHorizontal className="w-3 h-3" /> ADJUSTMENT
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
            {type}
          </span>
        );
    }
  };

  const columns = [
    {
      header: 'Date & Time',
      accessor: 'createdAt',
      render: (row) => (
        <span className="text-[11px] font-mono text-slate-300">
          {new Date(row.createdAt).toLocaleString()}
        </span>
      )
    },
    {
      header: 'Product & SKU',
      accessor: 'product',
      render: (row) => (
        <div>
          <p className="font-bold text-white text-xs">{row.product?.name || 'Product'}</p>
          <span className="font-mono text-[10px] text-purple-400">{row.product?.sku}</span>
        </div>
      )
    },
    {
      header: 'Warehouse / Location',
      accessor: 'warehouse',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-200 text-xs">{row.warehouse?.name || 'Warehouse'}</p>
          <span className="text-[10px] text-slate-400">{row.location?.name || 'Location'}</span>
        </div>
      )
    },
    {
      header: 'Movement Type',
      accessor: 'type',
      render: (row) => renderMovementBadge(row.type)
    },
    {
      header: 'Quantity',
      accessor: 'quantity',
      render: (row) => {
        const q = row.quantity;
        return (
          <span
            className={`font-mono font-bold text-xs ${
              q > 0 ? 'text-emerald-400' : q < 0 ? 'text-rose-400' : 'text-slate-300'
            }`}
          >
            {q > 0 ? `+${q}` : q} {row.product?.unit || 'units'}
          </span>
        );
      }
    },
    {
      header: 'Prev Stock',
      accessor: 'previousQuantity',
      render: (row) => <span className="font-mono text-slate-400">{row.previousQuantity}</span>
    },
    {
      header: 'New Stock',
      accessor: 'newQuantity',
      render: (row) => <span className="font-mono font-bold text-cyan-400">{row.newQuantity}</span>
    },
    {
      header: 'Reference',
      accessor: 'referenceId',
      render: (row) => <span className="font-mono font-bold text-amber-400 text-xs">{row.referenceId}</span>
    },
    {
      header: 'User',
      accessor: 'createdBy',
      render: (row) => (
        <span className="text-[11px] text-slate-300">{row.createdBy?.name || 'System Auto'}</span>
      )
    },
    {
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <button
          onClick={() => setViewingEntry(row)}
          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
          title="View Audit Record"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-6 rounded-2xl backdrop-blur-xl">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-purple-400" /> Stock Movement Ledger
          </h2>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            Immutable, read-only audit log automatically generated by inventory operations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" icon={RefreshCw} onClick={() => fetchLedgerData(page)} size="sm">
            Refresh
          </Button>
        </div>
      </div>

      {/* FILTERS & SEARCH BAR */}
      <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by Product Name, SKU, or Reference ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>
          <Button variant="primary" type="submit" size="sm">
            Search
          </Button>
          <Button variant="secondary" type="button" onClick={resetFilters} size="sm">
            Reset Filters
          </Button>
        </form>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2 border-t border-slate-800/80">
          <Select
            label="Movement Type"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="All">All Types</option>
            <option value="RECEIPT">RECEIPT</option>
            <option value="DELIVERY">DELIVERY</option>
            <option value="TRANSFER_IN">TRANSFER_IN</option>
            <option value="TRANSFER_OUT">TRANSFER_OUT</option>
            <option value="ADJUSTMENT">ADJUSTMENT</option>
          </Select>

          <Select
            label="Product"
            value={productFilter}
            onChange={(e) => {
              setProductFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="All">All Products</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>

          <Select
            label="Warehouse"
            value={warehouseFilter}
            onChange={(e) => handleWarehouseFilterChange(e.target.value)}
          >
            <option value="All">All Warehouses</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </Select>

          <Select
            label="Location"
            value={locationFilter}
            onChange={(e) => {
              setLocationFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="All">All Locations</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </Select>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>
      </div>

      {/* DATA TABLE */}
      <DataTable
        columns={columns}
        data={ledgerEntries}
        isLoading={loading}
        error={error}
        emptyTitle="Stock Ledger Entry Not Found"
        emptyDescription="No stock movement records match the selected filter criteria."
      />

      {/* PAGINATION CONTROLS */}
      {pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
          <span className="text-xs text-slate-400 font-medium">
            Showing <strong className="text-white">{ledgerEntries.length}</strong> of{' '}
            <strong className="text-white">{pagination.total}</strong> total ledger audit logs
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={ChevronLeft}
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              Previous
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
              Next
            </Button>
          </div>
        </div>
      )}

      {/* VIEW ENTRY MODAL */}
      {viewingEntry && (
        <Modal isOpen={true} onClose={() => setViewingEntry(null)} title="Audit Ledger Record Details">
          <div className="space-y-4 text-xs">
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div>
                <span className="font-mono text-purple-400 font-bold text-sm block">
                  {viewingEntry.referenceId}
                </span>
                <p className="text-white font-bold">{viewingEntry.product?.name}</p>
                <span className="font-mono text-[10px] text-slate-400">{viewingEntry.product?.sku}</span>
              </div>
              {renderMovementBadge(viewingEntry.type)}
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950 border border-slate-800 rounded-xl">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Storage Location</span>
                <p className="font-bold text-white">{viewingEntry.warehouse?.name}</p>
                <span className="text-[10px] text-slate-400">{viewingEntry.location?.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Timestamp</span>
                <p className="font-bold text-slate-200">{new Date(viewingEntry.createdAt).toLocaleString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 p-3 bg-slate-950 border border-slate-800 rounded-xl text-center">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Previous Stock</span>
                <span className="font-bold text-slate-300 text-sm">{viewingEntry.previousQuantity}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Quantity Change</span>
                <span
                  className={`font-bold text-sm ${
                    viewingEntry.quantity > 0
                      ? 'text-emerald-400'
                      : viewingEntry.quantity < 0
                      ? 'text-rose-400'
                      : 'text-slate-300'
                  }`}
                >
                  {viewingEntry.quantity > 0 ? `+${viewingEntry.quantity}` : viewingEntry.quantity}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">New Stock</span>
                <span className="font-bold text-cyan-400 text-sm">{viewingEntry.newQuantity}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex justify-between items-center">
              <span className="text-slate-400 text-[10px] font-bold uppercase">Executing User</span>
              <span className="text-white font-bold">{viewingEntry.createdBy?.name || 'System Automated'}</span>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="secondary" onClick={() => setViewingEntry(null)}>
                Close Record
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
