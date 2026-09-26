import express from 'express';
import {
  getTransfers,
  getTransferById,
  createTransfer,
  updateTransfer,
  validateTransfer,
  cancelTransfer
} from '../controllers/transferController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getTransfers);
router.get('/:id', protect, getTransferById);
router.post('/', protect, authorizeRoles('ADMIN', 'INVENTORY_MANAGER', 'WAREHOUSE_STAFF'), createTransfer);
router.put('/:id', protect, authorizeRoles('ADMIN', 'INVENTORY_MANAGER', 'WAREHOUSE_STAFF'), updateTransfer);
router.post('/:id/validate', protect, authorizeRoles('ADMIN', 'INVENTORY_MANAGER', 'WAREHOUSE_STAFF'), validateTransfer);
router.post('/:id/cancel', protect, authorizeRoles('ADMIN', 'INVENTORY_MANAGER', 'WAREHOUSE_STAFF'), cancelTransfer);

export default router;
