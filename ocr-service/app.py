import os
import tempfile
from pathlib import Path

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image

from lib.ocr_router import OCRRouter

SERVICE_NAME = "glutisafe-ocr"


def load_local_env() -> None:
    env_path = Path(__file__).resolve().parent / ".env"
    if not env_path.exists():
        return

    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip("'\"")
        if key:
            os.environ.setdefault(key, value)


load_local_env()

TEMP_DIR = Path(os.getenv("OCR_TEMP_DIR", "./tmp"))
TEMP_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="GlutiSafe OCR Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in os.getenv("OCR_CORS_ORIGINS", "http://localhost:5173").split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ocr_router: OCRRouter | None = None
startup_error: str | None = None


def ocr_status_payload() -> dict:
    if ocr_router is not None:
        return ocr_router.status()

    return {
        "service": SERVICE_NAME,
        "engine": "EasyOCR",
        "langs": [lang.strip() for lang in os.getenv("OCR_LANGS", "fr,en").split(",") if lang.strip()],
        "gpu": os.getenv("OCR_GPU", "false").strip().lower() in {"1", "true", "yes", "on"},
        "ready": False,
        "message": startup_error or "OCR service is not ready.",
    }


@app.on_event("startup")
def load_engine() -> None:
    global ocr_router, startup_error
    try:
        ocr_router = OCRRouter()
        startup_error = None
    except Exception as exc:
        ocr_router = None
        startup_error = str(exc)
        print(f"[GlutiSafe OCR] Startup error: {startup_error}")


@app.get("/health")
def health():
    status = ocr_status_payload()
    payload = {"status": "ok", "service": SERVICE_NAME}
    if startup_error or not status["ready"]:
        payload["status"] = "degraded"
        payload["error"] = startup_error or status["message"]
    return payload


@app.get("/ocr/status")
def ocr_status():
    return ocr_status_payload()


@app.post("/ocr/extract")
async def extract_ocr(image: UploadFile = File(...)):
    temp_path: Path | None = None

    try:
        status = ocr_status_payload()
        if not status["ready"]:
            return {
                "success": False,
                "text": "",
                "engine": status["engine"],
                "error": status["message"],
            }

        suffix = Path(image.filename or "upload.png").suffix or ".png"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix, dir=TEMP_DIR) as temp_file:
            content = await image.read()
            temp_file.write(content)
            temp_path = Path(temp_file.name)

        with Image.open(temp_path) as img:
            img.verify()

        if ocr_router is None:
            raise RuntimeError(startup_error or "OCR service is not loaded.")

        return ocr_router.extract_text(str(temp_path))

    except Exception as exc:
        status = ocr_status_payload()
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "text": "",
                "engine": status["engine"],
                "error": str(exc),
            },
        )
    finally:
        if temp_path and temp_path.exists():
            temp_path.unlink(missing_ok=True)
