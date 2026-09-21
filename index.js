const express = require('express');
const twilio = require('twilio');
const { getWeather, getWeatherForPlace } = require('./src/services/weather');
const { findPlace } = require('./src/services/places');
const { loadStops, nearestStop } = require('./src/services/stops');
const { setPending, getPending, clearPending } = require('./src/services/pendingSelections');
require('dotenv').config();

const app = express();
app.use(express.urlencoded({ extended: false }));

// Load static GTFS stop data once at startup
loadStops('./data/stops.txt');

app.post('/sms', async (req, res) => {
  const incomingMsg = req.body.Body;
  const from = req.body.From;
  const text = incomingMsg.trim();
  console.log('Received:', text, 'from', from);

  const twiml = new twilio.twiml.MessagingResponse();

  if (/^[0-9]+$/.test(text) && getPending(from)) {
    const choice = getPending(from)[parseInt(text, 10) - 1];
    clearPending(from);
    if (choice) {
      const stop = nearestStop(choice.geometry.location.lat, choice.geometry.location.lng);
      twiml.message(`Nearest stop: ${stop.stop_name}`);
    } else {
      twiml.message("Didn't recognize that number — try your search again.");
    }
  } else if (text.toUpperCase().startsWith('WEATHER')) {
    const locationQuery = text.slice(7).trim();
    const forecast = locationQuery
      ? await getWeatherForPlace(locationQuery)
      : await getWeather(42.0987, -75.9180);
    twiml.message(forecast);
  } else {
    const results = await findPlace(text, 42.0987, -75.9180);
    if (results.length > 1) {
      setPending(from, results);
      const list = results.map((r, i) => `${i + 1}) ${r.name}`).join('\n');
      twiml.message(`Found a few matches:\n${list}\nReply with a number.`);
    } else if (results.length === 1) {
      const stop = nearestStop(results[0].geometry.location.lat, results[0].geometry.location.lng);
      twiml.message(`Nearest stop: ${stop.stop_name}`);
    } else {
      twiml.message("Couldn't find that — try a more specific name.");
    }
  }

  res.type('text/xml').send(twiml.toString());
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));