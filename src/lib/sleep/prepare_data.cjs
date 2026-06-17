const fs = require('fs');

console.log('Reading History.json...');
const data = JSON.parse(fs.readFileSync('./src/lib/sleep/History.json', 'utf8'));
const history = data['Browser History'];

console.log('Sorting history...');
// Time is in microseconds. Sort ascending (oldest to newest)
history.sort((a, b) => (a.time_usec || 0) - (b.time_usec || 0));

console.log('Calculating durations and filtering...');

// Timezone overrides
const timezones = [
    {
        start: new Date('2025-08-15T00:00:00Z').getTime(),
        end: new Date('2025-09-24T00:00:00Z').getTime(), // up to end of Sep 23
        tz: 'America/Los_Angeles'
    },
    {
        start: new Date('2025-11-15T00:00:00Z').getTime(),
        end: new Date('2025-12-01T00:00:00Z').getTime(), // up to end of Nov 30
        tz: 'America/Chicago'
    },
    {
        start: new Date('2025-12-27T00:00:00Z').getTime(),
        end: new Date('2026-01-02T00:00:00Z').getTime(), // up to end of Jan 1
        tz: 'America/Los_Angeles'
    },
    {
        start: new Date('2026-01-02T00:00:00Z').getTime(),
        end: new Date('2026-02-04T00:00:00Z').getTime(), // up to end of Feb 3
        tz: 'Europe/Berlin'
    },
    {
        start: new Date('2026-02-04T00:00:00Z').getTime(),
        end: new Date('2026-02-12T00:00:00Z').getTime(), // up to end of Feb 11
        tz: 'Europe/Madrid'
    },
    {
        start: new Date('2026-03-01T00:00:00Z').getTime(),
        end: new Date('2026-03-07T00:00:00Z').getTime(), // up to end of Mar 6
        tz: 'America/Denver'
    },
    {
        start: new Date('2026-03-07T00:00:00Z').getTime(),
        end: new Date('2026-03-14T00:00:00Z').getTime(), // up to end of Mar 13
        tz: 'America/Los_Angeles'
    },
    {
        start: new Date('2026-05-17T00:00:00Z').getTime(),
        end: new Date('2030-01-01T00:00:00Z').getTime(), // up to "now"
        tz: 'Asia/Shanghai'
    }
];

function getTimezoneForDate(ms) {
    for (const period of timezones) {
        if (ms >= period.start && ms < period.end) {
            return period.tz;
        }
    }
    return 'America/New_York'; // default
}

const filtered = [];
let totalWastedMs = 0;

for (let i = 0; i < history.length; i++) {
    const entry = history[i];
    const time_usec = entry.time_usec;
    if (!time_usec) continue;
    
    const ms = time_usec / 1000;
    
    // Calculate duration
    let durationMs = 3 * 60 * 1000; // 3 minutes default
    if (i < history.length - 1) {
        const nextTimeMs = history[i+1].time_usec / 1000;
        const diff = nextTimeMs - ms;
        // If the gap to next event is less than 30 mins, we use the gap as duration
        if (diff >= 0 && diff < 30 * 60 * 1000) {
            durationMs = diff;
        }
    }
    
    // Determine user's local timezone at the time
    const localTz = getTimezoneForDate(ms);
    
    // Check if it's in the 1am-7am window (local time)
    const date = new Date(ms);
    const options = { timeZone: localTz, hour: 'numeric', hour12: false };
    const hour = parseInt(new Intl.DateTimeFormat('en-US', options).format(date));
    
    if (hour >= 1 && hour < 7) {
        let domain = '';
        try {
            domain = new URL(entry.url).hostname;
            domain = domain.replace(/^www\./, '');
        } catch(e) {}

        const localDate = new Intl.DateTimeFormat('en-US', { 
            timeZone: localTz, 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        }).format(date);

        const localTime = new Intl.DateTimeFormat('en-US', { 
            timeZone: localTz, 
            hour: 'numeric', 
            minute: '2-digit', 
            hour12: true 
        }).format(date);

        const groupDate = new Intl.DateTimeFormat('en-CA', { // en-CA gives YYYY-MM-DD
            timeZone: localTz, 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit' 
        }).format(date);
        
        filtered.push({
            title: entry.title,
            url: entry.url,
            domain: domain,
            time: ms,
            durationMs: durationMs,
            tz: localTz,
            localDate: localDate,
            localTime: localTime,
            groupDate: groupDate
        });
        totalWastedMs += durationMs;
    }
}

fs.writeFileSync('./src/lib/sleep/filtered.json', JSON.stringify(filtered));

console.log('Filtered entries:', filtered.length);
console.log('Total time wasted (hours):', (totalWastedMs / 1000 / 60 / 60).toFixed(2));
console.log('Saved to src/lib/sleep/filtered.json');
