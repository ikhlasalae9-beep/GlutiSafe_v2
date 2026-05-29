import os
import re
from pathlib import Path


ENGINE_NAME = "EasyOCR"
LANGUAGE_GROUPS = {
    "latin": ["fr", "en", "es", "it", "pt", "de", "nl", "ro", "tr", "pl"],
    "arabic": ["ar", "en"],
    "cyrillic": ["ru", "uk", "bg", "en"],
    "asian": ["ch_sim", "ja", "ko", "en"],
    "indic": ["hi", "en"],
}
DEFAULT_GROUP_ORDER = ["latin", "arabic", "cyrillic", "asian", "indic"]
LOW_CONFIDENCE_THRESHOLD = 0.35


def parse_bool(value: str | None, default: bool = False) -> bool:
    if value is None:
        return default

    return value.strip().lower() in {"1", "true", "yes", "on"}


def parse_langs(value: str | None) -> list[str]:
    langs = [lang.strip() for lang in (value or "fr,en").split(",") if lang.strip()]
    if not langs:
        return ["fr", "en"]

    normalized = []
    for lang in langs:
        if lang not in normalized:
            normalized.append(lang)

    if "ch_sim" in normalized:
        # EasyOCR only allows simplified Chinese with English in a single reader.
        return ["ch_sim", "en"]

    return normalized


class OCRRouter:
    def __init__(self):
        self.lang_groups = self._resolve_language_groups()
        self.gpu = parse_bool(os.getenv("OCR_GPU"), default=False)
        self.model_dir = Path(os.getenv("OCR_MODEL_DIR", "./models"))
        self.model_dir.mkdir(parents=True, exist_ok=True)

        self.readers = {}
        self.ready = False
        self.message = ""
        self._load_easyocr()

    def _resolve_language_groups(self) -> dict[str, list[str]]:
        custom_langs = os.getenv("OCR_LANGS")
        if custom_langs:
            return {"custom": parse_langs(custom_langs)}
        return LANGUAGE_GROUPS

    def _load_easyocr(self) -> None:
        try:
            import easyocr

            self.readers["latin"] = easyocr.Reader(
                self.lang_groups["latin"],
                gpu=self.gpu,
                model_storage_directory=str(self.model_dir),
            )
            self.ready = True
            device = "GPU" if self.gpu else "CPU"
            self.message = f"EasyOCR is ready on {device}."
        except Exception as exc:
            self.readers = {}
            self.ready = False
            self.message = str(exc)

    def status(self) -> dict:
        return {
            "service": "glutisafe-ocr",
            "engine": ENGINE_NAME,
            "language_groups": self.lang_groups,
            "gpu": self.gpu,
            "ready": self.ready,
            "message": self.message,
        }

    def extract_text(self, image_path: str) -> dict:
        if not self.ready:
            return {
                "success": False,
                "text": "",
                "engine": ENGINE_NAME,
                "error": self.message or "EasyOCR is not ready.",
            }

        attempts = []
        group_order = ["custom"] if "custom" in self.lang_groups else DEFAULT_GROUP_ORDER

        for group_name in group_order:
            result = self._extract_with_group(image_path, group_name)
            attempts.append({
                "group": group_name,
                "confidence": result["confidence"],
                "text_length": len(result["text"]),
            })

            if result["text"] and result["confidence"] >= LOW_CONFIDENCE_THRESHOLD:
                return {
                    "success": True,
                    "text": self._clean_text(result["text"]),
                    "engine": ENGINE_NAME,
                    "languageGroup": group_name,
                    "languageLabel": "Langue détectée automatiquement",
                    "confidence": result["confidence"],
                    "lowConfidence": False,
                    "attempts": attempts,
                }

            if result["text"] and group_name == group_order[-1]:
                return {
                    "success": True,
                    "text": self._clean_text(result["text"]),
                    "engine": ENGINE_NAME,
                    "languageGroup": group_name,
                    "languageLabel": "Langue détectée automatiquement",
                    "confidence": result["confidence"],
                    "lowConfidence": True,
                    "attempts": attempts,
                }

        return {
            "success": True,
            "text": "",
            "engine": ENGINE_NAME,
            "languageGroup": "auto",
            "languageLabel": "Langue détectée automatiquement",
            "confidence": 0,
            "lowConfidence": True,
            "attempts": attempts,
        }

    def _extract_with_group(self, image_path: str, group_name: str) -> dict:
        reader = self._get_reader(group_name)
        if reader is None:
            return {"text": "", "confidence": 0}

        results = reader.readtext(image_path, detail=1, paragraph=False)
        lines = []
        confidences = []
        for result in results:
            if len(result) >= 2:
                lines.append(str(result[1]))
            if len(result) >= 3:
                try:
                    confidences.append(float(result[2]))
                except (TypeError, ValueError):
                    pass

        confidence = sum(confidences) / len(confidences) if confidences else (1 if lines else 0)
        return {"text": "\n".join(lines), "confidence": confidence}

    def _get_reader(self, group_name: str):
        if group_name in self.readers:
            return self.readers[group_name]

        langs = self.lang_groups.get(group_name)
        if not langs:
            return None

        try:
            import easyocr

            self.readers[group_name] = easyocr.Reader(
                langs,
                gpu=self.gpu,
                model_storage_directory=str(self.model_dir),
            )
            return self.readers[group_name]
        except Exception:
            return None

    def _clean_text(self, text: str) -> str:
        normalized = re.sub(r"[ \t]+", " ", text or "")
        normalized = re.sub(r"\n{3,}", "\n\n", normalized)
        return "\n".join(line.strip() for line in normalized.splitlines()).strip()
