import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeftRight,
  Plus,
  Eye,
  CheckCircle2,
  XCircle,
  Package,
  Building2,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  Layers,
  Box
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { DataTable } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

export const TransfersPage = () => {
  const { user } = useAuth();
  const [transfers, setTransfers] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [sourceLocations, setSourceLocations] = useState([]);
  const [destLocations, setDestLocations] = useState([]);
  const [stockMap, setStockMap] = useState({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingTransfer, setViewingTransfer] = useState(null);
  const [validatingTransferId, setValidatingTransferId] = useState(null);
  const [cancelingTransferId, setCancelingTransferId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Form Data
  const [formData, setFormData] = useState({
    sourceWarehouseId: '',
    sourceLocationId: '',
    destinationWarehouseId: '',
    destinationLocationId: '',
    notes: '',
    items: [{ productId: '', quantity: 10 }]
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [trfRes, prodRes, whRes, invRes] = await Promise.all([
        api.get('/transfers').catch(() => ({ data: { data: [] } })),
        api.get('/products').catch(() => ({ data: { data: [] } })),
        api.get('/warehouses').catch(() => ({ data: { data: [] } })),
        api.get('/inventory/stock').catch(() => ({ data: { data: [] } }))
      ]);

      setTransfers(trfRes.data.data || []);
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

      if (whList.length > 0) {
        const defaultSrcWh = whList[0];
        const defaultDestWh = whList.length > 1 ? whList[1] : whList[0];

        setFormData((prev) => ({
          ...prev,
          sourceWarehouseId: prev.sourceWarehouseId || defaultSrcWh.id,
          destinationWarehouseId: prev.destinationWarehouseId || defaultDestWh.id
        }));

        if (defaultSrcWh.locations?.length > 0) {
          setSourceLocations(defaultSrcWh.locations);
          setFormData((prev) => ({
            ...prev,
            sourceLocationId: prev.sourceLocationId || defaultSrcWh.locations[0].id
          }));
        }

        if (defaultDestWh.locations?.length > 0) {
          setDestLocations(defaultDestWh.locations);
          const defaultDestLoc = defaultDestWh.locations.length > 1 ? defaultDestWh.locations[1] : defaultDestWh.locations[0];
          setFormData((prev) => ({
            ...prev,
            destinationLocationId: prev.destinationLocationId || defaultDestLoc.id
          }));
        }
      }

      if (prodList.length > 0 && !formData.items[0]?.productId) {
        setFormData((prev) => ({
          ...prev,
          items: [{ ...prev.items[0], productId: prodList[0].id }]
        }));
      }

      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch transfers data');
      setLoading(false);
    }
  };

  const handleOpenCreateModal = async () => {
    setIsCreateModalOpen(true);
    setFormError('');

    try {
      const [whRes, prodRes, invRes] = await Promise.all([
        api.get('/warehouses').catch(() => ({ data: { data: [] } })),
        api.get('/products').catch(() => ({ data: { data: [] } })),
        api.get('/inventory/stock').catch(() => ({ data: { data: [] } }))
      ]);

      const whList = whRes.data.data || [];
      const prodList = prodRes.data.data || [];
      const stockList = invRes.data.data || [];

      setWarehouses(whList);
      setProducts(prodList);

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

      const defaultSrcWh = whList[0];
      const defaultDestWh = whList.length > 1 ? whList[1] : whList[0];
      const firstProdId = prodList[0]?.id || '';

      let srcLocs = [];
      let destLocs = [];

      if (defaultSrcWh?.id) {
        try {
          const res = await api.get(`/warehouses/${defaultSrcWh.id}/locations`);
          srcLocs = res.data.data || defaultSrcWh.locations || [];
        } catch (e) {
          srcLocs = defaultSrcWh.locations || [];
        }
      }

      if (defaultDestWh?.id) {
        try {
          const res = await api.get(`/warehouses/${defaultDestWh.id}/locations`);
          destLocs = res.data.data || defaultDestWh.locations || [];
        } catch (e) {
          destLocs = defaultDestWh.locations || [];
        }
      }

      setSourceLocations(srcLocs);
      setDestLocations(destLocs);

      const defaultDestLoc = destLocs.length > 1 ? destLocs[1] : destLocs[0];

      setFormData({
        sourceWarehouseId: defaultSrcWh?.id || '',
        sourceLocationId: srcLocs[0]?.id || '',
        destinationWarehouseId: defaultDestWh?.id || '',
        destinationLocationId: defaultDestLoc?.id || '',
        notes: '',
        items: [{ productId: firstProdId, quantity: 10 }]
      });
    } catch (err) {
      console.error('Error opening transfer create modal:', err);
    }
  };

  const handleSourceWarehouseChange = async (whId) => {
    setFormData((prev) => ({ ...prev, sourceWarehouseId: whId, sourceLocationId: '' }));
    if (!whId) {
      setSourceLocations([]);
      return;
    }

    try {
      const res = await api.get(`/warehouses/${whId}/locations`);
      const locs = res.data.data || [];
      setSourceLocations(locs);
      if (locs.length > 0) {
        setFormData((prev) => ({ ...prev, sourceLocationId: locs[0].id }));
      }
    } catch (e) {
      const wh = warehouses.find((w) => w.id === whId);
      const fallbackLocs = wh?.locations || [];
      setSourceLocations(fallbackLocs);
      if (fallbackLocs.length > 0) {
        setFormData((prev) => ({ ...prev, sourceLocationId: fallbackLocs[0].id }));
      }
    }
  };

  const handleDestWarehouseChange = async (whId) => {
    setFormData((prev) => ({ ...prev, destinationWarehouseId: whId, destinationLocationId: '' }));
    if (!whId) {
      setDestLocations([]);
      return;
    }

    try {
      const res = await api.get(`/warehouses/${whId}/locations`);
      const locs = res.data.data || [];
      setDestLocations(locs);
      if (locs.length > 0) {
        setFormData((prev) => ({ ...prev, destinationLocationId: locs[0].id }));
      }
    } catch (e) {
      const wh = warehouses.find((w) => w.id === whId);
      const fallbackLocs = wh?.locations || [];
      setDestLocations(fallbackLocs);
      if (fallbackLocs.length > 0) {
        setFormData((prev) => ({ ...prev, destinationLocationId: fallbackLocs[0].id }));
      }
    }
  };

  const handleAddItemRow = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { productId: products[0]?.id || '', quantity: 5 }
      ]
    }));
  };

  const handleRemoveItemRow = (idx) => {
    if (formData.items.length === 1) return;
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx)
    }));
  };

  const handleItemChange = (idx, field, val) => {
    const newItems = [...formData.items];
    newItems[idx][field] = val;
    setFormData({ ...formData, items: newItems });
  };

  const getSourceStock = (productId, warehouseId, locationId) => {
    if (!productId || !warehouseId || !locationId) return 0;
    const key = `${productId}_${warehouseId}_${locationId}`;
    if (stockMap[key] !== undefined) return stockMap[key];
    const prod = products.find((p) => p.id === productId);
    return prod?.currentStock || prod?.stock || 0;
  };

  const isIdenticalLocation =
    formData.sourceWarehouseId === formData.destinationWarehouseId &&
    formData.sourceLocationId === formData.destinationLocationId;

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (isIdenticalLocation) {
      setFormError('Source and Destination storage locations cannot be identical.');
      return;
    }

    // Check quantity validity & available stock
    for (const item of formData.items) {
      const reqQty = parseInt(item.quantity || 0);
      if (reqQty <= 0) {
        setFormError('Transfer quantity must be greater than 0.');
        return;
      }

      const avail = getSourceStock(item.productId, formData.sourceWarehouseId, formData.sourceLocationId);
      if (reqQty > avail) {
        const prod = products.find((p) => p.id === item.productId);
        setFormError(
          `Insufficient stock for '${prod?.name || 'Product'}'. Source Available: ${avail}, Requested Transfer: ${reqQty}.`
        );
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await api.post('/transfers', formData);
      setIsCreateModalOpen(false);
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error scheduling transfer order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleValidateTransfer = async () => {
    if (!validatingTransferId) return;
    setIsSubmitting(true);
    try {
      const res = await api.post(`/transfers/${validatingTransferId}/validate`);
      alert(res.data.message || 'Transfer validated! Stock relocated.');
      setValidatingTransferId(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to validate transfer order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelTransfer = async () => {
    if (!cancelingTransferId) return;
    setIsSubmitting(true);
    try {
      await api.post(`/transfers/${cancelingTransferId}/cancel`);
      setCancelingTransferId(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel transfer order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Reference',
      accessor: 'referenceNumber',
      render: (row) => <span className="font-mono font-bold text-purple-400">{row.referenceNumber}</span>
    },
    {
      header: 'Source (From)',
      accessor: 'sourceWarehouse',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-200">{row.sourceWarehouse?.name || 'Warehouse'}</p>
          <span className="text-[10px] text-slate-400">{row.sourceLocation?.name || 'Location'}</span>
        </div>
      )
    },
    {
      header: 'Destination (To)',
      accessor: 'destinationWarehouse',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-200">{row.destinationWarehouse?.name || 'Warehouse'}</p>
          <span className="text-[10px] text-emerald-400">{row.destinationLocation?.name || 'Location'}</span>
        </div>
      )
    },
    {
      header: 'Items',
      accessor: 'items',
      render: (row) => (
        <span className="px-2 py-1 bg-slate-800 text-purple-300 rounded font-bold text-[10px]">
          {row.items?.length || 0} Items
        </span>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => setViewingTransfer(row)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          {row.status !== 'DONE' && row.status !== 'CANCELED' && (
            <>
              <Button
                variant="primary"
                size="sm"
                icon={CheckCircle2}
                onClick={() => setValidatingTransferId(row.id)}
              >
                Validate
              </Button>
              <button
                onClick={() => setCancelingTransferId(row.id)}
                className="p-1.5 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 rounded-lg transition-colors"
                title="Cancel Transfer Order"
              >
                <XCircle className="w-3.5 h-3.5" />
              </button>
            </>
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
            <ArrowLeftRight className="w-6 h-6 text-purple-400" /> Internal Stock Transfers
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Relocate inventory between warehouses or storage locations with atomic stock updates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" icon={RefreshCw} onClick={fetchData} size="sm">
            Refresh
          </Button>
          <Button variant="primary" icon={Plus} onClick={handleOpenCreateModal} size="sm">
            New Transfer Order
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={transfers}
        isLoading={loading}
        error={error}
        emptyTitle="No Internal Transfers"
        emptyDescription="Create your first internal stock transfer order to relocate goods between facilities."
        actionLabel="Create Transfer Order"
        onEmptyAction={handleOpenCreateModal}
      />

      {/* CREATE TRANSFER ORDER MODAL */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Schedule Internal Stock Transfer">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{formError}</span>
            </div>
          )}

          {/* SOURCE & DESTINATION SELECTION */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-4 h-4" /> Relocation Route
            </h4>

            {/* Source Facility */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Select
                label="Source Warehouse (From) *"
                value={formData.sourceWarehouseId}
                onChange={(e) => handleSourceWarehouseChange(e.target.value)}
              >
                {warehouses.length === 0 ? (
                  <option value="" className="bg-slate-900 text-slate-100">No warehouses created</option>
                ) : (
                  <>
                    {!formData.sourceWarehouseId && <option value="" className="bg-slate-900 text-slate-100">Select Warehouse...</option>}
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id} className="bg-slate-900 text-slate-100">
                        {w.name} ({w.code})
                      </option>
                    ))}
                  </>
                )}
              </Select>

              <Select
                label="Source Location *"
                value={formData.sourceLocationId}
                onChange={(e) => setFormData({ ...formData, sourceLocationId: e.target.value })}
              >
                {sourceLocations.length === 0 ? (
                  <option value="" className="bg-slate-900 text-slate-100">No storage locations in warehouse</option>
                ) : (
                  <>
                    {!formData.sourceLocationId && <option value="" className="bg-slate-900 text-slate-100">Select Location...</option>}
                    {sourceLocations.map((l) => (
                      <option key={l.id} value={l.id} className="bg-slate-900 text-slate-100">
                        {l.name} ({l.code})
                      </option>
                    ))}
                  </>
                )}
              </Select>
            </div>

            <div className="flex justify-center my-1">
              <ArrowRight className="w-5 h-5 text-purple-400 animate-pulse" />
            </div>

            {/* Destination Facility */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Select
                label="Destination Warehouse (To) *"
                value={formData.destinationWarehouseId}
                onChange={(e) => handleDestWarehouseChange(e.target.value)}
              >
                {warehouses.length === 0 ? (
                  <option value="" className="bg-slate-900 text-slate-100">No warehouses created</option>
                ) : (
                  <>
                    {!formData.destinationWarehouseId && <option value="" className="bg-slate-900 text-slate-100">Select Warehouse...</option>}
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id} className="bg-slate-900 text-slate-100">
                        {w.name} ({w.code})
                      </option>
                    ))}
                  </>
                )}
              </Select>

              <Select
                label="Destination Location *"
                value={formData.destinationLocationId}
                onChange={(e) => setFormData({ ...formData, destinationLocationId: e.target.value })}
              >
                {destLocations.length === 0 ? (
                  <option value="" className="bg-slate-900 text-slate-100">No storage locations in warehouse</option>
                ) : (
                  <>
                    {!formData.destinationLocationId && <option value="" className="bg-slate-900 text-slate-100">Select Location...</option>}
                    {destLocations.map((l) => (
                      <option key={l.id} value={l.id} className="bg-slate-900 text-slate-100">
                        {l.name} ({l.code})
                      </option>
                    ))}
                  </>
                )}
              </Select>
            </div>

            {isIdenticalLocation && (
              <div className="p-2 bg-rose-500/20 text-rose-300 rounded text-[11px] font-bold">
                ⚠️ Source and Destination locations cannot be identical! Please select different locations.
              </div>
            )}
          </div>

          {/* LINE ITEMS PICKER WITH LIVE STOCK CALCULATION */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-300 uppercase">Products to Transfer *</label>
              <button
                type="button"
                onClick={handleAddItemRow}
                className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Product Line
              </button>
            </div>

            {formData.items.map((item, idx) => {
              const srcStock = getSourceStock(item.productId, formData.sourceWarehouseId, formData.sourceLocationId);
              const trfQty = parseInt(item.quantity || 0);
              const remainingSrc = srcStock - trfQty;
              const isInsufficient = trfQty > srcStock;

              return (
                <div
                  key={idx}
                  className={`p-3 border rounded-xl space-y-3 ${
                    isInsufficient ? 'bg-rose-950/20 border-rose-800' : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono text-purple-400 font-bold">Transfer Item Line #{idx + 1}</span>
                    {formData.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(idx)}
                        className="text-rose-400 hover:text-rose-300 text-xs font-semibold"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Select
                      label="Product"
                      value={item.productId}
                      onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                    >
                      {products.length === 0 ? (
                        <option value="" className="bg-slate-900 text-slate-100">No products available</option>
                      ) : (
                        <>
                          {!item.productId && <option value="" className="bg-slate-900 text-slate-100">Select Product...</option>}
                          {products.map((p) => (
                            <option key={p.id} value={p.id} className="bg-slate-900 text-slate-100">
                              {p.name} ({p.sku})
                            </option>
                          ))}
                        </>
                      )}
                    </Select>

                    <Input
                      label="Transfer Quantity"
                      type="number"
                      min="1"
                      required
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                    />
                  </div>

                  {/* LIVE STOCK DISPLAY FOR SOURCE LOCATION */}
                  <div className="grid grid-cols-3 gap-2 p-2 bg-slate-900/90 border border-slate-800 rounded-lg text-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Source Stock</span>
                      <span className="font-bold text-emerald-400">{srcStock}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Transfer Qty</span>
                      <span className="font-bold text-purple-400">{trfQty}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Source Remaining</span>
                      <span className={`font-bold ${remainingSrc < 0 ? 'text-rose-400 font-extrabold' : 'text-cyan-400'}`}>
                        {remainingSrc}
                      </span>
                    </div>
                  </div>

                  {isInsufficient && (
                    <div className="text-[11px] font-bold text-rose-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Source does not have enough stock ({srcStock} available). Cannot transfer {trfQty}.
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <Input
            label="Notes / Reason"
            placeholder="e.g. Relocating fast-moving stock to Bay A"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Schedule Transfer Order
            </Button>
          </div>
        </form>
      </Modal>

      {/* VIEW DETAILS MODAL */}
      {viewingTransfer && (
        <Modal isOpen={true} onClose={() => setViewingTransfer(null)} title="Internal Transfer Details">
          <div className="space-y-4 text-xs">
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div>
                <span className="font-mono text-purple-400 font-bold text-sm block">
                  {viewingTransfer.referenceNumber}
                </span>
                <p className="text-white font-bold">{viewingTransfer.notes || 'Internal stock relocation'}</p>
              </div>
              <StatusBadge status={viewingTransfer.status} />
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950 border border-slate-800 rounded-xl">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Source Facility (From)</span>
                <p className="font-bold text-white">{viewingTransfer.sourceWarehouse?.name}</p>
                <span className="text-[10px] text-slate-400">{viewingTransfer.sourceLocation?.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Destination Facility (To)</span>
                <p className="font-bold text-white">{viewingTransfer.destinationWarehouse?.name}</p>
                <span className="text-[10px] text-emerald-400">{viewingTransfer.destinationLocation?.name}</span>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-300 mb-2">Transferred Product Lines</h4>
              <div className="space-y-2">
                {viewingTransfer.items?.map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex justify-between items-center">
                    <div>
                      <p className="font-bold text-white">{item.product?.name || 'Product'}</p>
                      <span className="font-mono text-[10px] text-purple-400">{item.product?.sku}</span>
                    </div>
                    <span className="font-bold text-purple-400 text-sm">
                      {item.quantity} {item.product?.unit || 'units'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="secondary" onClick={() => setViewingTransfer(null)}>
                Close Window
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* CONFIRM VALIDATION DIALOG */}
      <ConfirmDialog
        isOpen={!!validatingTransferId}
        onClose={() => setValidatingTransferId(null)}
        onConfirm={handleValidateTransfer}
        title="Validate Transfer & Relocate Stock"
        message="Validating this transfer will run an atomic database transaction: deducting stock from the source location, adding stock to the destination location, and logging TRANSFER_OUT & TRANSFER_IN ledger entries. Proceed?"
        confirmText="Validate & Move Stock"
        confirmVariant="primary"
        isLoading={isSubmitting}
      />

      {/* CONFIRM CANCEL DIALOG */}
      <ConfirmDialog
        isOpen={!!cancelingTransferId}
        onClose={() => setCancelingTransferId(null)}
        onConfirm={handleCancelTransfer}
        title="Cancel Transfer Order"
        message="Are you sure you want to cancel this stock transfer order?"
        confirmText="Cancel Transfer"
        confirmVariant="danger"
        isLoading={isSubmitting}
      />
    </div>
  );
};
