<script lang="ts">
	import { posterUrl } from '$lib/poster';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const ITEM_HEIGHT = 240;

	const pool = $derived.by(() => {
		const unwatched = data.movies.filter((m) => !m.watched);
		return unwatched.length > 0 ? unwatched : data.movies;
	});

	let spinning = $state(false);
	let hasSpun = $state(false);
	let sequence = $state<typeof data.movies>([]);
	let translateY = $state(0);
	let transitionMs = $state(0);
	let winner = $state<(typeof data.movies)[number] | null>(null);

	function spin() {
		if (spinning || pool.length === 0) return;
		spinning = true;
		winner = null;

		const pick = pool[Math.floor(Math.random() * pool.length)];

		const reelLength = 26;
		const seq = Array.from(
			{ length: reelLength - 1 },
			() => pool[Math.floor(Math.random() * pool.length)]
		);
		seq.push(pick);
		sequence = seq;

		// Snap back to the top with no transition before animating down again,
		// otherwise re-spinning would smoothly (and near-invisibly) ease from
		// wherever the reel stopped last time instead of doing a full spin.
		transitionMs = 0;
		translateY = 0;

		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				transitionMs = 3200;
				translateY = -(seq.length - 1) * ITEM_HEIGHT;
			});
		});
	}

	function onTransitionEnd() {
		if (!spinning) return;
		spinning = false;
		hasSpun = true;
		winner = sequence[sequence.length - 1];
	}
</script>

<svelte:head>
	<title>Nopemeter — Spin</title>
</svelte:head>

<section class="text-center">
	<h1 class="text-4xl font-black tracking-tight text-neutral-50 sm:text-5xl">
		Spin for tonight's <span class="text-amber-400">regret</span>.
	</h1>
	<p class="mt-3 text-neutral-400">
		Press the button. Whatever it lands on, that's what we're watching.
	</p>

	{#if data.movies.length === 0}
		<p class="mt-10 text-neutral-500">
			No movies in the pool yet — run <code class="text-amber-400">npm run db:seed</code> to load some.
		</p>
	{:else}
		<div class="relative mx-auto mt-10 max-w-sm">
			<div
				class="pointer-events-none absolute top-1/2 left-1/2 z-20 -translate-x-1/2 -translate-y-1/2"
			>
				<div
					class="absolute top-1/2 -left-[calc(50%+1.75rem)] h-0 w-0 -translate-y-1/2 border-y-[12px] border-l-[16px] border-y-transparent border-l-amber-400"
				></div>
				<div
					class="absolute top-1/2 -right-[calc(50%+1.75rem)] h-0 w-0 -translate-y-1/2 border-y-[12px] border-r-[16px] border-y-transparent border-r-amber-400"
				></div>
			</div>

			<div
				class="relative h-60 overflow-hidden rounded-2xl border-2 border-amber-400/60 bg-neutral-900 shadow-[0_0_40px_-10px_rgba(251,191,36,0.4)]"
			>
				<div
					class="pointer-events-none absolute inset-x-0 top-0 z-10 h-16 bg-gradient-to-b from-neutral-950 to-transparent"
				></div>
				<div
					class="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16 bg-gradient-to-t from-neutral-950 to-transparent"
				></div>

				{#if sequence.length}
					<div
						class="ease-[cubic-bezier(0.1,0.7,0.2,1)] transition-transform"
						style="transform: translateY({translateY}px); transition-duration: {transitionMs}ms;"
						ontransitionend={onTransitionEnd}
					>
						{#each sequence as item, i (i)}
							<div class="flex h-60 items-center gap-4 px-8">
								{#if posterUrl(item.posterPath)}
									<img
										src={posterUrl(item.posterPath)}
										alt=""
										class="h-44 w-30 flex-shrink-0 rounded-lg object-cover shadow-lg"
									/>
								{:else}
									<div
										class="flex h-44 w-30 flex-shrink-0 items-center justify-center rounded-lg bg-neutral-800 text-3xl"
									>
										🎬
									</div>
								{/if}
								<div class="min-w-0 text-left">
									<p class="truncate text-xl font-bold text-neutral-50">{item.title}</p>
									<p class="text-sm text-neutral-500">
										{item.year ?? ''}
										{item.mediaType === 'tv' ? '· TV Series' : ''}
									</p>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<div class="flex h-60 items-center justify-center text-5xl text-neutral-700">🎬</div>
				{/if}
			</div>
		</div>

		<button
			onclick={spin}
			disabled={spinning}
			class="mt-8 rounded-full bg-amber-400 px-8 py-3 text-lg font-bold text-neutral-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
		>
			{spinning ? 'Spinning…' : hasSpun ? 'Spin again' : 'Spin the wheel'}
		</button>

		{#if winner && !spinning}
			<div
				class="mx-auto mt-10 max-w-sm rounded-2xl border border-neutral-800 bg-neutral-900 p-6 text-left"
			>
				<div class="flex gap-4">
					{#if posterUrl(winner.posterPath)}
						<img
							src={posterUrl(winner.posterPath)}
							alt=""
							class="h-32 w-22 flex-shrink-0 rounded-lg object-cover shadow-lg"
						/>
					{/if}
					<div class="min-w-0">
						<p class="text-lg font-bold text-neutral-50">{winner.title}</p>
						<p class="text-sm text-neutral-500">
							{winner.year ?? ''}
							{winner.mediaType === 'tv' ? '· TV Series' : ''}
						</p>
					</div>
				</div>
				<a
					href="/movie/{winner.id}"
					class="mt-4 inline-block rounded-full bg-neutral-100 px-5 py-2 text-sm font-semibold text-neutral-950 transition hover:bg-white"
				>
					View & review →
				</a>
			</div>
		{/if}
	{/if}
</section>
