import { error, json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { and, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { movie } from '$lib/server/db/schema';
import { searchTmdbMulti, fetchTmdbById, fetchCertification } from '$lib/server/tmdb';
import type { RequestHandler } from './$types';

// Backs the "add your own pick" search box on the spin page: GET searches
// TMDB live (so any title is reachable, not just what's already seeded),
// POST resolves a chosen result to a row in our shared catalog, inserting it
// on first use.

export const GET: RequestHandler = async ({ url }) => {
	const q = url.searchParams.get('q')?.trim() ?? '';
	if (q.length < 2) return json([]);
	if (!env.TMDB_API_KEY) error(500, 'TMDB_API_KEY is not set');

	const hits = await searchTmdbMulti(env.TMDB_API_KEY, q);
	return json(hits);
};

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) error(401, 'Log in to add a movie.');
	if (!env.TMDB_API_KEY) error(500, 'TMDB_API_KEY is not set');

	const body = await request.json();
	const tmdbId = Number(body.tmdbId);
	const mediaType = body.mediaType;
	if (!Number.isInteger(tmdbId) || (mediaType !== 'movie' && mediaType !== 'tv')) {
		error(400, 'Invalid movie.');
	}

	const [existing] = await db
		.select()
		.from(movie)
		.where(and(eq(movie.tmdbId, tmdbId), eq(movie.mediaType, mediaType)))
		.limit(1);

	if (existing) {
		return json({
			id: existing.id,
			title: existing.title,
			year: existing.year,
			posterPath: existing.posterPath,
			mediaType: existing.mediaType,
			watched: false
		});
	}

	const details = await fetchTmdbById(env.TMDB_API_KEY, tmdbId, mediaType);
	const certification = await fetchCertification(env.TMDB_API_KEY, tmdbId, mediaType);

	await db.insert(movie).values({
		tmdbId: details.tmdbId,
		mediaType,
		title: details.title,
		year: details.year,
		posterPath: details.posterPath,
		synopsis: details.synopsis,
		tmdbRating: details.tmdbRating,
		tmdbVoteCount: details.tmdbVoteCount,
		certification
	});

	const [inserted] = await db
		.select()
		.from(movie)
		.where(and(eq(movie.tmdbId, tmdbId), eq(movie.mediaType, mediaType)))
		.limit(1);
	if (!inserted) error(500, 'Failed to save movie.');

	return json({
		id: inserted.id,
		title: inserted.title,
		year: inserted.year,
		posterPath: inserted.posterPath,
		mediaType: inserted.mediaType,
		watched: false
	});
};
