const m = require('mysql2/promise');
(async () => {
  const p = await m.createPool({ host: 'localhost', user: 'root', password: 'root', database: 'test_ai' });
  await p.query("UPDATE users SET password='admin' WHERE username='admin'");
  const [r] = await p.query('SELECT username, password, real_name FROM users');
  console.log(JSON.stringify(r, null, 2));
  await p.end();
  console.log('Password updated successfully');
})();
