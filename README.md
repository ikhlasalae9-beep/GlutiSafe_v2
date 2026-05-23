# GlutiSafe

GlutiSafe is a React, Node, and Python app for extracting visible ingredient text and checking it for possible gluten risk.

## Architecture

- `client/`: React + Vite frontend on `http://localhost:5173`
- `server/`: Node/Express analysis backend on `http://localhost:5000` for local development
- `client/api/`: Vercel serverless API functions for production deployment
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
VITE_API_URL=http://localhost:5000
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
GITHUB_MODELS_TOKEN=your_token_here
GITHUB_TOKEN=your_token_here
GITHUB_MODELS_BASE_URL=https://models.github.ai/inference
GITHUB_MODELS_MODEL=openai/gpt-4o
```

Manual input and rule-based analysis work even if AI services are unavailable. The chatbot uses GitHub Models GPT-4o through the backend endpoint `POST /api/chatbot/message`.

## Vercel Deployment

Deploy the `client/` directory on Vercel. The production API functions live in `client/api/`, so the frontend can call same-origin paths such as `/api/chatbot/message` when `VITE_API_URL` is empty.

In Vercel Project Settings, add these environment variables without the `VITE_` prefix:

```env
GITHUB_MODELS_TOKEN=your_github_models_token_here
GITHUB_TOKEN=your_github_models_token_here
GITHUB_MODELS_BASE_URL=https://models.github.ai/inference
GITHUB_MODELS_MODEL=openai/gpt-4o
OCR_SPACE_API_KEY=your_ocr_space_api_key_here
OCR_SPACE_API_URL=https://api.ocr.space/parse/image
```

Do not add GitHub tokens as `VITE_*` variables, because `VITE_*` values are exposed to the browser bundle.

For local frontend development with the Express backend, keep:

```env
VITE_API_URL=http://localhost:5000
```

For Vercel production, leave `VITE_API_URL` empty or unset so requests use the same deployed domain. OCR image extraction in production uses OCR.space from the Vercel API function, so `OCR_SPACE_API_KEY` must stay server-side and must not use a `VITE_` prefix.

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
- `GET http://localhost:8000/health` for the optional local EasyOCR service
- `GET http://localhost:8000/ocr/status` for the optional local EasyOCR service
- `POST http://localhost:8000/ocr/extract` for the optional local EasyOCR service

## Safety

- GlutiSafe does not provide medical diagnosis.
- GlutiSafe does not certify that a product is gluten-free.
- OCR can make mistakes, especially with blurry or cropped photos.
- Users should always verify the official label and manufacturer information.
