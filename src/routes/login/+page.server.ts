import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import {
	verifyPassword,
	generateSessionToken,
	createSession,
	SESSION_COOKIE_NAME
} from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) redirect(303, '/');
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const form = await request.formData();
		const email = String(form.get('email') ?? '')
			.trim()
			.toLowerCase();
		const password = String(form.get('password') ?? '');

		const [found] = await db
			.select({ id: user.id, passwordHash: user.passwordHash, emailVerified: user.emailVerified })
			.from(user)
			.where(eq(user.email, email))
			.limit(1);

		const valid = found ? await verifyPassword(password, found.passwordHash) : false;
		if (!found || !valid) {
			return fail(400, { error: 'Incorrect email or password.', email, unverified: false });
		}

		if (!found.emailVerified) {
			return fail(403, {
				error: 'Confirm your email before logging in — check your inbox for the link we sent.',
				email,
				unverified: true
			});
		}

		const token = generateSessionToken();
		await createSession(token, found.id);
		cookies.set(SESSION_COOKIE_NAME, token, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 30
		});

		redirect(303, '/');
	}
};
