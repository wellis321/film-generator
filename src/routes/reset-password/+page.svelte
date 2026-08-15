<script lang="ts">
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let password = $state('');
	let confirmPassword = $state('');
	const passwordsMatch = $derived(
		confirmPassword.length > 0 ? password === confirmPassword : null
	);
</script>

<svelte:head>
	<title>Reset password — Regretometer</title>
</svelte:head>

<div class="mx-auto max-w-sm">
	<h1 class="text-3xl font-black text-neutral-50">Set a new password</h1>

	{#if !data.valid}
		<div class="mt-6 rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
			<p class="text-neutral-300">
				This reset link is invalid or has expired.
				<a href="/forgot-password" class="text-amber-400 hover:underline"
					>Request a new one</a
				>.
			</p>
		</div>
	{:else}
		<form
			method="POST"
			class="mt-6 space-y-4 rounded-2xl border border-neutral-800 bg-neutral-900 p-5"
		>
			<div>
				<label for="password" class="block text-sm text-neutral-400">New password</label>
				<input
					id="password"
					name="password"
					type="password"
					required
					minlength="8"
					bind:value={password}
					class="mt-2 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 focus:border-amber-400 focus:outline-none"
				/>
				<p class="mt-1 text-xs text-neutral-500">At least 8 characters.</p>
			</div>

			<div>
				<label for="confirmPassword" class="block text-sm text-neutral-400"
					>Confirm new password</label
				>
				<input
					id="confirmPassword"
					name="confirmPassword"
					type="password"
					required
					minlength="8"
					bind:value={confirmPassword}
					class="mt-2 w-full rounded-lg border px-3 py-2 text-neutral-100 focus:outline-none {passwordsMatch === false
						? 'border-red-500/60 bg-neutral-950 focus:border-red-500'
						: passwordsMatch === true
							? 'border-green-500/60 bg-neutral-950 focus:border-green-500'
							: 'border-neutral-700 bg-neutral-950 focus:border-amber-400'}"
				/>
				{#if passwordsMatch === false}
					<p class="mt-1 text-xs text-red-400">Passwords don’t match yet.</p>
				{:else if passwordsMatch === true}
					<p class="mt-1 text-xs text-green-400">Passwords match ✓</p>
				{/if}
			</div>

			{#if form?.error}
				<p class="text-sm text-red-400">{form.error}</p>
			{/if}

			<button
				type="submit"
				disabled={passwordsMatch === false}
				class="w-full rounded-full bg-amber-400 px-5 py-2.5 text-sm font-semibold text-neutral-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-amber-400"
			>
				Set new password
			</button>
		</form>
	{/if}
</div>
