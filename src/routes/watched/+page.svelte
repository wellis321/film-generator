<script lang="ts">
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { posterUrl } from '$lib/poster';
	import { ratingLabels } from '$lib/rating-labels';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const sortOptions = [
		{ value: 'watched_desc', label: 'Recently watched' },
		{ value: 'watched_asc', label: 'Watched longest ago' },
		{ value: 'our_rating_desc', label: 'Our rating: high to low' },
		{ value: 'our_rating_asc', label: 'Our rating: low to high' },
		{ value: 'tmdb_rating_desc', label: 'TMDB rating: high to low' },
		{ value: 'tmdb_rating_asc', label: 'TMDB rating: low to high' },
		{ value: 'title_asc', label: 'Title: A–Z' },
		{ value: 'title_desc', label: 'Title: Z–A' }
	];

	const minRatingOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

	const hasActiveFilters = $derived(
		data.mediaType !== 'all' || data.minRating !== null || data.sort !== 'watched_desc'
	);

	function updateParam(key: string, value: string) {
		const params = new URLSearchParams(page.url.searchParams);
		if (value) {
			params.set(key, value);
		} else {
			params.delete(key);
		}
		goto(`?${params}`, { keepFocus: true, noScroll: true });
	}
</script>

<svelte:head>
	<title>Watched — Regretometer</title>
</svelte:head>

<h1 class="text-3xl font-black text-neutral-50 sm:text-4xl">Movies we've suffered through</h1>
<p class="mt-2 text-neutral-400">Synopsis, what others say, and what we actually think.</p>

<div class="mt-6 flex flex-wrap items-center gap-2.5">
	<label
		class="flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900 py-1.5 pr-3 pl-4 transition hover:border-amber-400/40"
	>
		<span class="text-[0.65rem] font-bold tracking-widest text-amber-400 uppercase">Sort</span>
		<select
			value={data.sort}
			onchange={(e) => updateParam('sort', e.currentTarget.value)}
			class="cursor-pointer appearance-none bg-transparent bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2020%2020%22%20fill=%22none%22%20stroke=%22%23fbbf24%22%20stroke-width=%222%22%3E%3Cpath%20d=%22M5%208l5%205%205-5%22/%3E%3C/svg%3E')] bg-[right_0_center] bg-no-repeat pr-5 text-sm font-medium text-neutral-100 focus:outline-none"
		>
			{#each sortOptions as opt (opt.value)}
				<option value={opt.value}>{opt.label}</option>
			{/each}
		</select>
	</label>

	<label
		class="flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900 py-1.5 pr-3 pl-4 transition hover:border-amber-400/40"
	>
		<span class="text-[0.65rem] font-bold tracking-widest text-amber-400 uppercase">Show</span>
		<select
			value={data.mediaType}
			onchange={(e) => updateParam('type', e.currentTarget.value === 'all' ? '' : e.currentTarget.value)}
			class="cursor-pointer appearance-none bg-transparent bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2020%2020%22%20fill=%22none%22%20stroke=%22%23fbbf24%22%20stroke-width=%222%22%3E%3Cpath%20d=%22M5%208l5%205%205-5%22/%3E%3C/svg%3E')] bg-[right_0_center] bg-no-repeat pr-5 text-sm font-medium text-neutral-100 focus:outline-none"
		>
			<option value="all">Movies & TV</option>
			<option value="movie">Movies only</option>
			<option value="tv">TV only</option>
		</select>
	</label>

	<label
		class="flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900 py-1.5 pr-3 pl-4 transition hover:border-amber-400/40"
	>
		<span class="text-[0.65rem] font-bold tracking-widest text-amber-400 uppercase">Rating</span>
		<select
			value={data.minRating ?? ''}
			onchange={(e) => updateParam('minRating', e.currentTarget.value)}
			class="cursor-pointer appearance-none bg-transparent bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2020%2020%22%20fill=%22none%22%20stroke=%22%23fbbf24%22%20stroke-width=%222%22%3E%3Cpath%20d=%22M5%208l5%205%205-5%22/%3E%3C/svg%3E')] bg-[right_0_center] bg-no-repeat pr-5 text-sm font-medium text-neutral-100 focus:outline-none"
		>
			<option value="">Any</option>
			{#each minRatingOptions as n (n)}
				<option value={n}>{n}+</option>
			{/each}
		</select>
	</label>

	{#if hasActiveFilters}
		<a
			href="/watched"
			class="rounded-full px-3 py-1.5 text-sm text-neutral-500 underline decoration-neutral-700 transition hover:text-amber-400 hover:decoration-amber-400"
			>Reset</a
		>
	{/if}
</div>

{#if data.movies.length === 0}
	<p class="mt-10 text-neutral-500">
		{#if hasActiveFilters}
			No watched movies match these filters — <a href="/watched" class="text-amber-400 hover:underline"
				>reset them</a
			>.
		{:else}
			Nothing watched yet — <a href="/" class="text-amber-400 hover:underline">go spin the wheel</a>.
		{/if}
	</p>
{:else}
	<div class="mt-8 space-y-6">
		{#each data.movies as m (m.id)}
			<div
				class="relative rounded-2xl border border-neutral-800 bg-neutral-900 transition hover:border-neutral-700"
			>
				<form
					method="POST"
					action="/movie/{m.id}?/unwatch"
					use:enhance
					onsubmit={(e) => {
						if (!confirm(`Remove "${m.title}" from your watched list?`)) e.preventDefault();
					}}
					class="absolute top-3 right-3 z-10"
				>
					<button
						type="submit"
						aria-label={`Remove ${m.title} from watched`}
						title="Not actually watched — remove from list"
						class="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-950/80 text-neutral-400 transition hover:bg-red-500/20 hover:text-red-400"
					>
						✕
					</button>
				</form>

				<a href="/movie/{m.id}" class="block p-5">
					<div class="flex flex-col gap-5 sm:flex-row">
						{#if posterUrl(m.posterPath)}
							<img
								src={posterUrl(m.posterPath)}
								alt=""
								class="h-52 w-36 flex-shrink-0 self-start rounded-lg object-cover shadow-lg"
							/>
						{/if}

						<div class="min-w-0 flex-1">
							<div class="flex flex-wrap items-baseline justify-between gap-2 pr-8">
								<h2 class="text-xl font-bold text-neutral-50">{m.title}</h2>
								{#if m.ourRating}
									<span
										class="text-lg font-bold whitespace-nowrap text-amber-400"
										title={ratingLabels[m.ourRating]}
										>{m.ourRating}/10 (us)</span
									>
								{/if}
							</div>
							<p class="text-sm text-neutral-500">
								{m.year ?? ''}
								{m.mediaType === 'tv' ? '· TV Series' : ''}
								{#if m.watchedAt}
									· watched {new Date(m.watchedAt).toLocaleDateString()}
								{/if}
							</p>

							<p class="mt-3 line-clamp-2 text-sm text-neutral-400">
								{m.synopsis || 'No synopsis available.'}
							</p>

							<p class="mt-3 text-xs text-neutral-500">
								<span class="font-medium text-neutral-500">Others say</span>
								{m.tmdbRating ? `${m.tmdbRating}/10 on TMDB` : 'no rating available'}
							</p>

							<div class="mt-3 border-l-2 border-amber-400 bg-amber-400/[0.07] py-2 pl-3">
								<p class="text-[0.65rem] font-bold tracking-widest text-amber-400 uppercase">
									We say
								</p>
								<p class="mt-0.5 text-sm text-neutral-100">
									{m.ourReview || 'No review yet.'}
								</p>
							</div>
						</div>
					</div>
				</a>
			</div>
		{/each}
	</div>
{/if}
