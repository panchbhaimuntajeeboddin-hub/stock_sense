import prisma from '../config/db.js';

// Fallback Location Store
const inMemoryLocations = new Map([
  ['loc-1', { id: 'loc-1', warehouseId: 'wh-1', name: 'Main Store Bay A', code: 'MAIN-ST' }],
  ['loc-2', { id: 'loc-2', warehouseId: 'wh-1', name: 'Rack A - Bulk Steel', code: 'RACK-A' }],
  ['loc-3', { id: 'loc-3', warehouseId: 'wh-1', name: 'Rack B - Hardware', code: 'RACK-B' }],
  ['loc-4', { id: 'loc-4', warehouseId: 'wh-2', name: 'Production Rack A1', code: 'PROD-RACK' }]
]);

export const getLocationsByWarehouse = async (warehouseId) => {
  try {
    return await prisma.location.findMany({
      where: { warehouseId },
      include: {
        _count: { select: { stocks: true } }
      },
      orderBy: { name: 'asc' }
    });
  } catch (err) {
    return Array.from(inMemoryLocations.values()).filter((l) => l.warehouseId === warehouseId);
  }
};

export const createLocation = async ({ warehouseId, name, code }) => {
  if (!warehouseId) {
    const error = new Error('Warehouse ID is required');
    error.statusCode = 400;
    throw error;
  }

  if (!name || !name.trim()) {
    const error = new Error('Location name is required');
    error.statusCode = 400;
    throw error;
  }

  const trimmedName = name.trim();
  const trimmedCode = code ? code.trim().toUpperCase() : `LOC-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  try {
    return await prisma.location.create({
      data: {
        warehouseId,
        name: trimmedName,
        code: trimmedCode
      }
    });
  } catch (err) {
    const newLoc = {
      id: `loc-${Date.now()}`,
      warehouseId,
      name: trimmedName,
      code: trimmedCode,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    inMemoryLocations.set(newLoc.id, newLoc);
    return newLoc;
  }
};

export const updateLocation = async (id, { name, code }) => {
  const updateData = {};
  if (name) updateData.name = name.trim();
  if (code) updateData.code = code.trim().toUpperCase();

  try {
    return await prisma.location.update({
      where: { id },
      data: updateData
    });
  } catch (err) {
    if (inMemoryLocations.has(id)) {
      const loc = inMemoryLocations.get(id);
      const updated = { ...loc, ...updateData, updatedAt: new Date().toISOString() };
      inMemoryLocations.set(id, updated);
      return updated;
    }
    const error = new Error('Location not found');
    error.statusCode = 404;
    throw error;
  }
};

export const deleteLocation = async (id) => {
  try {
    await prisma.location.delete({ where: { id } });
    return { success: true, message: 'Location deleted successfully' };
  } catch (err) {
    if (inMemoryLocations.has(id)) {
      inMemoryLocations.delete(id);
      return { success: true, message: 'Location deleted successfully' };
    }
    const error = new Error('Location not found');
    error.statusCode = 404;
    throw error;
  }
};
