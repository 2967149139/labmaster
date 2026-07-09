const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const { status, user_id, equipment_id, page, pageSize } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const pageSizeNum = Math.max(1, Math.min(100, parseInt(pageSize) || 10));
    let whereSQL = ' WHERE 1=1';
    const params = [];
    if (status) { const vals = Array.isArray(status) ? status : status.split(',').filter(v => v); if (vals.length === 1) { whereSQL += ' AND r.status = ?'; params.push(vals[0]); } else if (vals.length > 1) { whereSQL += ` AND r.status IN (${vals.map(() => '?').join(',')})`; params.push(...vals); } }
    if (user_id) { whereSQL += ' AND r.user_id = ?'; params.push(user_id); }
    if (equipment_id) { whereSQL += ' AND r.equipment_id = ?'; params.push(equipment_id); }
    const [countRows] = await pool.query(`SELECT COUNT(*) as total FROM reservations r LEFT JOIN users u ON r.user_id = u.id LEFT JOIN equipment e ON r.equipment_id = e.id${whereSQL}`, params);
    const total = countRows[0].total;
    const dataSQL = `SELECT r.*, u.real_name as user_name, e.name as equipment_name, e.eq_code as equipment_code
      FROM reservations r LEFT JOIN users u ON r.user_id = u.id 
      LEFT JOIN equipment e ON r.equipment_id = e.id${whereSQL} ORDER BY r.created_at DESC LIMIT ?, ?`;
    const [rows] = await pool.query(dataSQL, [...params, (pageNum - 1) * pageSizeNum, pageSizeNum]);
    res.json({ data: rows, total, page: pageNum, pageSize: pageSizeNum, totalPages: Math.ceil(total / pageSizeNum) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { user_id, equipment_id, experiment_id, title, start_time, end_time, purpose } = req.body;
    const [result] = await pool.query(
      'INSERT INTO reservations (user_id, equipment_id, experiment_id, title, start_time, end_time, purpose) VALUES (?,?,?,?,?,?,?)',
      [user_id, equipment_id, experiment_id || null, title, start_time, end_time, purpose]
    );
    res.json({ success: true, id: result.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { user_id, equipment_id, experiment_id, title, start_time, end_time, status, purpose } = req.body;
    await pool.query(
      'UPDATE reservations SET user_id=?, equipment_id=?, experiment_id=?, title=?, start_time=?, end_time=?, status=?, purpose=? WHERE id=?',
      [user_id, equipment_id, experiment_id, title, start_time, end_time, status, purpose, req.params.id]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    await pool.query('UPDATE reservations SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM reservations WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
