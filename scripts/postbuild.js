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
//
// dotenv's default `require('dotenv/config')` resolves .env relative to
// process.cwd(), which may not be the project root under Passenger/LSAPI.
// Resolve it relative to this file's own location instead, and catch the
// dynamic import so a startup error is at least reported instead of
// crashing the process via an unhandled rejection (which just looks like
// a silent, unexplained crash loop from the outside).
writeFileSync(
	join(buildDir, 'index.cjs'),
	[
		"const path = require('path');",
		"require('dotenv').config({ path: path.join(__dirname, '..', '.env'), quiet: true });",
		"import('./_app.js').catch((err) => {",
		"\tconsole.error('Failed to start app:', err);",
		'\tprocess.exit(1);',
		'});',
		''
	].join('\n')
);
