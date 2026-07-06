const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const { status, user_id, equipment_id } = req.query;
    let sql = `SELECT r.*, u.real_name as user_name, e.name as equipment_name, e.eq_code as equipment_code
      FROM reservations r LEFT JOIN users u ON r.user_id = u.id 
      LEFT JOIN equipment e ON r.equipment_id = e.id WHERE 1=1`;
    const params = [];
    if (status) { sql += ' AND r.status = ?'; params.push(status); }
    if (user_id) { sql += ' AND r.user_id = ?'; params.push(user_id); }
    if (equipment_id) { sql += ' AND r.equipment_id = ?'; params.push(equipment_id); }
    sql += ' ORDER BY r.start_time DESC';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
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
