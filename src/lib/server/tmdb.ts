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
	const exactMatchForYear = yearHint
		? exactMatches.find((r) => yearOf(r) === yearHint)
		: undefined;
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
