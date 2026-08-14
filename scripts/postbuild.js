import { renameSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const buildDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'build');
const original = join(buildDir, 'index.js');
const app = join(buildDir, '_app.js');

if (!existsSync(app)) {
	renameSync(original, app);
}

// Hostinger's Node hosting (Phusion Passenger) hardcodes the startup file
// to build/index.cjs for the "svelte-kit" app type, regardless of the
// project's own module format. The .cjs extension forces CommonJS
// interpretation even with "type": "module" in package.json, so this file
// uses require() for dotenv and a dynamic import() to hand off to the
// real (ESM) adapter-node server.
writeFileSync(
	join(buildDir, 'index.cjs'),
	"require('dotenv/config');\nimport('./_app.js');\n"
);
