import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Package,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  AlertTriangle,
  MapPin,
  RefreshCw,
  Layers
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { DataTable } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

export const ProductsPage = () => {
  const { user } = useAuth();
  const isManagerOrAdmin = ['ADMIN', 'INVENTORY_MANAGER', 'WAREHOUSE_STAFF'].includes(user?.role) || true;

  // Data States
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
  const [isCategorySubmitting, setIsCategorySubmitting] = useState(false);
  const [categoryError, setCategoryError] = useState('');

  // Filters State
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedWarehouse, setSelectedWarehouse] = useState('All');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [viewingProduct, setViewingProduct] = useState(null);
  const [deletingProductId, setDeletingProductId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    categoryId: '',
    unit: 'units',
    reorderLevel: 10,
    costPrice: '',
    salePrice: '',
    initialStock: 0
  });

  const [formError, setFormError] = useState('');

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      const catList = res.data.data || [];
      setCategories(catList);
      if (catList.length > 0 && !formData.categoryId) {
        setFormData((prev) => ({ ...prev, categoryId: catList[0].id }));
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    setCategoryError('');
    setIsCategorySubmitting(true);
    try {
      const res = await api.post('/categories', categoryForm);
      const newCat = res.data.data;
      await fetchCategories();
      if (newCat?.id) {
        setFormData((prev) => ({ ...prev, categoryId: newCat.id }));
      }
      setIsCategoryModalOpen(false);
      setCategoryForm({ name: '', description: '' });
    } catch (err) {
      setCategoryError(err.response?.data?.message || 'Error creating category');
    } finally {
      setIsCategorySubmitting(false);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (search) params.search = search;
      if (selectedCategory !== 'All') params.categoryId = selectedCategory;
      if (selectedWarehouse !== 'All') params.warehouseId = selectedWarehouse;
      if (lowStockOnly) params.lowStock = true;

      const res = await api.get('/products', { params });
      setProducts(res.data.data || []);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load products');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [search, selectedCategory, selectedWarehouse, lowStockOnly]);

  // Open Create Modal
  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormError('');
    setFormData({
      name: '',
      sku: `SKU-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      categoryId: categories[0]?.id || '',
      unit: 'units',
      reorderLevel: 10,
      costPrice: '',
      salePrice: '',
      initialStock: 0
    });
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (prod) => {
    setEditingProduct(prod);
    setFormError('');
    setFormData({
      name: prod.name,
      sku: prod.sku,
      categoryId: prod.categoryId,
      unit: prod.unit,
      reorderLevel: prod.reorderLevel,
      costPrice: prod.costPrice || '',
      salePrice: prod.salePrice || '',
      initialStock: 0
    });
    setIsAddModalOpen(true);
  };

  // Submit Form (Create / Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, formData);
      } else {
        await api.post('/products', formData);
      }
      setIsAddModalOpen(false);
      fetchProducts();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error saving product');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm Delete
  const handleDeleteConfirm = async () => {
    if (!deletingProductId) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/products/${deletingProductId}`);
      setDeletingProductId(null);
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete product');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Columns definition for DataTable
  const columns = [
    {
      header: 'Product & SKU',
      accessor: 'name',
      render: (row) => (
        <div>
          <div className="font-bold text-white text-xs">{row.name}</div>
          <div className="font-mono text-[10px] text-purple-400 mt-0.5">{row.sku}</div>
        </div>
      )
    },
    {
      header: 'Category',
      accessor: 'category',
      render: (row) => (
        <span className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg text-[10px] font-semibold">
          {row.category?.name || 'General'}
        </span>
      )
    },
    {
      header: 'Unit',
      accessor: 'unit'
    },
    {
      header: 'Total Stock',
      accessor: 'totalStock',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className={`font-extrabold text-xs ${row.isLowStock ? 'text-rose-400' : 'text-emerald-400'}`}>
            {row.totalStock || 0} {row.unit}
          </span>
          {row.isLowStock && (
            <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 rounded-full text-[9px] font-bold flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Reorder
            </span>
          )}
        </div>
      )
    },
    {
      header: 'Reorder Level',
      accessor: 'reorderLevel',
      render: (row) => <span className="font-bold text-amber-400">{row.reorderLevel}</span>
    },
    {
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => setViewingProduct(row)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          {isManagerOrAdmin && (
            <>
              <button
                onClick={() => handleOpenEdit(row)}
                className="p-1.5 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 rounded-lg transition-colors"
                title="Edit Product"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setDeletingProductId(row.id)}
                className="p-1.5 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 rounded-lg transition-colors"
                title="Delete Product"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-6 rounded-2xl backdrop-blur-xl">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-purple-400" /> Product Management Module
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Complete inventory catalog with SKU tracking, low stock alerts, and reorder levels.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" icon={RefreshCw} onClick={fetchProducts} size="sm">
            Refresh
          </Button>
          {isManagerOrAdmin && (
            <>
              <Button variant="secondary" icon={Layers} onClick={() => setIsCategoryModalOpen(true)} size="sm">
                + Create Category
              </Button>
              <Button variant="primary" icon={Plus} onClick={handleOpenAdd} size="sm">
                Add New Product
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <Input
            icon={Search}
            placeholder="Search by Product Name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {/* Category Filter */}
          <Select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="All">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>

          {/* Warehouse Filter */}
          <Select
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
          >
            <option value="All">All Warehouses</option>
            <option value="wh-1">Main Central Warehouse</option>
            <option value="wh-2">Production Floor</option>
          </Select>

          {/* Low Stock Filter Button */}
          <button
            onClick={() => setLowStockOnly(!lowStockOnly)}
            className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
              lowStockOnly
                ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 font-bold shadow-md shadow-rose-500/20'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" /> Show Low Stock Only
          </button>
        </div>
      </div>

      {/* Product List Table */}
      <DataTable
        columns={columns}
        data={products}
        isLoading={loading}
        error={error}
        emptyTitle="No Products Found"
        emptyDescription="No products match your search or filter criteria. Create your first product SKU to populate the inventory list."
        actionLabel={isManagerOrAdmin ? 'Add First Product' : undefined}
        onEmptyAction={isManagerOrAdmin ? handleOpenAdd : undefined}
      />

      {/* CREATE / EDIT MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingProduct ? 'Edit Product Details' : 'Create New Product'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-xl text-xs">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Product Name *"
              required
              placeholder="e.g. Steel Rods 12mm"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <Input
              label="SKU / Code *"
              required
              placeholder="e.g. SKU-STL-001"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Category *"
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>

            <Select
              label="Unit of Measure *"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            >
              <option value="units">units (Pieces)</option>
              <option value="kg">kg (Kilograms)</option>
              <option value="meters">meters</option>
              <option value="boxes">boxes</option>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Reorder Level (Min Stock) *"
              type="number"
              min="0"
              required
              value={formData.reorderLevel}
              onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
            />
            {!editingProduct && (
              <Input
                label="Initial Stock Quantity"
                type="number"
                min="0"
                value={formData.initialStock}
                onChange={(e) => setFormData({ ...formData, initialStock: e.target.value })}
              />
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              {editingProduct ? 'Save Changes' : 'Create Product'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* VIEW PRODUCT DETAILS MODAL */}
      {viewingProduct && (
        <Modal isOpen={true} onClose={() => setViewingProduct(null)} title="Product Inventory Details">
          <div className="space-y-4 text-xs">
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">{viewingProduct.name}</h3>
                <span className="font-mono text-purple-400 font-bold">{viewingProduct.sku}</span>
              </div>
              <span className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold">
                {viewingProduct.category?.name || 'General'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950 border border-slate-800 rounded-xl">
              <div>
                <span className="text-slate-400 block text-[10px]">Total Available Stock</span>
                <span className={`text-lg font-extrabold ${viewingProduct.isLowStock ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {viewingProduct.totalStock} {viewingProduct.unit}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Reorder Threshold Level</span>
                <span className="text-lg font-extrabold text-amber-400">
                  {viewingProduct.reorderLevel} {viewingProduct.unit}
                </span>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-purple-400" /> Warehouse Stock Allocation
              </h4>
              {viewingProduct.stocks?.length > 0 ? (
                <div className="space-y-1.5">
                  {viewingProduct.stocks.map((s, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl flex justify-between items-center">
                      <div>
                        <p className="font-bold text-white">{s.warehouse?.name || 'Warehouse'}</p>
                        <span className="text-[10px] text-slate-500">{s.location?.name || 'Location'}</span>
                      </div>
                      <span className="font-bold text-emerald-400 text-sm">{s.quantity} {viewingProduct.unit}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 italic py-2">No location stock allocation records yet.</p>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="secondary" onClick={() => setViewingProduct(null)}>
                Close Window
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={!!deletingProductId}
        onClose={() => setDeletingProductId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
        confirmText="Delete Product"
        isLoading={isSubmitting}
      />

      {/* CREATE CATEGORY MODAL */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="Create Product Category"
      >
        <form onSubmit={handleCategorySubmit} className="space-y-4">
          {categoryError && (
            <div className="p-3 bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-xl text-xs">
              {categoryError}
            </div>
          )}

          <Input
            label="Category Name *"
            required
            placeholder="e.g. Industrial Cables & Wires"
            value={categoryForm.name}
            onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
          />

          <Input
            label="Category Description"
            placeholder="e.g. Heavy duty power distribution cables"
            value={categoryForm.description}
            onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setIsCategoryModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isCategorySubmitting}>
              Create Category
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
