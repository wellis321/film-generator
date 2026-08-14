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
	if (yearHint) params.set(mediaType === 'movie' ? 'year' : 'first_air_date_year', yearHint);

	const res = await fetch(`${TMDB_API}/search/${mediaType}?${params}`, {
		headers: { Authorization: `Bearer ${apiKey}`, accept: 'application/json' }
	});
	if (!res.ok) throw new Error(`TMDB search failed for "${query}": ${res.status}`);

	const data = await res.json();
	const results: any[] = data.results ?? [];
	if (results.length === 0) return null;

	// TMDB's default ordering can surface trivia shorts/specials over the
	// actual film (e.g. "X-Men: The Mutant Watch" outranking "X-Men").
	// Prefer an exact title match, then fall back to whichever result has
	// the most votes, since real theatrical releases dwarf shorts on votes.
	const nameOf = (r: any) => (mediaType === 'movie' ? r.title : r.name) as string;
	const normalize = (s: string) => s.trim().toLowerCase();
	const exactMatch = results.find((r) => normalize(nameOf(r)) === normalize(query));
	const best =
		exactMatch ?? results.reduce((a, b) => ((b.vote_count ?? 0) > (a.vote_count ?? 0) ? b : a));

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
