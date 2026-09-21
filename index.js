const express = require('express');
const twilio = require('twilio');
const { getWeather, getWeatherForPlace } = require('./src/services/weather');
require('dotenv').config();

const app = express();
app.use(express.urlencoded({ extended: false }));

app.post('/sms', async (req, res) => {
  const incomingMsg = req.body.Body;
  console.log('Received:', incomingMsg);

  const twiml = new twilio.twiml.MessagingResponse();
  const text = incomingMsg.trim();

  if (text.toUpperCase().startsWith('WEATHER')) {
    const locationQuery = text.slice(7).trim(); // whatever comes after "WEATHER"
    const forecast = locationQuery
      ? await getWeatherForPlace(locationQuery)
      : await getWeather(42.0987, -75.9180); // Binghamton fallback
    twiml.message(forecast);
  } else {
    twiml.message(`You said: ${incomingMsg}`);
  }

  res.type('text/xml').send(twiml.toString());
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));