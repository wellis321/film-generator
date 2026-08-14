import { db } from '$lib/server/db';
import { movie } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

async function loadMovie(id: number) {
	const [row] = await db.select().from(movie).where(eq(movie.id, id)).limit(1);
	if (!row) error(404, 'Movie not found');
	return row;
}

export const load: PageServerLoad = async ({ params }) => {
	const id = Number(params.id);
	if (!Number.isInteger(id)) error(404, 'Movie not found');
	return { movie: await loadMovie(id) };
};

export const actions: Actions = {
	save: async ({ request, params }) => {
		const id = Number(params.id);
		if (!Number.isInteger(id)) error(404, 'Movie not found');

		const form = await request.formData();
		const ratingRaw = form.get('ourRating');
		const review = String(form.get('ourReview') ?? '').trim();
		const rating = ratingRaw ? Number(ratingRaw) : null;

		if (rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 10)) {
			return fail(400, { error: 'Rating must be a whole number between 1 and 10.' });
		}

		const existing = await loadMovie(id);

		await db
			.update(movie)
			.set({
				ourRating: rating,
				ourReview: review || null,
				watched: true,
				watchedAt: existing.watchedAt ?? new Date()
			})
			.where(eq(movie.id, id));

		return { success: true };
	},

	unwatch: async ({ params }) => {
		const id = Number(params.id);
		if (!Number.isInteger(id)) error(404, 'Movie not found');

		await db
			.update(movie)
			.set({ watched: false, watchedAt: null, ourRating: null, ourReview: null })
			.where(eq(movie.id, id));

		return { success: true };
	}
};
