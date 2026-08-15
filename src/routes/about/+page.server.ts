import { db } from '$lib/server/db';
import { movie } from '$lib/server/db/schema';
import { isNotNull, sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const posters = await db
		.select({ id: movie.id, title: movie.title, posterPath: movie.posterPath })
		.from(movie)
		.where(isNotNull(movie.posterPath))
		.orderBy(sql`RAND()`)
		.limit(48);

	return { posters };
};
