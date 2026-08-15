import { sql } from 'drizzle-orm';
import { db } from './db';
import { user } from './db/schema';

// Before accounts existed, watched/rating/review/excluded lived directly on
// the movie table (one shared value for "us"). Now that state is per-user
// in userMovie. The first person to ever sign up inherits that legacy data
// as their own — it was their family's data to begin with.
export async function migrateLegacyDataIfFirstUser(newUserId: number) {
	const [{ count }] = await db.select({ count: sql<number>`COUNT(*)` }).from(user);
	if (Number(count) !== 1) return; // not the first user

	await db.execute(sql`
		INSERT INTO user_movie (user_id, movie_id, watched, watched_at, excluded, our_rating, our_review)
		SELECT ${newUserId}, id, watched, watched_at, excluded, our_rating, our_review
		FROM movie
		WHERE watched = true OR excluded = true OR our_rating IS NOT NULL OR our_review IS NOT NULL
	`);
}
