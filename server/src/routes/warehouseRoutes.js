import express from 'express';
import {
  getWarehouses,
  getWarehouseById,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  getLocationsByWarehouse
} from '../controllers/warehouseController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getWarehouses);
router.get('/:id', protect, getWarehouseById);
router.post('/', protect, authorizeRoles('ADMIN', 'INVENTORY_MANAGER', 'WAREHOUSE_STAFF'), createWarehouse);
router.put('/:id', protect, authorizeRoles('ADMIN', 'INVENTORY_MANAGER', 'WAREHOUSE_STAFF'), updateWarehouse);
router.delete('/:id', protect, authorizeRoles('ADMIN', 'INVENTORY_MANAGER', 'WAREHOUSE_STAFF'), deleteWarehouse);
router.get('/:id/locations', protect, getLocationsByWarehouse);

export default router;
