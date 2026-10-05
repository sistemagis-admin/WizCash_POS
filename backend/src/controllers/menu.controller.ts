import { Request, Response, NextFunction } from 'express';
import { query } from '../config/db.js';

// GET /api/menus?outlet_id=1&category_id=1&search=kopi
export const getMenus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { outlet_id, category_id, search, is_available } = req.query;

    let sql = `
      SELECT 
        m.id,
        m.outlet_id,
        m.category_id,
        m.name,
        m.code,
        m.description,
        m.price::float,
        m.cost_price::float,
        m.stock,
        m.image_url,
        m.is_available,
        m.created_at,
        m.updated_at,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color,
        o.name as outlet_name,
        o.code as outlet_code
      FROM menus m
      LEFT JOIN categories c ON c.id = m.category_id
      LEFT JOIN outlets o ON o.id = m.outlet_id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (outlet_id) {
      params.push(outlet_id);
      sql += ` AND (m.outlet_id = $${params.length} OR m.outlet_id IS NULL)`;
    }

    if (category_id) {
      params.push(category_id);
      sql += ` AND m.category_id = $${params.length}`;
    }

    if (is_available !== undefined) {
      params.push(is_available === 'true');
      sql += ` AND m.is_available = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (LOWER(m.name) LIKE LOWER($${params.length}) OR LOWER(m.code) LIKE LOWER($${params.length}))`;
    }

    sql += ' ORDER BY m.id ASC';

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

// GET /api/menus/:id
export const getMenuById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT 
        m.id,
        m.outlet_id,
        m.category_id,
        m.name,
        m.code,
        m.description,
        m.price::float,
        m.cost_price::float,
        m.stock,
        m.image_url,
        m.is_available,
        m.created_at,
        m.updated_at,
        c.name as category_name,
        o.name as outlet_name
      FROM menus m
      LEFT JOIN categories c ON c.id = m.category_id
      LEFT JOIN outlets o ON o.id = m.outlet_id
      WHERE m.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Menu dengan ID ${id} tidak ditemukan`,
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/menus
export const createMenu = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      outlet_id,
      category_id,
      name,
      code,
      description,
      price,
      cost_price = 0,
      stock = 100,
      image_url,
      is_available = true,
    } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Nama menu (name) dan Harga (price) wajib diisi',
      });
    }

    // Auto-generate code if empty
    const generatedCode = code || `MNU-${Date.now().toString().slice(-5)}`;

    // Check code unique
    const checkCode = await query('SELECT id FROM menus WHERE UPPER(code) = UPPER($1)', [
      generatedCode,
    ]);
    if (checkCode.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Kode menu '${generatedCode}' sudah digunakan`,
      });
    }

    const result = await query(
      `INSERT INTO menus (
        outlet_id, 
        category_id, 
        name, 
        code, 
        description, 
        price, 
        cost_price, 
        stock, 
        image_url, 
        is_available
      ) VALUES ($1, $2, $3, UPPER($4), $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        outlet_id || null,
        category_id || null,
        name,
        generatedCode,
        description || null,
        price,
        cost_price,
        stock,
        image_url || null,
        is_available,
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Menu / produk berhasil ditambahkan',
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/menus/:id
export const updateMenu = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const {
      outlet_id,
      category_id,
      name,
      code,
      description,
      price,
      cost_price,
      stock,
      image_url,
      is_available,
    } = req.body;

    const checkMenu = await query('SELECT * FROM menus WHERE id = $1', [id]);
    if (checkMenu.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Menu dengan ID ${id} tidak ditemukan`,
      });
    }

    const current = checkMenu.rows[0];

    if (code && code !== current.code) {
      const checkCode = await query('SELECT id FROM menus WHERE UPPER(code) = UPPER($1) AND id != $2', [
        code,
        id,
      ]);
      if (checkCode.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Kode menu '${code}' sudah digunakan oleh menu lain`,
        });
      }
    }

    const updated = await query(
      `UPDATE menus 
       SET outlet_id = $1,
           category_id = $2,
           name = $3,
           code = UPPER($4),
           description = $5,
           price = $6,
           cost_price = $7,
           stock = $8,
           image_url = $9,
           is_available = $10,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $11
       RETURNING *`,
      [
        outlet_id !== undefined ? outlet_id : current.outlet_id,
        category_id !== undefined ? category_id : current.category_id,
        name || current.name,
        code || current.code,
        description !== undefined ? description : current.description,
        price !== undefined ? price : current.price,
        cost_price !== undefined ? cost_price : current.cost_price,
        stock !== undefined ? stock : current.stock,
        image_url !== undefined ? image_url : current.image_url,
        is_available !== undefined ? is_available : current.is_available,
        id,
      ]
    );

    res.json({
      success: true,
      message: 'Menu berhasil diperbarui',
      data: updated.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/menus/:id
export const deleteMenu = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM menus WHERE id = $1 RETURNING id, name', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Menu dengan ID ${id} tidak ditemukan`,
      });
    }

    res.json({
      success: true,
      message: `Menu '${result.rows[0].name}' berhasil dihapus`,
    });
  } catch (error) {
    next(error);
  }
};
