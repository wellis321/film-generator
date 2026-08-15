import {
	mysqlTable,
	int,
	text,
	varchar,
	boolean,
	timestamp,
	mysqlEnum,
	uniqueIndex
} from 'drizzle-orm/mysql-core';

// The shared movie/TV catalog — sourced from TMDB, identical for everyone.
// Per-user state (watched, rating, review, excluded) lives in userMovie.
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
	certification: varchar('certification', { length: 10 }),
	createdAt: timestamp('created_at').notNull().defaultNow()
});

export const user = mysqlTable('user', {
	id: int('id').primaryKey().autoincrement(),
	email: varchar('email', { length: 255 }).notNull().unique(),
	passwordHash: varchar('password_hash', { length: 255 }).notNull(),
	name: varchar('name', { length: 100 }),
	emailVerified: boolean('email_verified').notNull().default(false),
	createdAt: timestamp('created_at').notNull().defaultNow()
});

export const session = mysqlTable('session', {
	id: varchar('id', { length: 255 }).primaryKey(),
	userId: int('user_id').notNull(),
	expiresAt: timestamp('expires_at').notNull()
});

export const passwordResetToken = mysqlTable('password_reset_token', {
	id: varchar('id', { length: 255 }).primaryKey(),
	userId: int('user_id').notNull(),
	expiresAt: timestamp('expires_at').notNull()
});

export const emailVerificationToken = mysqlTable('email_verification_token', {
	id: varchar('id', { length: 255 }).primaryKey(),
	userId: int('user_id').notNull(),
	expiresAt: timestamp('expires_at').notNull()
});

// A logged-in user's saved roster of "who's picking" characters for the
// bracket spinner. Keyed on (userId, name) rather than a client-tracked row
// id, so renaming a slot starts a fresh character (0 wins) but re-using an
// existing name — even after removing and re-adding it — keeps its tally.
export const playerCharacter = mysqlTable(
	'player_character',
	{
		id: int('id').primaryKey().autoincrement(),
		userId: int('user_id').notNull(),
		name: varchar('name', { length: 100 }).notNull(),
		position: int('position').notNull().default(0),
		wins: int('wins').notNull().default(0)
	},
	(table) => [uniqueIndex('player_character_user_id_name_idx').on(table.userId, table.name)]
);

// One row per (user, movie): that user's personal watched/rating/review/
// exclusion state for that title.
export const userMovie = mysqlTable(
	'user_movie',
	{
		id: int('id').primaryKey().autoincrement(),
		userId: int('user_id').notNull(),
		movieId: int('movie_id').notNull(),
		watched: boolean('watched').notNull().default(false),
		watchedAt: timestamp('watched_at'),
		excluded: boolean('excluded').notNull().default(false),
		ourRating: int('our_rating'),
		ourReview: text('our_review'),
		createdAt: timestamp('created_at').notNull().defaultNow()
	},
	(table) => [uniqueIndex('user_movie_user_id_movie_id_idx').on(table.userId, table.movieId)]
);
