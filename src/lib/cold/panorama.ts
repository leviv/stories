import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize APIs outside so we don't recreate them.
const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
	model: 'gemini-2.5-flash-image',
	generationConfig: {
		// @ts-expect-error: responseModalities is not yet typed in this SDK version
		responseModalities: ['IMAGE']
	}
});

async function fetchAsImage(url: string): Promise<HTMLImageElement> {
	const res = await fetch(url);
	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Failed to fetch image. Status: ${res.status}. Response: ${text}`);
	}
	const blob = await res.blob();
	const imgUrl = URL.createObjectURL(blob);
	return new Promise<HTMLImageElement>((resolve, reject) => {
		const img = new Image();
		img.onload = () => {
			resolve(img);
			URL.revokeObjectURL(imgUrl);
		};
		img.onerror = () => {
			reject(new Error('Failed to load image from blob'));
		};
		img.src = imgUrl;
	});
}

export async function buildPanorama(lat: number, lng: number, panoId?: string): Promise<string> {
	const size = '640x640';
	const headings = [0, 90, 180, 270];

	// Fetch 4 tiles to cover 360 degrees
	const images = await Promise.all(
		headings.map((heading) => {
			const locationParam = panoId ? `pano=${panoId}` : `location=${lat},${lng}`;
			const url = `https://maps.googleapis.com/maps/api/streetview?size=${size}&${locationParam}&heading=${heading}&pitch=0&fov=90&key=${apiKey}&return_error_code=true`;
			return fetchAsImage(url);
		})
	);

	const canvas = document.createElement('canvas');
	canvas.width = 640 * 4; // 2560px
	canvas.height = 640;
	const ctx = canvas.getContext('2d');

	if (ctx) {
		images.forEach((img, index) => {
			ctx.drawImage(img, index * 640, 0, 640, 640);
		});
		return canvas.toDataURL('image/jpeg', 0.8);
	}
	throw new Error('Canvas context not available');
}

export interface HistoricalPano {
	pano: string;
	year: string;
}

export async function getHistoricalPanoIds(
	lat: number,
	lng: number,
	count: number
): Promise<HistoricalPano[]> {
	// Wait for Google Maps API to be available
	while (!window.google || !window.google.maps || !window.google.maps.StreetViewService) {
		await new Promise((r) => setTimeout(r, 100));
	}

	const sv = new google.maps.StreetViewService();

	return new Promise((resolve) => {
		sv.getPanorama({ location: { lat, lng }, radius: 50 }, async (data: any, status: string) => {
			if (status === 'OK' && data) {
				let panoIds: string[] = [];
				if (data.time && data.time.length > 0) {
					panoIds = data.time.map((t: any) => t.pano);

					// Ensure the newest (default) pano is at the end if it's not already
					if (data.location?.pano && !panoIds.includes(data.location.pano)) {
						panoIds.push(data.location.pano);
					}
				} else if (data.location?.pano) {
					panoIds = [data.location.pano];
				}

				if (panoIds.length === 0) {
					resolve(Array(count).fill({ pano: '', year: '' }));
					return;
				}

				const selectedPanoIds: string[] = [];
				for (let i = 0; i < count; i++) {
					let pIndex;
					if (count <= 1) {
						pIndex = panoIds.length - 1; // Default to newest if only 1 step
					} else {
						// Evenly distribute [0, count-1] to [0, panoIds.length-1]
						pIndex = Math.round((i / (count - 1)) * (panoIds.length - 1));
					}
					selectedPanoIds.push(panoIds[pIndex]);
				}

				// Fetch the actual date metadata for each selected pano
				const result: HistoricalPano[] = await Promise.all(
					selectedPanoIds.map(async (pano) => {
						return new Promise<HistoricalPano>((res) => {
							sv.getPanorama({ pano }, (pData: any, pStatus: string) => {
								if (pStatus === 'OK' && pData) {
									const yearStr = pData.imageDate
										? pData.imageDate.split('-')[0]
										: new Date().getFullYear().toString();
									res({ pano, year: yearStr });
								} else {
									res({ pano, year: new Date().getFullYear().toString() });
								}
							});
						});
					})
				);

				resolve(result);
			} else {
				// Failed to get panorama, return empty objects so we fallback to location
				resolve(Array(count).fill({ pano: '', year: '' }));
			}
		});
	});
}

export async function buildSatelliteView(lat: number, lng: number): Promise<string> {
	const size = '640x640';
	const url = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=14&size=${size}&maptype=satellite&key=${apiKey}`;
	const img = await fetchAsImage(url);

	const canvas = document.createElement('canvas');
	canvas.width = 640;
	canvas.height = 640;
	const ctx = canvas.getContext('2d');

	if (ctx) {
		ctx.drawImage(img, 0, 0, 640, 640);
		return canvas.toDataURL('image/jpeg', 0.8);
	}
	throw new Error('Canvas context not available');
}

export async function getMockColderImage(base64Image: string, step: number): Promise<string> {
	// Simulate network latency of AI generation
	await new Promise((r) => setTimeout(r, 1500));

	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => {
			const canvas = document.createElement('canvas');
			canvas.width = img.width;
			canvas.height = img.height;
			const ctx = canvas.getContext('2d');
			if (ctx) {
				ctx.drawImage(img, 0, 0);

				const intensity = Math.min(step * 0.25, 0.9);

				// Overall blue/white frost layer
				ctx.fillStyle = `rgba(200, 230, 255, ${intensity * 0.6})`;
				ctx.fillRect(0, 0, canvas.width, canvas.height);

				// Top/bottom edge vignette (white)
				const topGrad = ctx.createLinearGradient(0, 0, 0, 100);
				topGrad.addColorStop(0, `rgba(255, 255, 255, ${intensity})`);
				topGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
				ctx.fillStyle = topGrad;
				ctx.fillRect(0, 0, canvas.width, 100);

				const botGrad = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - 100);
				botGrad.addColorStop(0, `rgba(255, 255, 255, ${intensity})`);
				botGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
				ctx.fillStyle = botGrad;
				ctx.fillRect(0, canvas.height - 100, canvas.width, 100);

				resolve(canvas.toDataURL('image/jpeg', 0.8));
			} else {
				resolve(base64Image);
			}
		};
		img.onerror = reject;
		img.src = base64Image;
	});
}

export async function getColderImage(
	base64Image: string,
	step: number,
	imageType: 'streetview' | 'satellite' = 'streetview'
): Promise<string> {
	try {
		// Extract base64 data without the prefix
		const base64Data = base64Image.split(',')[1];
		const imagePart = {
			inlineData: {
				data: base64Data,
				mimeType: 'image/jpeg'
			}
		};

		let prompt = 'Make this 360 panoramic street view scene slightly colder.';
		if (imageType === 'satellite') {
			prompt = 'Make this overhead satellite map slightly colder.';
		}

		if (step === 1) {
			prompt =
				imageType === 'satellite'
					? 'Make this overhead satellite map colder, with a light dusting of snow and frost.'
					: 'Make this 360 degree panoramic street view scene colder, with a light dusting of snow and frost.';
		} else if (step === 2) {
			prompt =
				imageType === 'satellite'
					? 'Make this overhead satellite map covered in thick snow and ice, freezing cold winter.'
					: 'Make this 360 degree panoramic street view scene covered in thick snow and ice, freezing cold winter.';
		} else if (step >= 3) {
			prompt =
				imageType === 'satellite'
					? 'Make this overhead satellite map a completely frozen snowy wasteland. Over 20 feet of snow covering everything.'
					: 'Make this 360 degree panoramic street view scene a completely frozen snowy wasteland. Over 20 feet of snow covering everything.';
		}

		const result = await model.generateContent([prompt, imagePart]);
		const response = result.response;

		// The SDK usually puts the generated image inside the parts array as inlineData
		const parts = response.candidates?.[0]?.content?.parts || [];
		const imagePartResponse = parts.find((p) => p.inlineData);

		if (imagePartResponse && imagePartResponse.inlineData) {
			const image = imagePartResponse.inlineData;
			return `data:${image.mimeType};base64,${image.data}`;
		} else if (response.text()) {
			// Fallback if the model returned text instead of an image
			console.warn(
				'Model returned text instead of an image. Ensure the model supports image generation.'
			);
		}
	} catch (error) {
		console.error('Error generating colder image:', error);
	}

	// Fallback to the base image if generation fails
	return base64Image;
}
