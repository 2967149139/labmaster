const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const { role, search, current_user_id, current_user_role } = req.query;
    let sql = 'SELECT id, username, real_name, role, email, phone, department, avatar, status, created_at FROM users WHERE 1=1';
    const params = [];
    // 非管理员只能看到自己
    if (current_user_role && current_user_role !== 'admin') {
      sql += ' AND id = ?';
      params.push(current_user_id || 0);
    }
    if (role) { sql += ' AND role = ?'; params.push(role); }
    if (search) { sql += ' AND (real_name LIKE ? OR username LIKE ? OR department LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    sql += ' ORDER BY created_at DESC';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, username, real_name, role, email, phone, department, avatar, status, created_at FROM users WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: '用户不存在' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    if (req.body.current_user_role !== 'admin') {
      return res.status(403).json({ error: '仅管理员可添加人员' });
    }
    const { username, password, real_name, role, email, phone, department, avatar } = req.body;
    const [result] = await pool.query(
      'INSERT INTO users (username, password, real_name, role, email, phone, department, avatar) VALUES (?,?,?,?,?,?,?,?)',
      [username, password || '123456', real_name, role || 'researcher', email, phone, department, avatar || '']
    );
    res.json({ success: true, id: result.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { username, real_name, role, email, phone, department, avatar, status, password } = req.body;
    const current_role = req.body.current_user_role;
    // 非管理员不允许修改密码
    if (password && current_role !== 'admin') {
      return res.status(403).json({ error: '仅管理员可修改密码' });
    }
    if (password) {
      await pool.query(
        'UPDATE users SET username=?, real_name=?, role=?, email=?, phone=?, department=?, avatar=?, status=?, password=? WHERE id=?',
        [username, real_name, role, email, phone, department, avatar, status, password, req.params.id]
      );
    } else {
      await pool.query(
        'UPDATE users SET username=?, real_name=?, role=?, email=?, phone=?, department=?, avatar=?, status=? WHERE id=?',
        [username, real_name, role, email, phone, department, avatar, status, req.params.id]
      );
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    if (req.query.current_user_role !== 'admin') {
      return res.status(403).json({ error: '仅管理员可删除人员' });
    }
    await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
