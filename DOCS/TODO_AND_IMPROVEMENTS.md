# TODO et plan d'ameliorations

## Priorites hautes

| Categorie | Probleme | Recommandation |
|---|---|---|
| Bug fonctionnel | La route `/analyse` utilise `AnalysisPage.jsx` avec des resultats simules | Brancher `/analyse` sur le flux reel `Analyzer` ou adapter `AnalysisPage` pour appeler OCR/API |
| Bug UI/API | `Analyzer.jsx` passe des props que `ResultCard.jsx` ne consomme pas | Aligner le contrat de `ResultCard` avec la reponse `{ analysis, explanation }` |
| Securite | Authentification locale non securisee | Ajouter un vrai backend auth si des comptes reels sont necessaires |
| Securite | CORS ouvert sur le serveur Node | Restreindre les origins selon environnement |
| Securite | Upload OCR sans limite explicite | Ajouter limite de taille et validation MIME |
| Qualite | Encodage incorrect visible dans plusieurs fichiers | Reconvertir les fichiers en UTF-8 propre et tester l'affichage |

## Priorites moyennes

| Categorie | Probleme | Recommandation |
|---|---|---|
| OCR | Pas de preprocessing image | Ajouter rotation automatique, contraste, recadrage et nettete |
| OCR | Pas de score de confiance retourne au client | Renvoyer les blocs OCR avec confidence et positions |
| Backend | Validation de payload absente | Ajouter schema de validation pour les routes Express |
| Backend | Pas de middleware d'erreur global | Standardiser les reponses d'erreur |
| Backend | Pas de rate limiting | Proteger surtout les endpoints qui peuvent utiliser Gemini |
| UX | Statuts incoherents entre `safe/danger` et statuts backend | Centraliser le mapping des statuts |
| UX | Pages non routees et composants demos | Supprimer ou isoler les demos plus tard apres validation |
| Tests | Tests limites au moteur de regles | Ajouter tests API et tests frontend essentiels |

## Priorites basses

| Categorie | Probleme | Recommandation |
|---|---|---|
| Documentation | Les guides visuels existants ont des caracteres mal encodes | Corriger l'encodage et harmoniser avec ces docs techniques |
| Performance | EasyOCR peut etre lent au demarrage | Ajouter documentation de warmup et cache modele |
| Observabilite | Logs minimaux | Ajouter logs structures sans texte sensible complet |
| UX | Chatbot statique | Le connecter a une API ou l'indiquer clairement comme demo |
| Produit | Pas de base de donnees | Ajouter stockage serveur si historique multi-appareil requis |

## Ameliorations de la detection gluten

| Priorite | Action |
|---|---|
| Haute | Garder et renforcer les tests de phrases negatives comme `gluten not detected` |
| Haute | Ajouter des tests pour erreurs OCR frequentes autour de `not detected` |
| Moyenne | Ajouter une detection de contexte par fenetre de mots autour de `gluten` |
| Moyenne | Gérer les conflits : safe claim + ingredient direct dans la meme etiquette |
| Moyenne | Corriger ou verifier les chaines chinoises mal encodees |
| Basse | Externaliser les listes de termes dans un fichier JSON versionne |

## Ameliorations securite

- Restreindre CORS dans `server/index.js` et `ocr-service/app.py`.
- Ajouter rate limiting cote serveur.
- Ne jamais logger les cles API ou secrets.
- Ajouter limite de taille JSON et upload adaptee.
- Valider les types MIME et extensions image.
- Nettoyer les messages d'erreur OCR exposes en production.
- Remplacer l'authentification locale par un mecanisme serveur si l'application manipule des donnees utilisateur reelles.

## Ameliorations backend

- Ajouter validation schema avec une librairie type Zod, Joi ou equivalent.
- Ajouter middleware d'erreur Express.
- Ajouter tests unitaires pour `glutenRules.js`.
- Ajouter tests d'integration pour `/api/analyze` et `/api/full-analysis`.
- Documenter clairement le contrat de reponse `analysis`.
- Supprimer ou utiliser `multer`.

## Ameliorations frontend

- Brancher le flux reel sur la page `/analyse`.
- Harmoniser `ResultCard` avec les statuts backend.
- Ajouter etats vides, erreurs reseau et retry.
- Ajouter tests de composants critiques.
- Uniformiser la langue de l'interface.
- Corriger les caracteres mal encodes.
- Clarifier les pages demo/anciennes pages.

## Ameliorations OCR

- Ajouter preprocessing image.
- Ajouter retour des confidences OCR.
- Ajouter support de rotation.
- Ajouter controle taille et type.
- Ajouter endpoint de status plus detaille.
- Documenter les ressources CPU/GPU recommandees.

## Ameliorations documentation

- Maintenir `API_DOCUMENTATION.md` a chaque ajout d'endpoint.
- Ajouter une section production/deploiement quand l'hebergement sera choisi.
- Ajouter une matrice des variables d'environnement par environnement.
- Ajouter captures d'ecran apres stabilisation UI.
- Ajouter une checklist de release.

