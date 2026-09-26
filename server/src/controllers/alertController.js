import * as alertService from '../services/alertService.js';

export const getLowStockAlerts = async (req, res, next) => {
  try {
    const { warehouseId, locationId, status } = req.query;
    const result = await alertService.getLowStockAlerts({ warehouseId, locationId, status });
    res.status(200).json({
      success: true,
      count: result.alerts.length,
      summary: result.summary,
      data: result.alerts
    });
  } catch (error) {
    next(error);
  }
};
