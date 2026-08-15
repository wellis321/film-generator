<script lang="ts">
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
	<title>Forgot password — Regretometer</title>
</svelte:head>

<div class="mx-auto max-w-sm">
	<h1 class="text-3xl font-black text-neutral-50">Forgot your password?</h1>
	<p class="mt-2 text-neutral-400">
		Enter your email and we'll send you a link to set a new one.
	</p>

	{#if form?.success}
		<div class="mt-6 rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
			<p class="text-neutral-300">
				If that email has an account, a reset link is on its way. Check your inbox.
			</p>
		</div>
	{:else}
		<form
			method="POST"
			class="mt-6 space-y-4 rounded-2xl border border-neutral-800 bg-neutral-900 p-5"
		>
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

			{#if form?.error}
				<p class="text-sm text-red-400">{form.error}</p>
			{/if}

			<button
				type="submit"
				class="w-full rounded-full bg-amber-400 px-5 py-2.5 text-sm font-semibold text-neutral-950 transition hover:bg-amber-300"
			>
				Send reset link
			</button>
		</form>
	{/if}

	<p class="mt-4 text-sm text-neutral-500">
		<a href="/login" class="text-amber-400 hover:underline">Back to log in</a>
	</p>
</div>
