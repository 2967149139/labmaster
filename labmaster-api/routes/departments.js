const express = require('express');
const router = express.Router();
const pool = require('../db');

// 获取所有部门
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM departments ORDER BY id ASC');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 添加部门
router.post('/', async (req, res) => {
  try {
    if (req.body.current_user_role !== 'admin') {
      return res.status(403).json({ error: '仅管理员可管理部门' });
    }
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: '请输入部门名称' });
    const [result] = await pool.query(
      'INSERT INTO departments (name, description) VALUES (?, ?)',
      [name, description || '']
    );
    res.json({ success: true, id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: '部门名称已存在' });
    }
    res.status(500).json({ error: err.message });
  }
});

// 更新部门
router.put('/:id', async (req, res) => {
  try {
    if (req.body.current_user_role !== 'admin') {
      return res.status(403).json({ error: '仅管理员可管理部门' });
    }
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: '请输入部门名称' });
    await pool.query(
      'UPDATE departments SET name = ?, description = ? WHERE id = ?',
      [name, description || '', req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: '部门名称已存在' });
    }
    res.status(500).json({ error: err.message });
  }
});

// 删除部门
router.delete('/:id', async (req, res) => {
  try {
    if (req.query.current_user_role !== 'admin') {
      return res.status(403).json({ error: '仅管理员可管理部门' });
    }
    await pool.query('DELETE FROM departments WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
