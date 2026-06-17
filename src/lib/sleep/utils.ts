export function formatDuration(ms: number, format: 'hours' | 'minutes' = 'hours'): string {
	if (!ms) {
		return format === 'hours' ? '0m' : '-';
	}

	if (format === 'hours') {
		const hours = ms / 1000 / 60 / 60;
		if (hours < 1) {
			return `${Math.round(ms / 1000 / 60)}m`;
		}
		return `${hours.toFixed(1)} hrs`;
	} else {
		// minutes format
		const mins = Math.round(ms / 1000 / 60);
		if (mins === 0) {
			return '<1m';
		}
		return `${mins}m`;
	}
}
