const TMDB_API = 'https://api.themoviedb.org/3';

export type MediaType = 'movie' | 'tv';

export type TmdbResult = {
	tmdbId: number;
	title: string;
	year: string | null;
	posterPath: string | null;
	synopsis: string;
	tmdbRating: string;
	tmdbVoteCount: number;
};

export async function searchTmdb(
	apiKey: string,
	query: string,
	mediaType: MediaType,
	yearHint?: string
): Promise<TmdbResult | null> {
	const params = new URLSearchParams({ query });
	// TMDB's `year`/`first_air_date_year` params are loose ranking hints, not
	// filters — they don't reliably exclude same-titled results from other
	// years (e.g. querying "Aladdin" with year=2019 still returned the 1992
	// original first). `primary_release_year` is the actual strict filter
	// for movies; TV has no equivalent, so we filter results by year below.
	if (yearHint && mediaType === 'movie') params.set('primary_release_year', yearHint);

	const res = await fetch(`${TMDB_API}/search/${mediaType}?${params}`, {
		headers: { Authorization: `Bearer ${apiKey}`, accept: 'application/json' }
	});
	if (!res.ok) throw new Error(`TMDB search failed for "${query}": ${res.status}`);

	const data = await res.json();
	const results: any[] = data.results ?? [];
	if (results.length === 0) return null;

	// TMDB's default ordering can surface trivia shorts/specials, or a
	// same-titled release from a different year, over the intended film
	// (e.g. "X-Men: The Mutant Watch" outranking "X-Men"). Prefer an exact
	// title match whose year also matches the hint, then any exact title
	// match, then whichever result has the most votes.
	const nameOf = (r: any) => (mediaType === 'movie' ? r.title : r.name) as string;
	const yearOf = (r: any) =>
		((mediaType === 'movie' ? r.release_date : r.first_air_date) as string | undefined)?.slice(
			0,
			4
		);
	const normalize = (s: string) => s.trim().toLowerCase();
	const exactMatches = results.filter((r) => normalize(nameOf(r)) === normalize(query));
	const exactMatchForYear = yearHint ? exactMatches.find((r) => yearOf(r) === yearHint) : undefined;
	const best =
		exactMatchForYear ??
		exactMatches[0] ??
		results.reduce((a, b) => ((b.vote_count ?? 0) > (a.vote_count ?? 0) ? b : a));

	return {
		tmdbId: best.id,
		title: mediaType === 'movie' ? best.title : best.name,
		year: (mediaType === 'movie' ? best.release_date : best.first_air_date)?.slice(0, 4) || null,
		posterPath: best.poster_path,
		synopsis: best.overview || '',
		tmdbRating: best.vote_average?.toFixed(1) ?? '0',
		tmdbVoteCount: best.vote_count ?? 0
	};
}

export type TmdbSearchHit = {
	tmdbId: number;
	mediaType: MediaType;
	title: string;
	year: string | null;
	posterPath: string | null;
};

// Powers the "add your own pick" search box — unlike searchTmdb (which picks
// one best match for a known title), this returns several candidates across
// both movies and TV for the user to pick from themselves.
export async function searchTmdbMulti(apiKey: string, query: string): Promise<TmdbSearchHit[]> {
	const params = new URLSearchParams({ query });
	const res = await fetch(`${TMDB_API}/search/multi?${params}`, {
		headers: { Authorization: `Bearer ${apiKey}`, accept: 'application/json' }
	});
	if (!res.ok) throw new Error(`TMDB search failed for "${query}": ${res.status}`);

	const data = await res.json();
	const results: any[] = data.results ?? [];
	return results
		.filter((r) => r.media_type === 'movie' || r.media_type === 'tv')
		.slice(0, 8)
		.map((r) => ({
			tmdbId: r.id,
			mediaType: r.media_type as MediaType,
			title: r.media_type === 'movie' ? r.title : r.name,
			year:
				(
					(r.media_type === 'movie' ? r.release_date : r.first_air_date) as string | undefined
				)?.slice(0, 4) || null,
			posterPath: r.poster_path ?? null
		}));
}

// Looks a title up by its known TMDB id rather than searching by name —
// used once the user has picked an exact result from searchTmdbMulti, so we
// fetch its full details straight from TMDB before inserting it.
export async function fetchTmdbById(
	apiKey: string,
	tmdbId: number,
	mediaType: MediaType
): Promise<TmdbResult> {
	const res = await fetch(`${TMDB_API}/${mediaType}/${tmdbId}`, {
		headers: { Authorization: `Bearer ${apiKey}`, accept: 'application/json' }
	});
	if (!res.ok) throw new Error(`TMDB details fetch failed for id ${tmdbId}: ${res.status}`);

	const best = await res.json();
	return {
		tmdbId: best.id,
		title: mediaType === 'movie' ? best.title : best.name,
		year: (mediaType === 'movie' ? best.release_date : best.first_air_date)?.slice(0, 4) || null,
		posterPath: best.poster_path,
		synopsis: best.overview || '',
		tmdbRating: best.vote_average?.toFixed(1) ?? '0',
		tmdbVoteCount: best.vote_count ?? 0
	};
}

// Preferred country order for picking a certification when multiple are
// available — GB first since that's the primary audience for this app, US
// as the most widely recognised fallback.
const CERTIFICATION_COUNTRIES = ['GB', 'US'];

export async function fetchCertification(
	apiKey: string,
	tmdbId: number,
	mediaType: MediaType
): Promise<string | null> {
	const endpoint =
		mediaType === 'movie'
			? `${TMDB_API}/movie/${tmdbId}/release_dates`
			: `${TMDB_API}/tv/${tmdbId}/content_ratings`;

	const res = await fetch(endpoint, {
		headers: { Authorization: `Bearer ${apiKey}`, accept: 'application/json' }
	});
	if (!res.ok) return null;

	const data = await res.json();
	const results: any[] = data.results ?? [];

	for (const country of CERTIFICATION_COUNTRIES) {
		const entry = results.find((r) => r.iso_3166_1 === country);
		if (!entry) continue;

		if (mediaType === 'movie') {
			const withCert = (entry.release_dates ?? []).find((rd: any) => rd.certification?.trim());
			if (withCert) return withCert.certification.trim();
		} else if (entry.rating?.trim()) {
			return entry.rating.trim();
		}
	}

	return null;
}
