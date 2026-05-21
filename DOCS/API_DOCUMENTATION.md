# Documentation API

## Base URLs locales

| Service | URL par defaut |
|---|---|
| Client | `http://localhost:5173` |
| API Node | `http://localhost:5000` |
| Service OCR | `http://localhost:8000` |

## API Node Express

### GET `/api/health`

| Champ | Detail |
|---|---|
| Methode | `GET` |
| URL | `http://localhost:5000/api/health` |
| Purpose | Verifier que le serveur Node est demarre |
| Request body | Aucun |
| Frontend usage | Pas d'utilisation directe detectee dans `client/src` |

Reponse :

```json
{
  "status": "ok",
  "service": "glutisafe-api"
}
```

Notes :

- Defini dans `server/index.js`.

### POST `/api/analyze`

| Champ | Detail |
|---|---|
| Methode | `POST` |
| URL | `http://localhost:5000/api/analyze` |
| Purpose | Analyser un texte d'ingredients sans explication IA |
| Request body | JSON `{ "text": "..." }` |
| Frontend usage | Fonction `analyzeText` dans `client/src/lib/api.js`, mais usage direct non detecte |

Reponse :

```json
{
  "status": "CONTAINS_GLUTEN",
  "label": "Contient du gluten",
  "detectedWords": ["wheat flour"],
  "possibleWords": [],
  "safeClaims": [],
  "confidence": "high",
  "normalizedText": "ingredients wheat flour sugar",
  "message": "Des ingredients directement lies au gluten ont ete detectes."
}
```

Notes :

- Le format exact depend du resultat.
- Le verdict est calcule par `server/lib/glutenRules.js`.

### POST `/api/explain`

| Champ | Detail |
|---|---|
| Methode | `POST` |
| URL | `http://localhost:5000/api/explain` |
| Purpose | Generer une explication pour une analyse existante |
| Request body | JSON avec `analysis` et optionnellement `text` |
| Frontend usage | Fonction `explainAnalysis` dans `client/src/lib/api.js`, usage direct non detecte |

Request possible :

```json
{
  "text": "Ingredients: wheat flour, sugar",
  "analysis": {
    "status": "CONTAINS_GLUTEN",
    "label": "Contient du gluten",
    "detectedWords": ["wheat flour"],
    "possibleWords": [],
    "confidence": "high",
    "message": "Des ingredients directement lies au gluten ont ete detectes."
  }
}
```

Reponse :

```json
{
  "explanation": "Des ingredients lies au gluten ont ete detectes..."
}
```

Notes :

- Utilise Gemini si `GEMINI_API_KEY` est configuree.
- Sinon retourne une explication locale.

### POST `/api/full-analysis`

| Champ | Detail |
|---|---|
| Methode | `POST` |
| URL | `http://localhost:5000/api/full-analysis` |
| Purpose | Analyser un texte et obtenir une explication |
| Request body | JSON `{ "text": "..." }` |
| Frontend usage | `Analyzer.jsx` via `fullAnalysis(text)` |

Request :

```json
{
  "text": "Ingredients: wheat flour, sugar"
}
```

Reponse :

```json
{
  "analysis": {
    "status": "CONTAINS_GLUTEN",
    "label": "Contient du gluten",
    "detectedWords": ["wheat flour"],
    "possibleWords": [],
    "safeClaims": [],
    "confidence": "high",
    "normalizedText": "ingredients wheat flour sugar",
    "message": "Des ingredients directement lies au gluten ont ete detectes."
  },
  "explanation": "Des ingredients lies au gluten ont ete detectes..."
}
```

Notes :

- Endpoint le plus complet pour le flux utilisateur final.
- Defini dans `server/routes/analyze.js`.

## API OCR FastAPI

### GET `/health`

| Champ | Detail |
|---|---|
| Methode | `GET` |
| URL | `http://localhost:8000/health` |
| Purpose | Verifier l'etat global du service OCR |
| Request body | Aucun |
| Frontend usage | Pas d'utilisation directe detectee |

Reponse si pret :

```json
{
  "status": "ok",
  "service": "glutisafe-ocr"
}
```

Reponse degradee possible :

```json
{
  "status": "degraded",
  "service": "glutisafe-ocr",
  "error": "OCR service is not ready."
}
```

### GET `/ocr/status`

| Champ | Detail |
|---|---|
| Methode | `GET` |
| URL | `http://localhost:8000/ocr/status` |
| Purpose | Connaitre l'etat du moteur OCR |
| Request body | Aucun |
| Frontend usage | Pas d'utilisation directe detectee |

Reponse :

```json
{
  "service": "glutisafe-ocr",
  "engine": "EasyOCR",
  "langs": ["fr", "en", "es", "ch_sim"],
  "gpu": false,
  "ready": true,
  "message": "EasyOCR is ready on CPU."
}
```

### POST `/ocr/extract`

| Champ | Detail |
|---|---|
| Methode | `POST` |
| URL | `http://localhost:8000/ocr/extract` |
| Purpose | Extraire le texte d'une image |
| Request body | `multipart/form-data`, champ `image` |
| Frontend usage | `client/src/lib/ocrApi.js` via `extractTextWithEasyOCR(file)` |

Reponse succes :

```json
{
  "success": true,
  "text": "Ingredients: rice flour, sugar",
  "engine": "EasyOCR"
}
```

Reponse echec :

```json
{
  "success": false,
  "text": "",
  "engine": "EasyOCR",
  "error": "..."
}
```

Notes :

- Le champ fichier doit s'appeler `image`.
- Le service supprime le fichier temporaire apres traitement.
- Le client remplace les espaces multiples par un seul espace avant affichage.

