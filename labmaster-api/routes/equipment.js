const express = require('express');
const router = express.Router();
const pool = require('../db');

// 获取设备列表
router.get('/', async (req, res) => {
  try {
    const { status, lab_id, search } = req.query;
    let sql = `SELECT e.*, l.name as lab_name FROM equipment e LEFT JOIN labs l ON e.lab_id = l.id WHERE 1=1`;
    const params = [];
    if (status) { sql += ' AND e.status = ?'; params.push(status); }
    if (lab_id) { sql += ' AND e.lab_id = ?'; params.push(lab_id); }
    if (search) { sql += ' AND (e.name LIKE ? OR e.eq_code LIKE ? OR e.model LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    sql += ' ORDER BY e.created_at DESC';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
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
