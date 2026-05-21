import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import analyzeRouter from './routes/analyze.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '.env') });

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'glutisafe-api' });
});

app.use('/api', analyzeRouter);

app.listen(port, () => {
  console.log(`GlutiSafe API running on http://localhost:${port}`);
});
