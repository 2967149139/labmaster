const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function exportDB() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'test_ai',
    charset: 'utf8mb4'
  });

  let sql = `-- LabMaster 数据库导出\n-- 导出时间: ${new Date().toISOString()}\n\n`;
  sql += `CREATE DATABASE IF NOT EXISTS test_ai DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\nUSE test_ai;\n\n`;

  // 获取所有表
  const [tables] = await conn.query('SHOW TABLES');
  const tableNames = tables.map(t => Object.values(t)[0]);

  for (const table of tableNames) {
    console.log(`导出表: ${table}`);

    // 导出建表语句
    const [createRows] = await conn.query(`SHOW CREATE TABLE \`${table}\``);
    sql += `DROP TABLE IF EXISTS \`${table}\`;\n`;
    sql += createRows[0]['Create Table'] + ';\n\n';

    // 导出数据
    const [rows] = await conn.query(`SELECT * FROM \`${table}\``);
    if (rows.length > 0) {
      const columns = Object.keys(rows[0]);
      const colNames = columns.map(c => `\`${c}\``).join(', ');

      // 分批 INSERT，每批最多 50 条
      for (let i = 0; i < rows.length; i += 50) {
        const batch = rows.slice(i, i + 50);
        const values = batch.map(row => {
          const vals = columns.map(col => {
            const val = row[col];
            if (val === null || val === undefined) return 'NULL';
            if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
            if (typeof val === 'number') return String(val);
            if (typeof val === 'boolean') return val ? '1' : '0';
            // 字符串：转义引号和反斜杠
            return `'${String(val).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r')}'`;
          });
          return `(${vals.join(', ')})`;
        }).join(',\n  ');
        sql += `INSERT INTO \`${table}\` (${colNames}) VALUES\n  ${values};\n`;
      }
      sql += '\n';
    }
  }

  await conn.end();

  const outputPath = path.join(__dirname, 'labmaster-export.sql');
  fs.writeFileSync(outputPath, sql, 'utf8');
  console.log(`\n导出完成! 文件: ${outputPath}`);
  console.log(`文件大小: ${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB`);
}

exportDB().catch(err => { console.error('导出失败:', err.message); process.exit(1); });
