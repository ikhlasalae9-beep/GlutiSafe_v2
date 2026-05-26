# Vue d'ensemble du projet

## Qu'est-ce que GlutiSafe ?

GlutiSafe est une application web d'aide a la lecture d'etiquettes alimentaires pour les personnes qui souhaitent eviter le gluten. Le projet combine une interface React, une API Node/Express et un microservice Python FastAPI pour extraire le texte d'une image puis analyser les ingredients detectes.

Le projet ne certifie pas qu'un produit est officiellement sans gluten. Il fournit une aide a la decision basee sur l'OCR et sur un moteur de regles local.

## Objectif principal

L'objectif principal est de transformer une photo d'etiquette en resultat clair :

| Etape | Objectif |
|---|---|
| Capture ou import d'image | Recuperer une image lisible de la liste d'ingredients |
| OCR | Extraire le texte visible avec EasyOCR |
| Correction utilisateur | Permettre de corriger le texte extrait avant analyse |
| Analyse gluten | Detecter les termes directs, les risques possibles et les mentions rassurantes |
| Explication | Fournir une explication courte et prudente en francais |
| Historique | Sauvegarder localement les analyses pour consultation |

## Fonctionnalites principales

- Import ou capture d'image cote client.
- Extraction OCR via le service `ocr-service/`.
- Saisie manuelle des ingredients si l'OCR echoue.
- Analyse par regles locales dans `server/lib/glutenRules.js`.
- Explication optionnelle via GPT-4o, sans modifier le verdict.
- Historique local par email utilisateur dans le navigateur.
- Interface React avec tableau de bord, analyse, historique, profil et authentification locale simplifiee.
- Guides visuels existants dans `DOCS/glutisafe_visual_style_guide.md` et `DOCS/glutisafe_image_design_skills.md`.

## Flux utilisateur ideal

1. L'utilisateur ouvre l'application React sur `http://localhost:5173`.
2. Il selectionne une image ou prend une photo d'etiquette.
3. Le client envoie le fichier a `POST http://localhost:8000/ocr/extract`.
4. Le service OCR extrait le texte avec EasyOCR.
5. Le texte est affiche dans un champ editable.
6. L'utilisateur corrige le texte si necessaire.
7. Le client envoie le texte final a `POST http://localhost:5000/api/full-analysis`.
8. Le serveur analyse le texte avec `analyzeIngredients`.
9. Le serveur genere une explication prudente avec GPT-4o si le token est configure, sinon avec un fallback local.
10. L'interface affiche le statut, les mots detectes, le niveau de confiance et l'explication.
11. L'utilisateur peut sauvegarder l'analyse dans l'historique local.

## Architecture generale

GlutiSafe est organise en trois parties :

| Partie | Technologie | Role |
|---|---|---|
| `client/` | React, Vite, Tailwind CSS | Interface utilisateur et orchestration du flux |
| `server/` | Node.js, Express | Analyse gluten et explication IA/fallback |
| `ocr-service/` | Python, FastAPI, EasyOCR | Extraction du texte depuis les images |

Le verdict de securite vient du moteur de regles local. GPT-4o est utilise uniquement pour expliquer un verdict deja decide.

## Points importants

- Les secrets sont attendus dans des fichiers `.env`, non inclus dans la documentation.
- Les fichiers `.env.example` indiquent les variables attendues sans exposer de valeur sensible.
- L'authentification actuelle est locale au navigateur, via `localStorage`, et ne constitue pas une authentification serveur.
- Une partie de l'interface active semble encore utiliser des donnees simulees, notamment `client/src/pages/AnalysisPage.jsx`.
