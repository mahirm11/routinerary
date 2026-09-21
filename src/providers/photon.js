const { Spectrum } = require('spectrum-ts');
const { imessage } = require('spectrum-ts/providers/imessage');
require('dotenv').config();

async function start() {
  const app = await Spectrum({
    projectId: process.env.SPECTRUM_PROJECT_ID,
    projectSecret: process.env.SPECTRUM_PROJECT_SECRET,
    providers: [imessage.config()],
  });

  for await (const [space, message] of app.messages) {
    if (message.direction === 'outbound') continue;
    if (message.content.type === 'text') {
      await space.send(`echo: ${message.content.text}`);
    }
  }
}

start();