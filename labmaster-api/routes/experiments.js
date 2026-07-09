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
    if (status) { const vals = Array.isArray(status) ? status : status.split(',').filter(v => v); if (vals.length === 1) { whereSQL += ' AND e.status = ?'; params.push(vals[0]); } else if (vals.length > 1) { whereSQL += ` AND e.status IN (${vals.map(() => '?').join(',')})`; params.push(...vals); } }
    if (search) { whereSQL += ' AND (e.title LIKE ? OR e.exp_code LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    const [countRows] = await pool.query(`SELECT COUNT(*) as total FROM experiments e LEFT JOIN labs l ON e.lab_id = l.id LEFT JOIN users u ON e.leader_id = u.id${whereSQL}`, params);
    const total = countRows[0].total;
    const dataSQL = `SELECT e.*, l.name as lab_name, u.real_name as leader_name 
      FROM experiments e LEFT JOIN labs l ON e.lab_id = l.id 
      LEFT JOIN users u ON e.leader_id = u.id${whereSQL} ORDER BY e.created_at DESC LIMIT ?, ?`;
    const [rows] = await pool.query(dataSQL, [...params, (pageNum - 1) * pageSizeNum, pageSizeNum]);
    res.json({ data: rows, total, page: pageNum, pageSize: pageSizeNum, totalPages: Math.ceil(total / pageSizeNum) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT e.*, l.name as lab_name, u.real_name as leader_name 
       FROM experiments e LEFT JOIN labs l ON e.lab_id = l.id 
       LEFT JOIN users u ON e.leader_id = u.id WHERE e.id = ?`, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: '实验不存在' });
    const [equip] = await pool.query(
      `SELECT eq.* FROM equipment eq 
       JOIN experiment_equipment ee ON eq.id = ee.equipment_id 
       WHERE ee.experiment_id = ?`, [req.params.id]);
    res.json({ ...rows[0], equipment: equip });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { exp_code, title, description, category, lab_id, leader_id, status, start_date, end_date, equipment_ids } = req.body;
    const [result] = await pool.query(
      'INSERT INTO experiments (exp_code, title, description, category, lab_id, leader_id, status, start_date, end_date) VALUES (?,?,?,?,?,?,?,?,?)',
      [exp_code, title, description, category, lab_id, leader_id, status || 'draft', start_date, end_date]
    );
    if (equipment_ids && equipment_ids.length) {
      for (const eqId of equipment_ids) {
        await pool.query('INSERT INTO experiment_equipment (experiment_id, equipment_id) VALUES (?,?)', [result.insertId, eqId]);
      }
    }
    await pool.query('INSERT INTO operation_logs (user_id, action, module, target_id, detail) VALUES (?,?,?,?,?)',
      [1, '创建实验', 'experiments', result.insertId, `创建实验: ${title}`]);
    res.json({ success: true, id: result.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { exp_code, title, description, category, lab_id, leader_id, status, start_date, end_date, result, equipment_ids } = req.body;
    await pool.query(
      'UPDATE experiments SET exp_code=?, title=?, description=?, category=?, lab_id=?, leader_id=?, status=?, start_date=?, end_date=?, result=? WHERE id=?',
      [exp_code, title, description, category, lab_id, leader_id, status, start_date, end_date, result, req.params.id]
    );
    if (equipment_ids) {
      await pool.query('DELETE FROM experiment_equipment WHERE experiment_id = ?', [req.params.id]);
      for (const eqId of equipment_ids) {
        await pool.query('INSERT INTO experiment_equipment (experiment_id, equipment_id) VALUES (?,?)', [req.params.id, eqId]);
      }
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM experiments WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
