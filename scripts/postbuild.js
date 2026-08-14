import { renameSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const buildDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'build');
const entry = join(buildDir, 'index.js');
const app = join(buildDir, '_app.js');

if (!existsSync(app)) {
	renameSync(entry, app);
}

writeFileSync(
	entry,
	"import 'dotenv/config';\nimport './_app.js';\n"
);
