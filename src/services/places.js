const axios = require('axios');

async function findPlace(query, biasLat, biasLon) {
  const res = await axios.get(
    'https://maps.googleapis.com/maps/api/place/textsearch/json',
    {
      params: {
        query,
        location: `${biasLat},${biasLon}`,
        radius: 8000,
        key: process.env.GOOGLE_PLACES_API_KEY,
      },
    }
  );
  console.log('Places API status:', res.data.status, res.data.error_message || '');
  return res.data.results.slice(0, 3);
}

module.exports = { findPlace };