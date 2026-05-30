import dotenv from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '.env') });

console.log('[env] GitHub Models config', {
  githubModelsToken: Boolean(process.env.GITHUB_MODELS_TOKEN),
  githubToken: Boolean(process.env.GITHUB_TOKEN),
  baseUrl: process.env.GITHUB_MODELS_BASE_URL,
  model: process.env.GITHUB_MODELS_MODEL,
});

const [{ default: cors }, { default: express }, { default: analyzeRouter }, { default: chatbotRouter }, { default: adminRouter }, { default: loginSecurityRouter }] = await Promise.all([
  import('cors'),
  import('express'),
  import('./routes/analyze.js'),
  import('./routes/chatbot.js'),
  import('./routes/admin.js'),
  import('./routes/loginSecurity.js'),
]);

const app = express();
const port = process.env.PORT || 5000;
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  process.env.PRODUCTION_CLIENT_URL || 'https://your-vercel-domain.vercel.app',
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS origin not allowed: ${origin}`));
    },
  }),
);
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'glutisafe-api' });
});

app.use('/api', analyzeRouter);
app.use('/api', chatbotRouter);
app.use('/api', adminRouter);
app.use('/api', loginSecurityRouter);

app.listen(port, () => {
  console.log(`GlutiSafe API running on http://localhost:${port}`);
});
