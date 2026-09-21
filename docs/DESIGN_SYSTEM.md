# NanoPay — Design System (implémentation)

> Statut : **implémentation** — source de vérité visuelle du frontend.
> Auteur : direction artistique NanoPay (langage « NanoPay Nuit » — fintech premium sombre).
> Docs/  — ce document remplace les valeurs indicatives de `DESIGN-SYSTEM.md` (racine) quand elles divergent : le code et ce document font foi.

NanoPay partage **un seul langage visuel** pour les 4 rôles (Client, Commerçant, Banque, Admin).
Le rôle est exprimé par la **navigation** et le **contexte**, jamais par un re-design.

---

## 1. Principes

- **Hiérarchie et sobriété** avant décoration. La confiance naît de la clarté.
- L'argent est une valeur **calme** : fonds sombres profonds (`night`), typographies blanches hiérarchisées (`moon`), **interface en noir et blanc** (aucune couleur décorative, tous les accents sont monochromes), chiffres tabulaires (`tabular-nums`), halo de marque discret — blanc — sur les surfaces mises en avant.
- **Un montant n'est jamais ambigu** : montant + devise, formatés avec `Intl.NumberFormat` (`fr-FR`).
- Les états financiers viennent **du backend** : le design system affiche, il ne décide pas.
- Accessibilité non négociable : focus visible, contraste, labels, `aria` ; jamais d'information par la couleur seule.

### Interdits (identité « NanoPay Nuit »)

- Dégradés décoratifs **aléatoires**, blobs, esthétique « dashboard IA » (violet, glow partout), glassmorphism hors chrome sticky.
- Ombres colorées ; le relief vient des **surfaces** (contraste `night`/`moon` en alpha) et de **halos blancs discrets** réservés aux tokens `--np-surface-hero`/`hero-strong` et aux pages publiques.
- Toute couleur autre que noir / blanc / gris : plus d'accents teintés (brand, gold, cyan) ni d'états colorés (success/warning/danger). La distinction vient des **icônes, libellés, poids et surfaces**.
- Boutons « pill » généralisés (rayons `sm`–`md`), polices fantaisie, emojis, mascottes, animations décoratives qui retardent une action.
- Titres massifs **décoratifs** qui écrasent l'information ou débordent sur mobile ; la hiérarchie (display → h1 → h2 → h3) doit rester lisible, fluide (`clamp`) et cohérente sur toutes les pages.

---

## 2. Utilisation

```tsx
import { ThemeProvider } from './design-system'

createRoot(el).render(
  <ThemeProvider lang="fr">
    <App />
  </ThemeProvider>,
)
```

- `<ThemeProvider>` injecte `:root { --np-* }` (tokens CSS) et `global.css` (reset, polices, keyframes, reduced-motion).
- Polices auto-chargées via `@fontsource-variable` (voir `package.json`) : Schibsted Grotesk Variable, Inter Variable, IBM Plex Mono.
- Tout composant s'importe depuis le barrel `src/design-system/index.ts` (et ses sous-barrels `primitives/`, `display/`, etc.).
- Les composants utilisent des **CSS Modules** (`*.module.css`) : ne pas écrire de styles globaux ad hoc dans les écrans.

---

## 3. Tokens (`--np-*`)

Générés par `src/design-system/tokens/index.ts` (`tokenStyles()` → `:root`). Groupe modèle convexe : `--np-<groupe>-<nom>`.

### 3.1 Couleurs — palette physique

| Token | Valeur |
|---|---|
| `--np-color-night-950` | `#0A0A0A` (fond de page) |
| `--np-color-night-925` | `#111111` (background secondaire) |
| `--np-color-night-900` | `#181818` (surface) |
| `--np-color-night-800` | `#202020` (surface élevée) |
| `--np-color-night-700` | `#292929` (surface forte) |
| `--np-color-night-600` | `#333333` |
| `--np-color-night-500` | `#3D3D3D` |
| `--np-color-moon-0` | `#FFFFFF` (texte primaire) |
| `--np-color-moon-50` | `#F2F3F6` |
| `--np-color-moon-100` | `#E6E8EE` |
| `--np-color-moon-200` | `#C9CDD8` |
| `--np-color-moon-300` | `#A8AEBE` |
| `--np-color-moon-400` | `#82899B` |
| `--np-color-moon-500` | `#646B7C` |
| `--np-color-ink-950` | `#0A0A0A` |
| `--np-color-ink-900` | `#101010` |
| `--np-color-ink-800` | `#171717` |
| `--np-color-ink-700` | `#1F1F1F` |
| `--np-color-ink-600` | `#292929` |
| `--np-color-ink-500` | `#373737` |
| `--np-color-ink-400` | `#4E4E4E` |
| `--np-color-ink-300` | `#6F6F6F` |
| `--np-color-ink-200` | `#9C9C9C` |
| `--np-color-ink-100` | `#D6D6D6` |
| `--np-color-ink-50` | `#ECECEC` |
| `--np-color-paper-0` | `#FFFFFF` (fonds clairs, boutons primaires, QR) |
| `--np-color-paper-50` | `#F7F8FB` |
| `--np-color-paper-100` | `#EFF1F6` |
| `--np-color-paper-200` | `#E3E6EE` |
| `--np-color-brand-800` | `#0A0A0A` |
| `--np-color-brand-700` | `#161616` |
| `--np-color-brand-600` | `#1C1C1C` (texte sur chips clairs) |
| `--np-color-brand-500` | `#FFFFFF` (action/focus principale) |
| `--np-color-brand-400` | `#D9D9D9` (bordures/ui, halo) |
| `--np-color-brand-300` | `#B2B2B2` (texte accent) |
| `--np-color-brand-200` | `#8C8C8C` |
| `--np-color-brand-100` | `#E6E6E6` |
| `--np-color-brand-50` | `#F2F2F2` |
| `--np-color-gold-700` | `#1C1C1C` |
| `--np-color-gold-600` | `#333333` |
| `--np-color-gold-500` | `#9A9A9A` |
| `--np-color-gold-400` | `#A8A8A8` |
| `--np-color-gold-300` | `#B2B2B2` |
| `--np-color-gold-100` | `#ECECEC` |
| `--np-color-cyan-900/800/700` | `#161616` `#1D1D1D` `#242424` |
| `--np-color-cyan-600/500/400` | `#2C2C2C` `#9A9A9A` `#A8A8A8` |
| `--np-color-cyan-300/200/100` | `#BBBBBB` `#D6D6D6` `#ECECEC` |
| `--np-color-success-700/600/500/400/300` | `#1C1C1C` `#333333` `#9A9A9A` `#A8A8A8` `#D4D4D4` |
| `--np-color-warning-700/600/500/400/300` | `#1C1C1C` `#333333` `#9A9A9A` `#A8A8A8` `#D4D4D4` |
| `--np-color-danger-700/600/500/400/300` | `#1C1C1C` `#333333` `#9A9A9A` `#B8B8B8` `#CFCFCF` |

### 3.2 Sémantiques

`--np-bg-*` : `page` (night-950 `#0A0A0A`), `surface` (night-925 `#111111` — background secondaire), `surface-2` (night-900 `#181818` — surface, cartes par défaut), `surface-3` (night-800 `#202020` — surface élevée, hover), `surface-4` (night-700 `#292929` — surface forte, press), `shimmer` (night-700), `overlay` (`color-mix(night-950 58%)`).

`--np-text-*` : `primary` (`#FFFFFF`), `secondary` (`#A6A6A6`), `tertiary` (`#6F6F6F`), `disabled` (`rgba(255,255,255,0.3)`), `on-brand` (night-950 — noir sur action blanche), `on-surface` (moon-0), `on-gold` (night-950).

`--np-border-*` : `base` (`rgba(255,255,255,0.12)`), `strong` (`rgba(255,255,255,0.16)`), `on-strong` (`rgba(255,255,255,0.28)`).

`--np-surface-*` : `raised` (bg-surface-3), `raised-strong` (bg-surface-4). Les surfaces immersives `hero` / `hero-strong` référencent les tokens `--np-gradient-hero-brand` / `--np-gradient-hero-strong` (halos blancs discrets sur fond night).

`--np-domain-*` : accents par module (`savings`, `vault`, `credit`, `payment`, `confirmation`), chacun avec `-accent-text/-bg/-border/-solid`. Tous sont **monochromes** (déclinaisons de gris) : la différenciation vient de l'icône, du libellé et de l'état, jamais d'une couleur.

`--np-gradient-*` : `hero-brand`, `hero-strong` — définition unique des halos (cf. `tokens/gradient.ts`).

`--np-state-*` : états de composants centralisés — `hover-surface`, `press-surface`, `hover-border`, `focus-border`, `selected-surface/text/border` (navigation active, onglets), `disabled-opacity`. Les composants interactifs (Button, Input, Navigation, Tabs, Pagination…) référencent ces tokens au lieu de valeurs dispersées.

`--np-action-*` : `primary` (moon-0 blanc), `primary-hover` (`#EDEDED`), `primary-active` (`#DCDCDC`), `primary-soft` (`color-mix(moon-0 14%)`), `primary-soft-hover` (`color-mix(moon-0 22%)`), `danger` (`#F2F2F2`), `danger-hover` (`#E2E2E2`), `danger-soft` (`color-mix(moon-0 14%)`). Le bouton `danger` est **outline** (transparent + bordure) dans `Button`.

`--np-status-*` : `success-text/bg`, `warning-text/bg`, `danger-text/bg`, `info-text/bg`, `neutral-text/bg` — textes en `*-400/300` lumineux, fonds translucides (`color-mix` 16 %) (cf. `color.ts`).

`--np-focus-ring` : `0 0 0 3px color-mix(brand-500 32%), 0 0 0 1px brand-400`.

### 3.3 Typographie

| Token | Valeur |
|---|---|
| `--np-font-sans` | Inter Variable |
| `--np-font-display` | Schibsted Grotesk Variable |
| `--np-font-mono` | IBM Plex Mono |

Échelle : `display-2` (héros, ex. solde/somme) `clamp(48px,10.5vw,116px)`/0.92/650/-0.045em, `display` (campagnes publiques) `clamp(40px,8vw,84px)`/0.95/640/-0.04em, `h1` (titre d'écran) `clamp(30px,5.4vw,52px)`/1.02/640/-0.032em, `page-title` (équivalent titre de page client) `clamp(28px,4.8vw,46px)`/1.04/640/-0.03em, `h2` (section) `clamp(22px,3.4vw,30px)`/1.12/620/-0.024em, `h3` (carte) `clamp(16.5px,2vw,19px)`/1.25/620/-0.014em, `body-lg` 16/25, `body` 15/23, `body-sm` 13/19, `caption` 12/17/500, `label` 11.5/12/600/+0.08em, `code` 12.5/18/500.

Échelle financière : `money` (montant courant) `clamp(22px,3.2vw,28px)`/1.04/650/-0.022em, `money-strong` `clamp(18px,2.4vw,22px)`/1.1/650/-0.016em, `money-display` (solde héros) `clamp(34px,7.5vw,80px)`/0.94/660/-0.04em. Tokens correspondants : `--np-type-*` et `--np-font-*` (`monetary` reste un alias de `money`). Les titres sont **massifs et fluides** (`clamp`), line-height serré et letter-spacing négatif ; les montants sont toujours hiérarchisés au-dessus de leurs labels et dominent visuellement les autres textes, la devise (`FCFA`) restant volontairement sous-dominante.

### 3.4 Espacement

`--np-space-0..13` : `0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 120 px`. Conteneurs `--np-container-max 1120px` et breakpoints `bp-sm 640, bp-md 768, bp-lg 1024, bp-xl 1280 px`.

### 3.5 Coins & ombres

Rayons `--np-radius-*` : `none 0, xs 8, sm 12, md 16, lg 24, xl 32, pill 999, full 999`. `xs/sm/md` couvrent badges, contrôles et cartes ; `lg/xl` les dialogues, feuilles et cartes ; `pill` les pastilles et éléments circulaires. Les alias `--np-radius-1` (→ `xs` — chips, tuiles, icônes) et `--np-radius-2` (→ `xl` — panneaux, sections, cartes sur mesure) sont définis dans le groupe `radius` et restent émis pour compatibilité.

Ombres `--np-shadow-*` : `none, xs, sm, card, md, lg, floating` — noires, multi-couches ; `card` (`0 20px 60px rgba(0,0,0,.35)`) est l'ombre par défaut des cartes pour les faire flotter ; `floating` pour les surfaces détachées (modales, toasts). Pas d'ombres colorées ni de grandes ombres Material ; le relief vient des surfaces et des halos contrôlés.

### 3.6 Durées, easing, z-index

`--np-duration-*` : `instant 0, fast 120, base 180, normal 180, slow 280, slower 420 ms` (`normal` = alias sémantique de `base`).
`--np-ease-*` : `out (0.22,1,0.36,1)`, `in (0.4,0,1,1)`, `in-out (0.65,0,0.35,1)`, `snap (0.2,0.9,0.3,1.22)`.
`--np-z-*` : `base 0, content 1, card 10, sticky 100, navigation 200, dropdown 200, drawer 260, modal 300, dialog 300, toast 400`.

---

## 4. Typographie (composants)

`Heading` : `as` (tag, défaut `div`), `variant` ∈ `display | h1 | h2 | h3`, `id`, `className`.
`Text` : `variant` ∈ `body | body-lg | body-sm | caption | label | code | monetary`, `as`, `align`, `color` (`primary|secondary|tertiary|disabled`), `tabular` (default true — chiffres alignés).

Règle : titres massifs et fluides ; `display-2` réservé aux héros (solde, montants clés), `display` aux pages publiques (landing), `h1` aux titres d'écran, `h2` aux sections, `h3` aux cartes. La devise est rendue dans un span `.amountCurrency` (taille `max(11px, 0.62em)`, couleur tertiary) pour que le nombre domine ; `monetary`/`money` uniquement pour de l'argent via `Amount`.

---

## 5. Icônes & logo

- `Icon` : `name` (47 icônes, tracé stroke 1.5 SVG inline), `size` (px, défaut 20), `title` (accessibilité), props SVG. Liste : `iconNames`.
- `Logo` / `LogoMark` : « puce nano » propriétaire + wordmark « NanoPay » (le mot « Pay » en couleur de marque). Ne jamais remplacer par une autre marque.
- Les icônes sont toujours reprises dans le même tracé (pas de mélange de familles/épaisseurs).

---

## 6. Primitives (`primitives/`)

- **Button** : `variant` ∈ `primary | secondary | ghost | danger`, `size` ∈ `sm | md | lg`, `loading` (→ Spinner, désactive, non-cliquable), `fullWidth`, `leadingIcon`/`trailingIcon`. `disabled` et `loading` bloquent les doubles soumissions d'actions financières.
- **IconButton** : `icon`, `label` (accessibilité — remplacer `aria-label`), `variant`, `size`, `active`. Ne jamais étiqueter une action icon-only sans `label`.
- **Spinner** : tailles 14/16/20, couleur héritée du texte.
- **Input / Select / Textarea** : `label`, `hint`, `error` (→ `FieldError`), `leadingIcon`, `id` auto si absent (`useId`), `aria-describedby` computé (error > hint), `aria-invalid`.
- **SearchInput** : champ de recherche (icône, reset, `clearable`, suggestions listées sans autocomplete).
- **PhoneInput** : champ téléphone avec indicatif (UEMOA) dans un Select intégré.
- **OTPInput** : code à N chiffres (accolage, collage, clavier).
- **Combobox** : autocomplete accessible (listbox, navigation clavier, groupes, hint), selon la même autorité que `Select` (options métier → backend).
- **DateInput** : saisie date en segments (jj/mm/aaaa).
- **FileUpload** : glisser-déposer + bouton, erreur, aperçu liste, drag active.
- **Checkbox / Radio / RadioGroup / Switch** : contrôles accessibles (focus visible, `aria-checked`), ex. `<RadioGroup name label>` + `<Radio value label>`.

Règles : la validation frontend est **UX**, jamais le seul garde-fou ; le backend reste l'autorité (`AGENTS.md`).

---

## 7. Layout (`layout/`)

- `Stack` : colonne, `gap` ∈ échelle `--np-space-*`, `align`, `justify`.
- `Inline` : ligne avec `wrap` (défaut), `gap` (défaut 12), `align`, `justify`.
- `Divider` : séparateur léger.
- `Section` : bloc sémantique (`section`), `title`, `description`, `eyebrow`, `actions`, liens d'ancrage inutiles évités.

---

## 8. Affichage (`display/`)

- **Avatar** : `name` + `src`/`icon`/`initials`, `size`, `tone`, `statusDot`.
- **Badge** : `tone` ∈ `neutral | info | success | warning | danger`, `icon`.
- **StatusPill** : même tonality + pastille indicative, option `pulse` (en attente/processing).
- **StatusBadge** : mappe un statut métier vers un tone + libellé (`COMPLETED → success ✓`, `PENDING → warning`, `CANCELLED → neutral`). Ne jamais traduire un statut inconnu en un état flou.
- **Card** : alias historique de **NanaCard** (même fondation) — `padding`, `interactive`, `selected`, `disabled`, `onClick`.
- **Skeleton / SkeletonText / SkeletonTextHeader** : états de chargement ; ne jamais afficher de pages vides (cf. `AGENTS.md` §23). Pas de `variant="circle"` : passer `width`/`height`/`radius`.
- **ProgressBar / ProgressRing** : `value` (0–100), `max`, `tone`, `label`/`showValue`. Le ring est SVG (safe SSR). Utilisés pour *afficher* une progression venue du backend (épargne, financement) — jamais calculée localement comme autorité.
- **Metric** : statistique avec `label`, `value`, `delta`, `hint`, `loading` (`value` optionnel).
- **Timeline / Stepper** : cycle de vie explicite (`done | active | upcoming | error`), chaque étape avec libellé textuel (jamais couleur seule), responsive (vertical mobile / horizontal desktop pour Stepper).
- **Table / TableContainer / THead / TBody / TFoot / Tr / Th / Td** : primitives sémantiques, `dense`, `hover`, `align` (`start|center|end`, retiré du DOM), colonnes sticky désactivées par défaut.
- **DataTable** : `columns` (label, align, className, `render`), `rows`, `loading` (squelettes lianes), `emptyState`, `caption`, `rowKey`, `onRowClick` (clavier Enter/Espace), `TFoot` re-exportée pour total.
- **TransactionRow** : ligne de transaction (titre, montant signé via `MoneyAmount`, statut, date, avatars) + `TransactionRowSkeleton`.
- **ProductCard** : carte produit (image ou placeholder, nom, prix, `selected`, sélection clavier), `footer`.
- **StoreCard** : carte marchand (logo via `Avatar`, nom, catégorie, stats, taux, notes) + `StoreCardSkeleton`.
- **OrderStatus** : affiche `Synchronisé`/`Validation en attente`/`Connexion requise` selon l'état de synchronisation backend.

### Cartes premium (`cards/`)

Fondation unique : surface sombre (`--np-bg-surface-2`), bord `--np-border-base` (`rgba(255,255,255,0.12)`, très subtil), ombre `--np-shadow-card` (`0 20px 60px rgba(0,0,0,.35)`, la carte flotte), **rayon par défaut `xl 32`** — toutes les cartes sont arrondies, finition fine et humanisée (`lg 24` pour les cartes compactes), padding mobile `sm 16 / md 20 / lg 24` puis desktop `md 24 / lg 32`. Liseré lumineux supérieur discret ; aucune esthétique Material (pas de ripple, pas d'ombre colorée, pas de coins génériques).

États : `default`, `hover` (translation `-2px` + surface plus claire + bord renforcé), `pressed` (retour à `0` + `surface-4`), `focused` (`--np-focus-ring`), `disabled` (opacité `--np-state-disabled-opacity`), `loading` (contenu estompé + `Spinner` centré, `aria-busy`). Accent par domaine via `tone` (`savings | vault | credit | payment | confirmation | danger`) : différencie un module, jamais décoratif.

- **NanaCard** : primitif (`padding`, `radius`, `tone`, `elevation`, `interactive`, `selected`, `disabled`, `loading`, `onClick`, `aria-label`).
- **NanaCardElevated** : `NanaCard` en élévation renforcée (`bg-surface-3`, `shadow-md`, hover `shadow-lg`).
- **NanaCardInteractive** : `NanaCard` avec états interactifs.
- **NanaPhotoCard** : la photo fait **partie de la composition** (jamais un rectangle posé). Média plein cadre clippé par la carte, ratio via `mediaRatio` (`16/11` par défaut), gradient `transparent → dark → surface noire`, vignette interne, image désaturée (`saturate(.94) contrast(1.03)`) et zoom `1.03` au survol. Le texte est rendu par l'interface (jamais incrusté dans l'image) : `label`, `amount` (`MoneyAmount` fort), `caption` en surimpression, puis section `title` + `titleMeta` + `progress` (`ProgressBar`), et pied `actionLabel` avec chevron (ou `action` personnalisé). `variant` pilote le gradient cinématographique du placeholder ; sans `image`, un fond composé + icône est affiché.
- **Variantes photo** (`NanaPhotoVariants.tsx`) : `SavingsPhotoCard`, `TravelPhotoCard`, `FamilyPhotoCard`, `BusinessPhotoCard`, `GoalPhotoCard`, `LifestylePhotoCard` — wrappers pré-réglant `variant`/`tone`/`icon`/`mediaRatio`/`title`/`actionLabel`, tout surchargeable via les mêmes props.
- **NanaAccountCard** : carte compte (label, numéro masqué mono, solde `MoneyAmount variant="display"`, titulaire, action) sur halo `--np-surface-hero`.
- **NanaStatCard** : `NanaCard` + `Metric` (label, valeur, `delta`, `hint`, `icon`, `loading`).
- **NanaTransactionCard** : `NanaCard` + `TransactionRow` / `TransactionRowSkeleton` (titre, montant signé, statut, date).
- **NanaSecurityCard** : icône + titre + description + état (`active | pending | disabled`) et action optionnelle.
- **NanaGoalCard** : objectif d'épargne (épargné, cible, `ProgressBar` or, échéance, action) ; le pourcentage affiché est borné et **purement présentationnel** (les valeurs viennent du backend).

### Actions rapides (`quick-actions/`)

- **NanaQuickAction** : action rapide = cercle elevated (`--np-bg-surface-3`, 52 px, radius pill) + icône 22 px + label 13 px (`--np-type-body-sm-size`, poids 600), parfaitement centrés. `variant` ∈ `recharge | send | withdraw | pay | scan | more` préréglant icône + label (surchargeables via `label`/`icon`), plus `loading`, `disabled`, `badge`, `onClick` et l'`aria-label` toujours défini (nom accessible stable pendant le chargement). Micro-interactions : hover (surface `-4`, label `primary`), press (`scale(0.96)`, `--np-duration-fast`, jamais spectaculaire), focus visible (`--np-focus-ring` sur le cercle), réduites sous `prefers-reduced-motion`.
- **NanaQuickActions** : grille responsive (`nav` nommée) — les actions s'étirent pour remplir la ligne (4 par ligne sur mobile lorsque l'espace le permet), sinon **défilement horizontal** (`overflow-x: auto`, snap) sans jamais compresser les éléments.
- Chaque variante reste une **action de navigation** : la route, la permission et la confirmation demeurent décidées par l'appelant et le backend.

---

## 9. Argent (`money/`)

- **Amount** : `value` (minor units), `currency` (ex. `XOF`), `variant` ∈ `display | default | inline | strong`, `signed` (signe +/−), `noSymbol`, `aria-label` par défaut `"<montant> <devise>"`. Affiche un montant **clair et sans ambiguïté** : `250 000 XOF`.
- **MoneyAmount** : alias convivial acceptant `amount` (+ `currency` = `XOF` par défaut, `signed`, `variant`, `noSymbol`) → délègue à `Amount`. Préféré pour les montants métier explicites.
- `formatMoney(amount, currency, { locale, digits })` : `Intl.NumberFormat('fr-FR', { style:'currency', currency, currencyDisplay:'narrowSymbol' })`.
- `getMoneyDigits(currency)` : devises à **0 décimales** (`XOF`, `XAF`, `XPF`, `KMF`, `GNF`, `JPY`, `BIF`, `CLP`, `MGA`, `RWF`), sinon 2.
- **Règle d'or** : les montants affichés proviennent du backend (unités minor). Ne **jamais** calculer autoritairement total/épargne/intérêt côté client.

---

## 10. Rétroaction (`feedback/`)

- **Alert** (alias `Modal`) : variantes `banner | inline | toast`, `tone` ∈ `info | success | warning | danger`, titre + message + action.
- **Dialog** : modal accessible (trap focus, `Escape`, `aria-modal`, aria-labelledby). `open`, `onClose`, `title`, `size` (`sm|md|lg`), `footer`.
- **ConfirmDialog** : actions critiques avec récap explicite (produit, référence, montant, méthode) et double protection anti-clic (aria-busy, disabled). Utilisé pour : confirmer paiement, démarrer/annuler épargne, utiliser le coffre, confirmations de retrait/livraison.
- **ToastProvider / useToast** : `toast({ tone, title, message, action? })`, tonality ∈ `success|danger|info|neutral`, zone `--np-z-toast`, entrée `np-anim-slide-down`. Ne montrer un succès **qu'après confirmation backend**.
- **InlineAlert** : `tone` ∈ `info | success | warning | danger`, `icon`, `children`.
- **EmptyState / ErrorState** : `title`, `description`, `action`, `icon` — expliquent *quoi / pourquoi / quoi faire* (pas de « undefined », pas d'erreur technique brute).

Patron d'état : `IDLE → LOADING → SUCCESS | ERROR` ; les processus financiers utilisent des états explicites (`PENDING, PROCESSING, CONFIRMED, FAILED, CANCELLED, REFUNDED`).

---

## 11. Surcouches (`overlays/`)

- **Tooltip** : aide au survol/focus, `placement`, `title`.
- **Dropdown** : menu contextuel (clavier ↑/↓, `Escape`, click-outside), `items` (label, hint, danger), `trigger`.
- **Popover** : contenu riche contextuel (`placement`, `offset`, clavier, click-outside).
- **Drawer** : panneau latéral (trapping focus, `Escape`, sommeil `body`), `placement` (`left|right`), mobile pour le menu.
- **BottomSheet** : panneau bas mobile (drag hint, `Escape`), `title`, `footer`.

`utils/overlay.ts` : `OverlayRootContext`, `OverlayRoots`, `getOverlayRoot()`, `useOverlayPortal()`. Les overlays rendent `null` côté SSR (`document` indisponible).

---

## 12. QR sécurité (`qr/`)

- **QRCode** : rendu via `qrcode` (canvas, niveaux L/M/Q/H), `value`, `size`, `level`, `label` (sr-only), `aria-label`. Rendu côté client (effect) → safe SSR. Le contenu du QR provient du backend ; le frontend **n'approuve jamais** validité/expiration.
- **ScannerFrame** : cadre de scan (coins, ligne mobile, hint, `hintTone`). La **décision** (valide/expiré/autorisé) appartient au backend ; ce composant n'affiche que le résultat renvoyé.

---

## 13. Navigation & shell (`navigation/`, `app/`)

- **Tabs** : onglets avec roving focus (↑/↓/→/←/Home/End), `items`, `selected`, `onChange` (contrôlé/uncontrôlé).
- **Breadcrumb** : fil d'Ariane (mobiles : 1er niveau + `…`), `items` (label, href, current).
- **Pagination** : pagination avec ellipses, boutons précédent/suivant, compact mobile.
- **Navigation** : liste de liens (groupes, icônes, badges, actif), `items`, `onNavigate`.
- **Sidebar** / **Topbar** : primitives conservées dans le design system (démo `/design-system`) mais **non utilisées par le shell applicatif** (parti pris mobile-first).
- **MobileNavigation** : barre basse affichée sur **tous les écrans** (≤ 5 actions), `--np-z-sticky`, largeur maximale alignée sur la colonne de contenu (`--np-mobile-nav-max`).
- **Shell** : `src/app/AppShell.tsx` assemble une colonne de contenu centrée (`max-width: 640px`), la `MobileNavigation` en bas et un `Drawer` de navigation complète ouvert par l'action « Plus ». Pas de Topbar ni de Sidebar dans le shell.
- **ProPageHeader** : en-tête des espaces pro (marchand, banque, admin) limité à `title` + `meta` + `actions` (pas d'`eyebrow` ni de `description`).
- **Point d'entrée** : `src/main.tsx` monte `<App />` → `src/app/App.tsx` (`BrowserRouter`, `ThemeProvider`, `ToastProvider`). Route de vérification : `/design-system` (page de revue complète) ; autre route → redirection `/design-system`.

---

## 14. Motion (`motion/`)

Keyframes globaux (`global.css`): `np-fade-in`, `np-fade-up`, `np-scale-in`, `np-slide-down`, `np-shimmer` (skeleton), `np-spin` (spinner), `np-pulse` (status en attente), `np-draw-check`.

Classes utilitaires : `.np-anim-fade-in/-up/-scale-in/-slide-down/-draw-check`.

`motionPresets` : `pageEnter (fade-up)`, `modalEnter (scale-in)`, `dropdownEnter (scale-in)`, `toastEnter (slide-down)`, `confirmPop (draw-check)`.

Répertoire `motion/` :
- `useReducedMotion()` : respecte `prefers-reduced-motion` ; les keyframes désactivent aussi l'animation sous reduced-motion (durées + délais). Éviter toute animation qui retarde une action financière.
- `useAnimatedNumber(value, { duration, disabled })` : compteur financier progressif (ease-out cubic, `requestAnimationFrame`, interruptions naturelles, désactivé sous reduced-motion). Branché sur `Amount` / `MoneyAmount` via la prop `animate` (opt-in, par défaut désactivé). Utilisé sur les montants mis en avant : épargne progressée, solde du coffre, restant de crédit.
- `EnterTransition({ preset?, className? })` : transition d'entrée de page. Appliqué dans `AppShell` (keyé sur `location.pathname` → nouvelle entrée à chaque navigation + scroll reset). Respecte reduced-motion.

Règles:
- Ne transitionner que `transform` / `opacity` (perf, pas de layout shift).
- Micro-interactions : hover `translateY(-1px)` sur cartes interactives (`Card`, `ProductCard`, `StoreCard`), `Pressable` inversé sous pression (`-1px`).
- `ProgressBar` : remplissage animé via `transform: scaleX` (pas `width`).
- `Timeline` : entrée en cascade (délai 40 ms/étape, plafonné) via `np-fade-up`.

---

## 15. Accessibilité (minimum)

- Focus visible via `--np-focus-ring` sur tous les contrôles.
- Navigation clavier, `Escape` sur les modales/overlays, `aria-modal`, trap focus.
- Labels associés (`htmlFor`/`useId`), `aria-invalid`, `aria-describedby`, messages d'erreur utiles.
- Statuts = couleur **+ libellé** (✓ Confirmé / ! Échec). Jamais couleur seule.
- Contraste suffisant (texte `moon-0` sur `night`, `on-brand` noir sur action blanche `brand-500`, textes d'accent `brand-300` sur fonds sombres).

---

## 16. Revue visuelle

Page de vérification : **`/design-system`** (`src/app/design-system/DesignSystemPage.tsx`) — fondations, typo, icônes, primitives, layout, affichage, argent, feedback, surcouches, QR, navigation, progression. Vérifier desktop **et** mobile avant de déclarer un composant terminé.

---

## 17. Composants planifiés

`Scanner` caméra réel (getUserMedia + post-traitement → backend), `Chart` (progressions), pages métier (marketplace, commandes, épargne, coffre, crédit, profils marchand/bank/admin). Ajouter selon les besoins réels des écrans, en réutilisant les primitives existantes (pas de parallélisme architectural).

---

## 18. Règles d'ajout d'un composant

1. Réutiliser les tokens `--np-*` et les primitives existantes.
2. CSS Modules + classe BEM : `block__element--modifier`.
3. Props accessibles par défaut (label/aria), mentionner les états IDLE/LOADING/ERROR/EMPTY.
4. Barrels : exporter depuis `index.ts` du dossier **et** depuis `src/design-system/index.ts`.
5. Vérifier : typecheck, build, smoke-test SSR (`vite build --ssr` + `renderToStaticMarkup`), preview desktop/mobile, clavier, contrastes, `prefers-reduced-motion`.
6. Mettre à jour ce document si l'API visuelle change.