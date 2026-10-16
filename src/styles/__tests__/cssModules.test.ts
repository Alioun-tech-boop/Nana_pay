import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import postcss from 'postcss'

/**
 * Garde-fou d'intégrité des CSS modules.
 *
 * Un composant qui référence `styles.x` sans que la classe `x` soit déclarée
 * au niveau racine du module CSS ne lève aucune erreur : il rend juste sans
 * style (className « dead ») — exactement le bug qui avait cisaillé la page
 * de paiement (toutes ses classes s'étaient retrouvées piégées à l'intérieur
 * d'une `@media (max-width: 767px)` non refermée).
 *
 * Ce test vérifie pour chaque module `*.module.css` de `src/` :
 *  1. que le CSS est syntaxiquement valide (postcss refuse les blocs non fermés) ;
 *  2. que toute classe `styles.x` référencée par un composant existe réellement ;
 *  3. que toute classe référencée possède une déclaration AU NIVEAU RACINE
 *     (une classe uniquement déclarée dans une `@media` est morte sur les
 *     viewports qui n'y correspondent pas → perte de style silencieuse).
 */

const ROOT = process.cwd()

/**
 * Classes marqueur légitimement déclarées SEULEMENT dans une `@media` :
 * elles servent de portée descendante mobile (par ex. `ProTable` qui masque
 * le tableau et affiche les cartes via `.mobile .tableWrap`). Exemptions
 * limitées au module concerné pour préserver l'intégrité des autres classes.
 */
const MEDIA_ONLY_MARKERS: Record<string, string[]> = {
  'src/components/pro/pro.module.css': ['mobile'],
}

function walk(dir: string, predicate: (file: string) => boolean): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(full, predicate))
    else if (predicate(full)) out.push(full)
  }
  return out
}

const normalize = (path: string) => path.replace(/\\/g, '/')

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Extraire les noms de classes d'un sélecteur CSS. */
function classNamesIn(selector: string): string[] {
  const names = new Set<string>()
  for (const match of selector.matchAll(/\.([_A-Za-z][\w-]*)/g)) names.add(match[1])
  return [...names]
}

interface ParsedCss {
  root: Set<string>
  all: Set<string>
}

function parseSelectors(css: string): ParsedCss {
  const root = postcss.parse(css)
  const rootSet = new Set<string>()
  const allSet = new Set<string>()
  root.walkRules((rule) => {
    const names = classNamesIn(rule.selector)
    const atRoot = rule.parent === root
    for (const name of names) {
      allSet.add(name)
      if (atRoot) rootSet.add(name)
    }
  })
  return { root: rootSet, all: allSet }
}

/** Usages de `localName.xxx` / `localName['xxx']` dans un fichier source. */
function findUsages(source: string, localName: string): string[] {
  const ids = new Set<string>()
  const name = escapeRegExp(localName)
  for (const match of source.matchAll(new RegExp(`\\b${name}\\.([A-Za-z0-9_-]+)`, 'g'))) ids.add(match[1])
  for (const match of source.matchAll(new RegExp(`\\b${name}\\[['"]([A-Za-z0-9_-]+)['"]\\]`, 'g'))) ids.add(match[1])
  return [...ids]
}

describe('CSS modules integrity', () => {
  const modules = walk(join(ROOT, 'src'), (file) => file.endsWith('.module.css'))
  const sources = walk(join(ROOT, 'src'), (file) => file.endsWith('.ts') || file.endsWith('.tsx'))

  it('every class used by a component is defined at the root level of its CSS module', () => {
    const modulePaths = new Set(modules.map(normalize))

    // modulePath -> id -> fichiers importeurs
    const importers = new Map<string, Map<string, string[]>>()
    const importRe = /import\s+([A-Za-z_$][\w$]*)\s+from\s+['"]([^'"]+\.module\.css)['"]/g

    for (const file of sources) {
      const text = readFileSync(file, 'utf8')
      for (const match of text.matchAll(importRe)) {
        const [, localName, specifier] = match
        const modulePath = normalize(resolve(dirname(file), specifier))
        if (!modulePaths.has(modulePath)) continue
        // Retirer la ligne d'import elle-même avant de chercher les usages :
        // `import field from '../field.module.css'` contient le motif
        // `field.module` qui produirait un faux positif.
        const source = text.replace(
          new RegExp(`import\\s+${escapeRegExp(localName)}\\s+from\\s+['"][^'"]+['"];?`, 'g'),
          '',
        )
        const byId = importers.get(modulePath) ?? new Map<string, string[]>()
        for (const id of findUsages(source, localName)) {
          const list = byId.get(id) ?? []
          list.push(normalize(relative(ROOT, file)))
          byId.set(id, list)
        }
        importers.set(modulePath, byId)
      }
    }

    const problems: string[] = []

    for (const cssFile of modules) {
      const css = readFileSync(cssFile, 'utf8')
      const niceName = normalize(relative(ROOT, cssFile))
      let parsed: ParsedCss
      try {
        parsed = parseSelectors(css)
      } catch (error) {
        problems.push(`${niceName}: CSS malformé — ${(error as Error).message}`)
        continue
      }

      const byId = importers.get(normalize(cssFile))
      if (!byId) continue

      for (const [id, files] of byId) {
        const usedIn = files.join(', ')
        if (!parsed.all.has(id)) {
          problems.push(
            `${niceName}: classe "styles.${id}" utilisée par ${usedIn} mais absente du module CSS`,
          )
        } else if (!parsed.root.has(id) && !(MEDIA_ONLY_MARKERS[niceName] ?? []).includes(id)) {
          problems.push(
            `${niceName}: classe "styles.${id}" utilisée par ${usedIn} n'existe que DANS une @media — inappliquée sur certains viewports`,
          )
        }
      }
    }

    expect(problems, problems.join('\n')).toEqual([])
  })
})