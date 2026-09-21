const express = require('express');
const twilio = require('twilio');
const { getWeather, getWeatherForPlace } = require('./src/services/weather');
const { findPlace } = require('./src/services/places');
const { loadStops, nearestStop } = require('./src/services/stops');
const { setPending, getPending, clearPending } = require('./src/services/pendingSelections');
const { getNextArrivals, formatArrivals } = require('./src/services/transit');
const { saveFavorite, getFavorite, setPaused, isPaused } = require('./src/services/favorites');
require('dotenv').config();

const app = express();
app.use(express.urlencoded({ extended: false }));

loadStops('./data/stops.txt');

const lastResolved = new Map();

app.post('/sms', async (req, res) => {
  const incomingMsg = req.body.Body;
  const from = req.body.From;
  const text = incomingMsg.trim();
  console.log('Received:', text, 'from', from);

  const twiml = new twilio.twiml.MessagingResponse();
  const upper = text.toUpperCase();

  if (upper === 'HELP') {
    twiml.message(
      'Routinerary commands:\nWEATHER [place] - forecast\n' +
      '[place name] - find nearest transit stop\nSAVE [name] - save your last search\n' +
      '[saved name] - look up a saved stop\nPAUSE - stop messages\nSTART - resume messages'
    );
  } else if (upper === 'PAUSE') {
    setPaused(from, true);
    twiml.message('Paused. Text START anytime to resume.');
  } else if (upper === 'START') {
    setPaused(from, false);
    twiml.message('Resumed! Text HELP to see available commands.');
  } else if (isPaused(from)) {
    // Paused users get no reply to anything else — silently drop.
    // (Twilio still needs a response; send empty TwiML.)
  } else if (upper.startsWith('SAVE ')) {
    const label = text.slice(5).trim().toLowerCase();
    const last = lastResolved.get(from);
    if (!last) {
      twiml.message('Search for a stop first, then text SAVE <name> to save it.');
    } else {
      saveFavorite(from, label, last.stop_id, last.stop_name, last.lat, last.lon);
      twiml.message(`Saved "${label}" — text ${label.toUpperCase()} anytime to look it up.`);
    }
  } else if (/^[0-9]+$/.test(text) && getPending(from)) {
    const choice = getPending(from)[parseInt(text, 10) - 1];
    clearPending(from);
    if (choice) {
      const stop = nearestStop(choice.geometry.location.lat, choice.geometry.location.lng);
      lastResolved.set(from, { stop_id: stop.stop_id, stop_name: stop.stop_name, lat: stop.lat, lon: stop.lon });
      const arrivals = await getNextArrivals(stop.stop_id);
      twiml.message(formatArrivals(arrivals, stop.stop_name));
    } else {
      twiml.message("Didn't recognize that number — try your search again.");
    }
  } else if (upper.startsWith('WEATHER')) {
    const locationQuery = text.slice(7).trim();
    const forecast = locationQuery
      ? await getWeatherForPlace(locationQuery)
      : await getWeather(42.0987, -75.9180);
    twiml.message(forecast);
  } else {
    const saved = getFavorite(from, text.toLowerCase());
    if (saved) {
      const arrivals = await getNextArrivals(saved.stop_id);
      twiml.message(formatArrivals(arrivals, saved.stop_name));
    } else {
      const results = await findPlace(text, 42.0987, -75.9180);
      if (results.length > 1) {
        setPending(from, results);
        const list = results.map((r, i) => `${i + 1}) ${r.name}`).join('\n');
        twiml.message(`Found a few matches:\n${list}\nReply with a number.`);
      } else if (results.length === 1) {
        const stop = nearestStop(results[0].geometry.location.lat, results[0].geometry.location.lng);
        lastResolved.set(from, { stop_id: stop.stop_id, stop_name: stop.stop_name, lat: stop.lat, lon: stop.lon });
        const arrivals = await getNextArrivals(stop.stop_id);
        twiml.message(formatArrivals(arrivals, stop.stop_name));
      } else {
        twiml.message("Couldn't find that — try a more specific name.");
      }
    }
  }

  res.type('text/xml').send(twiml.toString());
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));