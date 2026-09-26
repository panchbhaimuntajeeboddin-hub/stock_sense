import prisma from '../config/db.js';

/**
 * AI Demand Forecasting & Reorder Recommendation Service
 * Evaluates historical StockLedger DELIVERY and TRANSFER_OUT logs to calculate:
 * - Average Daily Usage (ADU)
 * - Estimated Days Remaining until stockout
 * - Risk Levels (CRITICAL, HIGH, MEDIUM, LOW, INSUFFICIENT_DATA)
 * - Suggested Reorder Quantities
 */
export const getReorderPredictions = async (filters = {}) => {
  const { warehouseId, categoryId, riskLevel } = filters;

  // 1. Fetch products with optional category filter
  const productWhere = {};
  if (categoryId) {
    productWhere.categoryId = categoryId;
  }

  const products = await prisma.product.findMany({
    where: productWhere,
    include: {
      category: true,
      stocks: {
        where: warehouseId ? { warehouseId } : {},
        include: { warehouse: true, location: true }
      }
    }
  });

  // 2. Fetch all historical outgoing StockLedger records (DELIVERY and TRANSFER_OUT)
  const ledgerWhere = {
    type: { in: ['DELIVERY', 'TRANSFER_OUT'] }
  };
  if (warehouseId) {
    ledgerWhere.warehouseId = warehouseId;
  }

  const ledgerRecords = await prisma.stockLedger.findMany({
    where: ledgerWhere,
    orderBy: { createdAt: 'asc' }
  });

  // Group ledger logs by product ID
  const productLedgerMap = {};
  ledgerRecords.forEach((log) => {
    if (!productLedgerMap[log.productId]) {
      productLedgerMap[log.productId] = [];
    }
    productLedgerMap[log.productId].push(log);
  });

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const predictions = [];

  for (const product of products) {
    const logs = productLedgerMap[product.id] || [];

    // Calculate total current stock for product (across all warehouses or specific warehouse)
    let currentStock = 0;
    product.stocks.forEach((s) => {
      currentStock += s.quantity || 0;
    });

    const reorderLevel = product.reorderLevel || 10;

    // Calculate historical consumption stats
    let totalQuantityShipped = 0;
    let recent7DaysShipped = 0;
    let earliestDate = logs.length > 0 ? new Date(logs[0].createdAt) : null;

    logs.forEach((log) => {
      const shippedQty = Math.abs(log.quantity || 0);
      totalQuantityShipped += shippedQty;

      if (new Date(log.createdAt) >= sevenDaysAgo) {
        recent7DaysShipped += shippedQty;
      }
    });

    // Calculate active days window
    let daysActive = 30; // default window assumption
    if (earliestDate) {
      const diffMs = now.getTime() - earliestDate.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      daysActive = Math.max(1, diffDays);
    }

    const averageDailyUsage = parseFloat((totalQuantityShipped / daysActive).toFixed(2));
    const recentDailyUsage = parseFloat((recent7DaysShipped / 7).toFixed(2));

    // Determine estimated days remaining until stockout
    let estimatedDaysRemaining = null;
    if (averageDailyUsage > 0) {
      estimatedDaysRemaining = Math.max(0, Math.round(currentStock / averageDailyUsage));
    }

    // Determine Data Adequacy / Confidence
    const hasSufficientData = logs.length >= 1 && totalQuantityShipped > 0;

    // Determine Risk Level
    let calculatedRiskLevel = 'LOW';

    if (!hasSufficientData && currentStock > reorderLevel) {
      calculatedRiskLevel = 'INSUFFICIENT_DATA';
    } else if (currentStock === 0 || (averageDailyUsage > 0 && estimatedDaysRemaining <= 3)) {
      calculatedRiskLevel = 'CRITICAL';
    } else if (currentStock <= reorderLevel || (averageDailyUsage > 0 && estimatedDaysRemaining <= 7)) {
      calculatedRiskLevel = 'HIGH';
    } else if (averageDailyUsage > 0 && estimatedDaysRemaining <= 14) {
      calculatedRiskLevel = 'MEDIUM';
    } else {
      calculatedRiskLevel = 'LOW';
    }

    // Determine Suggested Reorder Quantity
    // Target buffer is double the reorder level or 30 days of average consumption
    const targetBuffer = Math.max(reorderLevel * 2, Math.ceil(averageDailyUsage * 30));
    let suggestedReorderQuantity = 0;

    if (currentStock <= reorderLevel || (estimatedDaysRemaining !== null && estimatedDaysRemaining <= 14)) {
      suggestedReorderQuantity = Math.max(0, targetBuffer - currentStock);
    }

    predictions.push({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      unit: product.unit,
      categoryName: product.category?.name || 'Uncategorized',
      currentStock,
      reorderLevel,
      totalHistoricalShipped: totalQuantityShipped,
      averageDailyUsage,
      recent7DaysShipped,
      recentDailyUsage,
      estimatedDaysRemaining, // null if no consumption data
      suggestedReorderQuantity,
      riskLevel: calculatedRiskLevel,
      hasSufficientData,
      confidence: hasSufficientData ? 'HIGH' : 'LOW (INSUFFICIENT HISTORICAL LOGS)',
      isAiEstimate: true
    });
  }

  // Filter by risk level if requested
  let filteredPredictions = predictions;
  if (riskLevel && riskLevel !== 'ALL') {
    filteredPredictions = predictions.filter((p) => p.riskLevel === riskLevel);
  }

  // Generate aggregate statistics
  const summary = {
    totalProducts: predictions.length,
    criticalRiskCount: predictions.filter((p) => p.riskLevel === 'CRITICAL').length,
    highRiskCount: predictions.filter((p) => p.riskLevel === 'HIGH').length,
    mediumRiskCount: predictions.filter((p) => p.riskLevel === 'MEDIUM').length,
    lowRiskCount: predictions.filter((p) => p.riskLevel === 'LOW').length,
    insufficientDataCount: predictions.filter((p) => p.riskLevel === 'INSUFFICIENT_DATA').length,
    totalSuggestedReorderQty: predictions.reduce((sum, p) => sum + p.suggestedReorderQuantity, 0)
  };

  return {
    success: true,
    disclaimer: 'AI Estimated based on historical StockLedger delivery logs. Actual demand may vary.',
    summary,
    data: filteredPredictions
  };
};
