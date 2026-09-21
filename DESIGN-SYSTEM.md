# NanoPay — Design System

> Version : 0.2 (PROPOSED — direction « NanoPay Nuit »)
> Statut : contrat de conception pour l'identité visuelle NanoPay. À figer (valeurs hex finales) lors de la validation visuelle en Phase 1.
> Principe : **une identité propriétaire, pas un template.** Aucun kit SaaS, aucun dashboard générique, aucune UI « IA ».
> Chaque valeur est un token CSS (`--np-*`) rendu disponible à l'échelle de l'application.
>
> ⚠️ **Implémentation en cours** : les valeurs exactes et l'API réelle du design system font foi dans [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md). En cas de divergence, le code et `docs/DESIGN_SYSTEM.md` priment sur ce contrat indicatif.
>
> 🎨 **Direction actuelle** (décidée avec la direction artistique, non copiée de quelque marque que ce soit) : fintech **premium sombre** — profondeur `night`, typographies blanches hiérarchisées `moon`, deux halos contrôlés (brand/gold) sur les surfaces mises en avant, cartes financières immersives, grandes balises éditoriales sur les pages publiques. L'ancienne direction « fonds clairs » est abrogée.

---

## 1. Positionnement

NanoPay est une **fintech de confiance** : sérieuse, précise, rapide, silencieuse-paisible.

- La confiance se lit dans la **hiérarchie** et la **sobriété**, pas dans la décoration.
- L'argent est une valeur **calme** : fonds sombres profonds, accents limités, chiffres tabulaires.
- 4 rôles (Client, Commerçant, Banque, Admin) partagent **un seul langage visuel** ; le rôle est signalé par la navigation, pas par un re-design.

### Interdits
- Dégradés décoratifs aléatoires, glassmorphism hors chrome sticky, ombres colorées, cartes sans contenu, emojis dans l'UI, animations non fonctionnelles, titres géants dans les interfaces fonctionnelles, boutons génériques.

---

## 2. Tokens de couleur

### 2.1 Primitives (palette physique)

| Token | Valeur | Usage |
|---|---|---|
| `--np-color-ink-900` | `#0B1220` | Texte primaire, fond d'encre (surfaces sombres) |
| `--np-color-ink-600` | `#5A6474` | Texte secondaire |
| `--np-color-ink-400` | `#98A1B0` | Texte désactivé, placeholder |
| `--np-color-paper-0` | `#FFFFFF` | Surfaces primaires |
| `--np-color-paper-50` | `#F6F8FA` | Surfaces secondaires, fond de page |
| `--np-color-paper-100` | `#EDF0F4` | Bordures, séparateurs, fond de champs |
| `--np-color-brand-700` | `#0A3D7A` | Accent profond (boutons hover, liens) |
| `--np-color-brand-600` | `#0B4B92` | Accent primaire (boutons, focus) |
| `--np-color-brand-500` | `#0F63C8` | Accent réactif (focus, actif) |
| `--np-color-brand-100` | `#E3EDFB` | Fond d'accent doux, badges actifs |

### 2.2 Sémantique (fonctionnelle, jamais décorative)

| Token | Valeur indicative | Usage |
|---|---|---|
| `--np-color-success-600` | `#1B7A43` | Confirmé, payé, validé |
| `--np-color-success-100` | `#E4F3EA` | Badge succès |
| `--np-color-warning-600` | `#9A5B00` | En attente, attention |
| `--np-color-warning-100` | `#FDF0DD` | Badge attention |
| `--np-color-danger-600` | `#B3261E` | Échec, rejet, pénalité, refus |
| `--np-color-danger-100` | `#FCEBEA` | Badge erreur |
| `--np-color-neutral-600` | `#5A6474` | Neutre, en cours |

Règle : **jamais de couleur seule pour porter une information.** Un statut = couleur + icône + libellé (`✓ Confirmé` / `! Échec`).

### 2.3 Thèmes par rôle

Les rôles ne réinventent pas la palette : ils réutilisent les tokens sémantiques.
- **Client** : navigation sobre, accent standard.
- **Commerçant** : même tokens, section « caisse/retraits » mise en avant par la navigation.
- **Banque** : même tokens, dominance de surfaces `paper` (dossier, analyse).
- **Admin** : même tokens, dominance de tableaux et de statuts.

---

## 3. Typographie

- Famille : une seule famille système/SF dédiée (à valider) — ex. `Inter` ou `system-ui` — **avec chiffres tabulaires activés**.
- Tokens :

| Token | Taille / Poids | Usage |
|---|---|---|
| `--np-type-display` | 36 / 700 | Écrans de solde, montants hero |
| `--np-type-heading-1` | 28 / 650 | Titres de page |
| `--np-type-heading-2` | 20 / 600 | Sous-sections |
| `--np-type-heading-3` | 16 / 600 | Cartes, groupes |
| `--np-type-body` | 14 / 400 | Corps de texte |
| `--np-type-body-sm` | 13 / 400 | Détails, metadata |
| `--np-type-caption` | 12 / 500 | Libellés, aides |
| `--np-type-numeric` | tabular-nums | Tous les montants |

- Interligne : 1.5 corps / 1.3 titres. Interlettrage resserré sur les montants.
- Règle d'or : **le montant est le premier élément visuel** d'une carte financière.

---

## 4. Espacement & grille

- Échelle : `4 · 8 · 12 · 16 · 24 · 32 · 48` px (base 4).
- Tokens : `--np-space-1 … --np-space-7`.
- Grille de contenu : 8 colonnes (mobile) → 12 (desktop), gouttière 16/24 px, largeur max de contenu `1120 px`.
- Zone de frappe tactile minimale : **44 × 44 px**.

---

## 5. Rayons & ombres

| Token | Valeur | Usage |
|---|---|---|
| `--np-radius-sm` | 6 px | Inputs, badges |
| `--np-radius-md` | 10 px | Cartes, boutons |
| `--np-radius-lg` | 14 px | Modales, panneaux |
| `--np-shadow-sm` | `0 1px 2px rgba(11,18,32,.06)` | Élévation légère |
| `--np-shadow-md` | `0 6px 16px rgba(11,18,32,.10)` | Modales, overlap |
| `--np-shadow-focus` | `0 0 0 3px var(--np-color-brand-100)` | Focus visible (clavier) |

Pas d'ombre sur les surfaces de base. Pas de « halo » coloré.

---

## 6. Motion

| Token | Valeur |
|---|---|
| Durée rapide | 120–150 ms (hover, focus, toggles) |
| Durée standard | 180–200 ms (modales, transitions de panneau) |
| Easing | `cubic-bezier(0.25, 0.1, 0.25, 1)` |
| Réduction | Respect de `prefers-reduced-motion` : aucune animation décorative |

La motion sert **l'état** (chargement, confirmation, progression de commande, transition QR, modal) — jamais la décoration.

### 6.1 Motion de page
Chaque navigation déclenche une entrée de page `<EnterTransition>` (fade-up 180 ms, keyé sur le `pathname`, scroll reset). Les modales, drawers, toasts et menus ont déjà leurs transitions d'entrée. Aucune animation de sortie qui retarde une action financière.

### 6.2 Compteurs financiers
Montants mis en avant (épargne progressée, solde du coffre, restant de crédit) : compteur progressif `useAnimatedNumber` (ease-out, 450 ms) via la prop `animate` de `MoneyAmount`. Opt-in par défaut ; les montants en table restent statiques (pas de distraction sur les données transactionnelles).

### 6.3 Micro-interactions
Hover des cartes interactives (`Card`, `ProductCard`, `StoreCard`) : `translateY(-1px)` + ombre (120–150 ms). `ProgressBar` animé en `transform: scaleX`. `Timeline` : cascade d'entrée (40 ms/étape). Seuls `transform`/`opacity` sont animés (pas de layout shift).

---

## 7. Composants

Chaque composant : variantes + états explicites (`default / hover / focus / disabled / loading / error`) + contrat de props typées + test RTL. Aucun `any`.

### 7.1 Primitives
| Composant | Règles |
|---|---|
| `Button` | 3 variantes : `primary` (accent), `secondary` (outline), `ghost`. États loading (spinner + `disabled`), désactivé explicite, taille `sm/md/lg`. Pas de variante « décorative » |
| `Input` / `Select` / `Checkbox` / `Radio` | Contraste ≥ 3:1, focus `--np-shadow-focus`, labels associés, erreur liée au champ (`aria-describedby`) |
| `FieldError` | Message d'erreur de champ, associé au champ, `role="group"`/`aria-invalid` |
| `Badge` | Sémantique uniquement (statuts), couleur + icône + libellé |
| `Skeleton` | Chartgement de contenu, jamais de spinner plein écran sans raison |

### 7.2 Feedback / affichage
| Composant | Règles |
|---|---|
| `Toast` | Confirmation / erreur post-action ; `role="status"` ou `role="alert"` selon gravité ; autoclose lent pour succès, persistant pour erreur |
| `InlineAlert` | Erreur de page / réseau : `{ code, title, detail }`, jamais de message technique brut |
| `ConfirmDialog` | Actions d'argent : `Confirm Payment`, `Confirm Withdrawal`, `Start Savings`, `Submit Credit Request`, `Use Vault`, `Confirm Delivery`, `Cancel Savings`. Affichage des **conséquences** (montant, référence, méthode) + boutons `Cancel` / action principale `disabled` pendant l'appel |
| `EmptyState` | « Quoi / pourquoi / action suivante » — ex. `Aucun achat pour le moment.` + CTA `[Explorer les produits]` |
| `ErrorState` | Échec de chargement + action de retry |
| `StatusPill` | Statut de commande/paiement/retrait via enum backend, mapping 1:1 |

### 7.3 Montants
| Composant | Règles |
|---|---|
| `Amount` | Format `Intl.NumberFormat('fr-FR', { style:'currency', currency })` depuis `{ amount, currency }` minor units ; `tabular-nums` ; jamais concaténé à la main |
| `MoneyInput` | Saisie décimale verrouillée, précision par devise, valeurs envoyées en minor units |

### 7.4 Domaines
| Composant | Périmètre |
|---|---|
| `OrderCard`, `OrderSummary`, `OrderTimeline` | Affichent le cycle de vie via statuts backend : `✓ Commandée → ○ Financée → ○ QR → ● Retrait en attente → …` (étapes jamais inventées) |
| `SavingsCard` | Cible, épargné, progression, échéance, extension max (2 mois) — **toutes données backend** |
| `VaultCard` | Solde coffre, historique, affectation à commande — **data backend** |
| `CreditRequestCard`, `CreditSimulation` | Simulation **indicative** explicitement marquée « sous réserve de validation » |
| `QrDisplay` | QR depuis `payload` backend + `expiresAt` (compte à rebours) + bouton refresh + état d'expiration |
| `ScanSurface` | Scanner Commerçant ; n'affiche jamais « valide » par lui-même — attend la décision du backend |
| `WithdrawalForm` | Demande de retrait, confirmation obligatoire |
| `PaymentReceipt` | Reçu de paiement (commande, montant, méthode, statut) |
| `BankReviewCard` | Dossier de crédit pour la Banque (profil, documents, décision) |
| `AdminTable` | Supervision : pagination, tri, statuts, filtre d'audit |

### 7.5 Navigation
| Composant | Règles |
|---|---|
| `RoleShell` | Sidebar (navigation de rôle) + top bar (contexte, session, logout) + zone de contenu. Responsive : sidebar → drawer sur mobile |
| `TopBar` | Identité, environnement (badge `DEV/STAGING` optionnel `[EXTENSION]`), rôle, utilisateur, déconnexion |
| `Tabs` | Sous-navigation de section, focus clavier |

---

## 8. Accessibilité (baseline du design system)

- Focus visible sur **toute** l'app (`--np-shadow-focus`), navigation 100 % clavier.
- Landmarks : `<header>`, `<nav>`, `<main>` ; hiérarchie H1…H3 stricte.
- Contrastes : texte ≥ 4,5:1 ; composants ≥ 3:1 ; montants jamais gris clair.
- Messages d'erreur : annoncés via `aria-live` / `role="alert"`, liés aux champs.
- Réduction de mouvement respectée.
- Information jamais portée par la couleur seule.

---

## 9. Icônes

- **Une** librairie unique d'icônes (SVG inline, stroke 1.5, 20/24 px), chargées à la demande (pas de bundle d'icônes entier).
- Rôle des icônes : accompagner le statut et la navigation, jamais remplacer le texte des montants.
- Skeuomorphisme interdit.

---

## 10. Mise en œuvre (tokens en code)

- Tokens CSS exposés comme variables : `:root { --np-… }` + utilitaires JS (thème, `getToken`) pour ce qui est dynamique.
- Un module `formatMoney(amount, currency)` unique, testé, alimenté par `Intl`.
- Aucune couleur hexadécimale en dur dans les composants : **toujours** via token.
- Build : le CSS du design system est inliné (critique) au chargement initial.

---

## 11. Garde-fous de revue visuelle

- Une nouvelle variante de composant n'est ajoutée qu'après : justification (besoin réel), schéma de tokens, revue UX.
- Le design system évolue par **PR ciblées** documentées, pas par ajout opportuniste.
- Chaque page reçoit une revue visuelle (desktop + mobile) avant d'être déclarée « done ».