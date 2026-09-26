import * as dashboardService from '../services/dashboardService.js';

export const getDashboardOverview = async (req, res, next) => {
  try {
    const filters = req.query;

    const [summary, charts, sections] = await Promise.all([
      dashboardService.getDashboardSummary(filters),
      dashboardService.getDashboardCharts(filters),
      dashboardService.getDashboardSections(filters)
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary,
        charts,
        sections
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getSummary = async (req, res, next) => {
  try {
    const summary = await dashboardService.getDashboardSummary(req.query);
    res.status(200).json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
};

export const getCharts = async (req, res, next) => {
  try {
    const charts = await dashboardService.getDashboardCharts(req.query);
    res.status(200).json({ success: true, data: charts });
  } catch (error) {
    next(error);
  }
};

export const getSections = async (req, res, next) => {
  try {
    const sections = await dashboardService.getDashboardSections(req.query);
    res.status(200).json({ success: true, data: sections });
  } catch (error) {
    next(error);
  }
};
