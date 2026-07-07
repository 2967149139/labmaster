const express = require('express');
const router = express.Router();
const pool = require('../db');

// 登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    // 先查用户是否存在及状态
    const [userRows] = await pool.query(
      'SELECT id, username, real_name, role, email, phone, department, avatar, status FROM users WHERE username = ?',
      [username]
    );
    if (userRows.length === 0) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }
    const user = userRows[0];
    // 检查是否被禁用
    if (user.status === 'inactive') {
      return res.status(403).json({ error: '该用户已被禁用，请联系系统管理员' });
    }
    // 验证密码
    const [rows] = await pool.query(
      'SELECT id, username, real_name, role, email, phone, department, avatar FROM users WHERE username = ? AND password = ? AND status = "active"',
      [username, password]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }
    const loginUser = rows[0];
    // 记录日志
    await pool.query('INSERT INTO operation_logs (user_id, action, module, detail) VALUES (?, ?, ?, ?)',
      [loginUser.id, '登录系统', 'system', `${loginUser.real_name} 登录系统`]);
    res.json({ success: true, user: loginUser });
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
