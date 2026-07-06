const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function initDatabase() {
  // 先连接不指定数据库，创建数据库
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    charset: 'utf8mb4',
    multipleStatements: true
  });

  console.log('Connected to MySQL');

  // 读取并执行 SQL 文件
  const sqlPath = path.join(__dirname, '..', '..', 'labmaster-db', 'init', 'schema.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  await conn.query(sql);
  console.log('Database schema initialized successfully!');

  await conn.end();
}

initDatabase().catch(err => {
  console.error('Database initialization failed:', err.message);
  process.exit(1);
});
