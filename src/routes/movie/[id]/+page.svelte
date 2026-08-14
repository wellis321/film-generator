<script lang="ts">
	import { enhance } from '$app/forms';
	import { posterUrl } from '$lib/poster';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let ourRating = $state(data.movie.ourRating ?? 5);
	let ourReview = $state(data.movie.ourReview ?? '');
</script>

<svelte:head>
	<title>{data.movie.title} — Regretometer</title>
</svelte:head>

<a href="/" class="text-sm text-neutral-500 transition hover:text-neutral-300">← Back to the wheel</a>

<div class="mt-6 flex flex-col gap-8 sm:flex-row">
	{#if posterUrl(data.movie.posterPath, 'w500')}
		<img
			src={posterUrl(data.movie.posterPath, 'w500')}
			alt=""
			class="w-full max-w-64 flex-shrink-0 self-start rounded-2xl object-cover shadow-xl"
		/>
	{/if}

	<div class="min-w-0 flex-1">
		<h1 class="text-3xl font-black text-neutral-50 sm:text-4xl">{data.movie.title}</h1>
		<p class="mt-1 text-neutral-500">
			{data.movie.year ?? ''}
			{data.movie.mediaType === 'tv' ? '· TV Series' : ''}
		</p>

		<div class="mt-3 flex flex-wrap items-center gap-3">
			{#if data.movie.watched}
				<span
					class="inline-block rounded-full bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-400"
					>✓ Watched</span
				>
			{/if}

			{#if data.movie.excluded}
				<span
					class="inline-block rounded-full bg-neutral-800 px-3 py-1 text-xs font-semibold text-neutral-400"
					>🚫 Excluded from pool</span
				>
				<form method="POST" action="?/include" use:enhance>
					<button type="submit" class="text-xs text-neutral-500 underline hover:text-neutral-300">
						Add back to pool
					</button>
				</form>
			{:else}
				<form method="POST" action="?/exclude" use:enhance>
					<button type="submit" class="text-xs text-neutral-500 underline hover:text-neutral-300">
						We know we won't watch this — remove from pool
					</button>
				</form>
			{/if}
		</div>

		<h2 class="mt-6 text-sm font-semibold tracking-wide text-neutral-400 uppercase">Synopsis</h2>
		<p class="mt-2 leading-relaxed text-neutral-300">
			{data.movie.synopsis || 'No synopsis available.'}
		</p>

		<h2 class="mt-6 text-sm font-semibold tracking-wide text-neutral-400 uppercase">
			What others say
		</h2>
		<p class="mt-2 text-neutral-300">
			{#if data.movie.tmdbRating}
				<span class="text-lg font-bold text-neutral-50">{data.movie.tmdbRating}</span>/10 on TMDB
				<span class="text-neutral-500">({data.movie.tmdbVoteCount?.toLocaleString()} votes)</span>
			{:else}
				No rating available.
			{/if}
		</p>

		<h2 class="mt-8 text-sm font-semibold tracking-wide text-neutral-400 uppercase">
			What we say
		</h2>

		<form
			method="POST"
			action="?/save"
			use:enhance
			class="mt-3 space-y-4 rounded-2xl border border-neutral-800 bg-neutral-900 p-5"
		>
			<div>
				<label for="ourRating" class="block text-sm text-neutral-400">
					Our rating: <span class="font-semibold text-amber-400">{ourRating}/10</span>
				</label>
				<input
					id="ourRating"
					name="ourRating"
					type="range"
					min="1"
					max="10"
					step="1"
					bind:value={ourRating}
					class="mt-2 w-full accent-amber-400"
				/>
			</div>

			<div>
				<label for="ourReview" class="block text-sm text-neutral-400">Our review</label>
				<textarea
					id="ourReview"
					name="ourReview"
					bind:value={ourReview}
					rows="4"
					placeholder="Utterly forgotten within twenty minutes..."
					class="mt-2 w-full resize-y rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 placeholder-neutral-600 focus:border-amber-400 focus:outline-none"
				></textarea>
			</div>

			{#if form?.error}
				<p class="text-sm text-red-400">{form.error}</p>
			{/if}

			<div class="flex items-center gap-3">
				<button
					type="submit"
					class="rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-neutral-950 transition hover:bg-amber-300"
				>
					{data.movie.watched ? 'Update review' : 'Mark watched & save'}
				</button>

				{#if data.movie.watched}
					<button
						formaction="?/unwatch"
						class="text-sm text-neutral-500 transition hover:text-neutral-300"
					>
						Mark as not watched
					</button>
				{/if}
			</div>
		</form>
	</div>
</div>
