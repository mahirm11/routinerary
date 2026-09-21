const express = require('express');
const twilio = require('twilio');
const cron = require('node-cron');
const { loadStops } = require('./src/services/stops');
const { handleIncoming } = require('./src/handlers/handleIncoming');
const { sendMorningPush, sendScheduledPush } = require('./src/jobs/morningPush');
require('dotenv').config();

const app = express();
app.use(express.urlencoded({ extended: false }));

loadStops('./data/stops.txt');

app.post('/sms', async (req, res) => {
  const text = req.body.Body.trim();
  const from = req.body.From;
  console.log('Received:', text, 'from', from);

  const reply = await handleIncoming(text, from);
  const twiml = new twilio.twiml.MessagingResponse();
  if (reply) twiml.message(reply);
  res.type('text/xml').send(twiml.toString());
});

cron.schedule('* * * * *', () => { sendScheduledPush(); });
app.get('/trigger-morning-push', async (req, res) => {
  await sendMorningPush();
  res.send('Morning push sent.');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));