import { Router } from 'express';
import { login, register, getProfile, getUsers } from '../controllers/auth.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();

// Public routes
router.post('/login', login);
router.post('/register', register);

// Protected routes
router.get('/me', authenticateToken, getProfile);
router.get('/users', getUsers);

export default router;
