import { getApiUrl } from './config'

/**
 * Résout une URL de média renvoyée par le backend en une URL chargeable par le
 * navigateur.
 *
 * Le backend est monté sous un préfixe global (`/api`) et renvoie donc des
 * chemins *relatifs à l'API*, par exemple :
 *   `/merchants/products/<id>/image/<imageId>`
 *
 * Ces chemins ne sont PAS relatifs à la racine du site. Utilisés tels quels dans
 * un `<img src>`, ils visent `https://<site>/merchants/...` — soit une 404, donc
 * un produit sans image. On les préfixe avec l'URL d'API configurée
 * (`/api` en production via le proxy Netlify, l'origine Render sinon).
 *
 * Les URLs déjà absolues (`https://…`, `data:`, `blob:`) sont retournées telles
 * quelles : le backend peut un jour servir les médias depuis un CDN.
 */
export function resolveMediaUrl(url: string | undefined | null): string | undefined {
  if (!url) return undefined
  const trimmed = url.trim()
  if (!trimmed) return undefined

  // Déjà absolue (autre origine, data URI, blob) : ne pas y toucher.
  if (/^(https?:)?\/\//i.test(trimmed) || /^(data|blob):/i.test(trimmed)) {
    return trimmed
  }

  const base = getApiUrl()

  // Chemin relatif à l'API : on le rattache à la base configurée.
  if (trimmed.startsWith('/')) {
    return `${base}${trimmed}`
  }

  // Chemin sans slash initial : considéré relatif à l'API également.
  return `${base}/${trimmed}`
}
