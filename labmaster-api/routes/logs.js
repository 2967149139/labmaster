const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const { module, user_id, limit } = req.query;
    let sql = `SELECT ol.*, u.real_name FROM operation_logs ol LEFT JOIN users u ON ol.user_id = u.id WHERE 1=1`;
    const params = [];
    if (module) { sql += ' AND ol.module = ?'; params.push(module); }
    if (user_id) { sql += ' AND ol.user_id = ?'; params.push(user_id); }
    sql += ' ORDER BY ol.created_at DESC LIMIT ?';
    params.push(parseInt(limit) || 200);
    const [rows] = await pool.query(sql, params);
    res.json(rows);
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
