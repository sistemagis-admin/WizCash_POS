import { Request, Response, NextFunction } from 'express';
import { query } from '../config/db.js';

// GET /api/wallets?outlet_id=1
export const getWallets = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { outlet_id } = req.query;
    let sql = `
      SELECT 
        w.id, 
        w.outlet_id, 
        w.name, 
        w.type, 
        w.balance::float, 
        w.account_number, 
        w.created_at, 
        w.updated_at,
        o.name as outlet_name,
        o.code as outlet_code
      FROM wallets w
      LEFT JOIN outlets o ON o.id = w.outlet_id
    `;
    const params: any[] = [];

    if (outlet_id) {
      sql += ' WHERE w.outlet_id = $1';
      params.push(outlet_id);
    }

    sql += ' ORDER BY w.id ASC';

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

// POST /api/wallets
export const createWallet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { outlet_id = 1, name, type = 'cash', balance = 0, account_number } = req.body;

    if (!name) {
      res.status(400).json({ success: false, message: 'Nama dompet wajib diisi' });
      return;
    }

    const result = await query(
      `INSERT INTO wallets (outlet_id, name, type, balance, account_number)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, outlet_id, name, type, balance::float, account_number, created_at`,
      [outlet_id, name, type, balance, account_number || null]
    );

    res.status(201).json({
      success: true,
      message: 'Dompet kas berhasil dibuat',
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/wallets/:id
export const updateWallet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, type, balance, account_number } = req.body;

    const check = await query('SELECT * FROM wallets WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      res.status(404).json({ success: false, message: `Dompet dengan ID ${id} tidak ditemukan` });
      return;
    }

    const current = check.rows[0];
    const result = await query(
      `UPDATE wallets 
       SET name = $1, 
           type = $2, 
           balance = $3, 
           account_number = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING id, outlet_id, name, type, balance::float, account_number, updated_at`,
      [
        name || current.name,
        type || current.type,
        balance !== undefined ? balance : current.balance,
        account_number !== undefined ? account_number : current.account_number,
        id,
      ]
    );

    res.json({
      success: true,
      message: 'Dompet berhasil diperbarui',
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/wallets/:id
export const deleteWallet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM wallets WHERE id = $1 RETURNING id, name', [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: `Dompet dengan ID ${id} tidak ditemukan` });
      return;
    }

    res.json({
      success: true,
      message: `Dompet '${result.rows[0].name}' berhasil dihapus`,
    });
  } catch (error) {
    next(error);
  }
};
