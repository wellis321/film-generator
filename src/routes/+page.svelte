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
	import { fly, fade } from 'svelte/transition';
	import { tick } from 'svelte';
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

	// Defaults to the plain single-spin experience. Bracket sizes > 1 and the
	// "who's picking" layer only become reachable via "More options" below.
	let selectedBracketSize = $state<number>(1);
	let showAdvancedOptions = $state(false);
	let dialogEl: HTMLDialogElement;
	let scrollContainer: HTMLDivElement;
	let reelWrapperEl: HTMLDivElement | undefined;

	let spinning = $state(false);
	let sequence = $state<typeof data.movies>([]);
	let translateY = $state(0);
	let currentAnimation: Animation | null = null;

	let roundPool = $state<typeof data.movies>([]);
	// True only for a bracket's very first round, where the pool is too big
	// to display up front, so results build up as a fresh gallery one spin
	// at a time. Every later round narrows an *already-displayed* field, so
	// instead of clearing and rebuilding, we mark landed picks in place and
	// only cut the field down to survivors once the round finishes.
	let buildingFresh = $state(true);
	let pickedIds = $state<Set<number>>(new Set());
	let roundSize = $state(0);
	let spinsRemaining = $state(0);
	let totalInBatch = $state(0);
	// Set the instant a spin's reel starts moving, not derived from
	// spinsRemaining — so the "spin N of Total" label only ever changes
	// exactly when a new spin actually starts animating, never a beat early
	// during the pause after the previous one lands.
	let spinNumber = $state(0);
	let results = $state<{ movie: (typeof data.movies)[number]; quip: string }[]>([]);
	let closingQuip = $state('');
	let champion = $state<{ movie: (typeof data.movies)[number]; quip: string } | null>(null);
	let newBracketLabel = $state('Spin again');
	let pendingSpinTimeout: ReturnType<typeof setTimeout> | null = null;

	// Optional "who's picking" layer: named players claim a couple of movies
	// each right after round 1, then we narrate whether their picks survive
	// each subsequent round. Only meaningful once a real bracket (size > 1)
	// is in play — a single spin has no "survives the round" concept.
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
	// During a continuing round the gallery still shows the *previous*
	// round's full field until it's trimmed down at the end, so the layout
	// has to fit whichever is bigger — the field on screen right now, or
	// this round's target — not just the target on its own.
	const galleryGridClass = $derived(
		galleryGridClasses[Math.max(results.length, totalInBatch)] ??
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

	async function runSpin() {
		spinning = true;
		spinNumber += 1;

		const pick = pickFromRoundPool(pickedIds);

		const reelLength = 26;
		const seq = Array.from(
			{ length: reelLength - 1 },
			() => roundPool[Math.floor(Math.random() * roundPool.length)]
		);
		seq.push(pick);
		sequence = seq;
		translateY = 0;

		// wait for the reel wrapper to exist in the DOM (first spin only —
		// it's gated behind {#if sequence.length}).
		await tick();
		if (!reelWrapperEl) return;

		// A CSS transition driven by mutating a `transform` style property
		// used to do this, reset-then-retarget with a forced reflow in
		// between. That's fundamentally unreliable for `transform`: it's a
		// compositor-only property, so forcing a *layout* reflow via
		// offsetHeight doesn't guarantee the reset value was actually
		// committed to the compositor before the target value overwrote it
		// — and heavy main-thread activity (like an active scroll gesture)
		// makes that race far more likely to lose. The Web Animations API
		// sidesteps the whole class of bug: each call defines its own
		// explicit start and end keyframes, so there's no "previous state"
		// to race against — the animation always starts exactly at
		// translateY(0) the instant it begins playing, regardless of
		// whatever the element's resting style currently is.
		currentAnimation?.cancel();
		const targetY = -(seq.length - 1) * ITEM_HEIGHT;
		const animation = reelWrapperEl.animate(
			[{ transform: 'translateY(0px)' }, { transform: `translateY(${targetY}px)` }],
			{
				duration: transitionDurationFor(roundSize),
				easing: 'cubic-bezier(0.1, 0.7, 0.2, 1)',
				fill: 'forwards'
			}
		);
		currentAnimation = animation;

		try {
			await animation.finished;
		} catch {
			// cancelled by a follow-up spin — that spin owns onSpinComplete.
			return;
		}
		if (currentAnimation !== animation) return;
		translateY = targetY;
		onSpinComplete();
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

	function beginRound(size: number, fresh: boolean) {
		roundSize = size;
		totalInBatch = size;
		spinsRemaining = size;
		spinNumber = 0;
		buildingFresh = fresh;
		pickedIds = new Set();
		if (fresh) results = [];
		closingQuip = '';
		roundNarration = '';
		runSpin();
	}

	function startBracket() {
		if (bracketActive || fullPool.length === 0) return;
		champion = null;
		roundPool = fullPool;
		const size = Math.min(selectedBracketSize, fullPool.length);
		// Anything bigger than a single spin runs inside the bracket dialog;
		// a plain single spin plays right there on the page, no dialog at all.
		if (size > 1) dialogEl.showModal();
		beginRound(size, true);
	}

	function continueBracket() {
		if (bracketActive || nextRoundSize === 0) return;
		roundPool = results.map((r) => r.movie);
		// Not fresh: the gallery already shows this exact field, so the next
		// round marks landed picks in place instead of rebuilding it.
		beginRound(nextRoundSize, false);
	}

	// Fires on every dialog close, however it happened — the ✕ button,
	// Escape, or finishing up after a champion is crowned. All of those mean
	// "I'm done with this bracket," so they all get the same full reset.
	function onDialogClose() {
		if (pendingSpinTimeout) {
			clearTimeout(pendingSpinTimeout);
			pendingSpinTimeout = null;
		}
		currentAnimation?.cancel();
		currentAnimation = null;
		spinning = false;
		roundSize = 0;
		spinsRemaining = 0;
		spinNumber = 0;
		champion = null;
		results = [];
		buildingFresh = true;
		pickedIds = new Set();
		closingQuip = '';
		sequence = [];
		claims = new Map();
		claimingPlayerIndex = 0;
		claimsCollected = false;
		survivingPlayerIndices = new Set();
		roundNarration = '';
	}

	function onSpinComplete() {
		if (!spinning) return;
		spinning = false;

		const landed = sequence[sequence.length - 1];
		pickedIds.add(landed.id);
		pickedIds = new Set(pickedIds);
		if (buildingFresh) {
			results = [...results, { movie: landed, quip: randomReaction() }];
		}

		// The same settle pause applies whether another spin follows or this
		// was the round's last one — without it, the final landed movie gets
		// no time on screen before the round-complete UI takes over.
		// spinsRemaining is deliberately left untouched until the pause
		// elapses, so bracketActive (and the "spin N of Total" label) hold
		// steady through the whole pause instead of flipping early.
		pendingSpinTimeout = setTimeout(() => {
			pendingSpinTimeout = null;
			spinsRemaining -= 1;
			if (spinsRemaining > 0) {
				runSpin();
			} else {
				finishRound();
			}
		}, pauseDurationFor(roundSize));
	}

	function finishRound() {
		// Round's decided — cut the field down to just the survivors, all at
		// once, rather than the gallery having been rebuilt tile-by-tile.
		if (!buildingFresh) {
			results = results.filter((r) => pickedIds.has(r.movie.id));
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

{#snippet reelBox()}
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
				<div bind:this={reelWrapperEl} style="transform: translateY({translateY}px);">
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
{/snippet}

{#snippet championCard(c: { movie: (typeof data.movies)[number]; quip: string })}
	<div
		class="mx-auto mt-8 max-w-xs text-center"
		in:fly={{ y: 12, duration: 400, delay: 100 }}
	>
		<a href="/movie/{c.movie.id}" class="group block">
			{#if posterUrl(c.movie.posterPath, 'w500')}
				<img
					src={posterUrl(c.movie.posterPath, 'w500')}
					alt=""
					class="mx-auto w-32 rounded-2xl object-cover shadow-xl transition group-hover:opacity-90"
				/>
			{:else}
				<div
					class="mx-auto flex h-48 w-32 items-center justify-center rounded-2xl bg-neutral-800 text-4xl"
				>
					🎬
				</div>
			{/if}
		</a>
		<p class="mt-4 text-2xl font-bold text-neutral-50">{c.movie.title}</p>
		<p class="text-sm text-neutral-500">
			{c.movie.year ?? ''}
			{c.movie.mediaType === 'tv' ? '· TV Series' : ''}
		</p>
		<div class="mt-4 space-y-1 text-lg text-neutral-300 italic">
			{#each splitSentences(c.quip) as line (line)}
				<p>{line}</p>
			{/each}
		</div>
		{#if roundNarration}
			<p class="mt-3 text-base font-semibold text-neutral-100">{roundNarration}</p>
		{/if}
		<a
			href="/movie/{c.movie.id}"
			class="mt-4 inline-block rounded-full bg-neutral-100 px-5 py-2 text-sm font-semibold text-neutral-950 transition hover:bg-white"
		>
			View & review →
		</a>
	</div>
{/snippet}

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
		{#if selectedBracketSize === 1}
			{@render reelBox()}
		{/if}

		<div class="mt-6 text-center">
			<button
				onclick={startBracket}
				disabled={bracketActive}
				class="rounded-full bg-amber-400 px-8 py-3 text-lg font-bold text-neutral-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
			>
				{bracketActive
					? 'Spinning…'
					: selectedBracketSize === 1 && champion
						? newBracketLabel
						: 'Spin the wheel'}
			</button>
		</div>

		{#if selectedBracketSize === 1 && champion}
			{@render championCard(champion)}
		{/if}

		{#if !showAdvancedOptions}
			<button
				type="button"
				onclick={() => (showAdvancedOptions = true)}
				class="mx-auto mt-8 block text-sm text-neutral-500 transition hover:text-neutral-300"
			>
				More options
			</button>
		{:else}
			<div class="mx-auto mt-8 max-w-lg">
				<div class="flex items-center justify-between">
					<p class="text-sm text-neutral-500">More options</p>
					<button
						type="button"
						onclick={() => (showAdvancedOptions = false)}
						class="text-xs text-neutral-600 hover:text-neutral-400"
					>
						Hide
					</button>
				</div>

				<div class="mt-2 flex flex-wrap justify-center gap-2">
					<button
						type="button"
						onclick={() => (selectedBracketSize = 1)}
						disabled={bracketActive}
						class="rounded-full border px-4 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 {selectedBracketSize ===
						1
							? 'border-amber-400 bg-amber-400/10 text-amber-400'
							: 'border-neutral-700 text-neutral-400 hover:border-neutral-500'}"
					>
						Just Spin
					</button>
					{#each bracketSizes as size (size)}
						<button
							type="button"
							onclick={() => (selectedBracketSize = size)}
							disabled={bracketActive}
							class="rounded-full border px-4 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 {selectedBracketSize ===
							size
								? 'border-amber-400 bg-amber-400/10 text-amber-400'
								: 'border-neutral-700 text-neutral-400 hover:border-neutral-500'}"
						>
							{bracketSizeLabels[size]} ({size})
						</button>
					{/each}
				</div>

				{#if selectedBracketSize > 1}
					<div class="mt-4 max-w-md">
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
										class="h-2.5 w-2.5 flex-shrink-0 rounded-full {playerColors[
											i % playerColors.length
										].badge.split(' ')[0]}"
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
								<button
									type="button"
									onclick={addPlayer}
									class="text-sm text-amber-400 hover:underline"
								>
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
				{/if}
			</div>
		{/if}
	{/if}
</section>

<dialog
	bind:this={dialogEl}
	onclose={onDialogClose}
	class="m-auto w-[95vw] max-w-2xl rounded-2xl border border-neutral-800 bg-neutral-950 p-0 text-neutral-100 backdrop:bg-black/70 backdrop:backdrop-blur-sm sm:max-w-3xl lg:max-w-5xl xl:max-w-6xl"
>
	{#if selectedBracketSize > 1}
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

			{@render reelBox()}

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
						spin {spinNumber} of {totalInBatch}
					</p>
				{/if}
			</div>

			{#if champion}
				{@render championCard(champion)}
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
						<p class="mt-2 text-center text-base font-semibold text-neutral-100">
							{roundNarration}
						</p>
					{/if}

					{#snippet resultThumb(result: (typeof results)[number])}
						{@const owner = claims.get(result.movie.id)}
						{@const locked = !buildingFresh && bracketActive && pickedIds.has(result.movie.id)}
						{#if owner !== undefined}
							<span
								class="absolute -top-1.5 -right-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold {playerColors[
									owner % playerColors.length
								].badge}"
							>
								{playerNames[owner]?.[0] ?? '?'}
							</span>
						{:else if locked}
							<span
								class="absolute -top-1.5 -right-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-neutral-950"
							>
								✓
							</span>
						{/if}
						{#if posterUrl(result.movie.posterPath)}
							<img
								src={posterUrl(result.movie.posterPath)}
								alt=""
								class="w-full rounded-lg object-cover shadow-md transition duration-300 group-hover:opacity-80 {owner !==
								undefined
									? `ring-2 ${playerColors[owner % playerColors.length].ring}`
									: ''} {locked ? 'opacity-40 grayscale' : ''}"
							/>
						{:else}
							<div
								class="flex aspect-[2/3] items-center justify-center rounded-lg bg-neutral-800 text-xl transition duration-300 {locked
									? 'opacity-40 grayscale'
									: ''}"
							>
								🎬
							</div>
						{/if}
						<p
							class="mt-1 truncate text-xs font-medium transition duration-300 {locked
								? 'text-neutral-600'
								: 'text-neutral-300'}"
						>
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
									out:fade={{ duration: 300 }}
								>
									{@render resultThumb(result)}
								</button>
							{:else}
								<a
									href="/movie/{result.movie.id}"
									class="group relative block text-left"
									title={result.movie.title}
									out:fade={{ duration: 300 }}
								>
									{@render resultThumb(result)}
								</a>
							{/if}
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{/if}
</dialog>
