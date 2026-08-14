import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcryptjs';

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_z3bRlo7DCyIh@ep-falling-sunset-ayc5j97z-pooler.c-5.us-east-2.aws.neon.tech/esplive?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const email = 'asargeant8484@gmail.com';
  const password = 'Aaden8899$';

  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      await pool.query('UPDATE users SET password_hash = $1, subscription_status = $2 WHERE email = $3', [hash, 'pro', email]);
      console.log('Admin user updated with new password and PRO subscription!');
    } else {
      await pool.query('INSERT INTO users (email, password_hash, subscription_status, conversion_count) VALUES ($1, $2, $3, $4)', [email, hash, 'pro', 0]);
      console.log('Admin user created with PRO subscription!');
    }
  } catch (err) {
    console.error('Failed to create admin user:', err);
  } finally {
    await pool.end();
  }
}

run();
