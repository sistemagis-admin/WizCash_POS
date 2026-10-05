import { Router } from 'express';
import { getWallets, createWallet } from '../controllers/wallet.controller.js';

const router = Router();

router.get('/', getWallets);
router.post('/', createWallet);

export default router;
