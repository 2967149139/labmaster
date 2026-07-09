const express = require('express');
const cors = require('cors');
const path = require('path');

const dashboardRoutes = require('./routes/dashboard');
const equipmentRoutes = require('./routes/equipment');
const experimentRoutes = require('./routes/experiments');
const sampleRoutes = require('./routes/samples');
const userRoutes = require('./routes/users');
const reservationRoutes = require('./routes/reservations');
const inventoryRoutes = require('./routes/inventory');
const labRoutes = require('./routes/labs');
const logRoutes = require('./routes/logs');
const settingsRoutes = require('./routes/settings');
const authRoutes = require('./routes/auth');
const departmentRoutes = require('./routes/departments');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors({
  origin: ['https://labmaster-xi.vercel.app', 'http://localhost:5500', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件（前端）
app.use(express.static(path.join(__dirname, '..', 'labmaster-ui')));

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/experiments', experimentRoutes);
app.use('/api/samples', sampleRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/labs', labRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/settings', settingsRoutes);

// 前端回退（SPA支持）
app.get('/{*path}', (req, res) => {
  // 排除 API 路由
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API not found' });
  }
  res.sendFile(path.join(__dirname, '..', 'labmaster-ui', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`LabMaster API 服务器已启动: http://localhost:${PORT}`);
  console.log(`前端页面: http://localhost:${PORT}`);
});

module.exports = app;
