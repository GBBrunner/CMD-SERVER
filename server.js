const express = require('express');
const app = express();
const port = 4000;
app.use(express.json());
app.get('/', (req, res) => {
  res.send(`<!doctype html>
  <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <title>SERVER</title>
      <style>
        html,body{height:100%;margin:0}
        body{background:navy;color:#fff;display:flex;align-items:center;justify-content:center;font-family:Arial,Helvetica,sans-serif}
      </style>
    </head>
    <body>
      <h1>SERVER SIDE</h1>
    </body>
  </html>`);
});
app.post('/w', async (req, res) => {
  console.log('POST /w', req.body);
  const { userID, msg, from } = req.body || {};
  if (!userID) return res.status(400).send('Missing userID');
  const targetUrl = `http://localhost:3000/w/${userID}`;
  try {
    const forwardRes = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, msg })
    });
    const text = await forwardRes.text();
    res.send(`Forwarded to client: ${text}`);
  } catch (err) {
    console.error('Error forwarding to client', err);
    res.status(500).send('Error forwarding to client');
  }
});
app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});