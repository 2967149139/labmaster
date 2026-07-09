const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const { status, search, page, pageSize } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const pageSizeNum = Math.max(1, Math.min(100, parseInt(pageSize) || 10));
    let whereSQL = ' WHERE 1=1';
    const params = [];
    if (status) { const vals = Array.isArray(status) ? status : status.split(',').filter(v => v); if (vals.length === 1) { whereSQL += ' AND i.status = ?'; params.push(vals[0]); } else if (vals.length > 1) { whereSQL += ` AND i.status IN (${vals.map(() => '?').join(',')})`; params.push(...vals); } }
    if (search) { whereSQL += ' AND (i.name LIKE ? OR i.item_code LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    const [countRows] = await pool.query(`SELECT COUNT(*) as total FROM inventory i LEFT JOIN labs l ON i.lab_id = l.id${whereSQL}`, params);
    const total = countRows[0].total;
    const dataSQL = `SELECT i.*, l.name as lab_name FROM inventory i LEFT JOIN labs l ON i.lab_id = l.id${whereSQL} ORDER BY i.created_at DESC LIMIT ?, ?`;
    const [rows] = await pool.query(dataSQL, [...params, (pageNum - 1) * pageSizeNum, pageSizeNum]);
    res.json({ data: rows, total, page: pageNum, pageSize: pageSizeNum, totalPages: Math.ceil(total / pageSizeNum) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT i.*, l.name as lab_name FROM inventory i LEFT JOIN labs l ON i.lab_id = l.id WHERE i.id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: '物品不存在' });
    const [records] = await pool.query(
      'SELECT ir.*, u.real_name as operator_name FROM inventory_records ir LEFT JOIN users u ON ir.operator_id = u.id WHERE ir.inventory_id = ? ORDER BY ir.created_at DESC', [req.params.id]);
    res.json({ ...rows[0], records });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { item_code, name, category, quantity, unit, min_stock, storage_location, supplier, price, lab_id, description } = req.body;
    const [result] = await pool.query(
      'INSERT INTO inventory (item_code, name, category, quantity, unit, min_stock, storage_location, supplier, price, lab_id, description) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      [item_code, name, category, quantity || 0, unit, min_stock || 10, storage_location, supplier, price, lab_id, description]
    );
    res.json({ success: true, id: result.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { item_code, name, category, quantity, unit, min_stock, storage_location, supplier, price, lab_id, description } = req.body;
    await pool.query(
      'UPDATE inventory SET item_code=?, name=?, category=?, quantity=?, unit=?, min_stock=?, storage_location=?, supplier=?, price=?, lab_id=?, description=? WHERE id=?',
      [item_code, name, category, quantity, unit, min_stock, storage_location, supplier, price, lab_id, description, req.params.id]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM inventory WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 出入库记录
router.post('/:id/record', async (req, res) => {
  try {
    const { type, quantity, operator_id, remark } = req.body;
    const [inv] = await pool.query('SELECT quantity FROM inventory WHERE id = ?', [req.params.id]);
    if (inv.length === 0) return res.status(404).json({ error: '物品不存在' });
    const newQty = type === 'in' ? inv[0].quantity + quantity : inv[0].quantity - quantity;
    if (newQty < 0) return res.status(400).json({ error: '库存不足' });
    await pool.query('UPDATE inventory SET quantity = ? WHERE id = ?', [newQty, req.params.id]);
    await pool.query('INSERT INTO inventory_records (inventory_id, type, quantity, operator_id, remark) VALUES (?,?,?,?,?)',
      [req.params.id, type, quantity, operator_id, remark]);
    res.json({ success: true, new_quantity: newQty });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
