import express from 'express';
import {
  getProducts,
  getOperations,
  getMoveHistory,
  getStock
} from '../controllers/inventoryController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/stock', protect, getStock);
router.get('/products', protect, getProducts);
router.get('/operations', protect, getOperations);
router.get('/move-history', protect, getMoveHistory);

// Role authorization testing endpoints
router.get('/admin-only', protect, authorizeRoles('ADMIN'), (req, res) => {
  res.status(200).json({ success: true, message: 'Access granted: Admin restricted endpoint', user: req.user });
});

router.get('/manager-only', protect, authorizeRoles('ADMIN', 'INVENTORY_MANAGER'), (req, res) => {
  res.status(200).json({ success: true, message: 'Access granted: Manager restricted endpoint', user: req.user });
});

export default router;
