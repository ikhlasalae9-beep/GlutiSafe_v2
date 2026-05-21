# Analyse du service OCR

## Technologie OCR utilisee

Le service OCR utilise :

- FastAPI pour exposer une API HTTP.
- EasyOCR pour la reconnaissance de texte.
- Pillow pour verifier que le fichier upload est une image valide.
- `python-multipart` pour recevoir les fichiers en `multipart/form-data`.

Fichiers principaux :

- `ocr-service/app.py`
- `ocr-service/lib/ocr_router.py`
- `ocr-service/requirements.txt`

## Chargement du service

Au demarrage, `ocr-service/app.py` :

1. Charge manuellement `ocr-service/.env` si le fichier existe.
2. Cree le dossier temporaire `OCR_TEMP_DIR`.
3. Configure CORS avec `OCR_CORS_ORIGINS`.
4. Instancie `OCRRouter` au startup FastAPI.

`OCRRouter` :

- Lit `OCR_LANGS`.
- Lit `OCR_GPU`.
- Cree `OCR_MODEL_DIR`.
- Initialise `easyocr.Reader`.

## Extraction du texte

Endpoint principal :

```text
POST /ocr/extract
```

Flux :

1. Le client envoie un fichier avec le champ `image`.
2. Le service verifie que l'OCR est pret.
3. L'image est ecrite dans un fichier temporaire.
4. Pillow ouvre et verifie l'image.
5. `reader.readtext(image_path, detail=0, paragraph=True)` extrait les lignes.
6. Les lignes sont jointes avec `\n`.
7. `_clean_text` normalise les espaces et retours ligne.
8. Le fichier temporaire est supprime dans `finally`.

## Gestion des ingredients extraits

Le service OCR ne comprend pas semantiquement les ingredients. Il renvoie seulement du texte brut nettoye.

L'analyse des ingredients est effectuee ensuite par le serveur Node dans `server/lib/glutenRules.js`.

## Langues supportees

La configuration par defaut dans le README racine et `.env.example` indique :

```text
OCR_LANGS=fr,en,es,ch_sim
```

Dans le code, si `OCR_LANGS` n'est pas defini, la valeur par defaut est :

```text
fr,en
```

Langues visibles :

| Code | Langue |
|---|---|
| `fr` | Francais |
| `en` | Anglais |
| `es` | Espagnol |
| `ch_sim` | Chinois simplifie |

## Endpoints OCR

| Methode | Chemin | Role |
|---|---|---|
| `GET` | `/health` | Etat global du service |
| `GET` | `/ocr/status` | Etat du moteur EasyOCR |
| `POST` | `/ocr/extract` | Extraction de texte depuis image |

## Limites

- Aucun controle explicite de taille maximale des fichiers.
- Aucun filtrage MIME strict avant lecture par Pillow.
- Extraction dependante de la qualite de l'image.
- Les resultats OCR peuvent contenir des erreurs, caracteres manquants ou substitutions.
- Le premier demarrage peut etre lent si EasyOCR doit telecharger ou charger les modeles.
- Les langues multiples peuvent ralentir l'OCR.
- Les erreurs sont renvoyees au client avec `str(exc)`, ce qui peut etre trop detaille en production.

## Ameliorations possibles

| Priorite | Amelioration |
|---|---|
| Haute | Limiter la taille des fichiers uploades |
| Haute | Restreindre les types de fichiers acceptes |
| Moyenne | Ajouter preprocessing image : rotation, contraste, nettete, recadrage |
| Moyenne | Retourner aussi les blocs OCR avec confiance et position |
| Moyenne | Ajouter logs structures sans contenu sensible |
| Basse | Ajouter un endpoint de warmup ou readiness detaille |
| Basse | Permettre une configuration par langue depuis le client |

