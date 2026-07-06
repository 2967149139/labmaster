const express = require('express');
const router = express.Router();
const pool = require('../db');

// 仪表盘统计数据
router.get('/stats', async (req, res) => {
  try {
    const [[{ expCount }]] = await pool.query(
      "SELECT COUNT(*) as expCount FROM experiments WHERE status = 'in_progress'");
    const [[{ eqCount }]] = await pool.query('SELECT COUNT(*) as eqCount FROM equipment');
    const [[{ sampleCount }]] = await pool.query('SELECT COUNT(*) as sampleCount FROM samples');
    const [[{ userCount }]] = await pool.query("SELECT COUNT(*) as userCount FROM users WHERE status = 'active'");
    const [[{ pendingRes }]] = await pool.query(
      "SELECT COUNT(*) as pendingRes FROM reservations WHERE status = 'pending'");

    const [recentLogs] = await pool.query(
      `SELECT ol.*, u.real_name FROM operation_logs ol 
       LEFT JOIN users u ON ol.user_id = u.id 
       ORDER BY ol.created_at DESC LIMIT 10`);

    const [recentReservations] = await pool.query(
      `SELECT r.*, u.real_name as user_name, e.name as equipment_name 
       FROM reservations r 
       LEFT JOIN users u ON r.user_id = u.id 
       LEFT JOIN equipment e ON r.equipment_id = e.id 
       ORDER BY r.created_at DESC LIMIT 5`);

    const [weeklyUsage] = await pool.query(
      `SELECT DAYNAME(created_at) as day, COUNT(*) as cnt 
       FROM operation_logs 
       WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) 
       GROUP BY DAYNAME(created_at)`);

    res.json({
      expCount, eqCount, sampleCount, userCount, pendingRes,
      recentLogs, recentReservations, weeklyUsage
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
