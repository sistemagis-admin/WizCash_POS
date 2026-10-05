import { Router } from 'express';
import {
  getTransactions,
  createTransaction,
  getTransactionSummary,
} from '../controllers/transaction.controller.js';

const router = Router();

router.get('/', getTransactions);
router.post('/', createTransaction);
router.get('/summary', getTransactionSummary);

export default router;
