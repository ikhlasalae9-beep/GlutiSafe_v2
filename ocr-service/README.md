# GlutiSafe OCR Service

FastAPI service for extracting ingredient text with EasyOCR.

## Setup

```bash
pip install -r requirements.txt
```

Copy `.env.example` to `.env` or export the variables in your shell:

```env
OCR_LANGS=fr,en,es,ch_sim
OCR_GPU=false
OCR_MODEL_DIR=./models
OCR_TEMP_DIR=./tmp
OCR_CORS_ORIGINS=http://localhost:5173
```

`OCR_GPU=false` is the default local CPU mode.

## Run

```bash
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

## Endpoints

- `GET /health`
- `GET /ocr/status`
- `POST /ocr/extract` with `multipart/form-data`, field name `image`

The OCR service does not use Gemini and does not require `GEMINI_API_KEY`.
