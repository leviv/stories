import bubbles from '$lib/jaywalking/bubbles.png';
import cal from '$lib/jaywalking/cal.png';
import calculator from '$lib/jaywalking/calculator.png';
import camera from '$lib/jaywalking/camera.png';
import card from '$lib/jaywalking/card.png';
import chart from '$lib/jaywalking/chart.png';
import gift from '$lib/jaywalking/gift.png';
import heart from '$lib/jaywalking/heart.png';
import image from '$lib/jaywalking/image.png';
import minecraft from '$lib/jaywalking/minecraft.png';
import rocket from '$lib/jaywalking/rocket.png';
import video from '$lib/jaywalking/video.png';

export type IconItem = {
	id: string;
	src: string;
	labelKey: string;
	hasDot?: boolean;
};

export const iconItems: IconItem[] = [
	{ id: 'bubbles', src: bubbles, labelKey: 'icon.bubbles' },
	{ id: 'cal', src: cal, labelKey: 'icon.cal', hasDot: true },
	{ id: 'calculator', src: calculator, labelKey: 'icon.calculator' },
	{ id: 'camera', src: camera, labelKey: 'icon.camera' },
	{ id: 'card', src: card, labelKey: 'icon.card', hasDot: true },
	{ id: 'chart', src: chart, labelKey: 'icon.chart' },
	{ id: 'gift', src: gift, labelKey: 'icon.gift', hasDot: true },
	{ id: 'heart', src: heart, labelKey: 'icon.heart' },
	{ id: 'image', src: image, labelKey: 'icon.image' },
	{ id: 'minecraft', src: minecraft, labelKey: 'icon.minecraft' },
	{ id: 'rocket', src: rocket, labelKey: 'icon.rocket', hasDot: true },
	{ id: 'video', src: video, labelKey: 'icon.video' }
];
