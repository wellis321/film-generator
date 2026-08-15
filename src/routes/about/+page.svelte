<script lang="ts">
	import { posterUrl } from '$lib/poster';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const rotations = [-3, 2, -1.5, 3, -2.5, 1, -1, 2.5, -3, 1.5, -2, 3];
</script>

<svelte:head>
	<title>About — Regretometer</title>
</svelte:head>

<h1 class="text-3xl font-black text-neutral-50 sm:text-4xl">Wait, why does this exist?</h1>

<div class="mt-6 grid gap-x-10 gap-y-12 lg:grid-cols-[1fr_320px]">
	<div class="max-w-2xl space-y-5 text-neutral-300">
		<p class="leading-relaxed">
			Every family has one — the film, franchise, or decade-spanning universe everyone else
			adores, quotes endlessly, and rewatches on a loop, that you just don't get. You paid
			attention. You tried. And you still walked away with more questions than answers. This
			isn't a hit piece on anyone's favourite film — if you love it, genuinely, that's wonderful.
			This site just exists to log our side of the story, honestly, for an audience of exactly
			two. Well. Now you too, apparently.
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

	{#if data.posters.length > 0}
		<div class="lg:sticky lg:top-24 lg:self-start">
			<p class="mb-3 text-xs font-semibold tracking-widest text-neutral-500 uppercase">
				A few of the accused
			</p>
			<div class="grid grid-cols-3 gap-3 lg:grid-cols-3">
				{#each data.posters as p, i (p.id)}
					<a
						href="/movie/{p.id}"
						class="block overflow-hidden rounded-lg shadow-lg transition duration-200 hover:z-10 hover:rotate-0 hover:scale-110"
						style="rotate: {rotations[i % rotations.length]}deg;"
					>
						<img
							src={posterUrl(p.posterPath)}
							alt={p.title}
							class="aspect-2/3 w-full rounded-lg border border-neutral-800 object-cover"
						/>
					</a>
				{/each}
			</div>
		</div>
	{/if}
</div>
