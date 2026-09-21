const axios = require('axios');

async function getWeather(lat, lon) {
  const res = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
    params: { lat, lon, appid: process.env.OPENWEATHER_API_KEY, units: 'imperial' },
  });
  const temp = Math.round(res.data.main.temp);
  const outfit = temp < 50 ? 'bring a jacket' : 'light layers should be fine';
  return `${temp}°F — ${outfit}`;
}

async function geocode(query) {
  const res = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
    params: { address: query, key: process.env.GOOGLE_PLACES_API_KEY },
  });
  const loc = res.data.results[0]?.geometry?.location;
  return loc ? { lat: loc.lat, lon: loc.lng } : null;
}

async function getWeatherForPlace(query) {
  const coords = await geocode(query);
  if (!coords) return "Couldn't find that location — try a zip code or city name.";
  return getWeather(coords.lat, coords.lon);
}

module.exports = { getWeather, getWeatherForPlace };