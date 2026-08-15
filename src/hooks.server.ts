import type { Handle } from '@sveltejs/kit';
import { SESSION_COOKIE_NAME, validateSessionToken } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get(SESSION_COOKIE_NAME);

	if (token) {
		const user = await validateSessionToken(token);
		event.locals.user = user;
		if (!user) {
			event.cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
		}
	} else {
		event.locals.user = null;
	}

	return resolve(event);
};
