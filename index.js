const express = require('express');
const twilio = require('twilio');
require('dotenv').config();

const app = express();
app.use(express.urlencoded({ extended: false }));

app.post('/sms', (req, res) => {
  const incomingMsg = req.body.Body;
  console.log('Received:', incomingMsg);

  const twiml = new twilio.twiml.MessagingResponse();
  twiml.message(`You said: ${incomingMsg}`);

  res.type('text/xml').send(twiml.toString());
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));