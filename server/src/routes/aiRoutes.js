import express from 'express';
import { handleInventoryAssistantQuery, getReorderPredictions } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/inventory-assistant', protect, handleInventoryAssistantQuery);
router.get('/reorder-predictions', protect, getReorderPredictions);

export default router;
