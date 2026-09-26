import express from 'express';
import {
  getDeliveries,
  getDeliveryById,
  createDelivery,
  updateDelivery,
  validateDelivery,
  cancelDelivery
} from '../controllers/deliveryController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getDeliveries);
router.get('/:id', protect, getDeliveryById);
router.post('/', protect, authorizeRoles('ADMIN', 'INVENTORY_MANAGER', 'WAREHOUSE_STAFF'), createDelivery);
router.put('/:id', protect, authorizeRoles('ADMIN', 'INVENTORY_MANAGER', 'WAREHOUSE_STAFF'), updateDelivery);
router.post('/:id/validate', protect, authorizeRoles('ADMIN', 'INVENTORY_MANAGER', 'WAREHOUSE_STAFF'), validateDelivery);
router.post('/:id/cancel', protect, authorizeRoles('ADMIN', 'INVENTORY_MANAGER', 'WAREHOUSE_STAFF'), cancelDelivery);

export default router;
