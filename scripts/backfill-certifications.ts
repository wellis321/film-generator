import './load-env';
import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import { eq, isNull } from 'drizzle-orm';
import { movie } from '../src/lib/server/db/schema';
import { fetchCertification } from '../src/lib/server/tmdb';

const apiKey = process.env.TMDB_API_KEY;
const databaseUrl = process.env.DATABASE_URL;
if (!apiKey) throw new Error('TMDB_API_KEY is not set');
if (!databaseUrl) throw new Error('DATABASE_URL is not set');

const client = mysql.createPool(databaseUrl);
const db = drizzle(client, { mode: 'default' });

const rows = await db
	.select({ id: movie.id, tmdbId: movie.tmdbId, mediaType: movie.mediaType, title: movie.title })
	.from(movie)
	.where(isNull(movie.certification));

console.log(`Backfilling certification for ${rows.length} movies...`);

let updated = 0;
let missing = 0;

for (const row of rows) {
	const certification = await fetchCertification(apiKey, row.tmdbId, row.mediaType);
	if (certification) {
		await db.update(movie).set({ certification }).where(eq(movie.id, row.id));
		updated++;
		console.log(`+ ${row.title}: ${certification}`);
	} else {
		missing++;
	}
}

console.log(`\nDone. Updated ${updated}, no certification found for ${missing}.`);
await client.end();
