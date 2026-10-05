import { Request, Response, NextFunction } from 'express';
import { query, pool } from '../config/db.js';

// GET /api/transactions?outlet_id=1&wallet_id=2&type=income
export const getTransactions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { outlet_id, wallet_id, type, limit = 50, offset = 0 } = req.query;

    let sql = `
      SELECT 
        t.id,
        t.outlet_id,
        t.amount::float,
        t.type,
        t.description,
        t.reference_no,
        t.transaction_date,
        t.created_at,
        w.id as wallet_id,
        w.name as wallet_name,
        w.type as wallet_type,
        c.id as category_id,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color,
        u.id as user_id,
        u.username as cashier_username,
        u.full_name as cashier_name,
        o.name as outlet_name,
        o.code as outlet_code
      FROM transactions t
      LEFT JOIN wallets w ON t.wallet_id = w.id
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN outlets o ON t.outlet_id = o.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (outlet_id) {
      params.push(outlet_id);
      sql += ` AND t.outlet_id = $${params.length}`;
    }

    if (wallet_id) {
      params.push(wallet_id);
      sql += ` AND t.wallet_id = $${params.length}`;
    }

    if (type) {
      params.push(type);
      sql += ` AND t.type = $${params.length}`;
    }

    sql += ` ORDER BY t.transaction_date DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(Number(limit), Number(offset));

    const result = await query(sql, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/transactions
export const createTransaction = async (req: Request, res: Response, next: NextFunction) => {
  const client = await pool.connect();
  try {
    const {
      outlet_id,
      user_id,
      wallet_id,
      category_id,
      type,
      amount,
      description,
      reference_no,
      transaction_date,
    } = req.body;

    if (!wallet_id || !type || !amount) {
      res.status(400).json({
        success: false,
        message: 'wallet_id, type (income/expense/transfer), dan amount wajib diisi',
      });
      return;
    }

    // Verify wallet and get its outlet_id if not provided
    const walletCheck = await client.query('SELECT id, outlet_id, balance FROM wallets WHERE id = $1', [
      wallet_id,
    ]);

    if (walletCheck.rows.length === 0) {
      res.status(404).json({ success: false, message: `Dompet dengan ID ${wallet_id} tidak ditemukan` });
      return;
    }

    const resolvedOutletId = outlet_id || walletCheck.rows[0].outlet_id;

    await client.query('BEGIN');

    // 1. Insert transaction
    const txResult = await client.query(
      `INSERT INTO transactions (outlet_id, user_id, wallet_id, category_id, type, amount, description, reference_no, transaction_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, COALESCE($9, CURRENT_TIMESTAMP))
       RETURNING *`,
      [
        resolvedOutletId,
        user_id || null,
        wallet_id,
        category_id || null,
        type,
        amount,
        description || null,
        reference_no || `TRX-${Date.now().toString().slice(-6)}`,
        transaction_date || null,
      ]
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
      message: 'Transaksi berhasil dicatat dan saldo dompet diperbarui',
      data: txResult.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

// GET /api/transactions/summary?outlet_id=1
export const getTransactionSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { outlet_id } = req.query;

    let sql = `
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)::float as total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)::float as total_expense,
        (COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) - 
         COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0))::float as net_balance,
        COUNT(id)::int as total_transactions
      FROM transactions
    `;

    const params: any[] = [];
    if (outlet_id) {
      sql += ' WHERE outlet_id = $1';
      params.push(outlet_id);
    }

    const result = await query(sql, params);

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};
