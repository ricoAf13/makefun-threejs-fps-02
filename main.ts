// Cosmic Strike: Tactical Three.js FPS - Entry runner for make.fun threejs-fps-02
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-threejs.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Prepare target output directory
mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// Build and seal dossier.json for make.fun judge evaluation
const dossierJson = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { min: 3, max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
});

writeFileSync(join(out, 'dossier.json'), dossierJson);
console.log(`Successfully generated dossier.json (${dossierJson.length} bytes)`);

