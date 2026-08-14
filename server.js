import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 8080;
const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.VITE_API_URL || process.env.API_URL || '';

// Container Health Check Probe for Cloud Run / Shoal / K8s
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', port: PORT, timestamp: new Date().toISOString() });
});

// Runtime API Config Endpoint for Frontend
app.get('/api/config', (req, res) => {
  res.status(200).json({ apiUrl: API_URL });
});

// Enable cache headers for static assets
app.use((req, res, next) => {
  if (req.url.endsWith('.js') || req.url.endsWith('.css') || req.url.endsWith('.png') || req.url.endsWith('.svg')) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
  next();
});

// Serve static assets from dist folder
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`SargGeo Production Server listening on http://0.0.0.0:${PORT}`);
  if (API_URL) console.log(`Configured Backend API URL: ${API_URL}`);
});

