import express from 'express';
import { getReportData, exportReportCSV } from '../controllers/reportController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/:reportType', protect, getReportData);
router.get('/:reportType/export', protect, exportReportCSV);

export default router;
