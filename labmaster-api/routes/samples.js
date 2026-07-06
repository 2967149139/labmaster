const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const { status, search } = req.query;
    let sql = `SELECT s.*, l.name as lab_name, e.title as experiment_title 
      FROM samples s LEFT JOIN labs l ON s.lab_id = l.id 
      LEFT JOIN experiments e ON s.experiment_id = e.id WHERE 1=1`;
    const params = [];
    if (status) { sql += ' AND s.status = ?'; params.push(status); }
    if (search) { sql += ' AND (s.name LIKE ? OR s.sample_code LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    sql += ' ORDER BY s.created_at DESC';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.*, l.name as lab_name, e.title as experiment_title 
       FROM samples s LEFT JOIN labs l ON s.lab_id = l.id 
       LEFT JOIN experiments e ON s.experiment_id = e.id WHERE s.id = ?`, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: '样品不存在' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { sample_code, name, category, quantity, unit, storage_location, storage_condition, lab_id, experiment_id, status, received_date, expiry_date, description } = req.body;
    const [result] = await pool.query(
      'INSERT INTO samples (sample_code, name, category, quantity, unit, storage_location, storage_condition, lab_id, experiment_id, status, received_date, expiry_date, description) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [sample_code, name, category, quantity || 1, unit || '份', storage_location, storage_condition, lab_id, experiment_id, status || 'stored', received_date, expiry_date, description]
    );
    res.json({ success: true, id: result.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { sample_code, name, category, quantity, unit, storage_location, storage_condition, lab_id, experiment_id, status, received_date, expiry_date, description } = req.body;
    await pool.query(
      'UPDATE samples SET sample_code=?, name=?, category=?, quantity=?, unit=?, storage_location=?, storage_condition=?, lab_id=?, experiment_id=?, status=?, received_date=?, expiry_date=?, description=? WHERE id=?',
      [sample_code, name, category, quantity, unit, storage_location, storage_condition, lab_id, experiment_id, status, received_date, expiry_date, description, req.params.id]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM samples WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
