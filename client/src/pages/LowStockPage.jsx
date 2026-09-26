import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Ban,
  RefreshCw,
  Search,
  Filter,
  Plus,
  ArrowDownLeft,
  Building2,
  Package
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { DataTable } from '../components/ui/DataTable';

export const LowStockPage = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [summary, setSummary] = useState({ totalAlerts: 0, lowStockCount: 0, outOfStockCount: 0 });
  const [warehouses, setWarehouses] = useState([]);
  const [locations, setLocations] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [warehouseFilter, setWarehouseFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('All');

  const fetchMetadata = async () => {
    try {
      const res = await api.get('/warehouses');
      setWarehouses(res.data.data || []);
    } catch (e) {
      console.error('Error fetching warehouses metadata', e);
    }
  };

  const fetchAlerts = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        status: statusFilter !== 'All' ? statusFilter : undefined,
        warehouseId: warehouseFilter !== 'All' ? warehouseFilter : undefined,
        locationId: locationFilter !== 'All' ? locationFilter : undefined
      };

      const res = await api.get('/alerts/low-stock', { params });
      let list = res.data.data || [];

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        list = list.filter(
          (a) => a.productName.toLowerCase().includes(q) || a.sku.toLowerCase().includes(q)
        );
      }

      setAlerts(list);
      if (res.data.summary) {
        setSummary(res.data.summary);
      }
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch low stock alerts');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [statusFilter, warehouseFilter, locationFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAlerts();
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
    setStatusFilter('All');
    setWarehouseFilter('All');
    setLocationFilter('All');
  };

  const columns = [
    {
      header: 'Product Name',
      accessor: 'productName',
      render: (row) => (
        <div>
          <p className="font-bold text-white text-xs">{row.productName}</p>
          <span className="font-mono text-[10px] text-purple-400">{row.sku}</span>
        </div>
      )
    },
    {
      header: 'SKU',
      accessor: 'sku',
      render: (row) => <span className="font-mono font-bold text-slate-300 text-xs">{row.sku}</span>
    },
    {
      header: 'Current Stock',
      accessor: 'currentStock',
      render: (row) => (
        <span className={`font-mono font-bold text-xs ${row.currentStock === 0 ? 'text-rose-400 font-extrabold' : 'text-amber-400'}`}>
          {row.currentStock} {row.unit || 'units'}
        </span>
      )
    },
    {
      header: 'Reorder Level',
      accessor: 'reorderLevel',
      render: (row) => <span className="font-mono text-slate-400 text-xs">{row.reorderLevel} {row.unit || 'units'}</span>
    },
    {
      header: 'Warehouse',
      accessor: 'warehouseName',
      render: (row) => <span className="font-bold text-slate-200 text-xs">{row.warehouseName}</span>
    },
    {
      header: 'Storage Location',
      accessor: 'locationName',
      render: (row) => <span className="text-slate-400 text-xs">{row.locationName}</span>
    },
    {
      header: 'Alert Status',
      accessor: 'status',
      render: (row) => {
        if (row.status === 'OUT_OF_STOCK') {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <Ban className="w-3 h-3" /> OUT OF STOCK
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3" /> LOW STOCK
          </span>
        );
      }
    },
    {
      header: 'Quick Action',
      align: 'right',
      render: (row) => (
        <Button
          variant="primary"
          size="sm"
          icon={ArrowDownLeft}
          onClick={() => navigate('/receipts')}
        >
          Reorder Stock
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-6 rounded-2xl backdrop-blur-xl">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-400" /> Low Stock & Inventory Alerts
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time automated warnings for items at or below reorder levels calculated from PostgreSQL stock.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" icon={RefreshCw} onClick={fetchAlerts} size="sm">
            Refresh Alerts
          </Button>
          <Button variant="primary" icon={Plus} onClick={() => navigate('/receipts')} size="sm">
            Create Vendor Receipt
          </Button>
        </div>
      </div>

      {/* ALERT SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Alerts Active</span>
            <h3 className="text-2xl font-extrabold text-white mt-1">{summary.totalAlerts}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Require Action</p>
          </div>
          <div className="p-3 bg-purple-500/20 text-purple-400 rounded-2xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-amber-400 uppercase block">Low Stock Items</span>
            <h3 className="text-2xl font-extrabold text-white mt-1">{summary.lowStockCount}</h3>
            <p className="text-[11px] text-amber-300/80 mt-0.5">At or Below Reorder Threshold</p>
          </div>
          <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-rose-400 uppercase block">Out of Stock Items</span>
            <h3 className="text-2xl font-extrabold text-white mt-1">{summary.outOfStockCount}</h3>
            <p className="text-[11px] text-rose-300/80 mt-0.5">Zero Inventory Units</p>
          </div>
          <div className="p-3 bg-rose-500/20 text-rose-400 rounded-2xl">
            <Ban className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH PANEL */}
      <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search alerted products by Name or SKU..."
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-800/80">
          <Select label="Alert Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All Statuses (LOW & OUT OF STOCK)</option>
            <option value="LOW_STOCK">LOW_STOCK Only</option>
            <option value="OUT_OF_STOCK">OUT_OF_STOCK Only</option>
          </Select>

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
        </div>
      </div>

      {/* DATA TABLE */}
      <DataTable
        columns={columns}
        data={alerts}
        isLoading={loading}
        error={error}
        emptyTitle="No Active Inventory Alerts"
        emptyDescription="All stock levels across warehouses are currently healthy and above reorder levels."
      />
    </div>
  );
};
