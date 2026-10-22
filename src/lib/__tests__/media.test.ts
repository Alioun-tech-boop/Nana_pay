import { afterEach, describe, expect, it } from 'vitest'
import { resolveMediaUrl } from '../media'
import { setConfigForTests } from '../config'

/**
 * Le backend est monté sous un préfixe global `/api` et renvoie donc des chemins
 * relatifs à l'API (`/merchants/products/<id>/image/<imageId>`). Utilisés tels
 * quels dans un `<img src>`, ils visent la racine du site et renvoient 404 :
 * c'est exactement le bug qui empêchait toute image produit de s'afficher.
 */
describe('resolveMediaUrl', () => {
  afterEach(() => setConfigForTests(null))

  it('préfixe un chemin relatif à l’API avec l’URL configurée', () => {
    setConfigForTests({ apiUrl: '/api' })
    expect(resolveMediaUrl('/merchants/products/p1/image/i1')).toBe(
      '/api/merchants/products/p1/image/i1',
    )
  })

  it('utilise l’origine complète quand le backend est appelé directement', () => {
    setConfigForTests({ apiUrl: 'https://nanapay-api.onrender.com/api' })
    expect(resolveMediaUrl('/merchants/products/p1/image/i1')).toBe(
      'https://nanapay-api.onrender.com/api/merchants/products/p1/image/i1',
    )
  })

  it('ajoute un slash manquant pour un chemin sans slash initial', () => {
    setConfigForTests({ apiUrl: '/api' })
    expect(resolveMediaUrl('merchants/products/p1/image/i1')).toBe(
      '/api/merchants/products/p1/image/i1',
    )
  })

  it('laisse intacte une URL déjà absolue (CDN futur)', () => {
    setConfigForTests({ apiUrl: '/api' })
    expect(resolveMediaUrl('https://cdn.nanapay.example/img.png')).toBe(
      'https://cdn.nanapay.example/img.png',
    )
    expect(resolveMediaUrl('//cdn.nanapay.example/img.png')).toBe('//cdn.nanapay.example/img.png')
  })

  it('laisse intactes les data URI et les blob URL', () => {
    setConfigForTests({ apiUrl: '/api' })
    expect(resolveMediaUrl('data:image/png;base64,AAA')).toBe('data:image/png;base64,AAA')
    expect(resolveMediaUrl('blob:https://site/abc')).toBe('blob:https://site/abc')
  })

  it('retourne undefined pour une valeur absente ou vide', () => {
    setConfigForTests({ apiUrl: '/api' })
    expect(resolveMediaUrl(undefined)).toBeUndefined()
    expect(resolveMediaUrl(null)).toBeUndefined()
    expect(resolveMediaUrl('')).toBeUndefined()
    expect(resolveMediaUrl('   ')).toBeUndefined()
  })
})
