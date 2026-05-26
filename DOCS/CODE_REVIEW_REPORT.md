# Rapport de revue de code

## Synthese

GlutiSafe est un MVP prometteur avec une architecture claire : React pour l'interface, Express pour la logique metier, FastAPI/EasyOCR pour l'OCR. Le point fort principal est que le verdict gluten reste determine par un moteur de regles local, ce qui evite de deleguer une decision sensible a un modele generatif.

Les risques principaux sont fonctionnels et securite : la page d'analyse active semble encore simulee, le composant de resultat n'est pas aligne avec le flux API reel, et l'authentification est uniquement locale.

## Qualite du code

### Points positifs

- Code globalement lisible.
- Separation correcte des appels API dans `client/src/lib/`.
- Separation correcte des regles dans `server/lib/glutenRules.js`.
- Fallback local robuste si le fournisseur IA n'est pas configure.
- Nettoyage des fichiers temporaires OCR dans `finally`.

### Points a corriger

| Severite | Fichier | Probleme |
|---|---|---|
| Haute | `client/src/App.jsx` + `client/src/pages/AnalysisPage.jsx` | La route `/analyse` utilise une page avec resultats mockes |
| Haute | `client/src/components/Analyzer.jsx` + `client/src/components/ResultCard.jsx` | Contrat de props incompatible |
| Haute | `client/src/pages/AuthPage.jsx` | Le mot de passe est ignore ; pas d'authentification reelle |
| Moyenne | Plusieurs fichiers JSX/JS | Encodage incorrect visible dans les textes |
| Moyenne | `server/routes/analyze.js` | Pas de validation stricte des payloads |
| Moyenne | `ocr-service/app.py` | Upload sans limite explicite de taille |

## Qualite d'architecture

L'architecture est adaptee au stade MVP :

- Le client orchestre l'experience.
- Le serveur Node porte la logique metier.
- Le service OCR est isole.

Cette separation est saine car l'OCR a des dependances lourdes Python/EasyOCR qui ne polluent pas le serveur Node.

Limites :

- Pas de base de donnees.
- Pas d'authentification serveur.
- Pas de contrat partage entre frontend et backend.
- Pas de couche de validation commune.

## Maintenabilite

### Forces

- Les fonctions importantes ont des responsabilites assez nettes.
- Les listes de termes gluten sont centralisees dans un seul fichier.
- Les appels API sont centralises.

### Risques

- Plusieurs pages semblent etre des versions anciennes ou alternatives.
- Les statuts sont representes de plusieurs facons : `safe`, `danger`, `CONTAINS_GLUTEN`, `NO_GLUTEN_DETECTED`.
- Les listes de termes dans `glutenRules.js` sont longues et difficiles a relire.
- Les textes mal encodes compliquent la maintenance et peuvent casser la detection multilingue.

## Scalabilite

Le projet peut supporter une utilisation locale ou MVP, mais devra evoluer pour la production :

- Ajouter un stockage serveur pour utilisateurs et historique.
- Ajouter une file ou strategie de scaling pour OCR si le trafic augmente.
- Ajouter cache ou warmup EasyOCR.
- Proteger les endpoints IA contre les appels excessifs.
- Ajouter monitoring et logs structures.

## Gestion d'erreurs

Points positifs :

- Le client gere l'indisponibilite OCR avec un message et propose la saisie manuelle.
- Le fournisseur IA a un fallback local.
- Le service OCR renvoie `success: false` si le moteur n'est pas pret.

Points faibles :

- Pas de middleware d'erreur Express.
- Messages d'erreur OCR potentiellement trop techniques.
- Pas de format d'erreur commun entre Node et OCR.
- Pas de validation schema pour distinguer erreur utilisateur et erreur serveur.

## Risques securite

| Risque | Severite | Detail |
|---|---|---|
| Auth locale | Haute | Nom/email stockes dans `localStorage`, mot de passe ignore |
| CORS ouvert | Haute | `server/index.js` utilise `cors()` sans restriction |
| Upload OCR | Haute | Pas de limite explicite taille/type |
| Secrets | Moyenne | Les `.env.example` sont corrects, mais les `.env` doivent rester exclus |
| GPT-4o | Moyenne | Sans rate limit, couts ou abus possibles |
| Donnees locales | Moyenne | Historique en clair dans le navigateur |

## Risques performance

- EasyOCR peut etre lourd sur CPU.
- Le chargement initial des modeles peut etre lent.
- OCR multilingue peut augmenter le temps d'analyse.
- Le client peut envoyer de grandes images sans compression.
- Les listes de detection sont scannees en memoire a chaque requete ; acceptable pour MVP, a surveiller si les listes grossissent.

## Recommandations prochaines

1. Brancher `/analyse` sur le flux reel OCR + API.
2. Corriger `ResultCard.jsx` pour afficher les objets `analysis` du backend.
3. Corriger l'encodage UTF-8 des fichiers contenant du texte francais/chinois/arabe.
4. Ajouter validation d'entree cote serveur.
5. Ajouter limites d'upload OCR.
6. Restreindre CORS.
7. Ajouter tests unitaires et integration pour le flux critique.

## Conclusion

Le coeur technique est bon pour un MVP : extraction OCR, moteur de regles, explication prudente. Avant une demonstration serieuse ou une mise en production, il faut surtout reconnecter l'UI active au flux reel, corriger les contrats de composants et durcir les points securite autour de l'authentification, CORS et uploads.
