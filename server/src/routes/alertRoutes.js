import express from 'express';
import { getLowStockAlerts } from '../controllers/alertController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/low-stock', protect, getLowStockAlerts);

export default router;
