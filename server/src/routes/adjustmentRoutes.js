import express from 'express';
import {
  getAdjustments,
  getAdjustmentById,
  createAdjustment,
  validateAdjustment
} from '../controllers/adjustmentController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getAdjustments);
router.get('/:id', protect, getAdjustmentById);
router.post('/', protect, authorizeRoles('ADMIN', 'INVENTORY_MANAGER', 'WAREHOUSE_STAFF'), createAdjustment);
router.post('/:id/validate', protect, authorizeRoles('ADMIN', 'INVENTORY_MANAGER', 'WAREHOUSE_STAFF'), validateAdjustment);

export default router;
