import { db } from '$lib/server/db';
import { movie } from '$lib/server/db/schema';
import { eq, and, gte, asc, desc, sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

// tmdbRating is stored as text, so ordering it directly would sort
// lexicographically ("10.0" before "9.5"). Cast to a number for ordering.
const tmdbRatingNumeric = sql`CAST(${movie.tmdbRating} AS DECIMAL(3,1))`;

const SORTS = {
	watched_desc: desc(movie.watchedAt),
	watched_asc: asc(movie.watchedAt),
	our_rating_desc: desc(movie.ourRating),
	our_rating_asc: asc(movie.ourRating),
	tmdb_rating_desc: desc(tmdbRatingNumeric),
	tmdb_rating_asc: asc(tmdbRatingNumeric),
	title_asc: asc(movie.title),
	title_desc: desc(movie.title)
} as const;

export type SortKey = keyof typeof SORTS;

export const load: PageServerLoad = async ({ url }) => {
	const sortParam = url.searchParams.get('sort');
	const sort: SortKey = sortParam && sortParam in SORTS ? (sortParam as SortKey) : 'watched_desc';

	const mediaType = url.searchParams.get('type');
	const minRating = Number(url.searchParams.get('minRating') ?? '');

	const conditions = [eq(movie.watched, true)];
	if (mediaType === 'movie' || mediaType === 'tv') {
		conditions.push(eq(movie.mediaType, mediaType));
	}
	if (Number.isInteger(minRating) && minRating >= 1 && minRating <= 10) {
		conditions.push(gte(movie.ourRating, minRating));
	}

	const movies = await db
		.select()
		.from(movie)
		.where(and(...conditions))
		.orderBy(SORTS[sort]);

	return {
		movies,
		sort,
		mediaType: mediaType === 'movie' || mediaType === 'tv' ? mediaType : 'all',
		minRating: Number.isInteger(minRating) && minRating >= 1 && minRating <= 10 ? minRating : null
	};
};
