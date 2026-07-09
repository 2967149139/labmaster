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
    if (status) { const vals = Array.isArray(status) ? status : status.split(',').filter(v => v); if (vals.length === 1) { whereSQL += ' AND s.status = ?'; params.push(vals[0]); } else if (vals.length > 1) { whereSQL += ` AND s.status IN (${vals.map(() => '?').join(',')})`; params.push(...vals); } }
    if (search) { whereSQL += ' AND (s.name LIKE ? OR s.sample_code LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    const [countRows] = await pool.query(`SELECT COUNT(*) as total FROM samples s LEFT JOIN labs l ON s.lab_id = l.id LEFT JOIN experiments e ON s.experiment_id = e.id${whereSQL}`, params);
    const total = countRows[0].total;
    const dataSQL = `SELECT s.*, l.name as lab_name, e.title as experiment_title 
      FROM samples s LEFT JOIN labs l ON s.lab_id = l.id 
      LEFT JOIN experiments e ON s.experiment_id = e.id${whereSQL} ORDER BY s.created_at DESC LIMIT ?, ?`;
    const [rows] = await pool.query(dataSQL, [...params, (pageNum - 1) * pageSizeNum, pageSizeNum]);
    res.json({ data: rows, total, page: pageNum, pageSize: pageSizeNum, totalPages: Math.ceil(total / pageSizeNum) });
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
