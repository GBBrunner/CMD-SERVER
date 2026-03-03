const express = require('express');
const app = express();
const port = 4000;
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
app.post('/w' , (req, res) => {
  console.log('POST /w');
  res.send('POST /w');
});
app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});