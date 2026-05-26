# Carte du projet

## Vue generale

```text
GlutiSafe/
├─ client/
│  ├─ src/
│  │  ├─ App.jsx
│  │  ├─ main.jsx
│  │  ├─ index.css
│  │  ├─ lib/
│  │  ├─ pages/
│  │  └─ components/
│  ├─ public/logo.png
│  ├─ package.json
│  ├─ vite.config.js
│  └─ tailwind.config.js
├─ server/
│  ├─ index.js
│  ├─ routes/analyze.js
│  ├─ lib/
│  │  ├─ glutenRules.js
│  │  ├─ explain.js
│  │  └─ aiService.js
│  ├─ test-glutenRules.js
│  └─ package.json
├─ ocr-service/
│  ├─ app.py
│  ├─ lib/ocr_router.py
│  ├─ requirements.txt
│  └─ README.md
├─ DOCS/
├─ package.json
├─ README.md
└─ start_gluti_safe.ps1
```

## Racine

| Fichier | Description |
|---|---|
| `package.json` | Scripts racine pour lancer client, serveur et build client |
| `README.md` | Documentation de demarrage existante |
| `start_gluti_safe.ps1` | Script Windows pour lancer les trois services |
| `.gitignore` | Exclusions Git |

## Client

| Fichier | Description |
|---|---|
| `client/package.json` | Dependances React/Vite/Tailwind |
| `client/index.html` | HTML racine Vite |
| `client/vite.config.js` | Configuration Vite, proxy `/api` vers `localhost:5000` |
| `client/tailwind.config.js` | Configuration Tailwind |
| `client/src/main.jsx` | Point d'entree React |
| `client/src/App.jsx` | Routage principal |
| `client/src/index.css` | Styles globaux Tailwind |
| `client/public/logo.png` | Logo utilise dans l'interface |

## Client - librairies

| Fichier | Description |
|---|---|
| `client/src/lib/api.js` | Appels API Node |
| `client/src/lib/ocrApi.js` | Appel OCR FastAPI |
| `client/src/lib/auth.js` | Gestion utilisateur locale via `localStorage` |
| `client/src/lib/history.js` | Historique local des analyses |
| `client/src/lib/status.js` | Styles et labels de statut |

## Client - pages

| Fichier | Description |
|---|---|
| `client/src/pages/HomePage.jsx` | Tableau de bord actif |
| `client/src/pages/AnalysisPage.jsx` | Page `/analyse` active, actuellement simulee |
| `client/src/pages/HistoryPage.jsx` | Liste des analyses sauvegardees |
| `client/src/pages/ProfilePage.jsx` | Profil et statistiques locales |
| `client/src/pages/AuthPage.jsx` | Inscription/connexion locale |
| `client/src/pages/AnalyzePage.jsx` | Wrapper vers `Analyzer`, non route actuellement |
| `client/src/pages/Home.jsx` | Page alternative avec `Analyzer`, non routee actuellement |
| `client/src/pages/ScannerPage.jsx` | Ancienne page/demo de scanner |
| `client/src/pages/AboutPage.jsx` | Page informative non routee |
| `client/src/pages/LoginPage.jsx` | Ancienne page login non routee |

## Client - composants

| Fichier | Description |
|---|---|
| `SidebarLayout.jsx` | Layout principal avec sidebar |
| `Analyzer.jsx` | Flux OCR + analyse API |
| `ImageUploader.jsx` | Import/capture image |
| `ExtractedTextEditor.jsx` | Zone de correction du texte |
| `ResultCard.jsx` | Affichage du resultat |
| `OcrProgress.jsx` | Indicateur de progression OCR |
| `InputMethodTabs.jsx` | Choix import/camera/manuel |
| `ChatbotWidget.jsx` | Widget de chat statique |
| `NutritionChart.jsx` | Graphique nutritionnel |
| `Button.jsx` | Bouton reutilisable |

## Serveur Node

| Fichier | Description |
|---|---|
| `server/index.js` | Demarrage Express, CORS, JSON, health check |
| `server/routes/analyze.js` | Routes d'analyse et d'explication |
| `server/lib/glutenRules.js` | Moteur de regles gluten |
| `server/lib/explain.js` | Explication locale prudente |
| `server/lib/aiService.js` | Integration GPT-4o via OpenAI / GitHub Models |
| `server/test-glutenRules.js` | Tests manuels de detection |
| `server/.env.example` | Variables serveur attendues |

## Service OCR

| Fichier | Description |
|---|---|
| `ocr-service/app.py` | Application FastAPI |
| `ocr-service/lib/ocr_router.py` | Initialisation EasyOCR et extraction |
| `ocr-service/requirements.txt` | Dependances Python |
| `ocr-service/README.md` | Documentation specifique OCR |
| `ocr-service/.env.example` | Variables OCR attendues |

## Documentation

| Fichier | Description |
|---|---|
| `DOCS/PROJECT_OVERVIEW.md` | Vue d'ensemble technique |
| `DOCS/ARCHITECTURE.md` | Architecture et flux |
| `DOCS/CLIENT_ANALYSIS.md` | Analyse frontend |
| `DOCS/SERVER_ANALYSIS.md` | Analyse backend |
| `DOCS/OCR_SERVICE_ANALYSIS.md` | Analyse OCR |
| `DOCS/API_DOCUMENTATION.md` | Endpoints API |
| `DOCS/GLUTEN_DETECTION_LOGIC.md` | Regles gluten |
| `DOCS/SETUP_AND_RUN.md` | Installation et lancement |
| `DOCS/PROJECT_MAP.md` | Carte des fichiers |
| `DOCS/TODO_AND_IMPROVEMENTS.md` | Plan d'amelioration |
| `DOCS/CODE_REVIEW_REPORT.md` | Revue technique |
