#!/usr/bin/env node
/**
 * scripts/smoke-bootstrap.mjs — smoke-test de démarrage (production-like).
 *
 * Plusieurs blocages consécutifs sur Render étaient des erreurs de *bootstrap*
 * (DI, ValidationPipe, trust proxy) invisibles en `npm run start:dev` et non
 * couverts par `npm test`. Ce script exécute le build réel `dist/main.js` avec
 * une base de données injoignable et vérifie que l'application :
 *
 *   1. valide l'environnement,
 *   2. résout tous les modules (pas d'erreur DI),
 *   3. enregistre toutes les routes,
 *   4. atteint l'écoute HTTP — c'est là que la connexion Prisma échoue, ce qui
 *      est le comportement attendu ici et prouve que tout le reste a passé.
 *
 * Usage :  node scripts/smoke-bootstrap.mjs [chemin/vers/.env]
 *
 * Sortie 0 : bootstrap sain. Sortie 1 : régression détectée (le message est
 * imprimé). Ne touche à aucune base de données.
 */
import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const envFile = resolve(process.argv[2] ?? join(backendRoot, '.env'));
const entry = join(backendRoot, 'dist', 'main.js');
const timeoutMs = 30_000;

// Signal que main.ts n'emet qu'une fois app.listen() resolu.
const BOOT_OK = /NanaPay Backend running on port|Nest application successfully started/;
// Un echec de bootstrap ne doit jamais etre confondu avec le P1001 attendu.
const BOOT_FAIL =
  /Cannot find module|Cannot resolve|is not a function|Missing required|PackageLoader|Nest can't resolve|ERR_|AssertionError/;

/** Retire les codes de couleur ANSI pour garder une sortie lisible. */
const ANSI = new RegExp(String.fromCharCode(27) + '\\[[0-9;]*m', 'g');
const stripAnsi = (text) => text.replace(ANSI, '');

/** Echec attendu : la base est volontairement injoignable dans ce test. */
const DB_UNREACHABLE = /Can't reach database server|P1001|Invalid database URL/;

if (!existsSync(entry)) {
  console.error('Build absent : ' + entry);
  console.error('Lancez d\'abord `npm run build`.');
  process.exit(1);
}

/** Lit un fichier .env simple (KEY=VALUE, une par ligne, # = commentaire). */
function readEnvFile(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const raw of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 1) continue;
    out[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
  }
  return out;
}

const env = { ...process.env, ...readEnvFile(envFile) };

// Base injoignable volontairement : l'objectif est d'atteindre listen().
env.DATABASE_URL = 'postgresql://user:pass@127.0.0.1:59999/nanapay';
env.DIRECT_DATABASE_URL = 'postgresql://user:pass@127.0.0.1:59999/nanapay';
env.REDIS_URL = 'redis://127.0.0.1:59998';
env.NODE_ENV = 'production';
env.PORT = '3999';
env.API_PREFIX ??= 'api';
env.CORS_ORIGINS ??= 'https://localhost';

if (!env.JWT_PRIVATE_KEY || !env.JWT_PUBLIC_KEY) {
  console.error('JWT_PRIVATE_KEY / JWT_PUBLIC_KEY absentes de ' + envFile);
  process.exit(1);
}

const child = spawn(process.execPath, [entry], {
  cwd: backendRoot,
  env,
  stdio: ['ignore', 'pipe', 'pipe'],
});

let output = '';
let settled = false;
let timer;

function finish(code, reason) {
  if (settled) return;
  settled = true;
  clearTimeout(timer);
  child.kill('SIGKILL');

  if (code === 0) {
    console.log('Bootstrap sain : routes enregistrees, ecoute HTTP atteinte.');
    console.log('Source d\'environnement : ' + envFile);
    return;
  }
  console.error('Bootstrap en echec : ' + reason);
  console.error(stripAnsi(output).trimEnd().split('\n').slice(-30).join('\n'));
  process.exit(1);
}

function onChunk(chunk) {
  output += chunk.toString();
  if (BOOT_OK.test(output)) return finish(0, 'ok');
  if (BOOT_FAIL.test(output)) return finish(1, 'erreur de demarrage detectee');
}

child.stdout.on('data', onChunk);
child.stderr.on('data', onChunk);
child.on('exit', (code) => {
  // PrismaService.onModuleInit tourne apres l'enregistrement des routes : si le
  // seul echec est l'injoignabilite de la base (volontaire ici), le bootstrap
  // est valide — c'est exactement ce qu'on veut verifier avec ce script.
  if (DB_UNREACHABLE.test(output)) return finish(0, 'ok');
  finish(1, 'processus termine (code ' + code + ')');
});
child.on('error', (err) => finish(1, err.message));

timer = setTimeout(() => {
  // Toujours vivant apres le delai : app.listen() a reussi (la DB n'a pas
  // bloque le demarrage), donc le bootstrap est valide.
  if (BOOT_OK.test(output)) return finish(0, 'ok');
  finish(1, 'pas de signal de demarrage apres ' + timeoutMs / 1000 + 's');
}, timeoutMs);
