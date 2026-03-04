const express = require('express');
const app = express();
const port = 4000;
app.use(express.json());
let nextUserID = 1;

function commandHelperFunction(command){
  app.post(`/${command}`, (req, res) => {
    const targetPort = 3000 + id;

  });
}
app.get('/register', (req, res) => {
  const assignedID = nextUserID++;
  res.json({ userID: assignedID });
});

app.post('/w', async (req, res) => {
  const { userID, msg, from } = req.body || {};
  const targetPort = 3000 + parseInt(userID);
  const targetUrl = `http://localhost:${targetPort}/w/${userID}`;

  try {
    const forwardRes = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, msg })
    });
    res.send(await forwardRes.text());
  } catch (err) {
    res.status(404).send(`User ${userID} is offline.`);
  }
});

// Broadcast message to all registered clients (except sender)
app.post('/m', async (req, res) => {
  const { from, msg } = req.body || {};
  const results = [];

  // iterate over assigned IDs (1 .. nextUserID-1)
  const promises = [];
  for (let id = 1; id < nextUserID; id++) {
    if (String(id) === String(from)) continue; // skip sender
    const targetPort = 3000 + id;
    const targetUrl = `http://localhost:${targetPort}/m/${id}`;
    const p = fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, msg })
    })
      .then(r => ({ id, ok: r.ok }))
      .catch(() => ({ id, ok: false }));
    promises.push(p);
  }

  const settled = await Promise.all(promises);
  const failed = settled.filter(s => !s.ok).map(s => s.id);
  if (failed.length === 0) {
    res.send('Broadcast delivered');
  } else {
    res.status(206).send(`Broadcast partial: failed to deliver to ${failed.join(',')}`);
  }
});

app.listen(port, () => console.log(`Server running on port ${port}`));