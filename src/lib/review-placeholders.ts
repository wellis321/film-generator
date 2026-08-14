export const reviewPlaceholders = [
	'Utterly forgotten within twenty minutes...',
	"We're still not sure what the plot was about...",
	'Somehow both too long and forgettable...',
	"We watched it. That's the whole review...",
	'Everyone else cried. We checked our phones...',
	"Two hours of our lives we won't discuss again...",
	"We didn't hate it, we just didn't feel anything...",
	'Started strong, then we lost the will to care...',
	'Nice special effects, shame about everything else...',
	"We've already forgotten the main character's name...",
	'Fine, I guess, if you like that sort of thing...',
	'We paused it twice to check how much was left...',
	'Not the worst two hours of our lives. Close though...',
	"We're being generous by finishing it...",
	'Someone please explain why people love this...',
	'It happened. We watched it. Moving on...',
	'Competently made. Zero desire to watch it again...',
	'We spent more time discussing what to eat...',
	'Technically a movie. Debatable whether we enjoyed it...',
	"We've seen worse. We've also seen much, much better..."
];

export function randomPlaceholder() {
	return reviewPlaceholders[Math.floor(Math.random() * reviewPlaceholders.length)];
}
