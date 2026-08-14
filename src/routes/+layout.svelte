<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';

	let { children } = $props();

	const links = [
		{ href: '/', label: 'Spin' },
		{ href: '/watched', label: 'Watched' }
	];
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="flex min-h-screen flex-col bg-neutral-950 text-neutral-100">
	<header class="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur">
		<div class="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
			<a href="/" class="flex items-center gap-2 text-lg font-bold tracking-tight">
				<span class="text-2xl">🎡</span>
				<span
					>Nope<span class="text-amber-400">meter</span></span
				>
			</a>
			<nav class="flex gap-1">
				{#each links as link (link.href)}
					<a
						href={link.href}
						class="rounded-full px-4 py-1.5 text-sm font-medium transition-colors {page.url
							.pathname === link.href
							? 'bg-amber-400 text-neutral-950'
							: 'text-neutral-300 hover:bg-neutral-800'}"
					>
						{link.label}
					</a>
				{/each}
			</nav>
		</div>
	</header>

	<main class="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
		{@render children()}
	</main>

	<footer class="border-t border-neutral-800 px-6 py-6 text-center text-xs text-neutral-600">
		For movies everyone else seems to love. We'll be the judge of that.
	</footer>
</div>
