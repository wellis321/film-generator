// Splits on sentence-ending punctuation (optionally followed by a closing
// quote) before a space and the start of the next sentence, so quips like
// `The reviews say "iconic." We say "we'll see."` split into two lines
// instead of running together.
const SENTENCE_BOUNDARY = /(?<=[.!?]['"]?)\s+(?=[A-Z"])/;

export function splitSentences(text: string): string[] {
	return text.split(SENTENCE_BOUNDARY);
}
