import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import {
	validatePasswordResetToken,
	consumePasswordResetToken,
	hashPassword,
	invalidateAllUserSessions
} from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const token = url.searchParams.get('token') ?? '';
	const valid = token ? Boolean(await validatePasswordResetToken(token)) : false;
	return { valid };
};

export const actions: Actions = {
	default: async ({ request, url }) => {
		const token = url.searchParams.get('token') ?? '';
		const form = await request.formData();
		const password = String(form.get('password') ?? '');
		const confirmPassword = String(form.get('confirmPassword') ?? '');

		if (password.length < 8) {
			return fail(400, { error: 'Password must be at least 8 characters.' });
		}
		if (password !== confirmPassword) {
			return fail(400, { error: 'Passwords don’t match.' });
		}

		const result = await validatePasswordResetToken(token);
		if (!result) {
			return fail(400, {
				error: 'This reset link is invalid or has expired. Request a new one.'
			});
		}

		const passwordHash = await hashPassword(password);
		await db.update(user).set({ passwordHash }).where(eq(user.id, result.userId));
		await consumePasswordResetToken(token);
		// A password reset means any existing sessions (including one that
		// might belong to whoever's password just got reset out from under
		// them) should be forced to log in again with the new password.
		await invalidateAllUserSessions(result.userId);

		redirect(303, '/login');
	}
};
