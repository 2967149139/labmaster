const express = require('express');
const router = express.Router();
const pool = require('../db');

// 获取设备列表
router.get('/', async (req, res) => {
  try {
    const { status, lab_id, search, page, pageSize } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const pageSizeNum = Math.max(1, Math.min(100, parseInt(pageSize) || 10));
    let whereSQL = ' WHERE 1=1';
    const params = [];
    if (status) { const vals = Array.isArray(status) ? status : status.split(',').filter(v => v); if (vals.length === 1) { whereSQL += ' AND e.status = ?'; params.push(vals[0]); } else if (vals.length > 1) { whereSQL += ` AND e.status IN (${vals.map(() => '?').join(',')})`; params.push(...vals); } }
    if (lab_id) { whereSQL += ' AND e.lab_id = ?'; params.push(lab_id); }
    if (search) { whereSQL += ' AND (e.name LIKE ? OR e.eq_code LIKE ? OR e.model LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    const [countRows] = await pool.query(`SELECT COUNT(*) as total FROM equipment e LEFT JOIN labs l ON e.lab_id = l.id${whereSQL}`, params);
    const total = countRows[0].total;
    const dataSQL = `SELECT e.*, l.name as lab_name FROM equipment e LEFT JOIN labs l ON e.lab_id = l.id${whereSQL} ORDER BY e.created_at DESC LIMIT ?, ?`;
    const [rows] = await pool.query(dataSQL, [...params, (pageNum - 1) * pageSizeNum, pageSizeNum]);
    res.json({ data: rows, total, page: pageNum, pageSize: pageSizeNum, totalPages: Math.ceil(total / pageSizeNum) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 获取单个设备
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT e.*, l.name as lab_name FROM equipment e LEFT JOIN labs l ON e.lab_id = l.id WHERE e.id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: '设备不存在' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 创建设备
router.post('/', async (req, res) => {
  try {
    const { eq_code, name, model, category, lab_id, status, purchase_date, price, supplier, description } = req.body;
    const [result] = await pool.query(
      'INSERT INTO equipment (eq_code, name, model, category, lab_id, status, purchase_date, price, supplier, description) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [eq_code, name, model, category, lab_id, status || 'available', purchase_date, price, supplier, description]
    );
    await pool.query('INSERT INTO operation_logs (user_id, action, module, target_id, detail) VALUES (?,?,?,?,?)',
      [1, '添加设备', 'equipment', result.insertId, `添加设备: ${name}`]);
    res.json({ success: true, id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 更新设备
router.put('/:id', async (req, res) => {
  try {
    const { eq_code, name, model, category, lab_id, status, purchase_date, price, supplier, description } = req.body;
    await pool.query(
      'UPDATE equipment SET eq_code=?, name=?, model=?, category=?, lab_id=?, status=?, purchase_date=?, price=?, supplier=?, description=? WHERE id=?',
      [eq_code, name, model, category, lab_id, status, purchase_date, price, supplier, description, req.params.id]
    );
    await pool.query('INSERT INTO operation_logs (user_id, action, module, target_id, detail) VALUES (?,?,?,?,?)',
      [1, '更新设备', 'equipment', req.params.id, `更新设备: ${name}`]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 删除设备
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM equipment WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 更新设备状态
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    await pool.query('UPDATE equipment SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
