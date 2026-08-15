import { db } from '$lib/server/db';
import { movie, userMovie } from '$lib/server/db/schema';
import { and, eq, sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// -1 never matches a real user id, so logged-out visitors get a LEFT JOIN
	// that finds nothing — every movie comes back with watched/excluded both
	// false, i.e. the full, unfiltered pool.
	const userId = locals.user?.id ?? -1;

	const movies = await db
		.select({
			id: movie.id,
			title: movie.title,
			year: movie.year,
			posterPath: movie.posterPath,
			mediaType: movie.mediaType,
			watched: sql<number>`COALESCE(${userMovie.watched}, false)`
		})
		.from(movie)
		.leftJoin(userMovie, and(eq(userMovie.movieId, movie.id), eq(userMovie.userId, userId)))
		.where(sql`COALESCE(${userMovie.excluded}, false) = false`);

	return { movies: movies.map((m) => ({ ...m, watched: Boolean(m.watched) })) };
};
