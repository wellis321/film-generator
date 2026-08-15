import { redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import {
	validateEmailVerificationToken,
	consumeEmailVerificationToken,
	generateSessionToken,
	createSession,
	SESSION_COOKIE_NAME
} from '$lib/server/auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, cookies }) => {
	const token = url.searchParams.get('token') ?? '';
	if (!token) return { valid: false };

	const result = await validateEmailVerificationToken(token);
	if (!result) return { valid: false };

	await db.update(user).set({ emailVerified: true }).where(eq(user.id, result.userId));
	await consumeEmailVerificationToken(token);

	const sessionToken = generateSessionToken();
	await createSession(sessionToken, result.userId);
	cookies.set(SESSION_COOKIE_NAME, sessionToken, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		maxAge: 60 * 60 * 24 * 30
	});

	redirect(303, '/');
};
