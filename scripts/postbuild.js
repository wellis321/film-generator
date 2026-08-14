import { renameSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const buildDir = join(projectRoot, 'build');
const original = join(buildDir, 'index.js');
const app = join(buildDir, '_app.js');

if (!existsSync(app)) {
	renameSync(original, app);
}

// Read .env once, here, at build time — this script runs via plain `node`
// from the project root during `npm run build`, so there's no ambiguity
// about cwd or file location the way there was at runtime under whatever
// process manager (Passenger/LSAPI) actually starts the deployed app.
// Previous attempts loaded .env at runtime inside the generated entry file
// (via the dotenv package), which worked in every local reproduction but
// still left DATABASE_URL unset in production — never fully explained, and
// not diagnosable without deployed-filesystem access. Baking the resolved
// values directly into the generated wrapper as literals removes runtime
// file lookup from the equation entirely.
const envPath = join(projectRoot, '.env');
const envVars = {};
if (existsSync(envPath)) {
	for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) continue;
		const eq = trimmed.indexOf('=');
		if (eq === -1) continue;
		const key = trimmed.slice(0, eq).trim();
		let value = trimmed.slice(eq + 1).trim();
		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1);
		}
		envVars[key] = value;
	}
} else {
	console.warn(`postbuild: no .env found at ${envPath}`);
}

const assignments = Object.entries(envVars)
	.map(([key, value]) => `process.env[${JSON.stringify(key)}] = ${JSON.stringify(value)};`)
	.join('\n');

console.log(`postbuild: embedding ${Object.keys(envVars).length} env var(s): ${Object.keys(envVars).join(', ')}`);

// Hostinger's Node hosting reports build metadata with entry_file "index.js",
// but the deployed .htaccess (Phusion Passenger) hardcodes PassengerStartupFile
// to build/index.cjs for the "svelte-kit" app type. It's unclear which
// mechanism actually runs the app in practice, so cover both: write an
// env-setting wrapper at both build/index.js (ESM, since package.json has
// "type": "module") and build/index.cjs (forced CommonJS via extension),
// each handing off to the real adapter-node server renamed to build/_app.js.
const wrapper = [
	assignments,
	'',
	"import('./_app.js').catch((err) => {",
	"\tconsole.error('Failed to start app:', err);",
	'\tprocess.exit(1);',
	'});',
	''
].join('\n');

writeFileSync(original, wrapper);
writeFileSync(join(buildDir, 'index.cjs'), wrapper);
