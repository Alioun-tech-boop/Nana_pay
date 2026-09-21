# NanoPay — Sécurité Frontend

> Version : 0.2
> Portée : sécurité de l'application frontend NanoPay.
> Principe directeur : **le frontend est un environnement non fiable. Le backend est l'unique autorité de vérité, de permission et de fonds.**
> Le frontend applique des protections de **prévention UX** ; le backend applique la **décision de sécurité**.

---

## 1. Modèle de confiance

```text
Backend = décision (fonds, permissions, statuts, QR, retraits)
Frontend = présentation (masquer/exposer ce que le backend autorise)
```

Conséquence : **aucune** règle de sécurité critique ne repose sur un état côté client (bouton caché, route guard, `localStorage`, URL, flag React).

---

## 2. Authentification & sessions

1. **Jetons** : `accessToken` (courte durée, conseil 15 min) + `refreshToken` rotatif.
2. **Stockage** : jetons **en mémoire uniquement** (module de session). **Interdits** dans `localStorage`, `sessionStorage`, cookies sans `httpOnly`, URL.
   - Le `refreshToken` est conservé via canal sécurisé HTTP-only (cookie `SameSite`/`Secure`) ou en mémoire selon la capacité backend — jamais lisible par JS.
3. **Rotation** : chaque `auth/refresh` renvoie un nouveau `refreshToken` ; le précédent est révoqué.
4. **Expiration** : `logout` explicite acté ; expiration de session annoncée (`ProcessReview/handled in UX`) à l'utilisateur ; aucune fin de session muette.
5. **Centralisation** : un seul module `authService` + `apiClient` ; aucune librairie d'auth « dans le composant ».
6. Création de session, refresh, multi-devices : politique définie par le backend.

### 2.7 Mécanisme implémenté (état actuel du frontend)

- **Boot** : en mode réel, restauration via `GET /auth/me` (session cookie httpOnly backend) ; en mode mock, aucune session n'est restaurée — sans credentials persistés, une session ne peut exister après rechargement.
- **Refresh** : single-flight (`POST /auth/refresh`), rotation des jetons en mémoire, puis **un seul** retry de la requête initiale.
- **401** : refresh tenté une fois ; si l'échec persiste → purge session + message « session expirée » + redirection `/login`.
- **403** : session conservée, message traduit « accès refusé » — aucune logique de contournement.
- **Logout** : révocation du refresh token backend puis purge locale (toujours exécutée).

Détails dans `docs/FRONTEND_SECURITY.md` §3.8.

---

## 3. Autorisation

1. **Les rôles sont des contraintes backend.** `CLIENT · MERCHANT · BANK · ADMIN`.
2. Les guards de route côté frontend **masquent** l'interface — le backend **rejette** l'accès non autorisé (403).
3. **Ne jamais** accorder d'accès basé sur : `localStorage`, URL/query, état frontend, bouton caché, condition React.
4. Routes `/admin`, `/bank`, `/merchant` : protection UI **et** autorisation backend testées en e2e (accès refusé si backend refuse).

---

## 4. Transport

1. HTTPS uniquement ; pas de `fetch` nu dispersé — interceptor central (`apiClient`).
2. En-têtes : `Authorization: Bearer`, `Idempotency-Key` (mutations d'argent), `X-Request-Id` (corrélation), `Content-Type: application/json`.
3. CORS : politique backend stricte (origines explicites, credentials non exposés). Le frontend ne désactive jamais la policy.
4. Timeouts + `AbortController` sur démontage ; retries **bornés et idempotents** uniquement.

---

## 5. XSS / injection

1. **Interdiction** d'insérer du HTML non explicitement validé (`dangerouslySetInnerHTML`, `v-html`).
2. Le contenu rendu (nom de produit, description, messages) provient du backend **déjà assaini** ; le frontend ne reconstruit pas de HTML à partir de données brutes.
3. URL distantes (images, pièces jointes) exposées uniquement par le backend si fiables — le frontend valide le protocole (`https:`) quand il construit une URL.
4. Entrées utilisateur : validation UX (Zod) pour l'expérience — **la validation de sécurité est backend**.
5. Aucun eval / new Function / JSONP.

---

## 6. Stockage local & données sensibles

1. `localStorage`/`sessionStorage` : **interdit** pour jetons, balances, statuts de paiement, décisions de crédit, données bancaires.
2. Données financières : **chargées à la demande et gardées en mémoire** (cache de requêtes mémoire, invalidable). Pas de persistance financière.
3. Jamais de log de valeurs sensibles dans la console (jetons, documents, montants personnels).

---

## 7. Clés / secrets / environnements

1. **Zéro secret dans le bundle.** Les variables d'environnement exposées au navigateur sont les seules valeurs publiques (URL API, flags publics).
2. `.env.*` (avec secrets backend), certificats, clés : **jamais commités** ; bloqués par `.gitignore` + revue de PR.
3. Configuration par environnement : `dev / staging / prod`, URLs d'API distinctes, aucune valeur en dur.
4. Recherche de secrets en CI (`gitleaks`/équivalent) et revue manuelle du `git diff`.

---

## 8. Séparation des rôles (fuites de données)

1. **Contextes de requête isolés par rôle** : un `apiClient` commun, des services par domaine, **pas de state partagé de données sensibles entre rôles**.
2. Un utilisateur Client ne doit jamais recevoir ni voir de données Banque/Admin/Merchant ; réciproquement.
3. e2e de cloisonnement : `/bank` refusé pour Client, `/merchant` refusé pour Admin, etc.
4. Les données de session d'un rôle ne nourrissent jamais l'interface d'un autre rôle.

---

## 9. QR & retraits

1. Le QR est une **charge utile de transaction** générée côté backend.
2. Le frontend **n'évalue pas** la validité, l'expiration ou l'autorisation : il soumet les données scannées et **affiche la décision backend**.
3. Pas de paiement commerçant automatique à l'écran après scan — uniquement après `WITHDRAWAL_CONFIRMED` confirmé par le backend (puis règlement séparé).
4. `QrDisplay` : `expiresAt` fourni par le backend, compte à rebours, refresh contrôlé, aucun affichage obsolète comme valide.

---

## 10. Actions financières (idempotence & confirmation)

1. **Confirmation obligatoire** (`ConfirmDialog`) pour : `Confirm Payment`, `Submit Credit Request`, `Start Savings`, `Cancel Savings`, `Use Vault`, `Confirm Withdrawal`, `Confirm Delivery`, `Confirm Settlement` — avec montant/référence/méthode visibles.
2. **Double-clic** : action `disabled` + loading pendant l'appel.
3. **Idempotence** : `crypto.randomUUID()` par mutation (épargne, coffre, crédit, retrait, règlement) ; une répétition ne produit jamais de seconde opération.
4. **Aucun success UI avant confirmation backend** : un paiement Mobile Money ne devient « confirmé » que si le backend l'a confirmé.

---

## 11. Intégrité des données affichées

1. **Source de vérité backend** pour : prix, totaux, pénalités, intérêts, remboursements, soldes, statuts, éligibilité, extensions.
2. Aucun calcul financier autoritaire côté client ; les montants sont des entiers minor units venus du backend.
3. Refresh/back navigation : l'état est re-fetché, jamais reconstruit depuis la mémoire de la session.

---

## 12. Dépendances & tiers

1. Revue des dépendances avant ajout : utilité, maintenance, sécurité (`npm audit`/`pnpm audit` en CI), taille.
2. Aucun script tiers non maîtrisé (analytics/adversaires) sans revue ; les cookies/scripts tiers par défaut bloqués.
3. CSP recommandée (configuration du serveur hôte) : `script-src 'self'`, `frame-ancestors 'none'`, `object-src 'none'`.

---

## 13. Réponse aux incidents côté frontend

| Événement | Réaction |
|---|---|
| `401` sur refresh | Déconnexion silencieuse + redirection login |
| `403` | Affichage « accès refusé » (pas de détail de ressources !), pas de contournement |
| `404` sur données financières | Affichage générique « introuvable » (ne révéle pas l'existence) |
| Erreur réseau | Message utilisateur traduit (« Vérifiez votre connexion ») + retry borné |
| Veulerie de statut | Toute mutation sans succès → état `FAILED` visible, jamais « OK » |

---

## 14. Revue de sécurité (avant livraison)

1. Score d'audit de dépendances (zéro vulnérabilité critique).
2. Aucun secret détecté en CI.
3. e2e de cloisonnement des rôles verts.
4. Lighthouse : `best-practices ≥ 90`, `a11y = 100`.
5. Aucun `dangerouslySetInnerHTML`/vulnérabilité introduit.
6. Aucun jeton persistant dans le stockage navigateur.
7. Double clic + idempotence vérifiés sur toutes les mutations financières.