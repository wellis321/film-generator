import { db } from '$lib/server/db';
import { movie, userMovie, playerCharacter } from '$lib/server/db/schema';
import { and, eq, notInArray, sql } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

const MAX_CHARACTERS = 5;

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

	const savedCharacters = locals.user
		? await db
				.select({ name: playerCharacter.name, wins: playerCharacter.wins })
				.from(playerCharacter)
				.where(eq(playerCharacter.userId, locals.user.id))
				.orderBy(playerCharacter.position)
		: [];

	return {
		movies: movies.map((m) => ({ ...m, watched: Boolean(m.watched) })),
		savedCharacters
	};
};

export const actions: Actions = {
	saveCharacters: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { error: 'Log in to save characters.' });

		const form = await request.formData();
		const names = form
			.getAll('name')
			.map((n) => String(n).trim())
			.filter((n) => n.length > 0)
			.slice(0, MAX_CHARACTERS);

		// Drop any previously saved characters that aren't in the new roster
		// (keeping the rest preserves their win tallies).
		if (names.length > 0) {
			await db
				.delete(playerCharacter)
				.where(
					and(eq(playerCharacter.userId, locals.user.id), notInArray(playerCharacter.name, names))
				);
		} else {
			await db.delete(playerCharacter).where(eq(playerCharacter.userId, locals.user.id));
		}

		for (let i = 0; i < names.length; i++) {
			await db
				.insert(playerCharacter)
				.values({ userId: locals.user.id, name: names[i], position: i })
				.onDuplicateKeyUpdate({ set: { position: i } });
		}

		return { success: true };
	},

	recordWin: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { error: 'Log in to record a win.' });

		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim();
		if (!name) return fail(400, { error: 'Missing character name.' });

		await db
			.insert(playerCharacter)
			.values({ userId: locals.user.id, name, position: 999, wins: 1 })
			.onDuplicateKeyUpdate({ set: { wins: sql`${playerCharacter.wins} + 1` } });

		return { success: true };
	}
};
