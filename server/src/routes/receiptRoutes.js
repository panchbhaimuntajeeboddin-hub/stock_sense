import express from 'express';
import {
  getReceipts,
  getReceiptById,
  createReceipt,
  updateReceipt,
  validateReceipt,
  cancelReceipt
} from '../controllers/receiptController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getReceipts);
router.get('/:id', protect, getReceiptById);
router.post('/', protect, authorizeRoles('ADMIN', 'INVENTORY_MANAGER', 'WAREHOUSE_STAFF'), createReceipt);
router.put('/:id', protect, authorizeRoles('ADMIN', 'INVENTORY_MANAGER', 'WAREHOUSE_STAFF'), updateReceipt);
router.post('/:id/validate', protect, authorizeRoles('ADMIN', 'INVENTORY_MANAGER', 'WAREHOUSE_STAFF'), validateReceipt);
router.post('/:id/cancel', protect, authorizeRoles('ADMIN', 'INVENTORY_MANAGER', 'WAREHOUSE_STAFF'), cancelReceipt);

export default router;
