import prisma from '../config/db.js';

// In-memory fallback store if local database is offline
const inMemoryWarehouses = new Map([
  [
    'wh-1',
    {
      id: 'wh-1',
      name: 'Main Central Warehouse',
      code: 'WH-MAIN',
      address: '100 Logistics Blvd, Industrial Zone',
      locations: [
        { id: 'loc-1', warehouseId: 'wh-1', name: 'Main Store Bay A', code: 'MAIN-ST' },
        { id: 'loc-2', warehouseId: 'wh-1', name: 'Rack A - Bulk Steel', code: 'RACK-A' },
        { id: 'loc-3', warehouseId: 'wh-1', name: 'Rack B - Hardware', code: 'RACK-B' }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  [
    'wh-2',
    {
      id: 'wh-2',
      name: 'Production Plant Floor',
      code: 'WH-PROD',
      address: '200 Assembly Way, Plant 2',
      locations: [
        { id: 'loc-4', warehouseId: 'wh-2', name: 'Production Rack A1', code: 'PROD-RACK' }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]
]);

export const getAllWarehouses = async () => {
  try {
    return await prisma.warehouse.findMany({
      include: {
        locations: true,
        _count: {
          select: { locations: true, stocks: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  } catch (err) {
    return Array.from(inMemoryWarehouses.values());
  }
};

export const getWarehouseById = async (id) => {
  try {
    const wh = await prisma.warehouse.findUnique({
      where: { id },
      include: {
        locations: true,
        stocks: {
          include: {
            product: { select: { id: true, name: true, sku: true, unit: true } },
            location: { select: { id: true, name: true, code: true } }
          }
        }
      }
    });

    if (!wh) {
      const error = new Error('Warehouse not found');
      error.statusCode = 404;
      throw error;
    }

    return wh;
  } catch (err) {
    if (err.statusCode === 404) throw err;
    const wh = inMemoryWarehouses.get(id);
    if (!wh) {
      const error = new Error('Warehouse not found');
      error.statusCode = 404;
      throw error;
    }
    return wh;
  }
};

export const createWarehouse = async ({ name, code, address }) => {
  if (!name || !name.trim()) {
    const error = new Error('Warehouse name is required');
    error.statusCode = 400;
    throw error;
  }

  const trimmedName = name.trim();
  const trimmedCode = code ? code.trim().toUpperCase() : `WH-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  try {
    const existing = await prisma.warehouse.findUnique({ where: { code: trimmedCode } });
    if (existing) {
      const error = new Error(`Warehouse with code '${trimmedCode}' already exists`);
      error.statusCode = 400;
      throw error;
    }

    return await prisma.warehouse.create({
      data: {
        name: trimmedName,
        code: trimmedCode,
        address: address ? address.trim() : null
      },
      include: { locations: true }
    });
  } catch (err) {
    if (err.statusCode === 400) throw err;

    for (const wh of inMemoryWarehouses.values()) {
      if (wh.code === trimmedCode) {
        const error = new Error(`Warehouse with code '${trimmedCode}' already exists`);
        error.statusCode = 400;
        throw error;
      }
    }

    const newWh = {
      id: `wh-${Date.now()}`,
      name: trimmedName,
      code: trimmedCode,
      address: address ? address.trim() : null,
      locations: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    inMemoryWarehouses.set(newWh.id, newWh);
    return newWh;
  }
};

export const updateWarehouse = async (id, { name, code, address }) => {
  const updateData = {};
  if (name) updateData.name = name.trim();
  if (code) updateData.code = code.trim().toUpperCase();
  if (address !== undefined) updateData.address = address ? address.trim() : null;

  try {
    if (updateData.code) {
      const existing = await prisma.warehouse.findFirst({
        where: { code: updateData.code, NOT: { id } }
      });
      if (existing) {
        const error = new Error(`Warehouse with code '${updateData.code}' already exists`);
        error.statusCode = 400;
        throw error;
      }
    }

    return await prisma.warehouse.update({
      where: { id },
      data: updateData,
      include: { locations: true }
    });
  } catch (err) {
    if (err.statusCode === 400) throw err;
    if (inMemoryWarehouses.has(id)) {
      const wh = inMemoryWarehouses.get(id);
      const updated = { ...wh, ...updateData, updatedAt: new Date().toISOString() };
      inMemoryWarehouses.set(id, updated);
      return updated;
    }
    const error = new Error('Warehouse not found');
    error.statusCode = 404;
    throw error;
  }
};

export const deleteWarehouse = async (id) => {
  try {
    await prisma.warehouse.delete({ where: { id } });
    return { success: true, message: 'Warehouse deleted successfully' };
  } catch (err) {
    if (inMemoryWarehouses.has(id)) {
      inMemoryWarehouses.delete(id);
      return { success: true, message: 'Warehouse deleted successfully' };
    }
    const error = new Error('Warehouse not found');
    error.statusCode = 404;
    throw error;
  }
};
