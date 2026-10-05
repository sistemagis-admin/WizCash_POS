import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import outletRoutes from './outlet.routes.js';
import walletRoutes from './wallet.routes.js';
import transactionRoutes from './transaction.routes.js';

const apiRouter = Router();

apiRouter.use('/health', healthRoutes);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/outlets', outletRoutes);
apiRouter.use('/wallets', walletRoutes);
apiRouter.use('/transactions', transactionRoutes);

export default apiRouter;
