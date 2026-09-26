import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ArrowUpRight,
  Plus,
  Eye,
  CheckCircle2,
  XCircle,
  Package,
  Building2,
  RefreshCw,
  AlertTriangle,
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

export const DeliveriesPage = () => {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [locations, setLocations] = useState([]);
  const [stockMap, setStockMap] = useState({}); // Map of `${productId}_${whId}_${locId}` -> qty

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingDelivery, setViewingDelivery] = useState(null);
  const [validatingDeliveryId, setValidatingDeliveryId] = useState(null);
  const [cancelingDeliveryId, setCancelingDeliveryId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Form Data
  const [formData, setFormData] = useState({
    customerName: 'BuildTech Solutions Inc',
    sourceWarehouseId: '',
    sourceLocationId: '',
    notes: '',
    items: [{ productId: '', orderedQuantity: 10, unitPrice: '' }]
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [delRes, prodRes, whRes, invRes] = await Promise.all([
        api.get('/deliveries').catch(() => ({ data: { data: [] } })),
        api.get('/products').catch(() => ({ data: { data: [] } })),
        api.get('/warehouses').catch(() => ({ data: { data: [] } })),
        api.get('/inventory/stock').catch(() => ({ data: { data: [] } }))
      ]);

      setDeliveries(delRes.data.data || []);
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
        const initialWhId = formData.sourceWarehouseId || whList[0].id;
        setFormData((prev) => ({ ...prev, sourceWarehouseId: initialWhId }));
        
        try {
          const locRes = await api.get(`/warehouses/${initialWhId}/locations`);
          const locs = locRes.data.data || whList[0].locations || [];
          setLocations(locs);
          if (locs.length > 0) {
            setFormData((prev) => ({
              ...prev,
              sourceLocationId: prev.sourceLocationId || locs[0].id
            }));
          }
        } catch (e) {
          setLocations(whList[0].locations || []);
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
      setError(err.response?.data?.message || 'Failed to fetch deliveries data');
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

      const firstWhId = whList[0]?.id || '';
      const firstProdId = prodList[0]?.id || '';

      let locs = [];
      if (firstWhId) {
        try {
          const locRes = await api.get(`/warehouses/${firstWhId}/locations`);
          locs = locRes.data.data || whList[0]?.locations || [];
        } catch (e) {
          locs = whList[0]?.locations || [];
        }
      }
      setLocations(locs);

      setFormData({
        customerName: 'BuildTech Solutions Inc',
        sourceWarehouseId: firstWhId,
        sourceLocationId: locs[0]?.id || '',
        notes: '',
        items: [{ productId: firstProdId, orderedQuantity: 10, unitPrice: '' }]
      });
    } catch (err) {
      console.error('Error opening delivery create modal:', err);
    }
  };

  const handleWarehouseChange = async (whId) => {
    setFormData((prev) => ({ ...prev, sourceWarehouseId: whId, sourceLocationId: '' }));
    if (!whId) {
      setLocations([]);
      return;
    }

    try {
      const res = await api.get(`/warehouses/${whId}/locations`);
      const locs = res.data.data || [];
      setLocations(locs);
      if (locs.length > 0) {
        setFormData((prev) => ({ ...prev, sourceLocationId: locs[0].id }));
      }
    } catch (e) {
      const wh = warehouses.find((w) => w.id === whId);
      const fallbackLocs = wh?.locations || [];
      setLocations(fallbackLocs);
      if (fallbackLocs.length > 0) {
        setFormData((prev) => ({ ...prev, sourceLocationId: fallbackLocs[0].id }));
      }
    }
  };

  const handleAddItemRow = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { productId: products[0]?.id || '', orderedQuantity: 5, unitPrice: '' }
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

  const getAvailableStock = (productId, warehouseId, locationId) => {
    if (!productId || !warehouseId || !locationId) return 0;
    const key = `${productId}_${warehouseId}_${locationId}`;
    if (stockMap[key] !== undefined) return stockMap[key];
    
    // Fallback: check product total stock if location matching fails
    const prod = products.find((p) => p.id === productId);
    return prod?.currentStock || prod?.stock || 0;
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // Pre-validation check for negative stock
    for (const item of formData.items) {
      const avail = getAvailableStock(item.productId, formData.sourceWarehouseId, formData.sourceLocationId);
      const req = parseInt(item.orderedQuantity || 0);
      if (req > avail) {
        const prod = products.find((p) => p.id === item.productId);
        setFormError(
          `Insufficient stock for '${prod?.name || 'Product'}'. Available: ${avail}, Requested: ${req}. Stock cannot be negative.`
        );
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await api.post('/deliveries', formData);
      setIsCreateModalOpen(false);
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error creating delivery order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleValidateDelivery = async () => {
    if (!validatingDeliveryId) return;
    setIsSubmitting(true);
    try {
      const res = await api.post(`/deliveries/${validatingDeliveryId}/validate`);
      alert(res.data.message || 'Delivery order validated! Stock deducted.');
      setValidatingDeliveryId(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to validate delivery order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelDelivery = async () => {
    if (!cancelingDeliveryId) return;
    setIsSubmitting(true);
    try {
      await api.post(`/deliveries/${cancelingDeliveryId}/cancel`);
      setCancelingDeliveryId(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel delivery order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Reference',
      accessor: 'referenceNumber',
      render: (row) => <span className="font-mono font-bold text-amber-400">{row.referenceNumber}</span>
    },
    {
      header: 'Customer',
      accessor: 'customerName',
      render: (row) => <span className="font-bold text-white">{row.customerName}</span>
    },
    {
      header: 'Source Location',
      accessor: 'sourceWarehouse',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-200">{row.sourceWarehouse?.name || 'Warehouse'}</p>
          <span className="text-[10px] text-slate-400">{row.sourceLocation?.name || 'Location'}</span>
        </div>
      )
    },
    {
      header: 'Items',
      accessor: 'items',
      render: (row) => (
        <span className="px-2 py-1 bg-slate-800 text-amber-300 rounded font-bold text-[10px]">
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
            onClick={() => setViewingDelivery(row)}
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
                onClick={() => setValidatingDeliveryId(row.id)}
              >
                Validate
              </Button>
              <button
                onClick={() => setCancelingDeliveryId(row.id)}
                className="p-1.5 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 rounded-lg transition-colors"
                title="Cancel Delivery Order"
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
            <ArrowUpRight className="w-6 h-6 text-amber-400" /> Deliveries (Outgoing Goods)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Pick, pack, and validate outgoing customer shipments. Deducts stock upon validation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" icon={RefreshCw} onClick={fetchData} size="sm">
            Refresh
          </Button>
          <Button variant="primary" icon={Plus} onClick={handleOpenCreateModal} size="sm">
            New Delivery Order
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={deliveries}
        isLoading={loading}
        error={error}
        emptyTitle="No Delivery Orders"
        emptyDescription="Create your first outgoing customer delivery order to begin shipping goods."
        actionLabel="Create Delivery Order"
        onEmptyAction={handleOpenCreateModal}
      />

      {/* CREATE DELIVERY ORDER MODAL */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create Delivery Order">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{formError}</span>
            </div>
          )}

          <Input
            label="Customer Name *"
            required
            placeholder="BuildTech Solutions Inc"
            value={formData.customerName}
            onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Source Warehouse *"
              value={formData.sourceWarehouseId}
              onChange={(e) => handleWarehouseChange(e.target.value)}
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
              {locations.length === 0 ? (
                <option value="" className="bg-slate-900 text-slate-100">No storage locations in warehouse</option>
              ) : (
                <>
                  {!formData.sourceLocationId && <option value="" className="bg-slate-900 text-slate-100">Select Location...</option>}
                  {locations.map((l) => (
                    <option key={l.id} value={l.id} className="bg-slate-900 text-slate-100">
                      {l.name} ({l.code})
                    </option>
                  ))}
                </>
              )}
            </Select>
          </div>

          {/* Line Items Picker with Live Stock Calculation */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-300 uppercase">Delivery Line Items *</label>
              <button
                type="button"
                onClick={handleAddItemRow}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Product Line
              </button>
            </div>

            {formData.items.map((item, idx) => {
              const availStock = getAvailableStock(item.productId, formData.sourceWarehouseId, formData.sourceLocationId);
              const reqQty = parseInt(item.orderedQuantity || 0);
              const remainingStock = availStock - reqQty;
              const isInsufficient = reqQty > availStock;

              return (
                <div
                  key={idx}
                  className={`p-3 border rounded-xl space-y-3 ${
                    isInsufficient ? 'bg-rose-950/20 border-rose-800' : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono text-amber-400 font-bold">Item Line #{idx + 1}</span>
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

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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
                      label="Requested Quantity"
                      type="number"
                      min="1"
                      required
                      value={item.orderedQuantity}
                      onChange={(e) => handleItemChange(idx, 'orderedQuantity', e.target.value)}
                    />

                    <Input
                      label="Unit Price ($)"
                      type="number"
                      step="0.01"
                      placeholder="12.50"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                    />
                  </div>

                  {/* LIVE STOCK METRICS DISPLAY */}
                  <div className="grid grid-cols-3 gap-2 p-2 bg-slate-900/90 border border-slate-800 rounded-lg text-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Available Stock</span>
                      <span className="font-bold text-emerald-400">{availStock}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Requested Qty</span>
                      <span className="font-bold text-amber-400">{reqQty}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Remaining Stock</span>
                      <span className={`font-bold ${remainingStock < 0 ? 'text-rose-400 font-extrabold' : 'text-cyan-400'}`}>
                        {remainingStock}
                      </span>
                    </div>
                  </div>

                  {isInsufficient && (
                    <div className="text-[11px] font-bold text-rose-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Warning: Requested quantity ({reqQty}) exceeds available stock ({availStock}). Validation will be rejected.
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <Input
            label="Notes / Dispatch Notes"
            placeholder="e.g. SO-9921 Customer dispatch order"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Create Delivery Order
            </Button>
          </div>
        </form>
      </Modal>

      {/* VIEW DETAILS MODAL */}
      {viewingDelivery && (
        <Modal isOpen={true} onClose={() => setViewingDelivery(null)} title="Delivery Order Details">
          <div className="space-y-4 text-xs">
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div>
                <span className="font-mono text-amber-400 font-bold text-sm block">
                  {viewingDelivery.referenceNumber}
                </span>
                <p className="text-white font-bold">{viewingDelivery.customerName}</p>
              </div>
              <StatusBadge status={viewingDelivery.status} />
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950 border border-slate-800 rounded-xl">
              <div>
                <span className="text-slate-400 block text-[10px]">Source Facility</span>
                <p className="font-bold text-white">{viewingDelivery.sourceWarehouse?.name}</p>
                <span className="text-[10px] text-slate-400">{viewingDelivery.sourceLocation?.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Created On</span>
                <p className="font-bold text-slate-200">{new Date(viewingDelivery.createdAt).toLocaleString()}</p>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-300 mb-2">Delivery Product Lines</h4>
              <div className="space-y-2">
                {viewingDelivery.items?.map((item, idx) => {
                  const avail = getAvailableStock(
                    item.productId,
                    viewingDelivery.sourceWarehouseId,
                    viewingDelivery.sourceLocationId
                  );
                  const req = item.orderedQuantity || item.pickedQuantity || 0;
                  const rem = avail - req;

                  return (
                    <div key={idx} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-bold text-white">{item.product?.name || 'Product'}</p>
                          <span className="font-mono text-[10px] text-amber-400">{item.product?.sku}</span>
                        </div>
                        <span className="font-bold text-amber-400 text-sm">
                          -{req} {item.product?.unit || 'units'}
                        </span>
                      </div>

                      {/* Stock metrics summary */}
                      <div className="grid grid-cols-3 gap-2 p-2 bg-slate-900 border border-slate-800/80 rounded-lg text-center">
                        <div>
                          <span className="text-[9px] text-slate-400 uppercase font-bold block">Available Stock</span>
                          <span className="font-bold text-emerald-400">{avail}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 uppercase font-bold block">Requested Qty</span>
                          <span className="font-bold text-amber-400">{req}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 uppercase font-bold block">Remaining Stock</span>
                          <span className={`font-bold ${rem < 0 ? 'text-rose-400' : 'text-cyan-400'}`}>{rem}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="secondary" onClick={() => setViewingDelivery(null)}>
                Close Window
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {}
      <ConfirmDialog
        isOpen={!!validatingDeliveryId}
        onClose={() => setValidatingDeliveryId(null)}
        onConfirm={handleValidateDelivery}
        title="Validate Delivery & Decrease Stock"
        message="Validating this delivery order will execute an atomic database transaction that checks available stock, rejects if insufficient, decreases stock, and records a StockLedger entry. Proceed?"
        confirmText="Validate & Deduct Stock"
        confirmVariant="primary"
        isLoading={isSubmitting}
      />

      {/* CONFIRM CANCEL DIALOG */}
      <ConfirmDialog
        isOpen={!!cancelingDeliveryId}
        onClose={() => setCancelingDeliveryId(null)}
        onConfirm={handleCancelDelivery}
        title="Cancel Delivery Order"
        message="Are you sure you want to cancel this delivery order?"
        confirmText="Cancel Delivery"
        confirmVariant="danger"
        isLoading={isSubmitting}
      />
    </div>
  );
};
