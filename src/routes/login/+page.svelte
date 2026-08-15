<script lang="ts">
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
	<title>Log in — Regretometer</title>
</svelte:head>

<div class="mx-auto max-w-sm">
	<h1 class="text-3xl font-black text-neutral-50">Log in</h1>
	<p class="mt-2 text-neutral-400">Welcome back to the regret.</p>

	<form method="POST" class="mt-6 space-y-4 rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
		<div>
			<label for="email" class="block text-sm text-neutral-400">Email</label>
			<input
				id="email"
				name="email"
				type="email"
				required
				value={form?.email ?? ''}
				class="mt-2 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 focus:border-amber-400 focus:outline-none"
			/>
		</div>

		<div>
			<label for="password" class="block text-sm text-neutral-400">Password</label>
			<input
				id="password"
				name="password"
				type="password"
				required
				class="mt-2 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 focus:border-amber-400 focus:outline-none"
			/>
		</div>

		{#if form?.error}
			<p class="text-sm text-red-400">{form.error}</p>
		{/if}

		<button
			type="submit"
			class="w-full rounded-full bg-amber-400 px-5 py-2.5 text-sm font-semibold text-neutral-950 transition hover:bg-amber-300"
		>
			Log in
		</button>
	</form>

	<p class="mt-4 text-sm text-neutral-500">
		No account yet? <a href="/signup" class="text-amber-400 hover:underline">Sign up</a>
	</p>
	<p class="mt-1 text-sm text-neutral-500">
		<a href="/forgot-password" class="text-amber-400 hover:underline">Forgot your password?</a>
	</p>
</div>
