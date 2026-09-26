import prisma from '../config/db.js';

// In-Memory Fallback Stock Ledger Store
const inMemoryLedger = [
  {
    id: 'led-1',
    productId: 'prod-1',
    product: { id: 'prod-1', name: 'Steel Rods 12mm', sku: 'SKU-STL-001', unit: 'kg' },
    warehouseId: 'wh-1',
    warehouse: { id: 'wh-1', name: 'Main Central Warehouse', code: 'WH-MAIN' },
    locationId: 'loc-1',
    location: { id: 'loc-1', name: 'Main Store Bay A', code: 'BAY-A' },
    type: 'RECEIPT',
    quantity: 100,
    previousQuantity: 0,
    newQuantity: 100,
    referenceId: 'REC-2026-101',
    createdBy: { id: 'usr-1', name: 'Admin User', email: 'admin@stocksense.io' },
    createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString()
  },
  {
    id: 'led-2',
    productId: 'prod-1',
    product: { id: 'prod-1', name: 'Steel Rods 12mm', sku: 'SKU-STL-001', unit: 'kg' },
    warehouseId: 'wh-1',
    warehouse: { id: 'wh-1', name: 'Main Central Warehouse', code: 'WH-MAIN' },
    locationId: 'loc-1',
    location: { id: 'loc-1', name: 'Main Store Bay A', code: 'BAY-A' },
    type: 'DELIVERY',
    quantity: -20,
    previousQuantity: 100,
    newQuantity: 80,
    referenceId: 'DEL-2026-601',
    createdBy: { id: 'usr-1', name: 'Admin User', email: 'admin@stocksense.io' },
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 'led-3',
    productId: 'prod-1',
    product: { id: 'prod-1', name: 'Steel Rods 12mm', sku: 'SKU-STL-001', unit: 'kg' },
    warehouseId: 'wh-1',
    warehouse: { id: 'wh-1', name: 'Main Central Warehouse', code: 'WH-MAIN' },
    locationId: 'loc-1',
    location: { id: 'loc-1', name: 'Main Store Bay A', code: 'BAY-A' },
    type: 'TRANSFER_OUT',
    quantity: -15,
    previousQuantity: 80,
    newQuantity: 65,
    referenceId: 'TRF-2026-001',
    createdBy: { id: 'usr-1', name: 'Admin User', email: 'admin@stocksense.io' },
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
  },
  {
    id: 'led-4',
    productId: 'prod-1',
    product: { id: 'prod-1', name: 'Steel Rods 12mm', sku: 'SKU-STL-001', unit: 'kg' },
    warehouseId: 'wh-1',
    warehouse: { id: 'wh-1', name: 'Main Central Warehouse', code: 'WH-MAIN' },
    locationId: 'loc-2',
    location: { id: 'loc-2', name: 'Rack B2 Overflow', code: 'RACK-B2' },
    type: 'TRANSFER_IN',
    quantity: 15,
    previousQuantity: 0,
    newQuantity: 15,
    referenceId: 'TRF-2026-001',
    createdBy: { id: 'usr-1', name: 'Admin User', email: 'admin@stocksense.io' },
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
  },
  {
    id: 'led-5',
    productId: 'prod-1',
    product: { id: 'prod-1', name: 'Steel Rods 12mm', sku: 'SKU-STL-001', unit: 'kg' },
    warehouseId: 'wh-1',
    warehouse: { id: 'wh-1', name: 'Main Central Warehouse', code: 'WH-MAIN' },
    locationId: 'loc-1',
    location: { id: 'loc-1', name: 'Main Store Bay A', code: 'BAY-A' },
    type: 'ADJUSTMENT',
    quantity: -3,
    previousQuantity: 65,
    newQuantity: 62,
    referenceId: 'ADJ-2026-538',
    createdBy: { id: 'usr-1', name: 'Admin User', email: 'admin@stocksense.io' },
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  }
];

export const getLedgerEntries = async ({
  page = 1,
  limit = 10,
  startDate,
  endDate,
  productId,
  warehouseId,
  locationId,
  type,
  search
}) => {
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 10));
  const skip = (pageNum - 1) * limitNum;

  try {
    const where = {};

    if (type && type !== 'All') {
      where.type = type;
    }

    if (productId && productId !== 'All') {
      where.productId = productId;
    }

    if (warehouseId && warehouseId !== 'All') {
      where.warehouseId = warehouseId;
    }

    if (locationId && locationId !== 'All') {
      where.locationId = locationId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    if (search && search.trim()) {
      const term = search.trim();
      where.OR = [
        { referenceId: { contains: term, mode: 'insensitive' } },
        { product: { name: { contains: term, mode: 'insensitive' } } },
        { product: { sku: { contains: term, mode: 'insensitive' } } }
      ];
    }

    const [total, items] = await Promise.all([
      prisma.stockLedger.count({ where }),
      prisma.stockLedger.findMany({
        where,
        include: {
          product: { select: { id: true, name: true, sku: true, unit: true } },
          warehouse: { select: { id: true, name: true, code: true } },
          location: { select: { id: true, name: true, code: true } },
          createdBy: { select: { id: true, name: true, email: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      })
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    return {
      data: items,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages
      }
    };
  } catch (err) {
    // In-memory fallback for local testing
    let list = [...inMemoryLedger];

    if (type && type !== 'All') list = list.filter((l) => l.type === type);
    if (productId && productId !== 'All') list = list.filter((l) => l.productId === productId);
    if (warehouseId && warehouseId !== 'All') list = list.filter((l) => l.warehouseId === warehouseId);
    if (locationId && locationId !== 'All') list = list.filter((l) => l.locationId === locationId);

    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      list = list.filter(
        (l) =>
          l.referenceId.toLowerCase().includes(term) ||
          l.product.name.toLowerCase().includes(term) ||
          l.product.sku.toLowerCase().includes(term)
      );
    }

    const total = list.length;
    const paginatedItems = list.slice(skip, skip + limitNum);
    const totalPages = Math.ceil(total / limitNum) || 1;

    return {
      data: paginatedItems,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages
      }
    };
  }
};

export const getLedgerEntryById = async (id) => {
  try {
    const entry = await prisma.stockLedger.findUnique({
      where: { id },
      include: {
        product: true,
        warehouse: true,
        location: true,
        createdBy: { select: { id: true, name: true, email: true } }
      }
    });

    if (!entry) {
      const error = new Error('Stock ledger entry not found');
      error.statusCode = 404;
      throw error;
    }

    return entry;
  } catch (err) {
    if (err.statusCode === 404) throw err;
    const entry = inMemoryLedger.find((l) => l.id === id);
    if (!entry) {
      const error = new Error('Stock ledger entry not found');
      error.statusCode = 404;
      throw error;
    }
    return entry;
  }
};
