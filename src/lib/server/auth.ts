import { randomBytes, scrypt, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { eq } from 'drizzle-orm';
import { db } from './db';
import { session, user } from './db/schema';

const scryptAsync = promisify(scrypt);

export const SESSION_COOKIE_NAME = 'session';
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

export async function hashPassword(password: string): Promise<string> {
	const salt = randomBytes(16).toString('hex');
	const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
	return `${salt}:${derivedKey.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
	const [salt, hash] = stored.split(':');
	if (!salt || !hash) return false;
	const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
	const hashBuffer = Buffer.from(hash, 'hex');
	if (derivedKey.length !== hashBuffer.length) return false;
	return timingSafeEqual(derivedKey, hashBuffer);
}

// The cookie holds the raw random token; only its SHA-256 hash is stored as
// the session id in the database, so a database leak alone can't be used to
// forge a working session cookie.
function hashToken(token: string): string {
	return createHash('sha256').update(token).digest('hex');
}

export function generateSessionToken(): string {
	return randomBytes(32).toString('hex');
}

export async function createSession(token: string, userId: number) {
	const id = hashToken(token);
	const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
	await db.insert(session).values({ id, userId, expiresAt });
	return { id, userId, expiresAt };
}

export async function validateSessionToken(token: string) {
	const id = hashToken(token);
	const [result] = await db
		.select({
			userId: user.id,
			email: user.email,
			name: user.name,
			expiresAt: session.expiresAt
		})
		.from(session)
		.innerJoin(user, eq(session.userId, user.id))
		.where(eq(session.id, id))
		.limit(1);

	if (!result) return null;

	if (result.expiresAt.getTime() < Date.now()) {
		await db.delete(session).where(eq(session.id, id));
		return null;
	}

	return { id: result.userId, email: result.email, name: result.name };
}

export async function invalidateSession(token: string) {
	const id = hashToken(token);
	await db.delete(session).where(eq(session.id, id));
}
