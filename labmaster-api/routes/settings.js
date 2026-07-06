const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM system_settings ORDER BY id');
    const settings = {};
    rows.forEach(r => { settings[r.key] = r.value; });
    res.json(settings);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:key', async (req, res) => {
  try {
    const { value } = req.body;
    await pool.query('UPDATE system_settings SET value = ? WHERE `key` = ?', [value, req.params.key]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
