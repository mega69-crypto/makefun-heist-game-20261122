// main.ts — entrypoint for the Midnight Vault: The Heist make.fun entry.
// Node 22, standard library only. Copies game/ and screenshots/ into the
// output directory and writes /output/dossier.json with buildDossier from
// ./vendor/makefun-game.ts. Deterministic: two runs write identical bytes.
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildDossier } from './vendor/makefun-game.ts';

const root = dirname(fileURLToPath(import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

if (existsSync(out)) rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

cpSync(join(root, 'game'), join(out, 'game'), { recursive: true });
cpSync(join(root, 'screenshots'), join(out, 'screenshots'), { recursive: true });

const dossier = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});

writeFileSync(join(out, 'dossier.json'), dossier);
console.log(`dossier written: ${dossier.length} bytes -> ${join(out, 'dossier.json')}`);
