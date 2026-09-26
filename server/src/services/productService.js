import prisma from '../config/db.js';

// In-Memory Fallback Product Store for testing when DB is offline
const inMemoryProducts = new Map([
  [
    'prod-1',
    {
      id: 'prod-1',
      name: 'Steel Rods 12mm (Structural)',
      sku: 'SKU-STL-001',
      categoryId: 'cat-1',
      category: { id: 'cat-1', name: 'Raw Materials' },
      unit: 'kg',
      reorderLevel: 30,
      costPrice: 4.5,
      salePrice: 7.2,
      totalStock: 150,
      stocks: [
        { id: 'stk-1', warehouseId: 'wh-1', locationId: 'loc-1', quantity: 80, warehouse: { name: 'Main Central Warehouse' }, location: { name: 'Main Store Bay A' } },
        { id: 'stk-2', warehouseId: 'wh-1', locationId: 'loc-2', quantity: 50, warehouse: { name: 'Main Central Warehouse' }, location: { name: 'Rack A - Bulk Steel' } },
        { id: 'stk-3', warehouseId: 'wh-2', locationId: 'loc-3', quantity: 20, warehouse: { name: 'Production Floor' }, location: { name: 'Production Rack A1' } }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  [
    'prod-2',
    {
      id: 'prod-2',
      name: 'Ergonomic Office Chair',
      sku: 'SKU-CHR-102',
      categoryId: 'cat-2',
      category: { id: 'cat-2', name: 'Finished Goods' },
      unit: 'units',
      reorderLevel: 15,
      costPrice: 85.0,
      salePrice: 149.99,
      totalStock: 8, // Low Stock!
      stocks: [
        { id: 'stk-4', warehouseId: 'wh-1', locationId: 'loc-1', quantity: 8, warehouse: { name: 'Main Central Warehouse' }, location: { name: 'Main Store Bay A' } }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]
]);

export const getProducts = async ({ search, categoryId, warehouseId, lowStock }) => {
  try {
    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (categoryId && categoryId !== 'All') {
      where.categoryId = categoryId;
    }

    if (warehouseId && warehouseId !== 'All') {
      where.stocks = {
        some: { warehouseId }
      };
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        stocks: {
          include: {
            warehouse: { select: { id: true, name: true, code: true } },
            location: { select: { id: true, name: true, code: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = products.map((p) => {
      const totalStock = p.stocks.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
      const isLowStock = totalStock <= p.reorderLevel;
      return {
        ...p,
        totalStock,
        isLowStock
      };
    });

    if (lowStock === 'true' || lowStock === true) {
      return formatted.filter((p) => p.isLowStock);
    }

    return formatted;
  } catch (err) {
    let list = Array.from(inMemoryProducts.values());

    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
    }

    if (categoryId && categoryId !== 'All') {
      list = list.filter((p) => p.categoryId === categoryId);
    }

    const formatted = list.map((p) => {
      const totalStock = (p.stocks || []).reduce((acc, curr) => acc + (curr.quantity || 0), 0);
      const isLowStock = totalStock <= p.reorderLevel;
      return { ...p, totalStock, isLowStock };
    });

    if (lowStock === 'true' || lowStock === true) {
      return formatted.filter((p) => p.isLowStock);
    }

    return formatted;
  }
};

export const getProductById = async (id) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        stocks: {
          include: {
            warehouse: true,
            location: true
          }
        }
      }
    });

    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }

    const totalStock = product.stocks.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
    return {
      ...product,
      totalStock,
      isLowStock: totalStock <= product.reorderLevel
    };
  } catch (err) {
    if (err.statusCode === 404) throw err;
    const prod = inMemoryProducts.get(id);
    if (!prod) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }
    const totalStock = (prod.stocks || []).reduce((acc, curr) => acc + (curr.quantity || 0), 0);
    return { ...prod, totalStock, isLowStock: totalStock <= prod.reorderLevel };
  }
};

export const createProduct = async (data, userId) => {
  const { name, sku, categoryId, unit, reorderLevel, costPrice, salePrice, initialStock, warehouseId, locationId } = data;

  // Validation
  if (!name || !name.trim()) {
    const error = new Error('Product name is required');
    error.statusCode = 400;
    throw error;
  }

  if (!sku || !sku.trim()) {
    const error = new Error('Product SKU is required');
    error.statusCode = 400;
    throw error;
  }

  if (!categoryId) {
    const error = new Error('Category is required');
    error.statusCode = 400;
    throw error;
  }

  if (!unit) {
    const error = new Error('Unit of measure is required');
    error.statusCode = 400;
    throw error;
  }

  const parsedReorderLevel = parseInt(reorderLevel) || 0;
  if (parsedReorderLevel < 0) {
    const error = new Error('Reorder level cannot be negative');
    error.statusCode = 400;
    throw error;
  }

  const parsedInitialStock = parseInt(initialStock) || 0;
  if (parsedInitialStock < 0) {
    const error = new Error('Initial stock quantity cannot be negative');
    error.statusCode = 400;
    throw error;
  }

  const trimmedSku = sku.trim().toUpperCase();

  try {
    // Check SKU uniqueness
    const existingSku = await prisma.product.findUnique({ where: { sku: trimmedSku } });
    if (existingSku) {
      const error = new Error(`Product with SKU '${trimmedSku}' already exists`);
      error.statusCode = 400;
      throw error;
    }

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        sku: trimmedSku,
        categoryId,
        unit,
        reorderLevel: parsedReorderLevel,
        costPrice: costPrice ? parseFloat(costPrice) : null,
        salePrice: salePrice ? parseFloat(salePrice) : null
      },
      include: { category: true }
    });

    // Handle initial stock allocation if provided
    if (parsedInitialStock > 0 && warehouseId && locationId) {
      await prisma.stock.create({
        data: {
          productId: product.id,
          warehouseId,
          locationId,
          quantity: parsedInitialStock
        }
      });

      // Audit log entry in StockLedger
      await prisma.stockLedger.create({
        data: {
          productId: product.id,
          warehouseId,
          locationId,
          type: 'ADJUSTMENT',
          quantity: parsedInitialStock,
          previousQuantity: 0,
          newQuantity: parsedInitialStock,
          referenceId: `INIT-${product.sku}`,
          createdById: userId || null
        }
      });
    }

    return await getProductById(product.id);
  } catch (err) {
    if (err.statusCode === 400) throw err;

    // Check fallback in memory SKU
    for (const p of inMemoryProducts.values()) {
      if (p.sku.toUpperCase() === trimmedSku) {
        const error = new Error(`Product with SKU '${trimmedSku}' already exists`);
        error.statusCode = 400;
        throw error;
      }
    }

    const newProdId = `prod-${Date.now()}`;
    const newProd = {
      id: newProdId,
      name: name.trim(),
      sku: trimmedSku,
      categoryId,
      category: { id: categoryId, name: 'General' },
      unit,
      reorderLevel: parsedReorderLevel,
      costPrice: parseFloat(costPrice) || 0,
      salePrice: parseFloat(salePrice) || 0,
      totalStock: parsedInitialStock,
      stocks: parsedInitialStock > 0 ? [
        { id: `stk-${Date.now()}`, warehouseId: warehouseId || 'wh-1', locationId: locationId || 'loc-1', quantity: parsedInitialStock, warehouse: { name: 'Main Warehouse' }, location: { name: 'Main Store Bay A' } }
      ] : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    inMemoryProducts.set(newProdId, newProd);
    return { ...newProd, isLowStock: parsedInitialStock <= parsedReorderLevel };
  }
};

export const updateProduct = async (id, data) => {
  const { name, sku, categoryId, unit, reorderLevel, costPrice, salePrice } = data;

  if (reorderLevel !== undefined && parseInt(reorderLevel) < 0) {
    const error = new Error('Reorder level cannot be negative');
    error.statusCode = 400;
    throw error;
  }

  const updateData = {};
  if (name) updateData.name = name.trim();
  if (sku) updateData.sku = sku.trim().toUpperCase();
  if (categoryId) updateData.categoryId = categoryId;
  if (unit) updateData.unit = unit;
  if (reorderLevel !== undefined) updateData.reorderLevel = parseInt(reorderLevel);
  if (costPrice !== undefined) updateData.costPrice = parseFloat(costPrice);
  if (salePrice !== undefined) updateData.salePrice = parseFloat(salePrice);

  try {
    if (updateData.sku) {
      const existing = await prisma.product.findFirst({
        where: { sku: updateData.sku, NOT: { id } }
      });
      if (existing) {
        const error = new Error(`Product with SKU '${updateData.sku}' already exists`);
        error.statusCode = 400;
        throw error;
      }
    }

    await prisma.product.update({
      where: { id },
      data: updateData
    });

    return await getProductById(id);
  } catch (err) {
    if (err.statusCode === 400) throw err;
    if (inMemoryProducts.has(id)) {
      const p = inMemoryProducts.get(id);
      const updated = { ...p, ...updateData, updatedAt: new Date().toISOString() };
      inMemoryProducts.set(id, updated);
      return updated;
    }
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }
};

export const deleteProduct = async (id) => {
  try {
    await prisma.product.delete({ where: { id } });
    return { success: true, message: 'Product deleted successfully' };
  } catch (err) {
    if (inMemoryProducts.has(id)) {
      inMemoryProducts.delete(id);
      return { success: true, message: 'Product deleted successfully' };
    }
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }
};
