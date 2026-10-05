import { Request, Response, NextFunction } from 'express';
import { query } from '../config/db.js';

export const getWallets = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      `SELECT id, name, type, balance::float, currency, created_at, updated_at 
       FROM wallets 
       ORDER BY id ASC`
    );
    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount,
    });
  } catch (error) {
    next(error);
  }
};

export const createWallet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, type = 'cash', balance = 0, currency = 'IDR', userId = 1 } = req.body;

    if (!name) {
      res.status(400).json({ success: false, message: 'Wallet name is required' });
      return;
    }

    const result = await query(
      `INSERT INTO wallets (user_id, name, type, balance, currency)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, type, balance::float, currency, created_at`,
      [userId, name, type, balance, currency]
    );

    res.status(201).json({
      success: true,
      message: 'Wallet created successfully',
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};
