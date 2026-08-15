const RESEND_API = 'https://api.resend.com/emails';

// Resend's shared sandbox sender only delivers to the email address on the
// Resend account itself, unless a real domain is verified. Swap this for an
// address on a verified domain (e.g. reset@wires.org.uk) once one is set up.
const FROM_ADDRESS = 'Regretometer <onboarding@resend.dev>';

export async function sendPasswordResetEmail(apiKey: string, to: string, resetUrl: string) {
	const res = await fetch(RESEND_API, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${apiKey}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			from: FROM_ADDRESS,
			to,
			subject: 'Reset your Regretometer password',
			html: `
				<p>Someone (hopefully you) asked to reset the password on your Regretometer account.</p>
				<p><a href="${resetUrl}">Click here to set a new password</a>. This link works for 30 minutes.</p>
				<p>If this wasn't you, you can ignore this email — your password won't change.</p>
			`
		})
	});

	if (!res.ok) {
		const body = await res.text();
		throw new Error(`Resend API error (${res.status}): ${body}`);
	}
}
