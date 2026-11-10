// Dublin clock, the sun's position over Dublin, and the service schedule.
export const DUBLIN = { lat: 53.3498, lon: -6.2603, tz: 'Europe/Dublin' };

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const partsFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: DUBLIN.tz, weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
});
const clockFmt = new Intl.DateTimeFormat('en-IE', { timeZone: DUBLIN.tz, hour: 'numeric', minute: '2-digit' });
const dayFmt = new Intl.DateTimeFormat('en-IE', { timeZone: DUBLIN.tz, weekday: 'short', day: 'numeric', month: 'short' });

export function dublinParts(date = new Date()) {
  const p = Object.fromEntries(partsFmt.formatToParts(date).map((x) => [x.type, x.value]));
  return {
    weekday: DAYS.indexOf(p.weekday),
    hours: +p.hour + +p.minute / 60 + +p.second / 3600,
  };
}

export const formatClock = (date) => clockFmt.format(date);
export const formatDay = (date) => dayFmt.format(date);

/** Today's date in Dublin at the given decimal hour (used to preview other times). */
export function atDublinHour(hour, now = new Date()) {
  return new Date(now.getTime() + (hour - dublinParts(now).hours) * 3600e3);
}

export function phaseOf(hours) {
  if (hours >= 5 && hours < 12) return { name: 'Morning', greeting: 'Good morning · Welcome home' };
  if (hours >= 12 && hours < 17) return { name: 'Afternoon', greeting: 'Good afternoon · Welcome home' };
  if (hours >= 17 && hours < 21) return { name: 'Evening', greeting: 'Good evening · Welcome home' };
  return { name: 'Night', greeting: 'Welcome home' };
}

/** Sun altitude/azimuth in radians (azimuth clockwise from north). Low-precision NOAA-style formulae. */
export function sunPosition(date, lat = DUBLIN.lat, lon = DUBLIN.lon) {
  const rad = Math.PI / 180;
  const d = date.getTime() / 86400000 - 10957.5; // days since J2000.0
  const g = rad * (357.529 + 0.98560028 * d);
  const q = 280.459 + 0.98564736 * d;
  const L = rad * (q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g));
  const e = rad * (23.439 - 0.00000036 * d);
  const ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L));
  const dec = Math.asin(Math.sin(e) * Math.sin(L));
  const gmst = (((18.697374558 + 24.06570982441908 * d) % 24) + 24) % 24;
  const H = gmst * 15 * rad + lon * rad - ra;
  const phi = lat * rad;
  const alt = Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H));
  const az = Math.atan2(-Math.sin(H), Math.tan(dec) * Math.cos(phi) - Math.sin(phi) * Math.cos(H));
  return { alt, az: (az + 2 * Math.PI) % (2 * Math.PI) };
}

/** The next (or current) occurrence of a weekly service, in Dublin time. */
export function nextService({ weekday, start, end }, now = new Date()) {
  const { hours } = dublinParts(now);
  for (let k = 0; k <= 7; k++) {
    const s = new Date(now.getTime() + (k * 24 + start - hours) * 3600e3);
    if (dublinParts(s).weekday !== weekday) continue;
    const e = new Date(s.getTime() + (end - start) * 3600e3);
    if (e <= now) continue;
    return { start: s, end: e, live: now >= s, inDays: k };
  }
  return null;
}

export const SERVICES = {
  sunday: { weekday: 0, start: 10, end: 12.5 },
  faithClinic: { weekday: 5, start: 18.5, end: 19.5 },
};

export function untilText(ms) {
  const m = Math.max(0, Math.round(ms / 60000));
  const d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mm = m % 60;
  if (d > 1) return `in ${d} days`;
  if (d === 1) return h ? `in 1 day ${h}h` : 'tomorrow';
  if (h) return `in ${h}h ${mm}m`;
  return `in ${mm} min`;
}
