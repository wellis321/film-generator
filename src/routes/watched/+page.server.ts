import { db } from '$lib/server/db';
import { movie, userMovie } from '$lib/server/db/schema';
import { eq, and, gte, asc, desc, sql } from 'drizzle-orm';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// tmdbRating is stored as text, so ordering it directly would sort
// lexicographically ("10.0" before "9.5"). Cast to a number for ordering.
const tmdbRatingNumeric = sql`CAST(${movie.tmdbRating} AS DECIMAL(3,1))`;

const SORTS = {
	watched_desc: desc(userMovie.watchedAt),
	watched_asc: asc(userMovie.watchedAt),
	our_rating_desc: desc(userMovie.ourRating),
	our_rating_asc: asc(userMovie.ourRating),
	tmdb_rating_desc: desc(tmdbRatingNumeric),
	tmdb_rating_asc: asc(tmdbRatingNumeric),
	title_asc: asc(movie.title),
	title_desc: desc(movie.title)
} as const;

export type SortKey = keyof typeof SORTS;

export const load: PageServerLoad = async ({ url, locals }) => {
	if (!locals.user) redirect(303, '/login');

	const sortParam = url.searchParams.get('sort');
	const sort: SortKey = sortParam && sortParam in SORTS ? (sortParam as SortKey) : 'watched_desc';

	const mediaType = url.searchParams.get('type');
	const minRating = Number(url.searchParams.get('minRating') ?? '');

	const conditions = [eq(userMovie.userId, locals.user.id), eq(userMovie.watched, true)];
	if (mediaType === 'movie' || mediaType === 'tv') {
		conditions.push(eq(movie.mediaType, mediaType));
	}
	if (Number.isInteger(minRating) && minRating >= 1 && minRating <= 10) {
		conditions.push(gte(userMovie.ourRating, minRating));
	}

	const movies = await db
		.select({
			id: movie.id,
			title: movie.title,
			year: movie.year,
			mediaType: movie.mediaType,
			posterPath: movie.posterPath,
			synopsis: movie.synopsis,
			tmdbRating: movie.tmdbRating,
			watchedAt: userMovie.watchedAt,
			ourRating: userMovie.ourRating,
			ourReview: userMovie.ourReview
		})
		.from(userMovie)
		.innerJoin(movie, eq(userMovie.movieId, movie.id))
		.where(and(...conditions))
		.orderBy(SORTS[sort]);

	return {
		movies,
		sort,
		mediaType: mediaType === 'movie' || mediaType === 'tv' ? mediaType : 'all',
		minRating: Number.isInteger(minRating) && minRating >= 1 && minRating <= 10 ? minRating : null
	};
};
