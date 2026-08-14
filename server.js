import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import pkg from 'pg';
const { Pool } = pkg;
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { formatAllCoordinates, parseLocationInput, dlsToDd, utmToDd } from './src/utils/coordinateConverter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const PORT = parseInt(process.env.PORT, 10) || 8080;
const JWT_SECRET = process.env.JWT_SECRET || 'sarggeo_super_secret_jwt_key_2026';
const NEON_DB_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_z3bRlo7DCyIh@ep-falling-sunset-ayc5j97z-pooler.c-5.us-east-2.aws.neon.tech/esplive?sslmode=require';

// Initialize PostgreSQL Connection Pool
const pool = new Pool({
  connectionString: NEON_DB_URL,
  ssl: { rejectUnauthorized: false }
});

// Auto-initialize DB Schema
async function initDb() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        subscription_status VARCHAR(50) DEFAULT 'free',
        conversion_count INT DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS project_waypoints (
        id SERIAL PRIMARY KEY,
        project_id INT REFERENCES projects(id) ON DELETE CASCADE,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        notes TEXT,
        lat DOUBLE PRECISION NOT NULL,
        lng DOUBLE PRECISION NOT NULL,
        dls VARCHAR(100),
        color VARCHAR(50),
        category VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS guest_conversions (
        session_id VARCHAR(255) PRIMARY KEY,
        conversion_count INT DEFAULT 0,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS api_keys (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        key_prefix VARCHAR(20) NOT NULL,
        key_hash VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(100) NOT NULL,
        status VARCHAR(50) DEFAULT 'active',
        expires_at TIMESTAMP WITH TIME ZONE,
        last_used_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Neon PostgreSQL Database connected and tables verified.');
  } catch (err) {
    console.error('Failed to initialize PostgreSQL database:', err.message);
  }
}
initDb();

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return next();

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (!err) req.user = user;
    next();
  });
};
app.use(authenticateToken);

// Developer API Key Authentication Middleware (with automatic expiration logic)
const authenticateApiKey = async (req, res, next) => {
  let apiKeyRaw = req.headers['x-api-key'];

  if (!apiKeyRaw && req.headers['authorization']) {
    const parts = req.headers['authorization'].split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer' && parts[1].startsWith('sg_live_')) {
      apiKeyRaw = parts[1];
    }
  }

  if (!apiKeyRaw) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Missing API Key. Pass x-api-key header or Authorization: Bearer sg_live_...'
    });
  }

  try {
    const keyHash = crypto.createHash('sha256').update(apiKeyRaw.trim()).digest('hex');

    const result = await pool.query(
      `SELECT k.id, k.status, k.expires_at, k.name, u.id AS user_id, u.email, u.subscription_status
       FROM api_keys k
       JOIN users u ON k.user_id = u.id
       WHERE k.key_hash = $1`,
      [keyHash]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'INVALID_KEY', message: 'Invalid API Key.' });
    }

    const key = result.rows[0];

    if (key.status !== 'active') {
      return res.status(401).json({ error: 'REVOKED_KEY', message: 'This API Key has been revoked.' });
    }

    // EXPIRATION CHECK: Check if key expired or user subscription ended
    const now = new Date();
    const isSubscriptionActive = key.subscription_status === 'pro';
    const isKeyExpired = key.expires_at && new Date(key.expires_at) < now;

    if (!isSubscriptionActive || isKeyExpired) {
      return res.status(401).json({
        error: 'SUBSCRIPTION_EXPIRED',
        message: 'API Key expired. Subscription/service has ended. Upgrade to Pro ($15/mo) to reactivate API keys.',
        expiredAt: key.expires_at || now.toISOString(),
        subscriptionStatus: key.subscription_status
      });
    }

    // Asynchronously log last used timestamp
    pool.query('UPDATE api_keys SET last_used_at = CURRENT_TIMESTAMP WHERE id = $1', [key.id]).catch(() => {});

    req.apiKey = key;
    next();
  } catch (err) {
    console.error('API key auth error:', err);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to authenticate API Key.' });
  }
};

// Container Health Probe
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', port: PORT, timestamp: new Date().toISOString() });
});

// Runtime Config
app.get('/api/config', (req, res) => {
  res.status(200).json({
    apiUrl: process.env.NEXT_PUBLIC_API_URL || process.env.VITE_API_URL || '',
    maxFreeConversions: 3
  });
});

// AUTH ENDPOINTS
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password || password.length < 4) {
    return res.status(400).json({ error: 'Valid email and password (min 4 chars) required.' });
  }

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await pool.query(
      'INSERT INTO users (email, password_hash, subscription_status, conversion_count) VALUES ($1, $2, \'free\', 0) RETURNING id, email, subscription_status, conversion_count',
      [email.toLowerCase().trim(), passwordHash]
    );

    const user = newUser.rows[0];
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        subscriptionStatus: user.subscription_status,
        conversionCount: user.conversion_count
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Failed to register account.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        subscriptionStatus: user.subscription_status,
        conversionCount: user.conversion_count
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Failed to log in.' });
  }
});

app.get('/api/auth/me', async (req, res) => {
  if (!req.user) {
    return res.json({ authenticated: false, user: null });
  }

  try {
    const result = await pool.query('SELECT id, email, subscription_status, conversion_count FROM users WHERE id = $1', [req.user.userId]);
    if (result.rows.length === 0) return res.json({ authenticated: false, user: null });

    const user = result.rows[0];
    res.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        subscriptionStatus: user.subscription_status,
        conversionCount: user.conversion_count
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// CONVERSION TRACKING API
app.post('/api/conversion/track', async (req, res) => {
  const { sessionId, countDelta = 1 } = req.body;

  try {
    if (req.user) {
      const uRes = await pool.query('SELECT id, subscription_status, conversion_count FROM users WHERE id = $1', [req.user.userId]);
      if (uRes.rows.length === 0) return res.status(404).json({ error: 'User not found' });
      const user = uRes.rows[0];

      if (user.subscription_status === 'pro') {
        return res.json({ allowed: true, subscriptionStatus: 'pro', conversionCount: user.conversion_count });
      }

      if (user.conversion_count >= 3) {
        return res.status(402).json({
          allowed: false,
          error: 'LIMIT_REACHED',
          message: 'Free trial limit reached (3 conversions). Upgrade to Pro ($15/mo) for unlimited access.',
          conversionCount: user.conversion_count,
          subscriptionStatus: 'free'
        });
      }

      const updated = await pool.query(
        'UPDATE users SET conversion_count = conversion_count + $1 WHERE id = $2 RETURNING conversion_count',
        [countDelta, user.id]
      );

      const newCount = updated.rows[0].conversion_count;
      return res.json({
        allowed: true,
        subscriptionStatus: 'free',
        conversionCount: newCount,
        remainingFree: Math.max(0, 3 - newCount)
      });
    }

    const sessId = sessionId || 'guest_' + req.ip;
    const gRes = await pool.query('SELECT conversion_count FROM guest_conversions WHERE session_id = $1', [sessId]);
    let currentCount = gRes.rows.length > 0 ? gRes.rows[0].conversion_count : 0;

    if (currentCount >= 3) {
      return res.status(402).json({
        allowed: false,
        error: 'LIMIT_REACHED',
        message: 'Free trial limit reached (3 conversions). Upgrade to Pro ($15/mo) for unlimited access.',
        conversionCount: currentCount,
        subscriptionStatus: 'guest'
      });
    }

    currentCount += countDelta;
    await pool.query(
      `INSERT INTO guest_conversions (session_id, conversion_count, updated_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (session_id) DO UPDATE SET conversion_count = $2, updated_at = CURRENT_TIMESTAMP`,
      [sessId, currentCount]
    );

    return res.json({
      allowed: true,
      subscriptionStatus: 'guest',
      conversionCount: currentCount,
      remainingFree: Math.max(0, 3 - currentCount)
    });
  } catch (err) {
    console.error('Conversion tracking error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// SUBSCRIBE TO $15/MONTH PRO TIER API
app.post('/api/subscribe/pro', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Please sign in or create an account to upgrade to Pro.' });
  }

  try {
    const updated = await pool.query(
      'UPDATE users SET subscription_status = \'pro\' WHERE id = $1 RETURNING id, email, subscription_status, conversion_count',
      [req.user.userId]
    );

    // Reactivate any expired API keys
    const futureExpiry = new Date();
    futureExpiry.setDate(futureExpiry.getDate() + 30);
    await pool.query(
      'UPDATE api_keys SET status = \'active\', expires_at = $1 WHERE user_id = $2',
      [futureExpiry.toISOString(), req.user.userId]
    );

    const user = updated.rows[0];
    res.json({
      success: true,
      message: 'Account upgraded to $15/month Pro tier! Unlimited conversions, API keys, & cloud projects unlocked.',
      user: {
        id: user.id,
        email: user.email,
        subscriptionStatus: user.subscription_status,
        conversionCount: user.conversion_count
      }
    });
  } catch (err) {
    console.error('Subscription error:', err);
    res.status(500).json({ error: 'Failed to update subscription.' });
  }
});

// API KEYS MANAGEMENT API (JWT Authenticated)
app.get('/api/keys', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required.' });

  try {
    const result = await pool.query(
      `SELECT id, key_prefix, name, status, expires_at, last_used_at, created_at
       FROM api_keys
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.userId]
    );
    res.json({ keys: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch API keys.' });
  }
});

app.post('/api/keys/generate', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required.' });

  try {
    const userId = req.user.userId || req.user.id;
    const uRes = await pool.query('SELECT subscription_status FROM users WHERE id = $1', [userId]);
    if (uRes.rows.length === 0 || uRes.rows[0].subscription_status !== 'pro') {
      return res.status(403).json({
        error: 'PRO_REQUIRED',
        message: 'Developer API Keys require an active Pro Subscription ($15/mo).'
      });
    }

    const { name = 'Production API Key' } = req.body;
    const rawToken = crypto.randomBytes(24).toString('hex');
    const rawKey = `sg_live_${rawToken}`;
    const keyPrefix = `${rawKey.substring(0, 15)}...`;
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    // Key expires 30 days from creation (auto-renewed with Pro subscription)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const newKey = await pool.query(
      `INSERT INTO api_keys (user_id, key_prefix, key_hash, name, status, expires_at)
       VALUES ($1, $2, $3, $4, 'active', $5)
       RETURNING id, key_prefix, name, status, expires_at, created_at`,
      [userId, keyPrefix, keyHash, (name || 'Production API Key').trim(), expiresAt.toISOString()]
    );

    res.status(201).json({
      success: true,
      apiKey: rawKey, // Raw key returned ONCE upon creation
      key: newKey.rows[0]
    });
  } catch (err) {
    console.error('API key generation error:', err);
    res.status(500).json({ error: 'Failed to generate API Key: ' + err.message });
  }
});

app.delete('/api/keys/:id', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
  const keyId = parseInt(req.params.id, 10);

  try {
    await pool.query('DELETE FROM api_keys WHERE id = $1 AND user_id = $2', [keyId, req.user.userId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to revoke API key.' });
  }
});

// PUBLIC REST API GATEWAY V1 (Authenticated via x-api-key)
app.get('/api/v1/convert', authenticateApiKey, (req, res) => {
  const { input, lat, lng } = req.query;

  let resultLat = parseFloat(lat);
  let resultLng = parseFloat(lng);
  let rawInputStr = input || `${lat}, ${lng}`;

  if (input) {
    const dlsParsed = dlsToDd(input);
    if (dlsParsed && dlsParsed.isValid) {
      resultLat = dlsParsed.lat;
      resultLng = dlsParsed.lng;
    } else {
      const utmParsed = utmToDd(input);
      if (utmParsed) {
        resultLat = utmParsed.lat;
        resultLng = utmParsed.lng;
      } else {
        const parsed = parseLocationInput(input);
        if (parsed && parsed.lat != null && parsed.lng != null) {
          resultLat = parsed.lat;
          resultLng = parsed.lng;
        }
      }
    }
  }

  if (isNaN(resultLat) || isNaN(resultLng)) {
    return res.status(400).json({
      error: 'INVALID_INPUT',
      message: 'Invalid coordinate or DLS string provided in query parameters (?input=... or ?lat=...&lng=...).'
    });
  }

  const coords = formatAllCoordinates(resultLat, resultLng);

  res.json({
    success: true,
    input: rawInputStr,
    coordinates: {
      lat: resultLat,
      lng: resultLng,
      dd: coords.dd,
      dms: coords.dms,
      dls: coords.dls,
      utm: coords.utm,
      mgrs: coords.mgrs,
      nts: coords.nts,
      geohash: coords.geohash
    }
  });
});

app.post('/api/v1/convert/batch', authenticateApiKey, (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'INVALID_BATCH', message: 'Request body must contain "items" array.' });
  }

  const results = items.map((itemStr) => {
    let resultLat = null;
    let resultLng = null;

    const dlsParsed = dlsToDd(itemStr);
    if (dlsParsed && dlsParsed.isValid) {
      resultLat = dlsParsed.lat;
      resultLng = dlsParsed.lng;
    } else {
      const utmParsed = utmToDd(itemStr);
      if (utmParsed) {
        resultLat = utmParsed.lat;
        resultLng = utmParsed.lng;
      } else {
        const parsed = parseLocationInput(itemStr);
        if (parsed && parsed.lat != null && parsed.lng != null) {
          resultLat = parsed.lat;
          resultLng = parsed.lng;
        }
      }
    }

    if (resultLat == null || resultLng == null) {
      return { input: itemStr, isValid: false, error: 'Unrecognized spatial format' };
    }

    const coords = formatAllCoordinates(resultLat, resultLng);
    return {
      input: itemStr,
      isValid: true,
      lat: resultLat,
      lng: resultLng,
      dls: coords.dls,
      utm: coords.utm,
      mgrs: coords.mgrs,
      dd: coords.dd,
      dms: coords.dms
    };
  });

  res.json({
    success: true,
    total: results.length,
    validCount: results.filter((r) => r.isValid).length,
    results
  });
});

// HOSTED PROJECTS API
app.get('/api/projects', async (req, res) => {
  if (!req.user) return res.json({ projects: [] });

  try {
    const result = await pool.query(
      `SELECT p.id, p.name, p.description, p.created_at, p.updated_at,
              COUNT(w.id)::int AS waypoint_count
       FROM projects p
       LEFT JOIN project_waypoints w ON p.id = w.project_id
       WHERE p.user_id = $1
       GROUP BY p.id
       ORDER BY p.updated_at DESC`,
      [req.user.userId]
    );
    res.json({ projects: result.rows });
  } catch (err) {
    console.error('Fetch projects error:', err);
    res.status(500).json({ error: 'Failed to fetch projects.' });
  }
});

app.post('/api/projects', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
  const { name, description } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Project name is required.' });

  try {
    const result = await pool.query(
      'INSERT INTO projects (user_id, name, description) VALUES ($1, $2, $3) RETURNING *',
      [req.user.userId, name.trim(), description || '']
    );
    res.status(201).json({ project: result.rows[0] });
  } catch (err) {
    console.error('Create project error:', err);
    res.status(500).json({ error: 'Failed to create project.' });
  }
});

app.delete('/api/projects/:id', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
  const projectId = parseInt(req.params.id, 10);

  try {
    await pool.query('DELETE FROM projects WHERE id = $1 AND user_id = $2', [projectId, req.user.userId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete project.' });
  }
});

// PROJECT WAYPOINTS API
app.get('/api/projects/:id/waypoints', async (req, res) => {
  const projectId = parseInt(req.params.id, 10);

  try {
    const result = await pool.query(
      'SELECT id, title, notes, lat, lng, dls, color, category, created_at FROM project_waypoints WHERE project_id = $1 ORDER BY created_at DESC',
      [projectId]
    );
    res.json({ waypoints: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch waypoints.' });
  }
});

app.post('/api/projects/:id/waypoints', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
  const projectId = parseInt(req.params.id, 10);
  const { title, notes, lat, lng, dls, color, category } = req.body;

  if (lat == null || lng == null) return res.status(400).json({ error: 'Coordinates required.' });

  try {
    const result = await pool.query(
      `INSERT INTO project_waypoints (project_id, user_id, title, notes, lat, lng, dls, color, category)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [projectId, req.user.userId, title || 'Waypoint', notes || '', lat, lng, dls || '', color || '#38bdf8', category || 'Waypoint']
    );
    await pool.query('UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = $1', [projectId]);
    res.status(201).json({ waypoint: result.rows[0] });
  } catch (err) {
    console.error('Save waypoint error:', err);
    res.status(500).json({ error: 'Failed to save waypoint to database.' });
  }
});

// Serve static build assets
app.use((req, res, next) => {
  if (req.url.endsWith('.js') || req.url.endsWith('.css') || req.url.endsWith('.png') || req.url.endsWith('.svg')) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
  next();
});

app.use(express.static(path.join(__dirname, 'dist')));

app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'NOT_FOUND', message: `API endpoint ${req.method} ${req.path} not found.` });
  }
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`SargGeo Monetized Production Server listening on http://0.0.0.0:${PORT}`);
});
