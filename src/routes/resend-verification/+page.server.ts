import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { generateVerificationToken, createEmailVerificationToken } from '$lib/server/auth';
import { sendVerificationEmail } from '$lib/server/email';
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

		// Always report success — this form shouldn't be usable to check
		// which emails are registered or already verified.
		const [existing] = await db
			.select({ id: user.id, emailVerified: user.emailVerified })
			.from(user)
			.where(eq(user.email, email))
			.limit(1);

		if (existing && !existing.emailVerified) {
			const token = generateVerificationToken();
			await createEmailVerificationToken(token, existing.id);
			const verifyUrl = `${url.origin}/verify-email?token=${token}`;

			if (!env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not set');
			await sendVerificationEmail(env.RESEND_API_KEY, email, verifyUrl);
		}

		return { success: true };
	}
};
