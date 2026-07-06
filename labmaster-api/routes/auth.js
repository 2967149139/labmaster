const express = require('express');
const router = express.Router();
const pool = require('../db');

// 登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const [rows] = await pool.query(
      'SELECT id, username, real_name, role, email, phone, department, avatar FROM users WHERE username = ? AND password = ? AND status = "active"',
      [username, password]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }
    const user = rows[0];
    // 记录日志
    await pool.query('INSERT INTO operation_logs (user_id, action, module, detail) VALUES (?, ?, ?, ?)',
      [user.id, '登录系统', 'system', `${user.real_name} 登录系统`]);
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 获取当前用户
router.get('/me', async (req, res) => {
  try {
    const userId = req.query.userId || 1;
    const [rows] = await pool.query(
      'SELECT id, username, real_name, role, email, phone, department, avatar FROM users WHERE id = ?',
      [userId]
    );
    if (rows.length === 0) return res.status(404).json({ error: '用户不存在' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
