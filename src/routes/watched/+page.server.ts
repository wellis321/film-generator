import { db } from '$lib/server/db';
import { movie } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const movies = await db
		.select()
		.from(movie)
		.where(eq(movie.watched, true))
		.orderBy(desc(movie.watchedAt));

	return { movies };
};
