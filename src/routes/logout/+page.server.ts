import { redirect } from '@sveltejs/kit';
import { SESSION_COOKIE_NAME, invalidateSession } from '$lib/server/auth';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ cookies }) => {
		const token = cookies.get(SESSION_COOKIE_NAME);
		if (token) {
			await invalidateSession(token);
			cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
		}
		redirect(303, '/');
	}
};
