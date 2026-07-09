const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT l.*, u.real_name as manager_name FROM labs l LEFT JOIN users u ON l.manager_id = u.id ORDER BY l.created_at DESC`);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT l.*, u.real_name as manager_name FROM labs l LEFT JOIN users u ON l.manager_id = u.id WHERE l.id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: '实验室不存在' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { name, location, manager_id, area, description } = req.body;
    const [result] = await pool.query(
      'INSERT INTO labs (name, location, manager_id, area, description) VALUES (?,?,?,?,?)',
      [name, location, manager_id, area, description]
    );
    res.json({ success: true, id: result.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, location, manager_id, area, description, status } = req.body;
    await pool.query(
      'UPDATE labs SET name=?, location=?, manager_id=?, area=?, description=?, status=? WHERE id=?',
      [name, location, manager_id, area, description, status, req.params.id]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM labs WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
