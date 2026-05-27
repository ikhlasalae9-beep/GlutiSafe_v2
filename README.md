# GlutiSafe

GlutiSafe is a React, Node, and Python app for extracting visible ingredient text and checking it for possible gluten risk.

## Architecture

- `client/`: React + Vite frontend on `http://localhost:5173`
- `server/`: Node/Express analysis backend on `http://localhost:5000` for local development
- `client/api/index.js`: single consolidated Vercel serverless API function for production deployment
- `ocr-service/`: Python FastAPI EasyOCR service on `http://localhost:8000`

Image flow:

1. React sends an uploaded image or camera photo to `POST /api/analyze` in production.
2. The Vercel API function extracts text with OCR.space. The optional local Python service can still be used separately for EasyOCR development.
3. React displays the editable extracted text.
4. React sends final text to `POST /api/full-analysis` in production, or `POST http://localhost:5000/api/full-analysis` locally.
5. The backend API runs the local gluten rule engine.
6. The backend API uses backend-only AI services for explanations and chatbot responses, or returns clean fallback/error responses when AI is unavailable.

The verdict always comes from the rule engine. AI is never used for OCR, and AI provider keys are never exposed to the frontend.

## Frontend Setup

```bash
cd client
npm install
npm run dev
```

Create `client/.env` from `client/.env.example`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
VITE_API_URL=http://localhost:5000
VITE_OCR_API_URL=http://localhost:8000
```

## Backend Setup

```bash
cd server
npm install
npm run dev
```

Create `server/.env` from `server/.env.example`:

```env
PORT=5000
CLIENT_URL=http://localhost:5173
PRODUCTION_CLIENT_URL=https://your-vercel-domain.vercel.app
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_publishable_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_server_side_service_role_key
GITHUB_MODELS_TOKEN=your_github_models_token
GITHUB_TOKEN=your_github_token_fallback
GITHUB_MODELS_BASE_URL=https://models.github.ai/inference
GITHUB_MODELS_MODEL=openai/gpt-4o
AI_PROVIDER=OpenAI
AI_MODEL=gpt-4o
OCR_SPACE_API_KEY=your_ocr_space_key
OCR_SPACE_API_URL=https://api.ocr.space/parse/image
```

Manual input and rule-based analysis work even if AI services are unavailable. Explanations and chatbot responses use GPT-4o through OpenAI / GitHub Models via backend-only API routes when `GITHUB_MODELS_TOKEN` or `GITHUB_TOKEN` is configured.

## Supabase Setup

1. Create a Supabase project.
2. Open the Supabase SQL editor.
3. Run `supabase/schema.sql`.
4. Create the first user account from the GlutiSafe signup page.
5. Promote that first account manually:

```sql
update public.profiles
set role = 'admin'
where email = 'YOUR_EMAIL';
```

The schema creates:

- `profiles` for user/admin role and pack state.
- `analyses` for saved scan results.
- `subscriptions` for pack activations.
- `payments` for future payment proof workflows.

Row Level Security is enabled on all tables. Users can only read their own rows; admins can read platform data; protected pack actions use serverless routes with `SUPABASE_SERVICE_ROLE_KEY`.

For product names and private image previews in history, run `supabase/admin_extra_schema.sql`. It adds optional analysis columns and creates the private `analysis-images` bucket policies.

```sql
alter table public.analyses
add column if not exists product_name text,
add column if not exists image_path text;
```

Create a private Supabase Storage bucket named `analysis-images`. The app uploads product photos there and stores only the storage path in `public.analyses.image_path`.

For packs and future payments, run `supabase/packs_payments_schema.sql` on existing Supabase projects. It ensures every profile defaults to the Free Pack and adds payment fields for PayPal, CMI, and manual requests:

```sql
provider: paypal | cmi | manual
provider_payment_id
pack_type: monthly | yearly
amount
currency
status: created | pending | captured | confirmed | failed | rejected
raw_payload
```

New profiles are created with `role='user'`, `pack_status='free'`, `pack_type='none'`, and no pack dates. Existing null or empty pack values are normalized to Free Pack by the migration.

If you only need the profile pack defaults on an existing database, run `supabase/packs_update.sql`. Pack rules enforced by the app:

- Free: 5 scans per month and last 3 history items.
- Monthly: 100 scans per month for 30 days.
- Yearly: 1500 scans per year for 365 days.
- Blocked users cannot run analyses.
- PayPal and CMI are placeholders until real gateway credentials and webhooks are added.

In Supabase Dashboard -> Authentication -> URL Configuration:

- Site URL: `https://gluti-safe-v2.vercel.app`
- Redirect URLs:
  - `https://gluti-safe-v2.vercel.app/**`
  - `http://localhost:5173/**`

## Vercel Deployment

Deploy the `client/` directory on Vercel. The production API is consolidated into `client/api/index.js`, so the frontend can call same-origin paths such as `/api/chatbot/message` when `VITE_API_URL` is empty.

Important for Vercel Hobby: the `client/api` directory must contain only `index.js`. Every additional file inside `client/api` can become another Serverless Function and may exceed the Hobby plan limit. Shared API logic must live outside `client/api`, currently in `client/src/server/`.

In Vercel Project Settings, add these environment variables:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_server_side_service_role_key
GITHUB_MODELS_TOKEN=your_github_models_token
GITHUB_TOKEN=your_github_token_fallback
GITHUB_MODELS_BASE_URL=https://models.github.ai/inference
GITHUB_MODELS_MODEL=openai/gpt-4o
AI_PROVIDER=OpenAI
AI_MODEL=gpt-4o
OCR_SPACE_API_KEY=your_ocr_space_key
OCR_SPACE_API_URL=https://api.ocr.space/parse/image
```

Never add `SUPABASE_SERVICE_ROLE_KEY`, GitHub/OpenAI model tokens, or OCR keys as `VITE_*` variables. `VITE_*` values are exposed to the browser bundle. Never commit real `.env` files.

For local frontend development with the Express backend, keep:

```env
VITE_API_URL=http://localhost:5000
```

For Vercel production, leave `VITE_API_URL` empty or unset so requests use the same deployed domain. OCR image extraction in production uses OCR.space from the Vercel API function, so `OCR_SPACE_API_KEY` must stay server-side and must not use a `VITE_` prefix.

## GitHub and Vercel Checklist

Local:

```bash
npm install
cd client && npm install && npm run dev
cd ../server && npm install && npm run dev
npm run build
```

Production:

- Vercel build passes.
- Vercel creates one Serverless Function from `client/api/index.js`.
- Signup creates an auth user and a `profiles` row.
- Login works with Supabase Auth.
- Admin dashboard shows the real profile count and analysis count.
- New scans are inserted into `analyses`.
- Free Pack is shown for new users and users with empty pack values.
- `/packs` creates manual pending payment/subscription requests without activating paid packs.
- Pack activation updates `profiles` and inserts `subscriptions`.
- No `.env` file is committed.
- `SUPABASE_SERVICE_ROLE_KEY` is not present in the frontend bundle.

## OCR Service Setup

```bash
cd ocr-service
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

Create `ocr-service/.env` from `ocr-service/.env.example`:

```env
OCR_LANGS=fr,en,es
OCR_GPU=false
OCR_MODEL_DIR=./models
OCR_TEMP_DIR=./tmp
OCR_CORS_ORIGINS=http://localhost:5173
```

For Chinese OCR, EasyOCR requires simplified Chinese to be paired only with English:

```env
OCR_LANGS=ch_sim,en
```

## API Endpoints

- `GET /api/health`
- `POST /api/analyze`
- `POST /api/explain`
- `POST /api/full-analysis`
- `POST /api/chatbot/message`
- `GET /api/admin/stats`
- `POST /api/admin/users/:id/activate-pack`
- `POST /api/admin/users/:id/expire-pack`
- `POST /api/admin/users/:id/block`
- `POST /api/admin/users/:id/make-admin`
- `POST /api/admin/delete-user`
- `POST /api/admin/payments/:id/confirm`
- `POST /api/admin/payments/:id/reject`
- `POST /api/paypal/create-order` placeholder for future PayPal integration
- `POST /api/paypal/capture-order` placeholder for future PayPal integration
- `POST /api/paypal/webhook` placeholder for future PayPal integration
- `GET http://localhost:8000/health` for the optional local EasyOCR service
- `GET http://localhost:8000/ocr/status` for the optional local EasyOCR service
- `POST http://localhost:8000/ocr/extract` for the optional local EasyOCR service

## Safety

- GlutiSafe does not provide medical diagnosis.
- GlutiSafe does not certify that a product is gluten-free.
- OCR can make mistakes, especially with blurry or cropped photos.
- Users should always verify the official label and manufacturer information.
