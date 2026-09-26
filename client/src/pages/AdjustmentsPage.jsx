import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  SlidersHorizontal,
  Plus,
  Eye,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  FileText,
  Building2,
  TrendingDown,
  TrendingUp,
  Minus
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { DataTable } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

export const AdjustmentsPage = () => {
  const { user } = useAuth();
  const [adjustments, setAdjustments] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [locations, setLocations] = useState([]);
  const [stockMap, setStockMap] = useState({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingAdjustment, setViewingAdjustment] = useState(null);
  const [validatingAdjustmentId, setValidatingAdjustmentId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Form Data
  const [formData, setFormData] = useState({
    productId: '',
    warehouseId: '',
    locationId: '',
    recordedQuantity: 0,
    countedQuantity: 0,
    reason: 'Damaged goods during inspection'
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [adjRes, prodRes, whRes, invRes] = await Promise.all([
        api.get('/adjustments').catch(() => ({ data: { data: [] } })),
        api.get('/products').catch(() => ({ data: { data: [] } })),
        api.get('/warehouses').catch(() => ({ data: { data: [] } })),
        api.get('/inventory/stock').catch(() => ({ data: { data: [] } }))
      ]);

      setAdjustments(adjRes.data.data || []);
      const prodList = prodRes.data.data || [];
      const whList = whRes.data.data || [];
      const stockList = invRes.data.data || [];

      setProducts(prodList);
      setWarehouses(whList);

      const smap = {};
      stockList.forEach((s) => {
        const key = `${s.productId}_${s.warehouseId}_${s.locationId}`;
        smap[key] = s.quantity;
      });
      prodList.forEach((p) => {
        (p.stocks || []).forEach((s) => {
          const key = `${p.id}_${s.warehouseId}_${s.locationId}`;
          if (smap[key] === undefined) smap[key] = s.quantity;
        });
      });
      setStockMap(smap);

      let selectedProdId = prodList[0]?.id || '';
      let selectedWhId = whList[0]?.id || '';
      let selectedLocId = '';

      if (whList.length > 0 && whList[0].locations?.length > 0) {
        setLocations(whList[0].locations);
        selectedLocId = whList[0].locations[0].id;
      }

      const initialRecordedQty = getSystemStock(selectedProdId, selectedWhId, selectedLocId, smap, prodList);

      setFormData({
        productId: selectedProdId,
        warehouseId: selectedWhId,
        locationId: selectedLocId,
        recordedQuantity: initialRecordedQty,
        countedQuantity: initialRecordedQty,
        reason: 'Physical inventory audit adjustment'
      });

      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch adjustments data');
      setLoading(false);
    }
  };

  const handleOpenCreateModal = async () => {
    setIsCreateModalOpen(true);
    setFormError('');

    try {
      const [adjRes, prodRes, whRes, invRes] = await Promise.all([
        api.get('/adjustments').catch(() => ({ data: { data: [] } })),
        api.get('/products').catch(() => ({ data: { data: [] } })),
        api.get('/warehouses').catch(() => ({ data: { data: [] } })),
        api.get('/inventory/stock').catch(() => ({ data: { data: [] } }))
      ]);

      const prodList = prodRes.data.data || [];
      const whList = whRes.data.data || [];
      const stockList = invRes.data.data || [];

      setProducts(prodList);
      setWarehouses(whList);

      const smap = {};
      stockList.forEach((s) => {
        const key = `${s.productId}_${s.warehouseId}_${s.locationId}`;
        smap[key] = s.quantity;
      });
      prodList.forEach((p) => {
        (p.stocks || []).forEach((s) => {
          const key = `${p.id}_${s.warehouseId}_${s.locationId}`;
          if (smap[key] === undefined) smap[key] = s.quantity;
        });
      });
      setStockMap(smap);

      let selectedProdId = prodList[0]?.id || '';
      let selectedWhId = whList[0]?.id || '';
      let selectedLocId = '';
      let locs = [];

      if (selectedWhId) {
        try {
          const locRes = await api.get(`/warehouses/${selectedWhId}/locations`);
          locs = locRes.data.data || whList[0]?.locations || [];
        } catch (e) {
          locs = whList[0]?.locations || [];
        }
      }
      setLocations(locs);
      if (locs.length > 0) selectedLocId = locs[0].id;

      const initialRecordedQty = getSystemStock(selectedProdId, selectedWhId, selectedLocId, smap, prodList);

      setFormData({
        productId: selectedProdId,
        warehouseId: selectedWhId,
        locationId: selectedLocId,
        recordedQuantity: initialRecordedQty,
        countedQuantity: initialRecordedQty,
        reason: 'Physical inventory audit adjustment'
      });
    } catch (err) {
      console.error('Error opening adjustment modal:', err);
    }
  };

  const getSystemStock = (pId, wId, lId, map = stockMap, pList = products) => {
    if (!pId || !wId || !lId) return 0;
    const key = `${pId}_${wId}_${lId}`;
    if (map[key] !== undefined) return map[key];
    const prod = pList.find((p) => p.id === pId);
    return prod?.currentStock || prod?.stock || 0;
  };

  const handleWarehouseChange = async (whId) => {
    const wh = warehouses.find((w) => w.id === whId);
    let locs = [];
    let defaultLocId = '';

    if (wh && wh.locations?.length > 0) {
      locs = wh.locations;
      defaultLocId = wh.locations[0].id;
    } else {
      try {
        const res = await api.get(`/warehouses/${whId}/locations`);
        locs = res.data.data || [];
        if (locs.length > 0) defaultLocId = locs[0].id;
      } catch (e) {
        locs = [];
      }
    }

    setLocations(locs);
    const recQty = getSystemStock(formData.productId, whId, defaultLocId);
    setFormData((prev) => ({
      ...prev,
      warehouseId: whId,
      locationId: defaultLocId,
      recordedQuantity: recQty,
      countedQuantity: recQty
    }));
  };

  const handleProductChange = (prodId) => {
    const recQty = getSystemStock(prodId, formData.warehouseId, formData.locationId);
    setFormData((prev) => ({
      ...prev,
      productId: prodId,
      recordedQuantity: recQty,
      countedQuantity: recQty
    }));
  };

  const handleLocationChange = (locId) => {
    const recQty = getSystemStock(formData.productId, formData.warehouseId, locId);
    setFormData((prev) => ({
      ...prev,
      locationId: locId,
      recordedQuantity: recQty,
      countedQuantity: recQty
    }));
  };

  const difference = parseInt(formData.countedQuantity || 0) - parseInt(formData.recordedQuantity || 0);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.reason || !formData.reason.trim()) {
      setFormError('Reason for stock adjustment is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/adjustments', formData);
      const newAdj = res.data.data;
      setIsCreateModalOpen(false);

      // Prompt user to immediately validate or refresh
      setValidatingAdjustmentId(newAdj.id);
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error creating stock adjustment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleValidateAdjustment = async () => {
    if (!validatingAdjustmentId) return;
    setIsSubmitting(true);
    try {
      const res = await api.post(`/adjustments/${validatingAdjustmentId}/validate`);
      alert(res.data.message || 'Stock adjustment validated! Stock updated.');
      setValidatingAdjustmentId(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to validate stock adjustment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Reference',
      accessor: 'referenceNumber',
      render: (row) => <span className="font-mono font-bold text-rose-400">{row.referenceNumber}</span>
    },
    {
      header: 'Product',
      accessor: 'product',
      render: (row) => (
        <div>
          <p className="font-bold text-white">{row.product?.name || 'Product'}</p>
          <span className="font-mono text-[10px] text-slate-400">{row.product?.sku}</span>
        </div>
      )
    },
    {
      header: 'Location',
      accessor: 'warehouse',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-200">{row.warehouse?.name || 'Warehouse'}</p>
          <span className="text-[10px] text-slate-400">{row.location?.name || 'Location'}</span>
        </div>
      )
    },
    {
      header: 'System Qty',
      accessor: 'recordedQuantity',
      render: (row) => <span className="font-bold text-slate-300">{row.recordedQuantity}</span>
    },
    {
      header: 'Physical Count',
      accessor: 'countedQuantity',
      render: (row) => <span className="font-bold text-cyan-400">{row.countedQuantity}</span>
    },
    {
      header: 'Difference',
      accessor: 'difference',
      render: (row) => {
        const diff = row.difference;
        if (diff > 0) {
          return (
            <span className="inline-flex items-center gap-1 font-bold text-emerald-400">
              <TrendingUp className="w-3.5 h-3.5" /> +{diff}
            </span>
          );
        } else if (diff < 0) {
          return (
            <span className="inline-flex items-center gap-1 font-bold text-rose-400">
              <TrendingDown className="w-3.5 h-3.5" /> {diff}
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 font-bold text-slate-400">
            <Minus className="w-3.5 h-3.5" /> 0
          </span>
        );
      }
    },
    {
      header: 'Reason',
      accessor: 'reason',
      render: (row) => <span className="text-slate-300 text-xs italic truncate max-w-[150px]">{row.reason}</span>
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status || 'DONE'} />
    },
    {
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => setViewingAdjustment(row)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          {row.status !== 'DONE' && (
            <Button
              variant="primary"
              size="sm"
              icon={CheckCircle2}
              onClick={() => setValidatingAdjustmentId(row.id)}
            >
              Validate
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-6 rounded-2xl backdrop-blur-xl">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <SlidersHorizontal className="w-6 h-6 text-rose-400" /> Stock Adjustments
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Reconcile physical inventory count discrepancies against system recorded stock.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" icon={RefreshCw} onClick={fetchData} size="sm">
            Refresh
          </Button>
          <Button variant="primary" icon={Plus} onClick={handleOpenCreateModal} size="sm">
            Log Stock Adjustment
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={adjustments}
        isLoading={loading}
        error={error}
        emptyTitle="No Adjustments Recorded"
        emptyDescription="Create your first physical stock adjustment to resolve inventory discrepancies."
        actionLabel="Log Adjustment"
        onEmptyAction={handleOpenCreateModal}
      />

      {/* CREATE ADJUSTMENT MODAL */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Log Stock Adjustment">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{formError}</span>
            </div>
          )}

          <Select
            label="Product *"
            value={formData.productId}
            onChange={(e) => handleProductChange(e.target.value)}
          >
            {products.length === 0 ? (
              <option value="" className="bg-slate-900 text-slate-100">No products available</option>
            ) : (
              <>
                {!formData.productId && <option value="" className="bg-slate-900 text-slate-100">Select Product...</option>}
                {products.map((p) => (
                  <option key={p.id} value={p.id} className="bg-slate-900 text-slate-100">
                    {p.name} ({p.sku})
                  </option>
                ))}
              </>
            )}
          </Select>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Warehouse *"
              value={formData.warehouseId}
              onChange={(e) => handleWarehouseChange(e.target.value)}
            >
              {warehouses.length === 0 ? (
                <option value="" className="bg-slate-900 text-slate-100">No warehouses created</option>
              ) : (
                <>
                  {!formData.warehouseId && <option value="" className="bg-slate-900 text-slate-100">Select Warehouse...</option>}
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id} className="bg-slate-900 text-slate-100">
                      {w.name} ({w.code})
                    </option>
                  ))}
                </>
              )}
            </Select>

            <Select
              label="Storage Location *"
              value={formData.locationId}
              onChange={(e) => handleLocationChange(e.target.value)}
            >
              {locations.length === 0 ? (
                <option value="" className="bg-slate-900 text-slate-100">No storage locations in warehouse</option>
              ) : (
                <>
                  {!formData.locationId && <option value="" className="bg-slate-900 text-slate-100">Select Location...</option>}
                  {locations.map((l) => (
                    <option key={l.id} value={l.id} className="bg-slate-900 text-slate-100">
                      {l.name} ({l.code})
                    </option>
                  ))}
                </>
              )}
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="System Quantity (Recorded)"
              type="number"
              disabled
              value={formData.recordedQuantity}
              className="bg-slate-900 text-slate-400"
            />

            <Input
              label="Physical Count (Counted) *"
              type="number"
              min="0"
              required
              value={formData.countedQuantity}
              onChange={(e) => setFormData({ ...formData, countedQuantity: e.target.value })}
            />
          </div>

          {/* CALCULATED DIFFERENCE DISPLAY */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase">Calculated Stock Difference</span>
            <span
              className={`font-mono font-extrabold text-sm ${
                difference > 0 ? 'text-emerald-400' : difference < 0 ? 'text-rose-400' : 'text-slate-400'
              }`}
            >
              {difference > 0 ? `+${difference}` : difference} units
            </span>
          </div>

          <Input
            label="Reason for Adjustment *"
            required
            placeholder="e.g. Physical count discrepancy - damaged items during inspection"
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Save Adjustment Record
            </Button>
          </div>
        </form>
      </Modal>

      {/* VIEW DETAILS MODAL */}
      {viewingAdjustment && (
        <Modal isOpen={true} onClose={() => setViewingAdjustment(null)} title="Stock Adjustment Details">
          <div className="space-y-4 text-xs">
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div>
                <span className="font-mono text-rose-400 font-bold text-sm block">
                  {viewingAdjustment.referenceNumber}
                </span>
                <p className="text-white font-bold">{viewingAdjustment.product?.name}</p>
                <span className="font-mono text-[10px] text-slate-400">{viewingAdjustment.product?.sku}</span>
              </div>
              <StatusBadge status={viewingAdjustment.status || 'DONE'} />
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950 border border-slate-800 rounded-xl">
              <div>
                <span className="text-slate-400 block text-[10px]">Location</span>
                <p className="font-bold text-white">{viewingAdjustment.warehouse?.name}</p>
                <span className="text-[10px] text-slate-400">{viewingAdjustment.location?.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Logged Date</span>
                <p className="font-bold text-slate-200">{new Date(viewingAdjustment.createdAt).toLocaleString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 p-3 bg-slate-950 border border-slate-800 rounded-xl text-center">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Recorded System</span>
                <span className="font-bold text-slate-200 text-sm">{viewingAdjustment.recordedQuantity}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Physical Count</span>
                <span className="font-bold text-cyan-400 text-sm">{viewingAdjustment.countedQuantity}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Difference</span>
                <span
                  className={`font-bold text-sm ${
                    viewingAdjustment.difference > 0
                      ? 'text-emerald-400'
                      : viewingAdjustment.difference < 0
                      ? 'text-rose-400'
                      : 'text-slate-400'
                  }`}
                >
                  {viewingAdjustment.difference > 0 ? `+${viewingAdjustment.difference}` : viewingAdjustment.difference}
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
              <span className="text-slate-400 block text-[10px] font-bold uppercase mb-1">Reason</span>
              <p className="text-slate-200 text-xs italic">{viewingAdjustment.reason}</p>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="secondary" onClick={() => setViewingAdjustment(null)}>
                Close Window
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* CONFIRM VALIDATION DIALOG */}
      <ConfirmDialog
        isOpen={!!validatingAdjustmentId}
        onClose={() => setValidatingAdjustmentId(null)}
        onConfirm={handleValidateAdjustment}
        title="Validate Stock Adjustment"
        message="Validating this adjustment will execute a database transaction updating current stock to the physical count and logging an ADJUSTMENT entry into StockLedger with previous, new, and difference values. Proceed?"
        confirmText="Validate & Commit Adjustment"
        confirmVariant="primary"
        isLoading={isSubmitting}
      />
    </div>
  );
};
