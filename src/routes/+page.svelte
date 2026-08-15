<script lang="ts">
	import { posterUrl } from '$lib/poster';
	import { randomReaction } from '$lib/spin-reactions';
	import { randomGalleryQuip } from '$lib/gallery-reveal-quips';
	import { randomHeroSubtitle } from '$lib/hero-subtitles';
	import { randomSpinAgainLabel } from '$lib/spin-button-labels';
	import { splitSentences } from '$lib/split-sentences';
	import { bracketSizes, bracketSizeLabels } from '$lib/bracket-sizes';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const heroSubtitle = randomHeroSubtitle();
	const ITEM_HEIGHT = 240;

	const fullPool = $derived.by(() => {
		const unwatched = data.movies.filter((m) => !m.watched);
		return unwatched.length > 0 ? unwatched : data.movies;
	});

	let selectedBracketSize = $state<number>(16);
	let dialogEl: HTMLDialogElement;
	let scrollContainer: HTMLDivElement;

	let spinning = $state(false);
	let sequence = $state<typeof data.movies>([]);
	let translateY = $state(0);
	let transitionMs = $state(0);

	let roundPool = $state<typeof data.movies>([]);
	let roundSize = $state(0);
	let spinsRemaining = $state(0);
	let totalInBatch = $state(0);
	let results = $state<{ movie: (typeof data.movies)[number]; quip: string }[]>([]);
	let closingQuip = $state('');
	let champion = $state<{ movie: (typeof data.movies)[number]; quip: string } | null>(null);
	let newBracketLabel = $state('Spin again');
	let pendingSpinTimeout: ReturnType<typeof setTimeout> | null = null;

	const bracketActive = $derived(spinning || spinsRemaining > 0);
	const roundComplete = $derived(
		!bracketActive && roundSize > 0 && results.length === roundSize && !champion
	);
	const nextRoundSize = $derived(roundSize > 1 ? Math.ceil(roundSize / 2) : 0);

	// The dialog scrolls internally, so newly landed picks append below the
	// fold during a fast, large round — follow them down as they arrive.
	$effect(() => {
		results.length;
		if (bracketActive && scrollContainer) {
			scrollContainer.scrollTo({ top: scrollContainer.scrollHeight, behavior: 'smooth' });
		}
	});

	// Big rounds (32/64) would take minutes at the original dramatic pace, so
	// spins get quicker the larger the round — full drama is saved for the
	// small, decisive rounds where it actually matters.
	function transitionDurationFor(size: number) {
		if (size >= 32) return 1000;
		if (size >= 8) return 1800;
		return 3200;
	}
	function pauseDurationFor(size: number) {
		if (size >= 32) return 200;
		if (size >= 8) return 300;
		return 450;
	}

	function pickFromRoundPool(excludeIds: Set<number>) {
		const candidates = roundPool.filter((m) => !excludeIds.has(m.id));
		const source = candidates.length > 0 ? candidates : roundPool;
		return source[Math.floor(Math.random() * source.length)];
	}

	function runSpin() {
		spinning = true;

		const excludeIds = new Set(results.map((r) => r.movie.id));
		const pick = pickFromRoundPool(excludeIds);

		const reelLength = 26;
		const seq = Array.from(
			{ length: reelLength - 1 },
			() => roundPool[Math.floor(Math.random() * roundPool.length)]
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
				transitionMs = transitionDurationFor(roundSize);
				translateY = -(seq.length - 1) * ITEM_HEIGHT;
			});
		});
	}

	function beginRound(size: number) {
		roundSize = size;
		totalInBatch = size;
		spinsRemaining = size;
		results = [];
		closingQuip = '';
		runSpin();
	}

	function startBracket() {
		if (bracketActive || fullPool.length === 0) return;
		champion = null;
		roundPool = fullPool;
		dialogEl.showModal();
		beginRound(Math.min(selectedBracketSize, fullPool.length));
	}

	function continueBracket() {
		if (bracketActive || nextRoundSize === 0) return;
		roundPool = results.map((r) => r.movie);
		beginRound(nextRoundSize);
	}

	// Fires on every dialog close, however it happened — the ✕ button,
	// Escape, or finishing up after a champion is crowned. All of those mean
	// "I'm done with this bracket," so they all get the same full reset.
	function onDialogClose() {
		if (pendingSpinTimeout) {
			clearTimeout(pendingSpinTimeout);
			pendingSpinTimeout = null;
		}
		spinning = false;
		roundSize = 0;
		spinsRemaining = 0;
		champion = null;
		results = [];
		closingQuip = '';
		sequence = [];
	}

	function onTransitionEnd() {
		if (!spinning) return;
		spinning = false;

		const landed = sequence[sequence.length - 1];
		results = [...results, { movie: landed, quip: randomReaction() }];
		spinsRemaining -= 1;

		if (spinsRemaining > 0) {
			pendingSpinTimeout = setTimeout(() => {
				pendingSpinTimeout = null;
				runSpin();
			}, pauseDurationFor(roundSize));
		} else if (roundSize === 1) {
			champion = results[0];
			newBracketLabel = randomSpinAgainLabel();
		} else {
			closingQuip = randomGalleryQuip();
		}
	}
</script>

<svelte:head>
	<title>Regretometer — Spin</title>
</svelte:head>

<section class="text-center">
	<h1 class="text-4xl font-black tracking-tight text-neutral-50 sm:text-5xl">
		Spin for tonight's <span class="text-amber-400">regret</span>.
	</h1>
	<p class="mt-3 text-neutral-400">
		{heroSubtitle}
	</p>

	{#if data.movies.length === 0}
		<p class="mt-10 text-neutral-500">
			No movies in the pool yet — run <code class="text-amber-400">npm run db:seed</code> to load some.
		</p>
	{:else}
		<div class="mx-auto mt-10 flex max-w-lg flex-wrap justify-center gap-2">
			{#each bracketSizes as size (size)}
				<button
					type="button"
					onclick={() => (selectedBracketSize = size)}
					class="rounded-full border px-4 py-1.5 text-sm font-medium transition {selectedBracketSize ===
					size
						? 'border-amber-400 bg-amber-400/10 text-amber-400'
						: 'border-neutral-700 text-neutral-400 hover:border-neutral-500'}"
				>
					{bracketSizeLabels[size]} ({size})
				</button>
			{/each}
		</div>

		<button
			onclick={startBracket}
			class="mt-6 rounded-full bg-amber-400 px-8 py-3 text-lg font-bold text-neutral-950 transition hover:bg-amber-300"
		>
			Spin the wheel
		</button>
	{/if}
</section>

<dialog
	bind:this={dialogEl}
	onclose={onDialogClose}
	class="m-auto w-full max-w-2xl rounded-2xl border border-neutral-800 bg-neutral-950 p-0 text-neutral-100 backdrop:bg-black/70 backdrop:backdrop-blur-sm"
>
	<div bind:this={scrollContainer} class="max-h-[85vh] overflow-y-auto p-6">
		<div class="flex items-start justify-between gap-4">
			<p class="text-sm font-semibold tracking-wide text-amber-400 uppercase">
				{roundSize > 0 ? bracketSizeLabels[roundSize] : ''}
			</p>
			<button
				onclick={() => dialogEl.close()}
				aria-label="Stop and close"
				class="rounded-full border border-neutral-800 px-2.5 py-1 text-sm text-neutral-500 transition hover:border-neutral-600 hover:text-neutral-300"
			>
				✕
			</button>
		</div>

		<div class="relative mx-auto mt-4 max-w-sm">
			<div
				class="pointer-events-none absolute top-1/2 left-0 z-20 h-0 w-0 -translate-x-1/2 -translate-y-1/2 border-y-[12px] border-l-[16px] border-y-transparent border-l-amber-400"
			></div>
			<div
				class="pointer-events-none absolute top-1/2 right-0 z-20 h-0 w-0 translate-x-1/2 -translate-y-1/2 border-y-[12px] border-r-[16px] border-y-transparent border-r-amber-400"
			></div>

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
							<a
								href="/movie/{item.id}"
								class="flex h-60 items-center gap-4 px-8 transition-colors hover:bg-neutral-800/40"
							>
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
							</a>
						{/each}
					</div>
				{:else}
					<div class="flex h-60 items-center justify-center text-5xl text-neutral-700">🎬</div>
				{/if}
			</div>
		</div>

		<div class="mt-6 text-center">
			{#if champion}
				<button
					onclick={() => dialogEl.close()}
					class="rounded-full bg-amber-400 px-8 py-3 text-lg font-bold text-neutral-950 transition hover:bg-amber-300"
				>
					{newBracketLabel}
				</button>
			{:else if roundComplete}
				<button
					onclick={continueBracket}
					class="rounded-full bg-amber-400 px-8 py-3 text-lg font-bold text-neutral-950 transition hover:bg-amber-300"
				>
					Narrow it down to the {bracketSizeLabels[nextRoundSize]}
				</button>
			{:else if bracketActive}
				<p class="text-sm text-neutral-500">
					spin {totalInBatch - spinsRemaining + 1} of {totalInBatch}
				</p>
			{/if}
		</div>

		{#if champion}
			<div class="mx-auto mt-8 max-w-xs text-center">
				<a href="/movie/{champion.movie.id}" class="group block">
					{#if posterUrl(champion.movie.posterPath, 'w500')}
						<img
							src={posterUrl(champion.movie.posterPath, 'w500')}
							alt=""
							class="mx-auto w-48 rounded-2xl object-cover shadow-xl transition group-hover:opacity-90"
						/>
					{:else}
						<div
							class="mx-auto flex h-72 w-48 items-center justify-center rounded-2xl bg-neutral-800 text-5xl"
						>
							🎬
						</div>
					{/if}
				</a>
				<p class="mt-4 text-2xl font-bold text-neutral-50">{champion.movie.title}</p>
				<p class="text-sm text-neutral-500">
					{champion.movie.year ?? ''}
					{champion.movie.mediaType === 'tv' ? '· TV Series' : ''}
				</p>
				<div class="mt-4 space-y-1 text-lg text-neutral-300 italic">
					{#each splitSentences(champion.quip) as line (line)}
						<p>{line}</p>
					{/each}
				</div>
				<a
					href="/movie/{champion.movie.id}"
					class="mt-4 inline-block rounded-full bg-neutral-100 px-5 py-2 text-sm font-semibold text-neutral-950 transition hover:bg-white"
				>
					View & review →
				</a>
			</div>
		{:else if results.length > 0}
			<div class="mt-8">
				{#if closingQuip}
					<div class="space-y-1 text-center text-lg text-neutral-300 italic">
						{#each splitSentences(closingQuip) as line (line)}
							<p>{line}</p>
						{/each}
					</div>
				{/if}

				<div class="mt-6 grid grid-cols-4 gap-3 text-left sm:grid-cols-6 md:grid-cols-8">
					{#each results as result (result.movie.id)}
						<a href="/movie/{result.movie.id}" class="group block" title={result.movie.title}>
							{#if posterUrl(result.movie.posterPath)}
								<img
									src={posterUrl(result.movie.posterPath)}
									alt=""
									class="w-full rounded-lg object-cover shadow-md transition group-hover:opacity-80"
								/>
							{:else}
								<div
									class="flex aspect-[2/3] items-center justify-center rounded-lg bg-neutral-800 text-xl"
								>
									🎬
								</div>
							{/if}
							<p class="mt-1 truncate text-xs font-medium text-neutral-300">
								{result.movie.title}
							</p>
						</a>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</dialog>
