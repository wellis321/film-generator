import './load-env';
import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import { movie } from '../src/lib/server/db/schema';
import { searchTmdb, fetchCertification } from '../src/lib/server/tmdb';
import { seedList } from '../src/lib/server/seed-list';

const apiKey = process.env.TMDB_API_KEY;
const databaseUrl = process.env.DATABASE_URL;
if (!apiKey) throw new Error('TMDB_API_KEY is not set');
if (!databaseUrl) throw new Error('DATABASE_URL is not set');

const client = mysql.createPool(databaseUrl);
const db = drizzle(client, { mode: 'default' });

let added = 0;
let skipped = 0;
let failed = 0;

for (const entry of seedList) {
	const result = await searchTmdb(apiKey, entry.title, entry.mediaType, entry.year);
	if (!result) {
		console.warn(`No TMDB match for "${entry.title}" (${entry.mediaType})`);
		failed++;
		continue;
	}

	const [existing] = await db
		.select({ id: movie.id })
		.from(movie)
		.where(and(eq(movie.tmdbId, result.tmdbId), eq(movie.mediaType, entry.mediaType)))
		.limit(1);

	if (existing) {
		skipped++;
		continue;
	}

	const certification = await fetchCertification(apiKey, result.tmdbId, entry.mediaType);

	await db.insert(movie).values({
		tmdbId: result.tmdbId,
		mediaType: entry.mediaType,
		title: result.title,
		year: result.year,
		posterPath: result.posterPath,
		synopsis: result.synopsis,
		tmdbRating: result.tmdbRating,
		tmdbVoteCount: result.tmdbVoteCount,
		certification
	});
	added++;
	console.log(`+ ${result.title} (${result.year ?? 'n/a'})`);
}

console.log(`\nDone. Added ${added}, skipped ${skipped} already-seeded, ${failed} not found.`);
await client.end();
