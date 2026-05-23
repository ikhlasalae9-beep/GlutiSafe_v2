# GlutiSafe

GlutiSafe is a React, Node, and Python app for extracting visible ingredient text and checking it for possible gluten risk.

## Architecture

- `client/`: React + Vite frontend on `http://localhost:5173`
- `server/`: Node/Express analysis backend on `http://localhost:5000`
- `ocr-service/`: Python FastAPI EasyOCR service on `http://localhost:8000`

Image flow:

1. React sends an uploaded image or camera photo to `POST http://localhost:8000/ocr/extract`.
2. The OCR service extracts text with EasyOCR.
3. React displays the editable extracted text.
4. React sends final text to `POST http://localhost:5000/api/full-analysis`.
5. Node runs the local gluten rule engine.
6. Node uses backend-only AI services for explanations and chatbot responses, or returns clean fallback/error responses when AI is unavailable.

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
GITHUB_MODELS_TOKEN=your_token_here
GITHUB_TOKEN=your_token_here
GITHUB_MODELS_BASE_URL=https://models.github.ai/inference
GITHUB_MODELS_MODEL=openai/gpt-4o
```

Manual input and rule-based analysis work even if AI services are unavailable. The chatbot uses GitHub Models GPT-4o through the backend endpoint `POST /api/chatbot/message`.

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

- `GET http://localhost:5000/api/health`
- `POST http://localhost:5000/api/analyze`
- `POST http://localhost:5000/api/explain`
- `POST http://localhost:5000/api/full-analysis`
- `POST http://localhost:5000/api/chatbot/message`
- `GET http://localhost:8000/health`
- `GET http://localhost:8000/ocr/status`
- `POST http://localhost:8000/ocr/extract`

## Safety

- GlutiSafe does not provide medical diagnosis.
- GlutiSafe does not certify that a product is gluten-free.
- OCR can make mistakes, especially with blurry or cropped photos.
- Users should always verify the official label and manufacturer information.
