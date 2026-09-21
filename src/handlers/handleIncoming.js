const { getWeather, getWeatherForPlace } = require('../services/weather');
const { findPlace } = require('../services/places');
const { nearestStop } = require('../services/stops');
const { setPending, getPending, clearPending } = require('../services/pendingSelections');
const { getNextArrivals, formatArrivals } = require('../services/transit');
const { saveFavorite, getFavorite, setPaused, isPaused, setNotifyTime } = require('../services/favorites');

const lastResolved = new Map();

async function handleIncoming(text, from) {
  text = text.trim();
  const upper = text.toUpperCase();

  if (upper === 'HELP') {
    return 'Routinerary commands:\nWEATHER [place] - forecast\n' +
      '[place name] - find nearest transit stop\nSAVE [name] - save your last search\n' +
      '[saved name] - look up a saved stop\nPAUSE - stop messages\nSTART - resume messages\n' +
      'NOTIFY [H:MM] - set your daily morning update time (for your "home" favorite)';
  }
  if (upper === 'PAUSE') {
    setPaused(from, true);
    return 'Paused. Text START anytime to resume.';
  }
  if (upper === 'START') {
    setPaused(from, false);
    return 'Resumed! Text HELP to see available commands.';
  }
  if (isPaused(from)) {
    return null; // caller decides how to represent "no reply"
  }
  if (upper.startsWith('NOTIFY ')) {
    const timeStr = text.slice(7).trim();
    const match = timeStr.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
    if (!match) {
      return 'Invalid time. Use NOTIFY H:MM in 24-hour time, e.g. NOTIFY 7:30.';
    }
    const normalized = `${match[1].padStart(2, '0')}:${match[2]}`;
    setNotifyTime(from, normalized);
    return `Got it — your morning update will arrive at ${normalized}.`;
  }
  if (upper.startsWith('SAVE ')) {
    const label = text.slice(5).trim().toLowerCase();
    const last = lastResolved.get(from);
    if (!last) return 'Search for a stop first, then text SAVE <name> to save it.';
    saveFavorite(from, label, last.stop_id, last.stop_name, last.lat, last.lon);
    return `Saved "${label}" — text ${label.toUpperCase()} anytime to look it up.`;
  }
  if (/^[0-9]+$/.test(text) && getPending(from)) {
    const choice = getPending(from)[parseInt(text, 10) - 1];
    clearPending(from);
    if (!choice) return "Didn't recognize that number — try your search again.";
    const stop = nearestStop(choice.geometry.location.lat, choice.geometry.location.lng);
    lastResolved.set(from, { stop_id: stop.stop_id, stop_name: stop.stop_name, lat: stop.lat, lon: stop.lon });
    const arrivals = await getNextArrivals(stop.stop_id);
    return formatArrivals(arrivals, stop.stop_name);
  }
  if (upper.startsWith('WEATHER')) {
    const locationQuery = text.slice(7).trim();
    return locationQuery
      ? await getWeatherForPlace(locationQuery)
      : await getWeather(42.0987, -75.9180);
  }

  const saved = getFavorite(from, text.toLowerCase());
  if (saved) {
    const arrivals = await getNextArrivals(saved.stop_id);
    return formatArrivals(arrivals, saved.stop_name);
  }

  const results = await findPlace(text, 42.0987, -75.9180);
  if (results.length > 1) {
    setPending(from, results);
    const list = results.map((r, i) => `${i + 1}) ${r.name}`).join('\n');
    return `Found a few matches:\n${list}\nReply with a number.`;
  }
  if (results.length === 1) {
    const stop = nearestStop(results[0].geometry.location.lat, results[0].geometry.location.lng);
    lastResolved.set(from, { stop_id: stop.stop_id, stop_name: stop.stop_name, lat: stop.lat, lon: stop.lon });
    const arrivals = await getNextArrivals(stop.stop_id);
    return formatArrivals(arrivals, stop.stop_name);
  }
  return "Couldn't find that — try a more specific name.";
}

module.exports = { handleIncoming };