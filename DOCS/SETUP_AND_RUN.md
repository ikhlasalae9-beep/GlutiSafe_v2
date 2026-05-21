# Installation et lancement

## Outils requis

| Outil | Usage |
|---|---|
| Node.js | Lancer le client React et le serveur Express |
| npm | Installer les dependances JavaScript |
| Python 3 | Lancer le service OCR |
| pip | Installer les dependances Python |
| PowerShell | Utiliser `start_gluti_safe.ps1` sur Windows |

À vérifier : les versions minimales exactes ne sont pas precisees dans le projet.

## Variables d'environnement

Creer les fichiers locaux a partir des exemples :

```text
client/.env.example      -> client/.env
server/.env.example      -> server/.env
ocr-service/.env.example -> ocr-service/.env
```

Ne pas commiter les fichiers `.env`. Ils peuvent contenir des informations sensibles comme `GEMINI_API_KEY`.

## Installation des dependances

### Client

```bash
cd client
npm install
```

### Serveur Node

```bash
cd server
npm install
```

### Service OCR

```bash
cd ocr-service
pip install -r requirements.txt
```

Option recommandee : utiliser un environnement virtuel Python.

```bash
cd ocr-service
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
```

## Lancer le client

Depuis la racine :

```bash
npm run dev:client
```

Ou depuis `client/` :

```bash
npm run dev
```

URL par defaut :

```text
http://localhost:5173
```

## Lancer le serveur Node

Depuis la racine :

```bash
npm run dev:server
```

Ou depuis `server/` :

```bash
npm run dev
```

URL par defaut :

```text
http://localhost:5000
```

Health check :

```text
GET http://localhost:5000/api/health
```

## Lancer le service OCR

Depuis `ocr-service/` :

```bash
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

URL par defaut :

```text
http://localhost:8000
```

Health check :

```text
GET http://localhost:8000/health
```

## Utiliser `start_gluti_safe.ps1`

Depuis la racine du projet :

```powershell
.\start_gluti_safe.ps1
```

Le script :

1. Lance le client avec `npm run dev:client`.
2. Lance le serveur avec `npm run dev:server`.
3. Va dans `ocr-service/`.
4. Active `.venv` si `ocr-service/.venv/Scripts/activate.ps1` existe.
5. Lance Uvicorn sur le port `8000`.

Le script ouvre des fenetres PowerShell separees.

## Tests disponibles

Le serveur contient un test manuel du moteur de regles :

```bash
cd server
npm run test:rules
```

Ce test verifie plusieurs cas en francais, anglais, espagnol et chinois.

## Erreurs courantes et corrections

| Erreur | Cause probable | Correction |
|---|---|---|
| Port `5173` deja utilise | Un autre Vite tourne deja | Arreter l'ancien processus ou changer le port |
| Port `5000` deja utilise | API deja lancee | Arreter l'ancien serveur ou modifier `PORT` |
| Port `8000` deja utilise | Service OCR deja lance | Arreter l'ancien Uvicorn ou changer le port |
| `GEMINI_API_KEY is not configured` | Cle Gemini absente | Normal pour le mode fallback ; ajouter la cle seulement si necessaire |
| EasyOCR lent au premier lancement | Chargement/telechargement des modeles | Attendre le chargement initial |
| OCR indisponible | Dependances Python manquantes ou EasyOCR en erreur | Reinstaller `requirements.txt`, verifier `/ocr/status` |
| CORS bloque | URLs client/API incoherentes | Verifier `VITE_API_URL`, `VITE_OCR_API_URL`, `OCR_CORS_ORIGINS` |
| Texte avec caracteres bizarres | Encodage du fichier ou du terminal | Verifier que les fichiers sont en UTF-8 |

## Build client

Depuis la racine :

```bash
npm run build:client
```

Ou depuis `client/` :

```bash
npm run build
```

