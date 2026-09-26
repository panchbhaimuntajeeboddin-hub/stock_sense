import express from 'express';
import {
  getDashboardOverview,
  getSummary,
  getCharts,
  getSections
} from '../controllers/dashboardController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getDashboardOverview);
router.get('/summary', protect, getSummary);
router.get('/charts', protect, getCharts);
router.get('/sections', protect, getSections);

export default router;
