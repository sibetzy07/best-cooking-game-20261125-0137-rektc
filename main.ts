// Sizzle & Serve — hand-in program (Node 22, standard library only).
//
// The playable game lives in this repo's game/ directory: plain static
// files, game/index.html plus its ES modules, no library and no network.
// This program is what hands the entry in. It copies game/ and
// screenshots/ from beside this file into the output directory and writes
// output/dossier.json — the summary the judge reads — using the vendored
// make.fun helper in vendor/makefun-game.ts.
//
// Run it locally to check the hand-in:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Outside this machine the grader runs it with /output as the target:
// when MAKEFUN_OUTPUT_DIR is unset, /output is used.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// Directory holding this file — the repo root — and the output directory.
const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Copy the game, then the screenshots (if the folder exists).
mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outputDir, 'game'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// Write the dossier with the scorer's own caps, so anything this program
// accepts is something the scorer would accept too: at most 4 screenshots
// of 256 KiB each, at most 993 files / 48 MiB in game/, paths under
// 1,000 bytes, and the judge's source text capped at 160 KiB.
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
