<script lang="ts">
	import { posterUrl } from '$lib/poster';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Watched — Nopemeter</title>
</svelte:head>

<h1 class="text-3xl font-black text-neutral-50 sm:text-4xl">Movies we've suffered through</h1>
<p class="mt-2 text-neutral-400">Synopsis, what others say, and what we actually think.</p>

{#if data.movies.length === 0}
	<p class="mt-10 text-neutral-500">
		Nothing watched yet — <a href="/" class="text-amber-400 hover:underline">go spin the wheel</a>.
	</p>
{:else}
	<div class="mt-8 space-y-6">
		{#each data.movies as m (m.id)}
			<a
				href="/movie/{m.id}"
				class="block rounded-2xl border border-neutral-800 bg-neutral-900 p-5 transition hover:border-neutral-700"
			>
				<div class="flex flex-col gap-5 sm:flex-row">
					{#if posterUrl(m.posterPath)}
						<img
							src={posterUrl(m.posterPath)}
							alt=""
							class="h-52 w-36 flex-shrink-0 self-start rounded-lg object-cover shadow-lg"
						/>
					{/if}

					<div class="min-w-0 flex-1">
						<div class="flex flex-wrap items-baseline justify-between gap-2">
							<h2 class="text-xl font-bold text-neutral-50">{m.title}</h2>
							{#if m.ourRating}
								<span class="text-lg font-bold whitespace-nowrap text-amber-400"
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
							<span class="font-semibold text-neutral-400">Others say:</span>
							{m.tmdbRating ? `${m.tmdbRating}/10 on TMDB` : 'no rating available'}
						</p>

						<p class="mt-1 text-sm text-neutral-300">
							<span class="font-semibold text-neutral-400">We say:</span>
							{m.ourReview || 'No review yet.'}
						</p>
					</div>
				</div>
			</a>
		{/each}
	</div>
{/if}
