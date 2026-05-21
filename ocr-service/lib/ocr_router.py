import os
import re
from pathlib import Path


ENGINE_NAME = "EasyOCR"


def parse_bool(value: str | None, default: bool = False) -> bool:
    if value is None:
        return default

    return value.strip().lower() in {"1", "true", "yes", "on"}


def parse_langs(value: str | None) -> list[str]:
    langs = [lang.strip() for lang in (value or "fr,en").split(",") if lang.strip()]
    return langs or ["fr", "en"]


class OCRRouter:
    def __init__(self):
        self.langs = parse_langs(os.getenv("OCR_LANGS"))
        self.gpu = parse_bool(os.getenv("OCR_GPU"), default=False)
        self.model_dir = Path(os.getenv("OCR_MODEL_DIR", "./models"))
        self.model_dir.mkdir(parents=True, exist_ok=True)

        self.reader = None
        self.ready = False
        self.message = ""
        self._load_easyocr()

    def _load_easyocr(self) -> None:
        try:
            import easyocr

            self.reader = easyocr.Reader(
                self.langs,
                gpu=self.gpu,
                model_storage_directory=str(self.model_dir),
            )
            self.ready = True
            device = "GPU" if self.gpu else "CPU"
            self.message = f"EasyOCR is ready on {device}."
        except Exception as exc:
            self.reader = None
            self.ready = False
            self.message = str(exc)

    def status(self) -> dict:
        return {
            "service": "glutisafe-ocr",
            "engine": ENGINE_NAME,
            "langs": self.langs,
            "gpu": self.gpu,
            "ready": self.ready,
            "message": self.message,
        }

    def extract_text(self, image_path: str) -> dict:
        if not self.ready or self.reader is None:
            return {
                "success": False,
                "text": "",
                "engine": ENGINE_NAME,
                "error": self.message or "EasyOCR is not ready.",
            }

        lines = self.reader.readtext(image_path, detail=0, paragraph=True)
        text = "\n".join(str(line) for line in lines)

        return {
            "success": True,
            "text": self._clean_text(text),
            "engine": ENGINE_NAME,
        }

    def _clean_text(self, text: str) -> str:
        normalized = re.sub(r"[ \t]+", " ", text or "")
        normalized = re.sub(r"\n{3,}", "\n\n", normalized)
        return "\n".join(line.strip() for line in normalized.splitlines()).strip()
