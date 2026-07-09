const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const { module, user_id, page, pageSize } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const pageSizeNum = Math.max(1, Math.min(100, parseInt(pageSize) || 10));
    let whereSQL = ' WHERE 1=1';
    const params = [];
    if (module) { const vals = Array.isArray(module) ? module : module.split(',').filter(v => v); if (vals.length === 1) { whereSQL += ' AND ol.module = ?'; params.push(vals[0]); } else if (vals.length > 1) { whereSQL += ` AND ol.module IN (${vals.map(() => '?').join(',')})`; params.push(...vals); } }
    if (user_id) { whereSQL += ' AND ol.user_id = ?'; params.push(user_id); }
    const [countRows] = await pool.query(`SELECT COUNT(*) as total FROM operation_logs ol LEFT JOIN users u ON ol.user_id = u.id${whereSQL}`, params);
    const total = countRows[0].total;
    const dataSQL = `SELECT ol.*, u.real_name FROM operation_logs ol LEFT JOIN users u ON ol.user_id = u.id${whereSQL} ORDER BY ol.created_at DESC LIMIT ?, ?`;
    const [rows] = await pool.query(dataSQL, [...params, (pageNum - 1) * pageSizeNum, pageSizeNum]);
    res.json({ data: rows, total, page: pageNum, pageSize: pageSizeNum, totalPages: Math.ceil(total / pageSizeNum) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { user_id, action, module, target_id, detail } = req.body;
    await pool.query(
      'INSERT INTO operation_logs (user_id, action, module, target_id, detail) VALUES (?,?,?,?,?)',
      [user_id, action, module, target_id, detail]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
