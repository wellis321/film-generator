<script lang="ts">
	import { fade } from 'svelte/transition';
	import { posterUrl } from '$lib/poster';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const rotations = [-3, 2, -1.5, 3, -2.5, 1, -1, 2.5, -3, 1.5, -2, 3];
	const GRID_COLS = 3;
	const WAVE_STEP_MS = 90;
	const WAVE_INTERVAL_MS = 6000;

	let pool = $state(shuffle(data.posters));
	let cells = $state(pool.slice(0, 12));
	let poolIndex = $state(12);

	function shuffle<T>(arr: T[]) {
		return [...arr].sort(() => Math.random() - 0.5);
	}

	function nextPoster() {
		if (pool.length === 0) return null;
		if (poolIndex >= pool.length) {
			pool = shuffle(pool);
			poolIndex = 0;
		}
		const next = pool[poolIndex];
		poolIndex += 1;
		return next;
	}

	// Fires a diagonal wave through the grid: each cell's update delay is
	// proportional to its distance from the top-left corner, so the swap
	// sweeps top-left -> bottom-right instead of updating all at once.
	function triggerWave() {
		if (pool.length <= cells.length) return;
		for (let i = 0; i < cells.length; i++) {
			const row = Math.floor(i / GRID_COLS);
			const col = i % GRID_COLS;
			const delay = (row + col) * WAVE_STEP_MS;
			setTimeout(() => {
				const next = nextPoster();
				if (next) cells[i] = next;
			}, delay);
		}
	}

	$effect(() => {
		const interval = setInterval(triggerWave, WAVE_INTERVAL_MS);
		return () => clearInterval(interval);
	});
</script>

<svelte:head>
	<title>About — Regretometer</title>
</svelte:head>

<h1 class="text-3xl font-black text-neutral-50 sm:text-4xl">Wait, why does this exist?</h1>

<div class="mt-6 grid gap-x-10 gap-y-12 lg:grid-cols-[1fr_320px]">
	<div class="max-w-2xl space-y-5 text-neutral-300">
		<p class="leading-relaxed">
			This started with my daughter and me, and the first Harry Potter film. We'd heard it was a
			childhood-defining classic, so we sat down, paid proper attention — and walked away
			gobsmacked. Not by the magic. By how many holes were in the plot. So we kept going, on
			purpose: Twilight, the X-Men, Star Wars — deliberately picking things everyone else adored,
			just to see if we'd feel differently. We usually didn't.
		</p>

		<p class="leading-relaxed">
			This isn't a hit piece on anyone's favourite film — if you love it, genuinely, that's
			wonderful. This site just exists to log our side of the story, honestly, for an audience
			that used to be exactly two. Well. Now you too, apparently.
		</p>

		<p class="leading-relaxed">
			So if you've ever sat through a beloved classic wondering why the plot needed three
			prequels to make sense, or quietly thought <em>"huh, that was fine, I guess"</em> while everyone
			around you wept with joy — welcome. No malice here, just a family with a wheel and a stubborn
			refusal to pretend we felt something we didn't.
		</p>

		<div>
			<h2 class="text-sm font-semibold tracking-wide text-neutral-400 uppercase">
				A short, ongoing list of things we don't understand
			</h2>
			<ul class="mt-4 space-y-3">
				<li class="flex gap-3">
					<span class="text-amber-400">—</span>
					<span
						>Vampires who can suddenly stroll around in broad daylight. Rules, it turns out, are
						optional.</span
					>
				</li>
				<li class="flex gap-3">
					<span class="text-amber-400">—</span>
					<span
						>If you can trap someone in an endless simulated train, why not just... leave them
						there? Seems tidier.</span
					>
				</li>
				<li class="flex gap-3">
					<span class="text-amber-400">—</span>
					<span
						>Did Harry Potter just try to kill his own aunt, and did anyone else notice nobody
						mentioned it again?</span
					>
				</li>
				<li class="flex gap-3">
					<span class="text-amber-400">—</span>
					<span
						>You can apparently just drive a car to Hogwarts. So what, precisely, was the point of
						the wall at the train station?</span
					>
				</li>
				<li class="flex gap-3">
					<span class="text-amber-400">—</span>
					<span>We are not touching the Wolverine timeline. Nobody is touching the Wolverine timeline.</span
					>
				</li>
				<li class="flex gap-3">
					<span class="text-amber-400">—</span>
					<span>Was that entire superhero team-up filmed in one room? It certainly looked like it.</span
					>
				</li>
				<li class="flex gap-3">
					<span class="text-amber-400">—</span>
					<span
						>A hyperdrive that has failed at the worst possible moment for roughly fifty years
						running.</span
					>
				</li>
				<li class="flex gap-3">
					<span class="text-amber-400">—</span>
					<span
						>A state-of-the-art dinosaur cloning facility with, it turns out, one unreliable
						fence.</span
					>
				</li>
				<li class="flex gap-3">
					<span class="text-amber-400">—</span>
					<span>Parents who somehow board an international flight without noticing a missing child.</span
					>
				</li>
			</ul>
			<p class="mt-4 text-sm text-neutral-500">This list will, unfortunately, keep growing.</p>
		</div>

		<a
			href="/"
			class="mt-2 inline-block rounded-full bg-amber-400 px-6 py-2.5 text-sm font-semibold text-neutral-950 transition hover:bg-amber-300"
		>
			Spin the wheel →
		</a>
	</div>

	{#if cells.length > 0}
		<div class="lg:sticky lg:top-24 lg:self-start">
			<p class="mb-3 text-xs font-semibold tracking-widest text-neutral-500 uppercase">
				A few of the accused
			</p>
			<div class="grid grid-cols-3 gap-3">
				{#each cells as cell, i (i)}
					<a
						href="/movie/{cell.id}"
						class="block overflow-hidden rounded-lg shadow-lg transition duration-200 hover:z-10 hover:rotate-0 hover:scale-110"
						style="rotate: {rotations[i % rotations.length]}deg;"
					>
						{#key cell.id}
							<img
								src={posterUrl(cell.posterPath)}
								alt={cell.title}
								class="aspect-2/3 w-full rounded-lg border border-neutral-800 object-cover"
								transition:fade={{ duration: 400 }}
							/>
						{/key}
					</a>
				{/each}
			</div>
		</div>
	{/if}
</div>
