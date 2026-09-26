import * as reportService from '../services/reportService.js';

export const getReportData = async (req, res, next) => {
  try {
    const { reportType } = req.params;
    const result = await reportService.getReportData(reportType, req.query);
    res.status(200).json({
      success: true,
      count: result.data.length,
      pagination: result.pagination,
      data: result.data
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

export const exportReportCSV = async (req, res, next) => {
  try {
    const { reportType } = req.params;
    const csvContent = await reportService.generateReportCSV(reportType, req.query);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=StockSense_${reportType}_Report.csv`);
    res.status(200).send(csvContent);
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};
