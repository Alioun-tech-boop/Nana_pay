# Déploiement Netlify — NanaPay

## État actuel (vérifié)

Le site `moonlit-phoenix-2de61d.netlify.app` **fonctionne** : il sert le bundle
courant et proxy `/api/*` vers le backend Render.

Mais il n'est **pas relié à GitHub** : `build_settings` est vide côté Netlify,
les déploiements n'ont ni `branch` ni `commit_ref`. Un `git push` **ne déclenche
donc aucun déploiement automatique**.

Historique : les 4 déploiements présents dataient du 21–22 septembre 2026 et
avaient été faits par téléversement manuel (glisser-déposer). Le site servait
donc un bundle figé (`index-D9FZkJjR.js`) sans les règles de proxy `/api`
pourtant présentes dans `netlify.toml`, ce qui rendait l'application inutilisable
en ligne (toutes les requêtes API retombaient sur le HTML du SPA).

## Conséquence à connaître

Tant que le dépôt n'est pas relié, **chaque mise en production doit être
déclenchée manuellement**. Le backend Render, lui, se redéploie automatiquement
à chaque push — les deux ne sont donc pas synchronisés sans intervention.

## Déployer (procédure vérifiée)

```powershell
cd "C:\Users\EBOUEM Nathan\Downloads\Nana_pay"

# 1. Build avec les variables de production (le proxy /api est dans netlify.toml)
$env:VITE_NP_API_MODE = "real"
$env:VITE_NP_API_URL = "/api"
npm run build

# 2. Publier
$env:NETLIFY_AUTH_TOKEN = "<token>"
npx netlify-cli deploy --prod --dir=dist --site=f906477f-30e6-44d3-8e39-47018078313a
```

`netlify.toml` est lu automatiquement depuis la racine du dépôt : le proxy
`/api/*` et `/healthz` est appliqué par le CDN, pas par le build. Un simple
téléversement de `dist/` suffit donc, mais il faut bien passer par
`netlify deploy` (et non un glisser-déposer dans le dashboard, qui ignore la
configuration et recrée le problème).

## Vérifier après déploiement

Ces trois contrôles doivent passer. Le premier est le plus important : il
détecte immédiatement un déploiement fait par glisser-déposer (qui perd le
proxy).

```powershell
# 1. Le proxy atteint bien le backend (doit renvoyer du JSON, pas du HTML)
curl.exe -s -o NUL -w "%{content_type}`n" https://moonlit-phoenix-2de61d.netlify.app/healthz
# Attendu : application/json

# 2. Le catalogue public
curl.exe -s "https://moonlit-phoenix-2de61d.netlify.app/api/products?pageSize=1"
# Attendu : {"items":[{"id":"b1671173-..."

# 3. Le bundle servi correspond au build local
#    (comparer avec le nom produit dans dist/assets/)
```

## Pour activer le déploiement automatique

Cela demande une étape d'autorisation OAuth qui **n'est pas réalisable par
l'API** (tentative `PATCH /sites/:id` avec `build_settings` → 200 mais
`build_settings` reste vide). Procédure :

1. https://app.netlify.com/projects/moonlit-phoenix-2de61d → **Site configuration**
2. **Build & deploy** → **Continuous deployment** → **Link repository**
3. Autoriser l'application GitHub Netlify si demandé, puis choisir
   `Alioun-tech-boop/Nana_pay`

Paramètres à renseigner :

| Champ | Valeur |
|---|---|
| Branch | `master` |
| Build command | `npm run build` |
| Publish directory | `dist` |
| Base directory | *(laisser vide)* |

Les variables `VITE_NP_API_MODE` / `VITE_NP_API_URL` sont déjà déclarées dans
`netlify.toml` (`[build.environment]`) : rien à saisir dans le dashboard.

Une fois relié, chaque push sur `master` déclenchera le build et la publication.
