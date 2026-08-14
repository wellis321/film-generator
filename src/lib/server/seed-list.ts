import type { MediaType } from './tmdb';

export type SeedEntry = { title: string; mediaType: MediaType; year?: string };

export const seedList: SeedEntry[] = [
	// Harry Potter
	{ title: 'Harry Potter and the Philosopher\'s Stone', mediaType: 'movie', year: '2001' },
	{ title: 'Harry Potter and the Chamber of Secrets', mediaType: 'movie', year: '2002' },
	{ title: 'Harry Potter and the Prisoner of Azkaban', mediaType: 'movie', year: '2004' },
	{ title: 'Harry Potter and the Goblet of Fire', mediaType: 'movie', year: '2005' },
	{ title: 'Harry Potter and the Order of the Phoenix', mediaType: 'movie', year: '2007' },
	{ title: 'Harry Potter and the Half-Blood Prince', mediaType: 'movie', year: '2009' },
	{ title: 'Harry Potter and the Deathly Hallows: Part 1', mediaType: 'movie', year: '2010' },
	{ title: 'Harry Potter and the Deathly Hallows: Part 2', mediaType: 'movie', year: '2011' },

	// Twilight
	{ title: 'Twilight', mediaType: 'movie', year: '2008' },
	{ title: 'The Twilight Saga: New Moon', mediaType: 'movie', year: '2009' },
	{ title: 'The Twilight Saga: Eclipse', mediaType: 'movie', year: '2010' },
	{ title: 'The Twilight Saga: Breaking Dawn - Part 1', mediaType: 'movie', year: '2011' },
	{ title: 'The Twilight Saga: Breaking Dawn - Part 2', mediaType: 'movie', year: '2012' },

	// X-Men / Wolverine
	{ title: 'X-Men', mediaType: 'movie', year: '2000' },
	{ title: 'X2', mediaType: 'movie', year: '2003' },
	{ title: 'X-Men: The Last Stand', mediaType: 'movie', year: '2006' },
	{ title: 'X-Men Origins: Wolverine', mediaType: 'movie', year: '2009' },
	{ title: 'X-Men: First Class', mediaType: 'movie', year: '2011' },
	{ title: 'The Wolverine', mediaType: 'movie', year: '2013' },
	{ title: 'X-Men: Days of Future Past', mediaType: 'movie', year: '2014' },
	{ title: 'X-Men: Apocalypse', mediaType: 'movie', year: '2016' },
	{ title: 'Logan', mediaType: 'movie', year: '2017' },
	{ title: 'Dark Phoenix', mediaType: 'movie', year: '2019' },

	// Star Wars
	{ title: 'Star Wars', mediaType: 'movie', year: '1977' },
	{ title: 'The Empire Strikes Back', mediaType: 'movie', year: '1980' },
	{ title: 'Return of the Jedi', mediaType: 'movie', year: '1983' },
	{ title: 'Star Wars: Episode I - The Phantom Menace', mediaType: 'movie', year: '1999' },
	{ title: 'Star Wars: Episode II - Attack of the Clones', mediaType: 'movie', year: '2002' },
	{ title: 'Star Wars: Episode III - Revenge of the Sith', mediaType: 'movie', year: '2005' },
	{ title: 'Star Wars: The Force Awakens', mediaType: 'movie', year: '2015' },
	{ title: 'Star Wars: The Last Jedi', mediaType: 'movie', year: '2017' },
	{ title: 'Star Wars: The Rise of Skywalker', mediaType: 'movie', year: '2019' },

	// Lord of the Rings / Hobbit
	{ title: 'The Lord of the Rings: The Fellowship of the Ring', mediaType: 'movie', year: '2001' },
	{ title: 'The Lord of the Rings: The Two Towers', mediaType: 'movie', year: '2002' },
	{ title: 'The Lord of the Rings: The Return of the King', mediaType: 'movie', year: '2003' },
	{ title: 'The Hobbit: An Unexpected Journey', mediaType: 'movie', year: '2012' },
	{ title: 'The Hobbit: The Desolation of Smaug', mediaType: 'movie', year: '2013' },
	{ title: 'The Hobbit: The Battle of the Five Armies', mediaType: 'movie', year: '2014' },

	// Spider-Man
	{ title: 'Spider-Man', mediaType: 'movie', year: '2002' },
	{ title: 'Spider-Man 2', mediaType: 'movie', year: '2004' },
	{ title: 'Spider-Man 3', mediaType: 'movie', year: '2007' },
	{ title: 'The Amazing Spider-Man', mediaType: 'movie', year: '2012' },
	{ title: 'The Amazing Spider-Man 2', mediaType: 'movie', year: '2014' },
	{ title: 'Spider-Man: Homecoming', mediaType: 'movie', year: '2017' },
	{ title: 'Spider-Man: Far From Home', mediaType: 'movie', year: '2019' },
	{ title: 'Spider-Man: No Way Home', mediaType: 'movie', year: '2021' },

	// Batman
	{ title: 'Batman Begins', mediaType: 'movie', year: '2005' },
	{ title: 'The Dark Knight', mediaType: 'movie', year: '2008' },
	{ title: 'The Dark Knight Rises', mediaType: 'movie', year: '2012' },
	{ title: 'Batman v Superman: Dawn of Justice', mediaType: 'movie', year: '2016' },
	{ title: 'The Batman', mediaType: 'movie', year: '2022' },

	// Marvel / Avengers
	{ title: 'Iron Man', mediaType: 'movie', year: '2008' },
	{ title: 'Captain America: The First Avenger', mediaType: 'movie', year: '2011' },
	{ title: 'Thor', mediaType: 'movie', year: '2011' },
	{ title: 'The Avengers', mediaType: 'movie', year: '2012' },
	{ title: 'Guardians of the Galaxy', mediaType: 'movie', year: '2014' },
	{ title: 'Avengers: Age of Ultron', mediaType: 'movie', year: '2015' },
	{ title: 'Black Panther', mediaType: 'movie', year: '2018' },
	{ title: 'Avengers: Infinity War', mediaType: 'movie', year: '2018' },
	{ title: 'Captain Marvel', mediaType: 'movie', year: '2019' },
	{ title: 'Avengers: Endgame', mediaType: 'movie', year: '2019' },
	{ title: 'Doctor Strange', mediaType: 'movie', year: '2016' },

	// Indiana Jones
	{ title: 'Raiders of the Lost Ark', mediaType: 'movie', year: '1981' },
	{ title: 'Indiana Jones and the Temple of Doom', mediaType: 'movie', year: '1984' },
	{ title: 'Indiana Jones and the Last Crusade', mediaType: 'movie', year: '1989' },
	{ title: 'Indiana Jones and the Kingdom of the Crystal Skull', mediaType: 'movie', year: '2008' },

	// TV shows everyone loves that you're pretty sure you won't
	{ title: 'Friends', mediaType: 'tv' },
	{ title: 'The Big Bang Theory', mediaType: 'tv' }
];
