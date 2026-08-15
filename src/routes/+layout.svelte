<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import type { LayoutData } from './$types';

	let { children, data }: { children: any; data: LayoutData } = $props();

	const links = $derived(
		[
			{ href: '/', label: 'Spin' },
			data.user ? { href: '/watched', label: 'Watched' } : null,
			{ href: '/about', label: 'About' }
		].filter((link) => link !== null)
	);
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="flex min-h-screen flex-col bg-neutral-950 text-neutral-100">
	<header class="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur">
		<div class="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
			<a href="/" class="flex items-center gap-2.5 text-2xl font-bold tracking-tight">
				<span class="text-4xl">🎡</span>
				<span
					>Regret<span class="text-amber-400">ometer</span></span
				>
			</a>
			<div class="flex items-center gap-3">
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

				<div class="flex items-center gap-2 border-l border-neutral-800 pl-3">
					{#if data.user}
						<span class="hidden text-sm text-neutral-400 sm:inline"
							>{data.user.name || data.user.email}</span
						>
						<form method="POST" action="/logout">
							<button
								type="submit"
								class="rounded-full px-4 py-1.5 text-sm font-medium text-neutral-300 transition-colors hover:bg-neutral-800"
							>
								Log out
							</button>
						</form>
					{:else}
						<a
							href="/login"
							class="rounded-full px-4 py-1.5 text-sm font-medium text-neutral-300 transition-colors hover:bg-neutral-800"
						>
							Log in
						</a>
						<a
							href="/signup"
							class="rounded-full bg-amber-400 px-4 py-1.5 text-sm font-medium text-neutral-950 transition-colors hover:bg-amber-300"
						>
							Sign up
						</a>
					{/if}
				</div>
			</div>
		</div>
	</header>

	<main class="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
		{@render children()}
	</main>

	<footer class="border-t border-neutral-800 px-6 py-6 text-center text-base text-neutral-500">
		For movies everyone else seems to love. We'll be the judge of that.
	</footer>
</div>
