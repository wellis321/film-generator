import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { generateResetToken, createPasswordResetToken } from '$lib/server/auth';
import { sendPasswordResetEmail } from '$lib/server/email';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) redirect(303, '/');
};

export const actions: Actions = {
	default: async ({ request, url }) => {
		const form = await request.formData();
		const email = String(form.get('email') ?? '')
			.trim()
			.toLowerCase();

		if (!email || !email.includes('@')) {
			return fail(400, { error: 'Enter a valid email address.', email });
		}

		// Always report success, whether or not the email matches an
		// account — this stops the form from being usable to check which
		// emails are registered.
		const [existing] = await db
			.select({ id: user.id })
			.from(user)
			.where(eq(user.email, email))
			.limit(1);

		if (existing) {
			const token = generateResetToken();
			await createPasswordResetToken(token, existing.id);
			const resetUrl = `${url.origin}/reset-password?token=${token}`;

			if (!env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not set');
			await sendPasswordResetEmail(env.RESEND_API_KEY, email, resetUrl);
		}

		return { success: true };
	}
};
