import { Request, Response } from 'express';
import { query } from '../config/db.js';

// GET /api/outlets
export const getOutlets = async (req: Request, res: Response) => {
  try {
    const { is_active } = req.query;
    let sql = `
      SELECT 
        o.id,
        o.name,
        o.code,
        o.address,
        o.phone,
        o.is_active,
        o.created_at,
        COUNT(DISTINCT w.id)::int as total_wallets,
        COALESCE(SUM(w.balance), 0)::numeric as total_balance,
        COUNT(DISTINCT u.id)::int as total_staff
      FROM outlets o
      LEFT JOIN wallets w ON w.outlet_id = o.id
      LEFT JOIN users u ON u.outlet_id = o.id
    `;

    const params: any[] = [];
    if (is_active !== undefined) {
      sql += ' WHERE o.is_active = $1';
      params.push(is_active === 'true');
    }

    sql += ' GROUP BY o.id ORDER BY o.id ASC';

    const result = await query(sql, params);
    return res.json({
      success: true,
      data: result.rows,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data outlet',
      error: error.message,
    });
  }
};

// GET /api/outlets/:id
export const getOutletById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const outletResult = await query('SELECT * FROM outlets WHERE id = $1', [id]);

    if (outletResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Outlet dengan ID ${id} tidak ditemukan`,
      });
    }

    const outlet = outletResult.rows[0];

    // Fetch related wallets
    const walletsResult = await query(
      'SELECT id, name, type, balance, account_number FROM wallets WHERE outlet_id = $1 ORDER BY id ASC',
      [id]
    );

    // Fetch staff
    const staffResult = await query(
      'SELECT id, username, full_name, role, is_active FROM users WHERE outlet_id = $1 ORDER BY id ASC',
      [id]
    );

    return res.json({
      success: true,
      data: {
        ...outlet,
        wallets: walletsResult.rows,
        staff: staffResult.rows,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil detail outlet',
      error: error.message,
    });
  }
};

// POST /api/outlets
export const createOutlet = async (req: Request, res: Response) => {
  try {
    const { name, code, address, phone } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: 'Nama outlet dan Kode outlet wajib diisi',
      });
    }

    // Check code unique
    const checkCode = await query('SELECT id FROM outlets WHERE UPPER(code) = UPPER($1)', [code]);
    if (checkCode.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Kode outlet '${code}' sudah digunakan`,
      });
    }

    const result = await query(
      `INSERT INTO outlets (name, code, address, phone, is_active)
       VALUES ($1, UPPER($2), $3, $4, true)
       RETURNING *`,
      [name, code, address || null, phone || null]
    );

    const newOutlet = result.rows[0];

    // Auto-create default Cash drawer wallet for the new outlet
    await query(
      `INSERT INTO wallets (outlet_id, name, type, balance, account_number)
       VALUES ($1, $2, 'cash', 0.00, $3)`,
      [newOutlet.id, `Kas Laci Kasir (${newOutlet.name})`, `LACI-${newOutlet.code}`]
    );

    return res.status(201).json({
      success: true,
      message: 'Outlet berhasil dibuat beserta dompet kas default',
      data: newOutlet,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Gagal membuat outlet baru',
      error: error.message,
    });
  }
};

// PUT /api/outlets/:id
export const updateOutlet = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, code, address, phone, is_active } = req.body;

    const checkOutlet = await query('SELECT * FROM outlets WHERE id = $1', [id]);
    if (checkOutlet.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Outlet dengan ID ${id} tidak ditemukan`,
      });
    }

    if (code) {
      const checkCode = await query(
        'SELECT id FROM outlets WHERE UPPER(code) = UPPER($1) AND id != $2',
        [code, id]
      );
      if (checkCode.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Kode outlet '${code}' sudah digunakan oleh outlet lain`,
        });
      }
    }

    const current = checkOutlet.rows[0];
    const updated = await query(
      `UPDATE outlets 
       SET name = $1, 
           code = UPPER($2), 
           address = $3, 
           phone = $4, 
           is_active = $5,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [
        name || current.name,
        code || current.code,
        address !== undefined ? address : current.address,
        phone !== undefined ? phone : current.phone,
        is_active !== undefined ? is_active : current.is_active,
        id,
      ]
    );

    return res.json({
      success: true,
      message: 'Data outlet berhasil diperbarui',
      data: updated.rows[0],
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui outlet',
      error: error.message,
    });
  }
};

// DELETE /api/outlets/:id
export const deleteOutlet = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM outlets WHERE id = $1 RETURNING id, name', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Outlet dengan ID ${id} tidak ditemukan`,
      });
    }

    return res.json({
      success: true,
      message: `Outlet '${result.rows[0].name}' berhasil dihapus`,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Gagal menghapus outlet',
      error: error.message,
    });
  }
};
