<script lang="ts">
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	let password = $state('');
	let confirmPassword = $state('');
	const passwordsMatch = $derived(
		confirmPassword.length > 0 ? password === confirmPassword : null
	);
</script>

<svelte:head>
	<title>Sign up — Regretometer</title>
</svelte:head>

<div class="mx-auto max-w-sm">
	<h1 class="text-3xl font-black text-neutral-50">Create an account</h1>

	{#if form?.success}
		<p class="mt-2 text-neutral-400">Almost there.</p>
		<div class="mt-6 rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
			<p class="text-neutral-300">
				We've sent a confirmation link to <span class="font-semibold text-neutral-100"
					>{form.email}</span
				>. Click it to activate your account — it works for 24 hours.
			</p>
			<p class="mt-3 text-sm text-neutral-500">
				Link not showing up? <a
					href="/resend-verification"
					class="text-amber-400 hover:underline">Resend it</a
				>.
			</p>
		</div>
	{:else}
		<p class="mt-2 text-neutral-400">Get your own ratings, reviews, and watched list.</p>

		<form
			method="POST"
			class="mt-6 space-y-4 rounded-2xl border border-neutral-800 bg-neutral-900 p-5"
		>
			<div>
				<label for="name" class="block text-sm text-neutral-400">Name (optional)</label>
				<input
					id="name"
					name="name"
					type="text"
					value={form?.name ?? ''}
					class="mt-2 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 focus:border-amber-400 focus:outline-none"
				/>
			</div>

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
					minlength="8"
					bind:value={password}
					class="mt-2 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 focus:border-amber-400 focus:outline-none"
				/>
				<p class="mt-1 text-xs text-neutral-500">At least 8 characters.</p>
			</div>

			<div>
				<label for="confirmPassword" class="block text-sm text-neutral-400"
					>Confirm password</label
				>
				<input
					id="confirmPassword"
					name="confirmPassword"
					type="password"
					required
					minlength="8"
					bind:value={confirmPassword}
					class="mt-2 w-full rounded-lg border px-3 py-2 text-neutral-100 focus:outline-none {passwordsMatch ===
					false
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
				Sign up
			</button>
		</form>

		<p class="mt-4 text-sm text-neutral-500">
			Already have an account? <a href="/login" class="text-amber-400 hover:underline"
				>Log in</a
			>
		</p>
	{/if}
</div>
