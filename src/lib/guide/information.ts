import architectsSound from './assets/architects-sounds.jpg';
import artSelfie from './assets/art_selfie.png';
import birthday from './assets/birthday.jpeg';
import crowdGif from './assets/crowd.gif';
import dataDie from './assets/data-die.jpg';
import databaseGif from './assets/database.gif';
import dawnWall from './assets/dawn_wall.png';
import dyslexia from './assets/dexlisya.jpeg';
import dontTouchArt from './assets/dont_touch_art.png';
import experimentGif from './assets/experiment.gif';
import forestListeners from './assets/forest-listeners.jpg';
import gameGif from './assets/game.gif';
import graphGif from './assets/graph.gif';
import howAreYou from './assets/how_are_you.png';
import howBadIsYourMusic from './assets/how_bad_is_your_music.jpeg';
import humanTerrain from './assets/human_terrain.jpeg';
import jmail from './assets/jmail.jpeg';
import legacy from './assets/legacy.png';
import miceInMuseum from './assets/mice_in_museum.jpg';
import newCongress from './assets/new_congress.png';
import outOfSight from './assets/out-of-sight.jpg';
import panamaPapers from './assets/panama_papers.jpeg';
import peopleMap from './assets/people-map.png';
import queeringTheMap from './assets/queering-the-map.jpg';
import scrollGif from './assets/scroll.gif';
import screwedGif from './assets/screwed.gif';
import simGif from './assets/sim.gif';
import sonicDna from './assets/sonic-dna.jpg';
import soundGif from './assets/sound.gif';
import tennisJudge from './assets/tennis_judge.jpg';
import trumpConnections from './assets/trump-connections.jpeg';
import userGif from './assets/user.gif';
import virtualSolitary from './assets/6x9_solitary.jpg';
import vrGif from './assets/vr.gif';
import wealth from './assets/wealth.png';
import whatIsCode from './assets/what_is_code.png';
import yearInMusic from './assets/year_in_music.jpeg';
import airJordans from './assets/air_jordans.png';

export interface TileLink {
	url: string;
	label: string;
	image?: string;
}

export interface Tile {
	gif: string;
	title: string;
	body: string;
	links: TileLink[];
	col: number;
	row: number;
}

const tiles: Tile[] = [
	{
		gif: crowdGif,
		title: 'Crowdsourced Narratives',
		body: 'Visitors to the website can contribute their own stories and experiences, which collectively builds a dataset that is used to tell the story. This type of storytelling depends on user input, which can be hard to source and is be susceptible to bias and trolling.',
		links: [
			{ url: 'https://www.queeringthemap.com/', label: 'Queering the Map', image: queeringTheMap },
			{ url: 'https://artsandculture.google.com/experiment/forest-listeners/jAHbryPWSLc1rA', label: 'Forest Listeners', image: forestListeners }
		],
		col: 1,
		row: 2
	},
	{
		gif: scrollGif,
		title: 'Scrollytelling',
		body: 'Scroll-driven animations and events that allow users to control the pace of the story and reveal content as they explore. This technique can become laborious if misused, and in my opinion works best when the creator wants to convey a sense of scale through the scroll. Scrollytelling can often be converted easily to a video for easier sharability on social media.',
		links: [
			{ url: 'https://eattherichtextformat.github.io/1-pixel-wealth/', label: 'Wealth shown to scale', image: wealth },
			{ url: 'https://pudding.cool/2021/10/lenna/', label: 'Can data die?', image: dataDie },
			{ url: 'https://highline.huffingtonpost.com/articles/en/poor-millennials/', label: 'Millenials are Screwed', image: screwedGif }
		],
		col: 4,
		row: 3
	},
	{
		gif: graphGif,
		title: 'Interactive traditional data viz',
		body: "This is the most straighforward and understandable form of interactive storytelling. Things like maps, bar charts and line grapphs, but with user interaction. It's best utilized  when traditional mediums are too small for massive visualizations that require panning, zooming, filtering. It also gives writers the ability to zoom in and out from big picture to individual data points.",
		links: [
			{ url: 'https://pudding.cool/2019/05/people-map/', label: 'A people map of the US', image: peopleMap },
			{ url: 'https://drones.pitchinteractive.com/', label: 'Out of sight, out of mind', image: outOfSight },
			{ url: 'https://trump.kimalbrecht.com/network/', label: 'Trump Connections', image: trumpConnections }
		],
		col: 1,
		row: 8
	},
	{
		gif: soundGif,
		title: 'Audio Storytelling',
		body: 'Soundscapes, audio explorations and subject matter that is explicitly about sound. Often used to compare and contrast different types of audio or to make audio visualizations.',
		links: [
			{ url: 'https://pudding.cool/2025/04/music-dna/', label: 'How Sonic DNA Connects Generations of Music', image: sonicDna },
			{ url: 'https://www.nytimes.com/interactive/2015/12/29/arts/design/sound-architecture.html', label: 'Dear Architects: Sound Matters', image: architectsSound },
			{ url: 'https://pudding.cool/projects/music-history/', label: 'Best Year in Music', image: yearInMusic }
		],
		col: 4,
		row: 6
	},
	{
		gif: simGif,
		title: 'Simulations',
		body: 'An interactive model of a real world phenomenom. These stories usally educate the reader on how a system works by letting them see or interact with the system. This devices is useful to disprove assumptions and show rather than tell.',
		links: [
			{ url: 'https://geon.github.io/programming/2016/03/03/dsxyliea', label: 'Dyslexia', image: dyslexia },
			{ url: 'https://pudding.cool/2018/04/birthday-paradox/', label: 'The birthday paradox', image: birthday },
			{ url: 'https://www.bloomberg.com/graphics/2015-paul-ford-what-is-code/', label: 'What is code', image: whatIsCode }
		],
		col: 2,
		row: 10
	},
	{
		gif: gameGif,
		title: 'Game-Based Narratives',
		body: 'Gamifying parts of a story or making a game around a narrative theme to make the topic more engaging. Heavily used with educational content geared towards younger audiences. There can be a high potential of virality, where readers are encouraged to share with others to get a high score.',
		links: [
			{ url: 'https://artsandculture.google.com/experiment/don-t-touch-the-art-at-the-national-gallery-of-art-washington-d-c/6gFFxOZaOc9WwQ', label: "Don't Touch the Art", image: dontTouchArt },
			{ url: 'https://pudding.cool/2021/10/judge-my-music/', label: 'How Bad Is Your Streaming Music?', image: howBadIsYourMusic },
			{ url: 'https://graphics.wsj.com/are-you-good-enough-to-be-a-tennis-line-judge/', label: 'Are You Good Enough to Be a Tennis Line Judge?', image: tennisJudge }
		],
		col: 1,
		row: 13
	},
	{
		gif: vrGif,
		title: 'Virtual & Augmented Reality',
		body: '3D environments of real or imagined realities. Often used to show the setting of a real location in a way that feels more immersive than pictures alone.',
		links: [
			{ url: 'https://www.theguardian.com/world/ng-interactive/2016/apr/27/6x9-a-virtual-experience-of-solitary-confinement', label: '6x9: a virtual experience of solitary confinement', image: virtualSolitary },
			{ url: 'https://www.nytimes.com/interactive/2015/01/09/sports/the-dawn-wall-el-capitan.html', label: 'The Dawn Wall', image: dawnWall },
			{ url: 'https://pudding.cool/2018/10/city_3d/', label: 'Human Terrain', image: humanTerrain }
		],
		col: 4,
		row: 11
	},
	{
		gif: databaseGif,
		title: 'Searchable databases',
		body: 'Large sets of data are often hard to parse and hard to efficiently search. Searchable databases seek to contextualize and make datasets accessible and readable to the general public.',
		links: [
			{ url: 'https://jmail.world/', label: 'JMail: Jeffrey Epsteins Emails', image: jmail },
			{ url: 'https://www.icij.org/investigations/panama-papers/', label: 'Panama Papers', image: panamaPapers },
			{ url: 'https://pudding.cool/2018/09/jordans/', label: 'A visual history of every Air Jordan', image: airJordans }
		],
		col: 1,
		row: 16
	},
	{
		gif: experimentGif,
		title: 'Experimental Interfaces',
		body: 'Often exploring fictional or speculative worlds. These stories often use emerging technologies, or existing technologies in exciting ways.',
		links: [
			{ url: 'https://artsandculture.google.com/experiment/mice-in-the-museum-with-berlin%E2%80%99s-gem%C3%A4ldegalerie/JwHp29GHTw0GQQ', label: 'Mice in the Museum', image: miceInMuseum },
			{ url: 'https://beginyourlegacy.framer.website/#otherdevices', label: 'Legacy: Renting taste', image: legacy }
		],
		col: 3,
		row: 14
	},
	{
		gif: userGif,
		title: 'Inserting yourself in the story',
		body: "Insert yourself in to a dataset to see how you compare. These are shareable, and more contextual to the reader. Often 'choose your own adventure' style, where the reader can make choices that affect the outcome of the story.",
		links: [
			{ url: 'https://artsandculture.google.com/camera/selfie', label: 'Art selfie', image: artSelfie },
			{ url: 'https://pudding.cool/2022/12/emotion-wheel/', label: 'How are you doing?', image: howAreYou },
			{ url: 'https://www.theguardian.com/us-news/ng-interactive/2014/nov/06/-sp-congress-diversity-women-race-lgbt-are-you-represented', label: 'Are you reflected in the new Congress?', image: newCongress }
		],
		col: 2,
		row: 18
	}
];

export default tiles;
