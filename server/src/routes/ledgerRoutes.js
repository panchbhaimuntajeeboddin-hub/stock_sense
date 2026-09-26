import express from 'express';
import { getLedgerEntries, getLedgerEntryById } from '../controllers/ledgerController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Read-only stock ledger endpoints
router.get('/', protect, getLedgerEntries);
router.get('/:id', protect, getLedgerEntryById);

export default router;
