import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import {
	hashPassword,
	generateSessionToken,
	createSession,
	SESSION_COOKIE_NAME
} from '$lib/server/auth';
import { migrateLegacyDataIfFirstUser } from '$lib/server/legacy-migration';
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
		const confirmPassword = String(form.get('confirmPassword') ?? '');
		const name = String(form.get('name') ?? '').trim();

		if (!email || !email.includes('@')) {
			return fail(400, { error: 'Enter a valid email address.', email, name });
		}
		if (password.length < 8) {
			return fail(400, { error: 'Password must be at least 8 characters.', email, name });
		}
		if (password !== confirmPassword) {
			return fail(400, { error: 'Passwords don’t match.', email, name });
		}

		const [existing] = await db
			.select({ id: user.id })
			.from(user)
			.where(eq(user.email, email))
			.limit(1);
		if (existing) {
			return fail(400, {
				error: 'An account with that email already exists.',
				email,
				name
			});
		}

		const passwordHash = await hashPassword(password);
		await db.insert(user).values({ email, passwordHash, name: name || null });

		const [created] = await db
			.select({ id: user.id, email: user.email, name: user.name })
			.from(user)
			.where(eq(user.email, email))
			.limit(1);

		const token = generateSessionToken();
		await createSession(token, created.id);
		cookies.set(SESSION_COOKIE_NAME, token, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 30
		});

		await migrateLegacyDataIfFirstUser(created.id);

		redirect(303, '/');
	}
};
