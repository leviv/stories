export interface Section {
	/** Text shown in the source (left) input box */
	source: string;
	/** Text shown in the target (right) output box */
	target: string;
	/** Source language label (e.g. "Spanish") */
	sourceLang: string;
	/** Target language label (e.g. "English") */
	targetLang: string;
}

/**
 * Part 1: Spanish → English (childhood memories)
 * Part 2: German → English (Berlin present)
 *
 * Every narrative section carries a real Google Translate query (English → German)
 * shown at the bottom of the UI.
 */
export const sections: Section[] = [
	// ── Intro ──────────────────────────────────────────────────

	{
		source: 'Lengua materna',
		target: 'Mother Tongue',
		sourceLang: 'Spanish',
		targetLang: 'English'
	},

	// ── Part 1: Spanish → English ──────────────────────────────

	{
		source:
			'De niño pensaba que mis abuelos eran tontos por no hablar inglés con fluidez. Vivieron en Estados Unidos durante 40 años y yo tenía 5 y sabía más inglés del que ellos jamás sabrían.',
		target:
			'As a kid I thought my grandparents were stupid for not speaking fluent English. They lived in the US for 40 years and I was 5 and knew more English than they ever would.',
		sourceLang: 'Spanish',
		targetLang: 'English'
	},

	{
		source:
			'Mi mamá ni siquiera nos enseñó español, tratando de ahorrarnos la vergüenza que ella sintió creciendo con acento.',
		target:
			"My mom didn't even teach us Spanish, trying to spare us the shame she felt growing up with an accent.",
		sourceLang: 'Spanish',
		targetLang: 'English'
	},

	{
		source: 'Mis amigos se quedaban mirando cuando mis abuelos hablaban español.',
		target: 'My friends stared when my grandparents spoke Spanish.',
		sourceLang: 'Spanish',
		targetLang: 'English'
	},

	{
		source:
			'Sentí una mezcla de vergüenza y frustración cuando mi mamá me puso el teléfono en la cara para hablar con mi abuela, y apenas pude desearle un feliz cumpleaños.',
		target:
			'I felt a mix of shame and frustration when my mom shoved the phone in my face to talk to my grandma, and I could barely even wish her a happy birthday.',
		sourceLang: 'Spanish',
		targetLang: 'English'
	},

	{
		source: 'Fui a su funeral sin haber tenido una conversación real.',
		target: 'I went to her funeral without having a real conversation.',
		sourceLang: 'Spanish',
		targetLang: 'English'
	},

	// ── Part 2: German → English ───────────────────────────────

	{
		source:
			'Und jetzt bin ich in einem fremden Land, und diese Gefühle kommen zurück. Aber diesmal sind die Rollen vertauscht.',
		target:
			"And now I'm in a foreign country, and those feelings are coming back. But this time, the roles are reversed.",
		sourceLang: 'German',
		targetLang: 'English'
	},

	{
		source:
			'Ich kann kein Deutsch, und ich bin ständig nervös auf den Straßen Berlins und bete, dass mich niemand etwas fragt.',
		target:
			"I don't know any German, and I'm constantly anxious on the streets of Berlin, praying that nobody asks me anything.",
		sourceLang: 'German',
		targetLang: 'English'
	},

	{
		source:
			'Ich entschuldige mich bei jeder Interaktion, spüre wie meine Wangen heiß werden, während ich das Gespräch auf Englisch umschalte.',
		target:
			'I apologize in every interaction, feeling my cheeks get hot as I switch the conversation to English.',
		sourceLang: 'German',
		targetLang: 'English'
	},

	{
		source:
			'Ich fühle mich allein in vollen Restaurants und wünschte, ich könnte über die Witze lachen, die am Nebentisch erzählt werden.',
		target:
			'I feel alone in full restaurants, wishing I could laugh at the jokes being told at the next table.',
		sourceLang: 'German',
		targetLang: 'English'
	},

	{
		source:
			'Fremde haben Verständnis dafür, dass ich die Sprache nicht kann — auf eine Weise, wie ich es als Kind nie hatte.',
		target:
			'Strangers are understanding about me not knowing the language — in a way I never was as a kid.',
		sourceLang: 'German',
		targetLang: 'English'
	}
];
