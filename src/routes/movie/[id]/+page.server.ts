import { db } from '$lib/server/db';
import { movie, userMovie } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

async function loadMovie(id: number) {
	const [row] = await db.select().from(movie).where(eq(movie.id, id)).limit(1);
	if (!row) error(404, 'Movie not found');
	return row;
}

async function loadUserMovie(userId: number, movieId: number) {
	const [row] = await db
		.select()
		.from(userMovie)
		.where(and(eq(userMovie.userId, userId), eq(userMovie.movieId, movieId)))
		.limit(1);
	return row ?? null;
}

export const load: PageServerLoad = async ({ params, locals }) => {
	const id = Number(params.id);
	if (!Number.isInteger(id)) error(404, 'Movie not found');

	const movieRow = await loadMovie(id);
	const userMovieRow = locals.user ? await loadUserMovie(locals.user.id, id) : null;

	return {
		movie: movieRow,
		userMovie: userMovieRow ?? {
			watched: false,
			watchedAt: null,
			excluded: false,
			ourRating: null,
			ourReview: null
		}
	};
};

export const actions: Actions = {
	save: async ({ request, params, locals }) => {
		if (!locals.user) return fail(401, { error: 'Log in to save a review.' });

		const id = Number(params.id);
		if (!Number.isInteger(id)) error(404, 'Movie not found');

		const form = await request.formData();
		const ratingRaw = form.get('ourRating');
		const review = String(form.get('ourReview') ?? '').trim();
		const rating = ratingRaw ? Number(ratingRaw) : null;

		if (rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 10)) {
			return fail(400, { error: 'Rating must be a whole number between 1 and 10.' });
		}

		await loadMovie(id);
		const existing = await loadUserMovie(locals.user.id, id);

		await db
			.insert(userMovie)
			.values({
				userId: locals.user.id,
				movieId: id,
				ourRating: rating,
				ourReview: review || null,
				watched: true,
				watchedAt: existing?.watchedAt ?? new Date()
			})
			.onDuplicateKeyUpdate({
				set: {
					ourRating: rating,
					ourReview: review || null,
					watched: true,
					watchedAt: existing?.watchedAt ?? new Date()
				}
			});

		return { success: true };
	},

	unwatch: async ({ params, locals }) => {
		if (!locals.user) return fail(401, { error: 'Log in to do that.' });

		const id = Number(params.id);
		if (!Number.isInteger(id)) error(404, 'Movie not found');

		await db
			.insert(userMovie)
			.values({ userId: locals.user.id, movieId: id, watched: false })
			.onDuplicateKeyUpdate({
				set: { watched: false, watchedAt: null, ourRating: null, ourReview: null }
			});

		return { success: true };
	},

	exclude: async ({ params, locals }) => {
		if (!locals.user) return fail(401, { error: 'Log in to do that.' });

		const id = Number(params.id);
		if (!Number.isInteger(id)) error(404, 'Movie not found');

		await db
			.insert(userMovie)
			.values({ userId: locals.user.id, movieId: id, excluded: true })
			.onDuplicateKeyUpdate({ set: { excluded: true } });

		return { success: true };
	},

	include: async ({ params, locals }) => {
		if (!locals.user) return fail(401, { error: 'Log in to do that.' });

		const id = Number(params.id);
		if (!Number.isInteger(id)) error(404, 'Movie not found');

		await db
			.insert(userMovie)
			.values({ userId: locals.user.id, movieId: id, excluded: false })
			.onDuplicateKeyUpdate({ set: { excluded: false } });

		return { success: true };
	}
};
