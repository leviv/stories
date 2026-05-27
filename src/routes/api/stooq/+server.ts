import { error } from '@sveltejs/kit';

export const GET = async ({ fetch, url }) => {
	const symbol = url.searchParams.get('symbol');
	if (!symbol) {
		throw error(400, 'Missing symbol');
	}

	const period1 = 0;
	const period2 = Math.floor(Date.now() / 1000);
	const yahooUrl = new URL('https://query1.finance.yahoo.com/v7/finance/download/' + symbol);
	yahooUrl.searchParams.set('period1', String(period1));
	yahooUrl.searchParams.set('period2', String(period2));
	yahooUrl.searchParams.set('interval', '1d');
	yahooUrl.searchParams.set('events', 'history');
	yahooUrl.searchParams.set('includeAdjustedClose', 'true');

	const response = await fetch(yahooUrl);
	if (!response.ok) {
		throw error(response.status, `Yahoo request failed (${response.status})`);
	}

	const csv = await response.text();
	return new Response(csv, {
		status: 200,
		headers: {
			'content-type': 'text/plain; charset=utf-8'
		}
	});
};
