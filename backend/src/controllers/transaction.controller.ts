import { Request, Response, NextFunction } from 'express';
import { query, pool } from '../config/db.js';

export const getTransactions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      `SELECT 
        t.id,
        t.amount::float,
        t.type,
        t.description,
        t.transaction_date,
        t.created_at,
        w.id as wallet_id,
        w.name as wallet_name,
        c.id as category_id,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color
       FROM transactions t
       LEFT JOIN wallets w ON t.wallet_id = w.id
       LEFT JOIN categories c ON t.category_id = c.id
       ORDER BY t.transaction_date DESC`
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

export const createTransaction = async (req: Request, res: Response, next: NextFunction) => {
  const client = await pool.connect();
  try {
    const { wallet_id, category_id, type, amount, description, transaction_date } = req.body;

    if (!wallet_id || !type || !amount) {
      res.status(400).json({
        success: false,
        message: 'wallet_id, type (income/expense), and amount are required',
      });
      return;
    }

    await client.query('BEGIN');

    // 1. Insert transaction
    const txResult = await client.query(
      `INSERT INTO transactions (wallet_id, category_id, type, amount, description, transaction_date)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6, CURRENT_TIMESTAMP))
       RETURNING *`,
      [wallet_id, category_id || null, type, amount, description || null, transaction_date || null]
    );

    // 2. Update wallet balance
    const balanceAdjustment = type === 'income' ? amount : -amount;
    await client.query(
      `UPDATE wallets 
       SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2`,
      [balanceAdjustment, wallet_id]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Transaction created and wallet updated successfully',
      data: txResult.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

export const getTransactionSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      `SELECT 
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)::float as total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)::float as total_expense,
        (COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) - 
         COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0))::float as net_balance
       FROM transactions`
    );

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};
