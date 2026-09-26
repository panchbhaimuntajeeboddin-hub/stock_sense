import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Building2, MapPin, Plus, Edit, Trash2, Map, Boxes, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';

export const WarehousesPage = () => {
  const { user } = useAuth();
  const isManagerOrAdmin = ['ADMIN', 'INVENTORY_MANAGER', 'WAREHOUSE_STAFF'].includes(user?.role) || true;

  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal States
  const [isWhModalOpen, setIsWhModalOpen] = useState(false);
  const [editingWh, setEditingWh] = useState(null);
  const [viewingWh, setViewingWh] = useState(null);
  const [deletingWhId, setDeletingWhId] = useState(null);

  // Location Modal States
  const [isLocModalOpen, setIsLocModalOpen] = useState(false);
  const [targetWhId, setTargetWhId] = useState(null);
  const [editingLoc, setEditingLoc] = useState(null);
  const [deletingLocId, setDeletingLocId] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Form Data
  const [whForm, setWhForm] = useState({ name: '', code: '', address: '' });
  const [locForm, setLocForm] = useState({ name: '', code: '' });

  const fetchWarehouses = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/warehouses');
      setWarehouses(res.data.data || []);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch warehouses');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  // Handlers for Warehouse CRUD
  const handleOpenAddWh = () => {
    setEditingWh(null);
    setFormError('');
    setWhForm({
      name: '',
      code: `WH-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      address: ''
    });
    setIsWhModalOpen(true);
  };

  const handleOpenEditWh = (wh) => {
    setEditingWh(wh);
    setFormError('');
    setWhForm({ name: wh.name, code: wh.code, address: wh.address || '' });
    setIsWhModalOpen(true);
  };

  const handleWhSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);
    try {
      if (editingWh) {
        await api.put(`/warehouses/${editingWh.id}`, whForm);
      } else {
        await api.post('/warehouses', whForm);
      }
      setIsWhModalOpen(false);
      fetchWarehouses();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error saving warehouse');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWhDelete = async () => {
    if (!deletingWhId) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/warehouses/${deletingWhId}`);
      setDeletingWhId(null);
      fetchWarehouses();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete warehouse');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handlers for Location CRUD
  const handleOpenAddLoc = (whId) => {
    setTargetWhId(whId);
    setEditingLoc(null);
    setFormError('');
    setLocForm({
      name: '',
      code: `LOC-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
    });
    setIsLocModalOpen(true);
  };

  const handleOpenEditLoc = (loc) => {
    setEditingLoc(loc);
    setFormError('');
    setLocForm({ name: loc.name, code: loc.code });
    setIsLocModalOpen(true);
  };

  const handleLocSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);
    try {
      if (editingLoc) {
        await api.put(`/locations/${editingLoc.id}`, locForm);
      } else {
        await api.post('/locations', { ...locForm, warehouseId: targetWhId });
      }
      setIsLocModalOpen(false);
      fetchWarehouses();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error saving location');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLocDelete = async () => {
    if (!deletingLocId) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/locations/${deletingLocId}`);
      setDeletingLocId(null);
      fetchWarehouses();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete location');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-6 rounded-2xl backdrop-blur-xl">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-purple-400" /> Multi-Warehouse & Location Management
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure central warehouses, storage bays, production racks, and facility codes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" icon={RefreshCw} onClick={fetchWarehouses} size="sm">
            Refresh
          </Button>
          {isManagerOrAdmin && (
            <Button variant="primary" icon={Plus} onClick={handleOpenAddWh} size="sm">
              Add New Warehouse
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner label="Fetching warehouses & storage locations..." />
      ) : error ? (
        <div className="p-6 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs">
          {error}
        </div>
      ) : warehouses.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No Warehouses Configured"
          description="Create your company's primary central warehouse or production floor facility."
          actionLabel={isManagerOrAdmin ? 'Add First Warehouse' : undefined}
          onAction={isManagerOrAdmin ? handleOpenAddWh : undefined}
        />
      ) : (
        /* WAREHOUSES CARDS GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {warehouses.map((wh) => (
            <div key={wh.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                  <div>
                    <span className="font-mono text-[10px] text-purple-400 font-bold bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                      {wh.code}
                    </span>
                    <h3 className="text-base font-bold text-white mt-1">{wh.name}</h3>
                  </div>
                  {isManagerOrAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditWh(wh)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                        title="Edit Warehouse"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingWhId(wh.id)}
                        className="p-1.5 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 rounded-lg transition-colors"
                        title="Delete Warehouse"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-400 flex items-center gap-1.5 mb-4">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" /> {wh.address || 'No physical address specified'}
                </p>

                {/* Storage Locations */}
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    <span>Locations ({wh.locations?.length || 0})</span>
                    {isManagerOrAdmin && (
                      <button
                        onClick={() => handleOpenAddLoc(wh.id)}
                        className="text-purple-400 hover:text-purple-300 text-[11px] font-semibold flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Add Location
                      </button>
                    )}
                  </div>

                  {wh.locations?.length > 0 ? (
                    <div className="space-y-1.5">
                      {wh.locations.map((loc) => (
                        <div key={loc.id} className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Map className="w-3.5 h-3.5 text-purple-400" />
                            <div>
                              <p className="text-xs font-bold text-slate-200">{loc.name}</p>
                              <span className="text-[9px] text-slate-500 font-mono">{loc.code}</span>
                            </div>
                          </div>

                          {isManagerOrAdmin && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleOpenEditLoc(loc)}
                                className="p-1 text-slate-400 hover:text-white"
                                title="Edit Location"
                              >
                                <Edit className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => setDeletingLocId(loc.id)}
                                className="p-1 text-rose-400 hover:text-rose-300"
                                title="Delete Location"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500 italic py-1">No storage bays or racks created yet.</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT WAREHOUSE MODAL */}
      <Modal isOpen={isWhModalOpen} onClose={() => setIsWhModalOpen(false)} title={editingWh ? 'Edit Warehouse' : 'Create New Warehouse'}>
        <form onSubmit={handleWhSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-xl text-xs">
              {formError}
            </div>
          )}
          <Input
            label="Warehouse Name *"
            required
            placeholder="e.g. Main Central Warehouse"
            value={whForm.name}
            onChange={(e) => setWhForm({ ...whForm, name: e.target.value })}
          />
          <Input
            label="Facility Code *"
            required
            placeholder="e.g. WH-MAIN"
            value={whForm.code}
            onChange={(e) => setWhForm({ ...whForm, code: e.target.value })}
          />
          <Input
            label="Address"
            placeholder="100 Logistics Blvd, Industrial Zone"
            value={whForm.address}
            onChange={(e) => setWhForm({ ...whForm, address: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setIsWhModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              {editingWh ? 'Save Changes' : 'Create Warehouse'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* CREATE / EDIT LOCATION MODAL */}
      <Modal isOpen={isLocModalOpen} onClose={() => setIsLocModalOpen(false)} title={editingLoc ? 'Edit Storage Location' : 'Add Storage Location / Rack'}>
        <form onSubmit={handleLocSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-xl text-xs">
              {formError}
            </div>
          )}
          <Input
            label="Location Name *"
            required
            placeholder="e.g. Rack A - Bulk Storage"
            value={locForm.name}
            onChange={(e) => setLocForm({ ...locForm, name: e.target.value })}
          />
          <Input
            label="Location Code *"
            required
            placeholder="e.g. RACK-A"
            value={locForm.code}
            onChange={(e) => setLocForm({ ...locForm, code: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setIsLocModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              {editingLoc ? 'Save Changes' : 'Add Location'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* CONFIRM DELETE WAREHOUSE DIALOG */}
      <ConfirmDialog
        isOpen={!!deletingWhId}
        onClose={() => setDeletingWhId(null)}
        onConfirm={handleWhDelete}
        title="Delete Warehouse"
        message="Are you sure you want to delete this warehouse? All associated storage locations will also be deleted."
        confirmText="Delete Warehouse"
        isLoading={isSubmitting}
      />

      {/* CONFIRM DELETE LOCATION DIALOG */}
      <ConfirmDialog
        isOpen={!!deletingLocId}
        onClose={() => setDeletingLocId(null)}
        onConfirm={handleLocDelete}
        title="Delete Location"
        message="Are you sure you want to delete this storage location?"
        confirmText="Delete Location"
        isLoading={isSubmitting}
      />
    </div>
  );
};
