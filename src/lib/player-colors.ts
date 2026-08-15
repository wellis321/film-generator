// Tailwind needs static, literal class names to pick them up at build time,
// so these are pre-composed per slot rather than built from a color name at
// runtime.
export const playerColors = [
	{ ring: 'ring-sky-400', badge: 'bg-sky-400 text-neutral-950', text: 'text-sky-400' },
	{ ring: 'ring-rose-400', badge: 'bg-rose-400 text-neutral-950', text: 'text-rose-400' },
	{ ring: 'ring-emerald-400', badge: 'bg-emerald-400 text-neutral-950', text: 'text-emerald-400' },
	{ ring: 'ring-violet-400', badge: 'bg-violet-400 text-neutral-950', text: 'text-violet-400' },
	{ ring: 'ring-fuchsia-400', badge: 'bg-fuchsia-400 text-neutral-950', text: 'text-fuchsia-400' }
] as const;
