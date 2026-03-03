const express = require('express');
const app = express();
app.use(express.json());
let nextUserID = 1;
const port = 3000 + nextUserID;
app.get('/', (req, res) => {
  const userID = nextUserID++;
  res.set('X-User-ID', String(userID));
  res.send(`<!doctype html>
  <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <title>CLIENT</title>
      <style>
        html,body{height:100%;margin:0}
        body{background:darkcyan;color:#fff;display:flex;align-items:center;justify-content:center;font-family:Arial,Helvetica,sans-serif}
      </style>
    </head>
    <body>
      <h1>CLIENT SIDE — ID: ${userID}</h1>
    </body>
  </html>`);
});
app.post('/w/:userID', (req, res) => {
  console.log('POST /w', req.params.userID, req.body);
  const { from, msg } = req.body || {};
  console.log(`Whisper to ${req.params.userID} from ${from}: ${msg}`);
  res.send('POST /w received');
});

app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});