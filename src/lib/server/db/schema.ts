import { mysqlTable, int, text, varchar, boolean, timestamp, mysqlEnum } from 'drizzle-orm/mysql-core';

export const movie = mysqlTable('movie', {
	id: int('id').primaryKey().autoincrement(),
	tmdbId: int('tmdb_id').notNull(),
	mediaType: mysqlEnum('media_type', ['movie', 'tv']).notNull().default('movie'),
	title: varchar('title', { length: 255 }).notNull(),
	year: varchar('year', { length: 4 }),
	posterPath: varchar('poster_path', { length: 255 }),
	synopsis: text('synopsis'),
	tmdbRating: varchar('tmdb_rating', { length: 8 }),
	tmdbVoteCount: int('tmdb_vote_count'),
	watched: boolean('watched').notNull().default(false),
	watchedAt: timestamp('watched_at'),
	ourRating: int('our_rating'),
	ourReview: text('our_review'),
	createdAt: timestamp('created_at').notNull().defaultNow()
});
