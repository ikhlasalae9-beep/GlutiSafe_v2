# Analyse du client

## Framework et bibliotheques

Le client est une application React construite avec Vite.

Fichiers de configuration :

- `client/package.json`
- `client/vite.config.js`
- `client/tailwind.config.js`
- `client/postcss.config.js`

Dependances principales :

| Bibliotheque | Usage |
|---|---|
| `react` / `react-dom` | UI |
| `react-router-dom` | Routage |
| `tailwindcss` | Styles |
| `lucide-react` | Icones |
| `framer-motion` | Animations potentielles |
| `recharts` | Graphiques nutritionnels |

## Point d'entree

- `client/src/main.jsx` monte l'application dans `#root`.
- `BrowserRouter` entoure `App`.
- `client/src/App.jsx` definit les routes actives.

## Pages principales

| Fichier | Role |
|---|---|
| `client/src/pages/HomePage.jsx` | Tableau de bord, raccourci vers analyse, dernieres analyses |
| `client/src/pages/AnalysisPage.jsx` | Page active pour `/analyse`, mais avec resultats simules |
| `client/src/pages/HistoryPage.jsx` | Historique local par utilisateur |
| `client/src/pages/ProfilePage.jsx` | Profil local, statistiques et preferences UI |
| `client/src/pages/AuthPage.jsx` | Inscription/connexion locale |
| `client/src/pages/Home.jsx` | Ancienne page ou page alternative non routee actuellement |
| `client/src/pages/AnalyzePage.jsx` | Wrapper vers `Analyzer`, non route actuellement |
| `client/src/pages/ScannerPage.jsx` | Page de scan alternative avec donnees demo |
| `client/src/pages/AboutPage.jsx` | Page informative non routee actuellement |
| `client/src/pages/LoginPage.jsx` | Ancienne page login non routee actuellement |

## Composants importants

| Fichier | Role |
|---|---|
| `client/src/components/SidebarLayout.jsx` | Layout principal avec sidebar et navigation mobile |
| `client/src/components/Analyzer.jsx` | Flux complet OCR + analyse API |
| `client/src/components/ImageUploader.jsx` | Import/capture image |
| `client/src/components/ExtractedTextEditor.jsx` | Edition du texte extrait ou saisi |
| `client/src/components/OcrProgress.jsx` | Progression OCR |
| `client/src/components/ResultCard.jsx` | Carte de resultat |
| `client/src/components/HistoryPanel.jsx` | Panneau historique, si utilise |
| `client/src/components/ChatbotWidget.jsx` | Widget de chat statique/demo |
| `client/src/components/NutritionChart.jsx` | Visualisation nutritionnelle |

## Routage

Les routes actives sont dans `client/src/App.jsx`.

```text
/           -> HomePage
/analyse    -> AnalysisPage
/history    -> HistoryPage
/profile    -> ProfilePage
/register   -> AuthPage(mode="register")
/login      -> AuthPage(mode="login")
*           -> redirection vers /register
```

Point important : `AnalyzePage` et `Analyzer` contiennent le flux fonctionnel OCR/API, mais `/analyse` pointe vers `AnalysisPage`, qui simule actuellement l'analyse avec `mockResults`.

## Appels API

Les appels sont centralises dans :

- `client/src/lib/api.js`
- `client/src/lib/ocrApi.js`

| Fonction | Endpoint | Role |
|---|---|---|
| `analyzeText(text)` | `POST /api/analyze` | Analyse uniquement |
| `explainAnalysis(payload)` | `POST /api/explain` | Explication uniquement |
| `fullAnalysis(text)` | `POST /api/full-analysis` | Analyse + explication |
| `extractTextWithEasyOCR(file)` | `POST /ocr/extract` | OCR image |

`Analyzer.jsx` utilise `fullAnalysis` et `extractTextWithEasyOCR`.

## Gestion d'etat

La gestion d'etat est locale avec React hooks :

- `useState` pour les formulaires, fichiers, erreurs et resultats.
- `useEffect` pour nettoyage des previews et chargement d'historique.
- `localStorage` pour utilisateur et historique.

Il n'y a pas de store global type Redux/Zustand.

## Structure UI

Le style repose sur Tailwind CSS et des composants React. L'interface utilise :

- Sidebar desktop et navigation mobile.
- Cartes pour les resultats, historique et profil.
- Couleurs teal/cyan/emerald avec fond clair.
- Icones `lucide-react`.

## Forces

- Stack moderne et simple a lancer.
- Separation claire entre appels API et composants UI.
- Flux OCR/API deja implemente dans `Analyzer.jsx`.
- Fallback manuel prevu si l'OCR est indisponible.
- Historique local limite a 50 elements dans `saveAnalysis`.
- Interface riche pour un MVP.

## Problemes et opportunites d'amelioration

| Priorite | Point | Details |
|---|---|---|
| Haute | Route `/analyse` branchee sur une simulation | `AnalysisPage.jsx` utilise `mockResults` et ne semble pas appeler les API reelles |
| Haute | `ResultCard.jsx` incompatible avec `Analyzer.jsx` | `Analyzer` passe `analysis`, `onSave`, `saved`, `onNew`, mais `ResultCard` attend `status`, `ingredients`, `explanation` |
| Haute | Authentification non securisee | `AuthPage.jsx` ignore le mot de passe et stocke seulement nom/email dans `localStorage` |
| Moyenne | Plusieurs pages alternatives non routees | Risque de confusion entre ancienne UI et UI active |
| Moyenne | Encodage visible incorrect | Plusieurs textes francais apparaissent en mojibake (`Ã©`, `â€™`) |
| Moyenne | Statuts incoherents | Certains composants attendent `safe/danger`, d'autres `NO_GLUTEN_DETECTED/CONTAINS_GLUTEN` |
| Basse | Chatbot statique | `ChatbotWidget.jsx` affiche des messages fixes et ne connecte pas d'API |

