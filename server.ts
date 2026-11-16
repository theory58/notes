import 'dotenv/config';
import express from 'express';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';

const require = createRequire(import.meta.url);
const hapiVercelHandler = require('./api/index.cjs');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Forward /notes and /api/* directly to the exact Vercel Hapi.js serverless adapter
  // before any body-parsing middleware so stream handling is tested end-to-end.
  app.use((req, res, next) => {
    if (req.path === '/notes' || req.path.startsWith('/notes/') || req.path.startsWith('/api/')) {
      Promise.resolve(hapiVercelHandler(req, res)).catch(next);
      return;
    }
    next();
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Notes API Vercel Studio berjalan pada http://localhost:${PORT}`);
  });
}

startServer();
