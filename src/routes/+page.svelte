<script lang="ts">
	import { posterUrl } from '$lib/poster';
	import { randomReaction } from '$lib/spin-reactions';
	import { randomGalleryQuip } from '$lib/gallery-reveal-quips';
	import { randomHeroSubtitle } from '$lib/hero-subtitles';
	import { randomSpinAgainLabel } from '$lib/spin-button-labels';
	import { splitSentences } from '$lib/split-sentences';
	import { bracketSizes, bracketSizeLabels } from '$lib/bracket-sizes';
	import { characterNameSuggestions } from '$lib/player-name-suggestions';
	import { playerColors } from '$lib/player-colors';
	import {
		eliminatedQuip,
		stillInQuip,
		noSurvivorsQuip,
		championClaimedQuip
	} from '$lib/player-quips';
	import { page } from '$app/state';
	import { invalidateAll } from '$app/navigation';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const user = $derived(page.data.user);
	const winsByName = $derived(new Map(data.savedCharacters.map((c) => [c.name, c.wins])));

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

	// Optional "who's picking" layer: named players claim a couple of movies
	// each right after round 1, then we narrate whether their picks survive
	// each subsequent round.
	const CLAIMS_PER_PLAYER = 2;
	let players = $state<string[]>(data.savedCharacters.map((c) => c.name));
	let savingCharacters = $state(false);
	let savedFeedback = $state(false);
	let claims = $state<Map<number, number>>(new Map());
	let claimingPlayerIndex = $state(0);
	let claimsCollected = $state(false);
	let survivingPlayerIndices = $state<Set<number>>(new Set());
	let roundNarration = $state('');

	const playerNames = $derived(players.map((n, i) => n.trim() || `Player ${i + 1}`));

	function countFor(playerIndex: number) {
		let count = 0;
		for (const idx of claims.values()) if (idx === playerIndex) count++;
		return count;
	}

	const allClaimsComplete = $derived.by(() => {
		if (players.length === 0) return true;
		for (let i = 0; i < players.length; i++) {
			if (countFor(i) < CLAIMS_PER_PLAYER) return false;
		}
		return true;
	});

	const bracketActive = $derived(spinning || spinsRemaining > 0);
	const roundComplete = $derived(
		!bracketActive && roundSize > 0 && results.length === roundSize && !champion
	);
	const nextRoundSize = $derived(roundSize > 1 ? Math.ceil(roundSize / 2) : 0);

	// The gallery grid mirrors the round size instead of a flat responsive
	// breakpoint set, so a round of 4 shows a few tiles across one row while
	// a round of 64 wraps into rows of 8. Columns are capped to a fixed max
	// width (not a stretchy fraction of the dialog) so a small round like 4
	// stays thumbnail-sized instead of blowing up to fill the whole width —
	// the reel and the results need to fit on screen together.
	const galleryGridClasses: Record<number, string> = {
		2: 'grid-cols-[repeat(2,minmax(0,110px))] sm:grid-cols-[repeat(2,minmax(0,140px))] justify-center',
		4: 'grid-cols-[repeat(2,minmax(0,100px))] sm:grid-cols-[repeat(4,minmax(0,120px))] justify-center',
		8: 'grid-cols-[repeat(4,minmax(0,90px))] sm:grid-cols-[repeat(8,minmax(0,100px))] justify-center',
		16: 'grid-cols-[repeat(4,minmax(0,90px))] sm:grid-cols-[repeat(8,minmax(0,100px))] justify-center',
		32: 'grid-cols-[repeat(4,minmax(0,90px))] sm:grid-cols-[repeat(8,minmax(0,100px))] justify-center',
		64: 'grid-cols-[repeat(4,minmax(0,90px))] sm:grid-cols-[repeat(8,minmax(0,100px))] justify-center'
	};
	const galleryGridClass = $derived(
		galleryGridClasses[totalInBatch] ??
			'grid-cols-[repeat(4,minmax(0,90px))] sm:grid-cols-[repeat(8,minmax(0,100px))] justify-center'
	);
	const needsClaiming = $derived(roundComplete && players.length > 0 && !claimsCollected);

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

	function addPlayer() {
		if (players.length >= 5) return;
		players = [...players, ''];
	}

	function removePlayer(index: number) {
		players = players.filter((_, i) => i !== index);
	}

	function randomNameFor(index: number) {
		const used = new Set(players.filter((n) => n));
		const available = characterNameSuggestions.filter((n) => !used.has(n));
		const pool = available.length > 0 ? available : characterNameSuggestions;
		players[index] = pool[Math.floor(Math.random() * pool.length)];
	}

	async function saveCharacters() {
		if (!user || savingCharacters) return;
		savingCharacters = true;
		const formData = new FormData();
		for (const name of players) {
			if (name.trim()) formData.append('name', name.trim());
		}
		await fetch('?/saveCharacters', { method: 'POST', body: formData });
		await invalidateAll();
		savingCharacters = false;
		savedFeedback = true;
		setTimeout(() => (savedFeedback = false), 2000);
	}

	function recordWin(name: string) {
		if (!user) return;
		const formData = new FormData();
		formData.append('name', name);
		fetch('?/recordWin', { method: 'POST', body: formData }).then(() => invalidateAll());
	}

	// Finds the next player who hasn't hit their quota yet, so auto-advance
	// skips anyone already done instead of blindly moving one slot forward —
	// important once people can jump around via the pills below instead of
	// only ever moving strictly in turn order.
	function nextIncompleteFrom(startIndex: number) {
		for (let offset = 1; offset <= players.length; offset++) {
			const idx = (startIndex + offset) % players.length;
			if (countFor(idx) < CLAIMS_PER_PLAYER) return idx;
		}
		return startIndex;
	}

	function setActiveClaimer(index: number) {
		if (!needsClaiming) return;
		claimingPlayerIndex = index;
	}

	function claimMovie(movieId: number) {
		if (!needsClaiming) return;
		const owner = claims.get(movieId);
		if (owner !== undefined) {
			if (owner === claimingPlayerIndex) {
				claims.delete(movieId);
				claims = new Map(claims);
			}
			return;
		}
		if (countFor(claimingPlayerIndex) >= CLAIMS_PER_PLAYER) return;
		claims.set(movieId, claimingPlayerIndex);
		claims = new Map(claims);
		if (countFor(claimingPlayerIndex) >= CLAIMS_PER_PLAYER) {
			claimingPlayerIndex = nextIncompleteFrom(claimingPlayerIndex);
		}
	}

	function playersWithClaims() {
		const withClaims = new Set<number>();
		for (const playerIndex of claims.values()) withClaims.add(playerIndex);
		return withClaims;
	}

	// Used both by "Skip picks" (bail out early, some players may have
	// nothing claimed) and "Continue" (everyone's happy with their picks) —
	// claiming only ever finalizes on an explicit click, never automatically,
	// so there's always a chance to revisit and change a choice first.
	function finalizeClaims() {
		claimsCollected = true;
		survivingPlayerIndices = playersWithClaims();
	}

	// Compares this round's survivors against who was still in going into it,
	// returning the names of anyone whose last claimed movie just died.
	function updateSurvivors(aliveIds: Set<number>) {
		const currentlySurviving = new Set<number>();
		for (let i = 0; i < players.length; i++) {
			const claimedIds = [...claims.entries()].filter(([, pi]) => pi === i).map(([id]) => id);
			if (claimedIds.some((id) => aliveIds.has(id))) currentlySurviving.add(i);
		}
		const newlyEliminated = [...survivingPlayerIndices].filter((i) => !currentlySurviving.has(i));
		survivingPlayerIndices = currentlySurviving;
		return { currentlySurviving, newlyEliminated };
	}

	function beginRound(size: number) {
		roundSize = size;
		totalInBatch = size;
		spinsRemaining = size;
		results = [];
		closingQuip = '';
		roundNarration = '';
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
		claims = new Map();
		claimingPlayerIndex = 0;
		claimsCollected = false;
		survivingPlayerIndices = new Set();
		roundNarration = '';
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
			return;
		}

		const trackingPlayers = claimsCollected && claims.size > 0;
		const aliveIds = new Set(results.map((r) => r.movie.id));
		const { newlyEliminated } = trackingPlayers
			? updateSurvivors(aliveIds)
			: { newlyEliminated: [] as number[] };

		if (roundSize === 1) {
			champion = results[0];
			newBracketLabel = randomSpinAgainLabel();
			if (trackingPlayers) {
				const winnerIndex = claims.get(champion.movie.id);
				if (winnerIndex !== undefined) {
					roundNarration = championClaimedQuip(playerNames[winnerIndex]);
					recordWin(playerNames[winnerIndex]);
				} else if (newlyEliminated.length > 0) {
					roundNarration = `${eliminatedQuip(newlyEliminated.map((i) => playerNames[i]))} ${noSurvivorsQuip()}`;
				} else {
					roundNarration = noSurvivorsQuip();
				}
			}
		} else {
			closingQuip = randomGalleryQuip();
			if (trackingPlayers) {
				const stillIn = [...survivingPlayerIndices].map((i) => playerNames[i]);
				roundNarration =
					newlyEliminated.length > 0
						? eliminatedQuip(newlyEliminated.map((i) => playerNames[i]))
						: stillIn.length > 0
							? stillInQuip(stillIn)
							: '';
			}
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

		<div class="mx-auto mt-6 max-w-md">
			<p class="text-sm text-neutral-500">
				Who's picking? <span class="text-neutral-600">(optional)</span>
			</p>
			{#if !user}
				<p class="mt-0.5 text-xs text-neutral-600">
					<a href="/login" class="text-amber-400/80 hover:underline">Log in</a> to save your characters
					and track their wins.
				</p>
			{/if}
			<div class="mt-2 space-y-2">
				{#each players as _, i (i)}
					<div class="flex items-center gap-2">
						<span
							class="h-2.5 w-2.5 flex-shrink-0 rounded-full {playerColors[i % playerColors.length]
								.badge.split(' ')[0]}"
						></span>
						<input
							type="text"
							placeholder="Player {i + 1}"
							bind:value={players[i]}
							class="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-1.5 text-sm text-neutral-100 placeholder-neutral-600 focus:border-amber-400 focus:outline-none"
						/>
						{#if user && winsByName.get(players[i].trim())}
							<span
								class="flex-shrink-0 text-xs font-semibold text-amber-400"
								title="Wins with this character">🏆 {winsByName.get(players[i].trim())}</span
							>
						{/if}
						<button
							type="button"
							onclick={() => randomNameFor(i)}
							title="Suggest a name"
							class="flex-shrink-0 rounded-full border border-neutral-700 px-2 py-1 text-xs text-neutral-400 transition hover:border-neutral-500 hover:text-neutral-200"
						>
							🎲
						</button>
						<button
							type="button"
							onclick={() => removePlayer(i)}
							aria-label="Remove player"
							class="flex-shrink-0 rounded-full border border-neutral-700 px-2 py-1 text-xs text-neutral-400 transition hover:border-neutral-500 hover:text-neutral-200"
						>
							✕
						</button>
					</div>
				{/each}
			</div>
			<div class="mt-2 flex items-center gap-4">
				{#if players.length < 5}
					<button type="button" onclick={addPlayer} class="text-sm text-amber-400 hover:underline">
						+ Add player
					</button>
				{/if}
				{#if user && players.length > 0}
					<button
						type="button"
						onclick={saveCharacters}
						disabled={savingCharacters}
						class="text-sm text-neutral-400 hover:text-neutral-200 disabled:cursor-not-allowed"
					>
						{savedFeedback ? 'Saved ✓' : savingCharacters ? 'Saving…' : '💾 Save characters'}
					</button>
				{/if}
			</div>
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
	class="m-auto w-[95vw] max-w-2xl rounded-2xl border border-neutral-800 bg-neutral-950 p-0 text-neutral-100 backdrop:bg-black/70 backdrop:backdrop-blur-sm sm:max-w-3xl lg:max-w-5xl xl:max-w-6xl"
>
	<div bind:this={scrollContainer} class="max-h-[85vh] overflow-y-auto p-4 sm:p-6 lg:p-8">
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
			{:else if needsClaiming}
				<div class="flex flex-wrap items-center justify-center gap-2">
					{#each playerNames as name, i (i)}
						<button
							type="button"
							onclick={() => setActiveClaimer(i)}
							class="rounded-full border px-3 py-1 text-sm font-medium transition {i ===
							claimingPlayerIndex
								? `border-current ${playerColors[i % playerColors.length].text}`
								: 'border-neutral-700 text-neutral-400 hover:border-neutral-500'}"
						>
							{name} ({countFor(i)}/{CLAIMS_PER_PLAYER})
						</button>
					{/each}
				</div>
				<p class="mt-2 text-sm text-neutral-500">
					Tap a poster to claim it for
					<span
						class="font-semibold {playerColors[claimingPlayerIndex % playerColors.length].text}"
						>{playerNames[claimingPlayerIndex]}</span
					>
					— tap it again to undo, or pick another name above to switch.
				</p>
				{#if allClaimsComplete}
					<button
						type="button"
						onclick={finalizeClaims}
						class="mt-3 rounded-full bg-amber-400 px-6 py-2 text-sm font-bold text-neutral-950 transition hover:bg-amber-300"
					>
						Continue → Narrow it down
					</button>
				{:else}
					<button
						type="button"
						onclick={finalizeClaims}
						class="mt-2 text-sm text-neutral-500 hover:underline"
					>
						Skip picks
					</button>
				{/if}
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
				{#if roundNarration}
					<p class="mt-3 text-base font-semibold text-neutral-100">{roundNarration}</p>
				{/if}
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
				{#if roundNarration}
					<p class="mt-2 text-center text-base font-semibold text-neutral-100">{roundNarration}</p>
				{/if}

				{#snippet resultThumb(result: (typeof results)[number])}
					{@const owner = claims.get(result.movie.id)}
					{#if owner !== undefined}
						<span
							class="absolute -top-1.5 -right-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold {playerColors[
								owner % playerColors.length
							].badge}"
						>
							{playerNames[owner]?.[0] ?? '?'}
						</span>
					{/if}
					{#if posterUrl(result.movie.posterPath)}
						<img
							src={posterUrl(result.movie.posterPath)}
							alt=""
							class="w-full rounded-lg object-cover shadow-md transition group-hover:opacity-80 {owner !==
							undefined
								? `ring-2 ${playerColors[owner % playerColors.length].ring}`
								: ''}"
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
				{/snippet}

				<div class="mt-6 grid gap-3 text-left {galleryGridClass}">
					{#each results as result (result.movie.id)}
						{#if needsClaiming}
							<button
								type="button"
								onclick={() => claimMovie(result.movie.id)}
								class="group relative block text-left"
								title={result.movie.title}
							>
								{@render resultThumb(result)}
							</button>
						{:else}
							<a
								href="/movie/{result.movie.id}"
								class="group relative block text-left"
								title={result.movie.title}
							>
								{@render resultThumb(result)}
							</a>
						{/if}
					{/each}
				</div>
			</div>
		{/if}
	</div>
</dialog>
