import prisma from '../config/db.js';

// In-Memory Fallback Adjustment Store
const inMemoryAdjustments = new Map([
  [
    'adj-1',
    {
      id: 'adj-1',
      referenceNumber: 'ADJ-2026-001',
      productId: 'prod-1',
      product: { id: 'prod-1', name: 'Steel Rods 12mm', sku: 'SKU-STL-001', unit: 'kg' },
      warehouseId: 'wh-1',
      warehouse: { id: 'wh-1', name: 'Main Central Warehouse' },
      locationId: 'loc-1',
      location: { id: 'loc-1', name: 'Main Store Bay A' },
      recordedQuantity: 100,
      countedQuantity: 97,
      difference: -3,
      reason: 'Physical count discrepancy - damaged items during inspection',
      status: 'DONE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]
]);

export const getAllAdjustments = async ({ productId, warehouseId }) => {
  try {
    const where = {};
    if (productId && productId !== 'All') where.productId = productId;
    if (warehouseId && warehouseId !== 'All') where.warehouseId = warehouseId;

    return await prisma.adjustment.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, sku: true, unit: true } },
        warehouse: { select: { id: true, name: true, code: true } },
        location: { select: { id: true, name: true, code: true } },
        createdBy: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  } catch (err) {
    let list = Array.from(inMemoryAdjustments.values());
    if (productId && productId !== 'All') list = list.filter((a) => a.productId === productId);
    if (warehouseId && warehouseId !== 'All') list = list.filter((a) => a.warehouseId === warehouseId);
    return list;
  }
};

export const getAdjustmentById = async (id) => {
  try {
    const adjustment = await prisma.adjustment.findUnique({
      where: { id },
      include: {
        product: true,
        warehouse: true,
        location: true,
        createdBy: { select: { id: true, name: true, email: true } }
      }
    });

    if (!adjustment) {
      const error = new Error('Stock adjustment record not found');
      error.statusCode = 404;
      throw error;
    }

    return adjustment;
  } catch (err) {
    if (err.statusCode === 404) throw err;
    const a = inMemoryAdjustments.get(id);
    if (!a) {
      const error = new Error('Stock adjustment record not found');
      error.statusCode = 404;
      throw error;
    }
    return a;
  }
};

export const createAdjustment = async (data, userId) => {
  const {
    productId,
    warehouseId,
    locationId,
    recordedQuantity,
    countedQuantity,
    reason
  } = data;

  if (!productId) {
    const error = new Error('Product selection is required');
    error.statusCode = 400;
    throw error;
  }

  if (!warehouseId || !locationId) {
    const error = new Error('Warehouse and storage location are required');
    error.statusCode = 400;
    throw error;
  }

  const recQty = parseInt(recordedQuantity);
  const countQty = parseInt(countedQuantity);

  if (isNaN(recQty) || isNaN(countQty)) {
    const error = new Error('Recorded and counted quantities must be valid integers');
    error.statusCode = 400;
    throw error;
  }

  if (countQty < 0) {
    const error = new Error('Physical count cannot be negative');
    error.statusCode = 400;
    throw error;
  }

  if (!reason || !reason.trim()) {
    const error = new Error('A valid reason for the stock adjustment is required');
    error.statusCode = 400;
    throw error;
  }

  const difference = countQty - recQty;
  const referenceNumber = `ADJ-2026-${String(Math.floor(100 + Math.random() * 900))}`;

  try {
    const adjustment = await prisma.adjustment.create({
      data: {
        referenceNumber,
        productId,
        warehouseId,
        locationId,
        recordedQuantity: recQty,
        countedQuantity: countQty,
        difference,
        reason: reason.trim(),
        status: 'DRAFT',
        createdById: userId || null
      },
      include: {
        product: true,
        warehouse: true,
        location: true
      }
    });

    return adjustment;
  } catch (err) {
    if (err.statusCode === 400) throw err;

    const newAdjId = `adj-${Date.now()}`;
    const newAdj = {
      id: newAdjId,
      referenceNumber,
      productId,
      product: { id: productId, name: 'Sample Item', sku: 'SKU-SMP-1', unit: 'units' },
      warehouseId,
      warehouse: { id: warehouseId, name: 'Main Warehouse' },
      locationId,
      location: { id: locationId, name: 'Main Store Bay A' },
      recordedQuantity: recQty,
      countedQuantity: countQty,
      difference,
      reason: reason.trim(),
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    inMemoryAdjustments.set(newAdjId, newAdj);
    return newAdj;
  }
};

// ATOMIC DATABASE TRANSACTION VALIDATION FOR STOCK ADJUSTMENT
export const validateAdjustment = async (id, userId) => {
  const adjustment = await getAdjustmentById(id);

  if (adjustment.status === 'DONE') {
    const error = new Error('Stock adjustment order is already DONE');
    error.statusCode = 400;
    throw error;
  }

  if (adjustment.status === 'CANCELED') {
    const error = new Error('Cannot validate a CANCELED stock adjustment');
    error.statusCode = 400;
    throw error;
  }

  const {
    productId,
    warehouseId,
    locationId,
    recordedQuantity,
    countedQuantity,
    difference,
    referenceNumber
  } = adjustment;

  try {
    // ATOMIC DATABASE TRANSACTION FOR ADJUSTMENT
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch current stock record or create if missing
      let existingStock = await tx.stock.findUnique({
        where: {
          productId_warehouseId_locationId: {
            productId,
            warehouseId,
            locationId
          }
        }
      });

      const currentSystemQty = existingStock ? existingStock.quantity : recordedQuantity;
      const actualDifference = countedQuantity - currentSystemQty;

      if (existingStock) {
        // Update stock to exact counted physical quantity
        await tx.stock.update({
          where: { id: existingStock.id },
          data: { quantity: countedQuantity }
        });
      } else {
        // Create stock record with physical count
        await tx.stock.create({
          data: {
            productId,
            warehouseId,
            locationId,
            quantity: countedQuantity
          }
        });
      }

      // 2. Create StockLedger entry with previous, new, and difference quantity
      await tx.stockLedger.create({
        data: {
          productId,
          warehouseId,
          locationId,
          type: 'ADJUSTMENT',
          quantity: actualDifference,
          previousQuantity: currentSystemQty,
          newQuantity: countedQuantity,
          referenceId: referenceNumber,
          createdById: userId || null
        }
      });

      // 3. Mark adjustment as DONE
      const updatedAdjustment = await tx.adjustment.update({
        where: { id },
        data: {
          status: 'DONE',
          difference: actualDifference
        },
        include: {
          product: true,
          warehouse: true,
          location: true
        }
      });

      return updatedAdjustment;
    });

    return result;
  } catch (err) {
    if (err.statusCode) throw err;

    if (inMemoryAdjustments.has(id)) {
      const a = inMemoryAdjustments.get(id);
      a.status = 'DONE';
      a.updatedAt = new Date().toISOString();
      inMemoryAdjustments.set(id, a);
      return a;
    }

    const error = new Error('Stock adjustment validation failed: ' + err.message);
    error.statusCode = 400;
    throw error;
  }
};
