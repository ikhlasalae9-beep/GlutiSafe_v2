# Analyse du serveur

## Framework backend

Le serveur est une API Node.js utilisant Express.

Fichiers principaux :

- `server/index.js`
- `server/routes/analyze.js`
- `server/lib/glutenRules.js`
- `server/lib/explain.js`
- `server/lib/gemini.js`

Dependances :

| Dependence | Usage |
|---|---|
| `express` | API HTTP |
| `cors` | Autoriser les appels cross-origin |
| `dotenv` | Charger `server/.env` |
| `@google/genai` | Gemini pour l'explication |
| `multer` | Present dans les dependances, mais non utilise dans le code analyse |

## Initialisation

`server/index.js` :

- Charge `server/.env`.
- Cree une application Express.
- Active `cors()` sans restriction specifique.
- Active `express.json({ limit: '1mb' })`.
- Expose `GET /api/health`.
- Monte `analyzeRouter` sur `/api`.
- Lance le serveur sur `process.env.PORT || 5000`.

## Endpoints principaux

| Methode | Chemin | Fichier | Role |
|---|---|---|---|
| `GET` | `/api/health` | `server/index.js` | Health check |
| `POST` | `/api/analyze` | `server/routes/analyze.js` | Analyse texte uniquement |
| `POST` | `/api/explain` | `server/routes/analyze.js` | Explication d'une analyse |
| `POST` | `/api/full-analysis` | `server/routes/analyze.js` | Analyse + explication |

## Controleurs et services

Il n'y a pas de couche controller/service formelle. La logique est repartie ainsi :

- Routes HTTP dans `server/routes/analyze.js`.
- Logique metier dans `server/lib/glutenRules.js`.
- Gestion de l'explication dans `server/lib/explain.js`.
- Integration Gemini dans `server/lib/gemini.js`.

## Middleware

Middleware detecte :

- `cors()` : autorise les requetes cross-origin.
- `express.json({ limit: '1mb' })` : parse les corps JSON jusqu'a 1 MB.

Il n'y a pas actuellement de middleware d'authentification, rate limiting, logging structure ou validation schema.

## APIs externes

Le serveur peut utiliser Gemini via `@google/genai`.

Variables attendues :

- `GEMINI_API_KEY`
- `GEMINI_MODEL`

La cle API est lue depuis l'environnement cote serveur. Elle n'est pas exposee au client.

Important : Gemini ne decide pas le verdict. `server/lib/gemini.js` recoit un prompt qui indique que le verdict est deja fixe.

## Upload de fichiers

Le serveur Node ne gere pas directement l'upload d'image dans le code actuel. Les images sont envoyees au service OCR Python.

La dependance `multer` est presente dans `server/package.json`, mais aucun endpoint Express ne l'utilise actuellement. À vérifier si elle est prevue pour une prochaine version.

## Gestion d'erreurs

Points existants :

- `generateExplanation` capture les erreurs Gemini et retourne un fallback local.
- Si `GEMINI_API_KEY` est absente, le serveur continue de fonctionner avec fallback.

Limites :

- Les routes `/api/analyze`, `/api/explain` et `/api/full-analysis` n'ont pas de validation stricte des payloads.
- Les erreurs inattendues dans les routes async ne sont pas renvoyees avec un format d'erreur centralise.
- Pas de middleware global d'erreur.

## Forces

- API simple et lisible.
- Separation correcte entre routes, regles et integration Gemini.
- Le verdict reste deterministe et local.
- Fonctionnement degrade acceptable sans Gemini.
- Tests manuels de regles presents dans `server/test-glutenRules.js`.

## Problemes et opportunites d'amelioration

| Priorite | Point | Details |
|---|---|---|
| Haute | Validation d'entree absente | Ajouter une validation schema pour `text`, `analysis`, tableaux de mots |
| Haute | CORS trop ouvert | Restreindre les origins selon environnement |
| Moyenne | Pas de middleware d'erreur centralise | Harmoniser les erreurs JSON |
| Moyenne | Pas de rate limiting | Protege surtout `/api/explain` si Gemini est active |
| Moyenne | Encodage de chaines | Plusieurs textes francais apparaissent mal encodes dans `explain.js` et `gemini.js` |
| Basse | `multer` inutilise | Supprimer plus tard si l'upload reste dans `ocr-service/`, ou documenter son usage futur |

