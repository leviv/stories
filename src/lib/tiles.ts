import architectsSound from './assets/architects-sounds.jpg';
import crowdGif from './assets/crowd.gif';
import dataDie from './assets/data-die.jpg';
import databaseGif from './assets/database.gif';
import experimentGif from './assets/experiment.gif';
import forestListeners from './assets/forest-listeners.jpg';
import gameGif from './assets/game.gif';
import graphGif from './assets/graph.gif';
import outOfSight from './assets/out-of-sight.jpg';
import peopleMap from './assets/people-map.png';
import queeringTheMap from './assets/queering-the-map.jpg';
import scrollGif from './assets/scroll.gif';
import screwedGif from './assets/screwed.gif';
import simGif from './assets/sim.gif';
import sonicDna from './assets/sonic-dna.jpg';
import soundGif from './assets/sound.gif';
import trumpConnections from './assets/trump-connections.jpeg';
import userGif from './assets/user.gif';
import vrGif from './assets/vr.gif';
import wealth from './assets/wealth.png';

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
		body: 'Visitors to the website can contribute their own stories and experiences, which collectively builds a dataset that is used to tell the story. This type of storytelling depends on user input, which can be hard to source and can be susceptible to bias and trolling.',
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
		body: "This is the most straighforward and understandable form of interactive storytelling. Things like maps, bar charts and line grapphs, but with user interaction. It's best utilized  when traditional mediums are too small for massive visualizations that require panning, zooming, filtering. I also gives writers the ability to zoom in and out from big picture to individual data points.",
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
		body: 'Soundscapes, audio explorations and ',
		links: [
			{ url: 'https://pudding.cool/2025/04/music-dna/', label: 'How Sonic DNA Connects Generations of Music', image: sonicDna },
			{ url: 'https://www.nytimes.com/interactive/2015/12/29/arts/design/sound-architecture.html', label: 'Dear Architects: Sound Matters', image: architectsSound },
			{ url: 'https://howlerjs.com', label: 'Howler.js', image: soundGif }
		],
		col: 4,
		row: 6
	},
	{
		gif: simGif,
		title: 'Simulations',
		body: 'Often an interactive widget that demonstrates the effect tha the article is writing about',
		links: [
			{ url: 'https://geon.github.io/programming/2016/03/03/dsxyliea', label: 'Dyslexia', image: simGif },
			{ url: 'https://pudding.cool/2018/04/birthday-paradox/', label: 'The birthday paradox', image: simGif },
			{ url: 'https://www.bloomberg.com/graphics/2015-paul-ford-what-is-code/', label: 'What is code', image: simGif }
		],
		col: 2,
		row: 10
	},
	{
		gif: gameGif,
		title: 'Game-Based Narratives',
		body: 'Gamifying parts of a story or making a game around a narrative theme to make the topic more engaging. Some of the gamifying aspects of starting with an assumption and having to check it helps a lot with recall and understanding your own biases.',
		links: [
			{ url: 'https://artsandculture.google.com/experiment/don-t-touch-the-art-at-the-national-gallery-of-art-washington-d-c/6gFFxOZaOc9WwQ', label: "Don't Touch the Art", image: gameGif },
			{ url: 'https://pudding.cool/2021/10/judge-my-music/', label: 'How Bad Is Your Streaming Music?', image: gameGif },
			{ url: 'https://pudding.cool/2018/10/city_3d/', label: 'Are You Good Enough to Be a Tennis Line Judge?', image: gameGif }
		],
		col: 1,
		row: 13
	},
	{
		gif: vrGif,
		title: 'Virtual & Augmented Reality',
		body: '3D scans Imaginative or reconstructed worlds',
		links: [
			{ url: 'https://www.theguardian.com/world/ng-interactive/2016/apr/27/6x9-a-virtual-experience-of-solitary-confinement', label: '6x9: a virtual experience of solitary confinement', image: vrGif },
			{ url: 'https://www.nytimes.com/interactive/2015/01/09/sports/the-dawn-wall-el-capitan.html', label: 'The Dawn Wall', image: vrGif },
			{ url: 'https://pudding.cool/2018/10/city_3d/', label: 'Human Terrain', image: vrGif }
		],
		col: 4,
		row: 11
	},
	{
		gif: databaseGif,
		title: 'Searchable databases',
		body: 'Representing a dataset well that might otherwise be unaccessible to the public',
		links: [
			{ url: 'https://jmail.world/', label: 'JMail: Jeffrey Epsteins Emails', image: databaseGif },
			{ url: 'https://www.icij.org/investigations/panama-papers/', label: 'Panama Papers', image: databaseGif },
			{ url: 'https://pudding.cool/2018/09/jordans/', label: 'A visual history of every Air Jordan', image: databaseGif }
		],
		col: 1,
		row: 16
	},
	{
		gif: experimentGif,
		title: 'Experimental Interfaces',
		body: 'Often exploring fictional or speculative worlds. Sometimes using emerging technologies.',
		links: [
			{ url: 'https://artsandculture.google.com/experiment/mice-in-the-museum-with-berlin%E2%80%99s-gem%C3%A4ldegalerie/JwHp29GHTw0GQQ', label: 'Mice in the Museum', image: experimentGif },
			{ url: 'https://beginyourlegacy.framer.website/#otherdevices', label: 'Legacy: Renting taste', image: experimentGif }
		],
		col: 3,
		row: 14
	},
	{
		gif: userGif,
		title: 'Inserting yourself in the story',
		body: "Insert yourself in to a dataset to see how you compare. These are shareable, and more contextual to the reader. Often 'choose your own adventure' style, where the reader can make choices that affect the outcome of the story.",
		links: [
			{ url: 'https://artsandculture.google.com/camera/selfie', label: 'Art selfie', image: userGif },
			{ url: 'https://pudding.cool/2022/12/emotion-wheel/', label: 'How are you doing?', image: userGif },
			{ url: 'https://www.theguardian.com/us-news/ng-interactive/2014/nov/06/-sp-congress-diversity-women-race-lgbt-are-you-represented', label: 'Are you reflected in the new Congress?', image: userGif }
		],
		col: 2,
		row: 18
	}
];

export default tiles;
