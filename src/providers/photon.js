const { Spectrum } = require('spectrum-ts');
const { imessage } = require('spectrum-ts/providers/imessage');
const { loadStops } = require('../services/stops'); // adjust path if needed
const { handleIncoming } = require('../handlers/handleIncoming');
require('dotenv').config();

async function start() {
  loadStops('./data/stops.txt'); // if not already loaded elsewhere

  const app = await Spectrum({
    projectId: process.env.SPECTRUM_PROJECT_ID,
    projectSecret: process.env.SPECTRUM_PROJECT_SECRET,
    providers: [imessage.config()],
  });

  for await (const [space, message] of app.messages) {
    if (message.direction === 'outbound') continue;
    if (message.content.type !== 'text') continue;
    const reply = await handleIncoming(message.content.text, message.sender?.id || 'unknown');
    if (reply) await space.send(reply);
  }
}

start();