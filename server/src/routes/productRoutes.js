import express from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} from '../controllers/productController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getProducts);
router.get('/:id', protect, getProductById);
router.post('/', protect, authorizeRoles('ADMIN', 'INVENTORY_MANAGER', 'WAREHOUSE_STAFF'), createProduct);
router.put('/:id', protect, authorizeRoles('ADMIN', 'INVENTORY_MANAGER', 'WAREHOUSE_STAFF'), updateProduct);
router.delete('/:id', protect, authorizeRoles('ADMIN', 'INVENTORY_MANAGER', 'WAREHOUSE_STAFF'), deleteProduct);

export default router;
