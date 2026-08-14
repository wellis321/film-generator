import { renameSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const buildDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'build');
const original = join(buildDir, 'index.js');
const app = join(buildDir, '_app.js');

if (!existsSync(app)) {
	renameSync(original, app);
}

// Hostinger's Node hosting reports build metadata with entry_file "index.js",
// but the deployed .htaccess (Phusion Passenger) hardcodes PassengerStartupFile
// to build/index.cjs for the "svelte-kit" app type. It's unclear which
// mechanism actually runs the app in practice, so cover both: write a
// dotenv-loading wrapper at both build/index.js (ESM, since package.json has
// "type": "module") and build/index.cjs (forced CommonJS via extension),
// each handing off to the real adapter-node server renamed to build/_app.js.
//
// dotenv's default cwd-relative resolution may not find .env if the process
// is spawned with a working directory other than the project root, so the
// path is resolved relative to this file's own location instead. Errors
// from the handoff are logged and exit cleanly rather than crashing via an
// unhandled rejection, which would otherwise look like a silent, unexplained
// crash loop from the outside.
const esmWrapper = [
	"import { config } from 'dotenv';",
	"import { fileURLToPath } from 'node:url';",
	"import { dirname, join } from 'node:path';",
	'',
	"config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env'), quiet: true });",
	'',
	"import('./_app.js').catch((err) => {",
	"\tconsole.error('Failed to start app:', err);",
	'\tprocess.exit(1);',
	'});',
	''
].join('\n');

const cjsWrapper = [
	"const path = require('path');",
	"require('dotenv').config({ path: path.join(__dirname, '..', '.env'), quiet: true });",
	"import('./_app.js').catch((err) => {",
	"\tconsole.error('Failed to start app:', err);",
	'\tprocess.exit(1);',
	'});',
	''
].join('\n');

writeFileSync(original, esmWrapper);
writeFileSync(join(buildDir, 'index.cjs'), cjsWrapper);
