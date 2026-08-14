import { db } from '$lib/server/db';
import { movie } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const movies = await db
		.select({
			id: movie.id,
			title: movie.title,
			year: movie.year,
			posterPath: movie.posterPath,
			mediaType: movie.mediaType,
			watched: movie.watched
		})
		.from(movie)
		.where(eq(movie.excluded, false));

	return { movies };
};
