# PIPELINES.md

Ce document recense les pipelines fonctionnels de l’application MyWebClient, du déclencheur utilisateur jusqu’au résultat observable, en détaillant pour chaque pipeline :
1. Le déclencheur (UI ou événement)
2. Les fonctions côté client (React/JS)
3. Les fonctions côté serveur (API/Node/DB)
4. Le résultat fonctionnel

---

## 1. Authentification (Login)

**Déclencheur :**
- Soumission du formulaire de connexion (clic sur "Se connecter" dans le composant Login.js)

**Fonctions client :**
- `handleSubmit` (Login.js) : envoie une requête POST à `/api/auth/login` avec identifiant et mot de passe
- Si succès : stockage du token dans localStorage, exécution du callback `onLogin`

**Fonctions serveur :**
- `POST /api/auth/login` (authRoutes.js) :
  - Vérifie l’identifiant et le mot de passe via AdminDB
  - Met à jour la session, log l’accès
  - Retourne `{ success, token, user }` ou une erreur

**Résultat fonctionnel :**
- L’utilisateur est connecté, l’interface bascule sur l’espace principal de l’application

---

## 2. Exploration et édition d’une expression

**Déclencheur :**
- Sélection d’une expression dans l’UI (ExpressionExplorer.js)
- Actions utilisateur : édition, sauvegarde, suppression, tagging, navigation (boutons ou raccourcis clavier)

**Fonctions client :**
- `getExpression` (Context.js) : GET `/api/expression?id=`
- `saveReadable` (Context.js) : POST `/api/readable` (sauvegarde du markdown)
- `deleteExpression` (Context.js) : GET `/api/deleteExpression?id=`
- `getReadable` (Context.js) : GET `/api/readable?id=`
- `tagContent` (Context.js) : POST `/api/tagContent` (tagging d’un segment de texte)
- `getTaggedContent` (Context.js) : GET `/api/taggedContent?expressionId=`
- Navigation : `getPrevExpression`, `getNextExpression` (Context.js) : GET `/api/prev`, `/api/next`
- Suppression média : `deleteMedia` (Context.js) : POST `/api/deleteMedia`

**Fonctions serveur :**
- `GET /api/expression` : retourne les détails d’une expression
- `POST /api/readable` : sauvegarde le contenu markdown d’une expression
- `GET /api/deleteExpression` : supprime une expression
- `GET /api/readable` : retourne le markdown d’une expression
- `POST /api/tagContent` : crée un tag sur un segment de texte
- `GET /api/taggedContent` : retourne le contenu taggé d’une expression
- `GET /api/prev`, `GET /api/next` : navigation entre expressions
- `POST /api/deleteMedia` : supprime un média associé

**Résultat fonctionnel :**
- L’utilisateur peut consulter, éditer, sauvegarder, supprimer, tagger et naviguer entre les expressions. L’UI se met à jour en temps réel.

---

## 3. Exploration et filtrage des “lands”

**Déclencheur :**
- Sélection d’un “land” dans l’UI (LandExplorer.js)
- Modification des filtres (relevance, depth) via sliders ou filtres

**Fonctions client :**
- `getLand` (Context.js) : GET `/api/land?id=`
- `getExpressions` (Context.js) : GET `/api/expressions?landId=...`
- `setCurrentRelevance`, `setCurrentDepth` (Context.js) : modifient les filtres et rechargent les données
- `setCurrentPage`, `setResultsPerPage` (Context.js) : pagination

**Fonctions serveur :**
- `GET /api/land` : retourne les infos d’un land (métadonnées, min/max relevance/depth, etc.)
- `GET /api/expressions` : retourne la liste paginée/filtrée des expressions d’un land

**Résultat fonctionnel :**
- L’utilisateur explore les “lands”, filtre les expressions par pertinence/profondeur, navigue par pagination.

---

## 4. Gestion et édition des tags

**Déclencheur :**
- Actions utilisateur dans TagExplorer.js (création, édition, suppression, réorganisation de tags)
- Tagging de contenu dans Expression.js

**Fonctions client :**
- `getTags` (Context.js) : GET `/api/tags?landId=`
- `setTags` (Context.js) : POST `/api/tags` (sauvegarde la structure des tags)
- `updateTag` (Context.js) : POST `/api/updateTag` (modifie un tag)
- `tagContent` (Context.js) : POST `/api/tagContent` (tagging d’un segment de texte)
- `getTaggedContent` (Context.js) : GET `/api/taggedContent?expressionId=`
- `deleteTaggedContent` (Context.js) : GET `/api/deleteTaggedContent?id=`

**Fonctions serveur :**
- `GET /api/tags` : retourne la liste des tags d’un land
- `POST /api/tags` : sauvegarde la structure hiérarchique des tags
- `POST /api/updateTag` : modifie un tag
- `POST /api/tagContent` : crée un tag sur un segment de texte
- `GET /api/taggedContent` : retourne le contenu taggé
- `GET /api/deleteTaggedContent` : supprime un contenu taggé

**Résultat fonctionnel :**
- L’utilisateur gère la taxonomie des tags, tagge des segments de texte, visualise le contenu taggé.

---

## 5. Sélection de la base de données

**Déclencheur :**
- Sélection d’un fichier base de données dans DatabaseLocator.js

**Fonctions client :**
- `setDb` (Context.js) : GET `/api/connect?db=...`
- Si succès : chargement initial des lands, expressions, tags

**Fonctions serveur :**
- `GET /api/connect` : tente de se connecter à la base SQLite fournie

**Résultat fonctionnel :**
- L’application se connecte à la base, charge les données, l’UI est initialisée.

---

## 6. Gestion des domaines

**Déclencheur :**
- Sélection ou navigation vers un domaine dans Domain.js

**Fonctions client :**
- `getDomain` (Context.js) : GET `/api/domain?id=`

**Fonctions serveur :**
- `GET /api/domain` : retourne les infos d’un domaine

**Résultat fonctionnel :**
- L’utilisateur consulte les informations d’un domaine.

---

## 7. Gestion des médias associés à une expression

**Déclencheur :**
- Suppression d’un média dans Expression.js

**Fonctions client :**
- `deleteMedia` (Context.js) : POST `/api/deleteMedia`

**Fonctions serveur :**
- `POST /api/deleteMedia` : supprime un média associé à une expression

**Résultat fonctionnel :**
- Le média est supprimé, l’UI est mise à jour.

---

*Document exhaustif, à compléter si de nouveaux pipelines sont ajoutés.*
