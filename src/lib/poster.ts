export function posterUrl(posterPath: string | null, size: 'w342' | 'w500' = 'w342') {
	return posterPath ? `https://image.tmdb.org/t/p/${size}${posterPath}` : null;
}
