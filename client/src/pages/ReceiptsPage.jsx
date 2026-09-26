import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ArrowDownLeft,
  Plus,
  Eye,
  CheckCircle2,
  XCircle,
  Edit,
  Package,
  Building2,
  RefreshCw,
  Check,
  AlertTriangle
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { DataTable } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export const ReceiptsPage = () => {
  const { user } = useAuth();
  const [receipts, setReceipts] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [locations, setLocations] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState(null);
  const [validatingReceiptId, setValidatingReceiptId] = useState(null);
  const [cancelingReceiptId, setCancelingReceiptId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Form Data
  const [formData, setFormData] = useState({
    supplierName: 'Apex Metal Supplies',
    destinationWarehouseId: '',
    destinationLocationId: '',
    notes: '',
    items: [{ productId: '', expectedQuantity: 50, unitCost: '' }]
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [recRes, prodRes, whRes] = await Promise.all([
        api.get('/receipts').catch(() => ({ data: { data: [] } })),
        api.get('/products').catch(() => ({ data: { data: [] } })),
        api.get('/warehouses').catch(() => ({ data: { data: [] } }))
      ]);

      setReceipts(recRes.data.data || []);
      const prodList = prodRes.data.data || [];
      const whList = whRes.data.data || [];

      setProducts(prodList);
      setWarehouses(whList);

      if (whList.length > 0) {
        const initialWhId = formData.destinationWarehouseId || whList[0].id;
        setFormData((prev) => ({ ...prev, destinationWarehouseId: initialWhId }));
        
        try {
          const locRes = await api.get(`/warehouses/${initialWhId}/locations`);
          const locs = locRes.data.data || whList[0].locations || [];
          setLocations(locs);
          if (locs.length > 0) {
            setFormData((prev) => ({
              ...prev,
              destinationLocationId: prev.destinationLocationId || locs[0].id
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
      setError(err.response?.data?.message || 'Failed to fetch receipts data');
      setLoading(false);
    }
  };

  const handleOpenCreateModal = async () => {
    setIsCreateModalOpen(true);
    setFormError('');

    try {
      const [whRes, prodRes] = await Promise.all([
        api.get('/warehouses').catch(() => ({ data: { data: [] } })),
        api.get('/products').catch(() => ({ data: { data: [] } }))
      ]);

      const whList = whRes.data.data || [];
      const prodList = prodRes.data.data || [];

      setWarehouses(whList);
      setProducts(prodList);

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
        supplierName: 'Apex Metal Supplies',
        destinationWarehouseId: firstWhId,
        destinationLocationId: locs[0]?.id || '',
        notes: '',
        items: [{ productId: firstProdId, expectedQuantity: 50, unitCost: '' }]
      });
    } catch (err) {
      console.error('Error opening receipt create modal:', err);
    }
  };

  // Update locations list when warehouse changes
  const handleWarehouseChange = async (whId) => {
    setFormData((prev) => ({ ...prev, destinationWarehouseId: whId, destinationLocationId: '' }));
    if (!whId) {
      setLocations([]);
      return;
    }

    try {
      const res = await api.get(`/warehouses/${whId}/locations`);
      const locs = res.data.data || [];
      setLocations(locs);
      if (locs.length > 0) {
        setFormData((prev) => ({ ...prev, destinationLocationId: locs[0].id }));
      }
    } catch (e) {
      const wh = warehouses.find((w) => w.id === whId);
      const fallbackLocs = wh?.locations || [];
      setLocations(fallbackLocs);
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
        { productId: products[0]?.id || '', expectedQuantity: 10, unitCost: '' }
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

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);
    try {
      await api.post('/receipts', formData);
      setIsCreateModalOpen(false);
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error creating receipt');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleValidateReceipt = async () => {
    if (!validatingReceiptId) return;
    setIsSubmitting(true);
    try {
      const res = await api.post(`/receipts/${validatingReceiptId}/validate`);
      alert(res.data.message || 'Receipt validated! Stock increased.');
      setValidatingReceiptId(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to validate receipt');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelReceipt = async () => {
    if (!cancelingReceiptId) return;
    setIsSubmitting(true);
    try {
      await api.post(`/receipts/${cancelingReceiptId}/cancel`);
      setCancelingReceiptId(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel receipt');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Reference',
      accessor: 'referenceNumber',
      render: (row) => <span className="font-mono font-bold text-emerald-400">{row.referenceNumber}</span>
    },
    {
      header: 'Supplier / Vendor',
      accessor: 'supplier',
      render: (row) => <span className="font-bold text-white">{row.supplier?.name || 'General Vendor'}</span>
    },
    {
      header: 'Destination Location',
      accessor: 'destinationWarehouse',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-200">{row.destinationWarehouse?.name || 'Warehouse'}</p>
          <span className="text-[10px] text-slate-400">{row.destinationLocation?.name || 'Location'}</span>
        </div>
      )
    },
    {
      header: 'Line Items',
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
            onClick={() => setViewingReceipt(row)}
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
                onClick={() => setValidatingReceiptId(row.id)}
              >
                Validate
              </Button>
              <button
                onClick={() => setCancelingReceiptId(row.id)}
                className="p-1.5 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 rounded-lg transition-colors"
                title="Cancel Receipt"
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-6 rounded-2xl backdrop-blur-xl">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <ArrowDownLeft className="w-6 h-6 text-emerald-400" /> Receipts (Incoming Goods)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Receive incoming vendor shipments and automatically increase stock upon validation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" icon={RefreshCw} onClick={fetchData} size="sm">
            Refresh
          </Button>
          <Button variant="primary" icon={Plus} onClick={handleOpenCreateModal} size="sm">
            Create Receipt
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={receipts}
        isLoading={loading}
        error={error}
        emptyTitle="No Incoming Receipts"
        emptyDescription="Create your first incoming vendor receipt to receive stock into storage locations."
        actionLabel="Create First Receipt"
        onEmptyAction={handleOpenCreateModal}
      />

      {/* CREATE RECEIPT MODAL */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create Incoming Receipt Order">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-xl text-xs">
              {formError}
            </div>
          )}

          <Input
            label="Supplier / Vendor Name *"
            required
            placeholder="Apex Metal Supplies"
            value={formData.supplierName}
            onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Destination Warehouse *"
              value={formData.destinationWarehouseId}
              onChange={(e) => handleWarehouseChange(e.target.value)}
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
              {locations.length === 0 ? (
                <option value="" className="bg-slate-900 text-slate-100">No storage locations in warehouse</option>
              ) : (
                <>
                  {!formData.destinationLocationId && <option value="" className="bg-slate-900 text-slate-100">Select Location...</option>}
                  {locations.map((l) => (
                    <option key={l.id} value={l.id} className="bg-slate-900 text-slate-100">
                      {l.name} ({l.code})
                    </option>
                  ))}
                </>
              )}
            </Select>
          </div>

          {/* Line Items Picker */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-300 uppercase">Receipt Line Items *</label>
              <button
                type="button"
                onClick={handleAddItemRow}
                className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Product
              </button>
            </div>

            {formData.items.map((item, idx) => (
              <div key={idx} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono text-purple-400 font-bold">Item #{idx + 1}</span>
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
                    label="Expected Qty"
                    type="number"
                    min="1"
                    required
                    value={item.expectedQuantity}
                    onChange={(e) => handleItemChange(idx, 'expectedQuantity', e.target.value)}
                  />

                  <Input
                    label="Unit Cost ($)"
                    type="number"
                    step="0.01"
                    placeholder="4.50"
                    value={item.unitCost}
                    onChange={(e) => handleItemChange(idx, 'unitCost', e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>

          <Input
            label="Notes / PO Details"
            placeholder="e.g. PO-8842 - Urgent steel delivery"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Save Receipt Order
            </Button>
          </div>
        </form>
      </Modal>

      {/* VIEW DETAILS MODAL */}
      {viewingReceipt && (
        <Modal isOpen={true} onClose={() => setViewingReceipt(null)} title="Receipt Details">
          <div className="space-y-4 text-xs">
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div>
                <span className="font-mono text-emerald-400 font-bold text-sm block">
                  {viewingReceipt.referenceNumber}
                </span>
                <p className="text-white font-bold">{viewingReceipt.supplier?.name}</p>
              </div>
              <StatusBadge status={viewingReceipt.status} />
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950 border border-slate-800 rounded-xl">
              <div>
                <span className="text-slate-400 block text-[10px]">Destination Facility</span>
                <p className="font-bold text-white">{viewingReceipt.destinationWarehouse?.name}</p>
                <span className="text-[10px] text-slate-400">{viewingReceipt.destinationLocation?.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Created On</span>
                <p className="font-bold text-slate-200">{new Date(viewingReceipt.createdAt).toLocaleString()}</p>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-300 mb-2">Received Product Items</h4>
              <div className="space-y-1.5">
                {viewingReceipt.items?.map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex justify-between items-center">
                    <div>
                      <p className="font-bold text-white">{item.product?.name || 'Product'}</p>
                      <span className="font-mono text-[10px] text-purple-400">{item.product?.sku}</span>
                    </div>
                    <span className="font-bold text-emerald-400 text-sm">
                      +{item.receivedQuantity || item.expectedQuantity} {item.product?.unit || 'units'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="secondary" onClick={() => setViewingReceipt(null)}>
                Close Window
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* CONFIRM VALIDATION DIALOG */}
      <ConfirmDialog
        isOpen={!!validatingReceiptId}
        onClose={() => setValidatingReceiptId(null)}
        onConfirm={handleValidateReceipt}
        title="Validate Receipt & Increase Stock"
        message="Validating this receipt will run a database transaction that automatically increases inventory stock and logs a StockLedger entry. Proceed?"
        confirmText="Validate & Increase Stock"
        confirmVariant="primary"
        isLoading={isSubmitting}
      />

      {/* CONFIRM CANCEL DIALOG */}
      <ConfirmDialog
        isOpen={!!cancelingReceiptId}
        onClose={() => setCancelingReceiptId(null)}
        onConfirm={handleCancelReceipt}
        title="Cancel Receipt Order"
        message="Are you sure you want to cancel this receipt order?"
        confirmText="Cancel Receipt"
        confirmVariant="danger"
        isLoading={isSubmitting}
      />
    </div>
  );
};
