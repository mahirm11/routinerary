const twilio = require('twilio');
const { getWeather } = require('../services/weather');
const { getNextArrivals, formatArrivals } = require('../services/transit');
const { getAllHomeFavorites, getHomeFavoritesForTime } = require('../services/favorites');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function pushToUsers(users) {
  console.log(`Morning push: sending to ${users.length} user(s)`);
  for (const user of users) {
    try {
      const forecast = await getWeather(user.lat, user.lon);
      const arrivals = await getNextArrivals(user.stop_id);
      const transitMsg = formatArrivals(arrivals, user.stop_name);
      const message = `Good morning! ${forecast}\n${transitMsg}`;
      await client.messages.create({ body: message, from: process.env.TWILIO_PHONE_NUMBER, to: user.phone });
      console.log(`Sent morning push to ${user.phone}`);
    } catch (err) {
      console.error(`Failed to send to ${user.phone}:`, err.message);
    }
  }
}

async function sendMorningPush() {
  await pushToUsers(getAllHomeFavorites());
}

async function sendScheduledPush() {
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  await pushToUsers(getHomeFavoritesForTime(time));
}

module.exports = { sendMorningPush, sendScheduledPush };
