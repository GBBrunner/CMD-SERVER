const express = require('express');
const app = express();
const port = 4000;

app.use(express.json());
let nextUserID = 1;

function commandHelperFunction(command, getRecipientIDs) {
  app.post(`/${command}`, async (req, res) => {
    const { userID, msg, from } = req.body;
    
    if (!from || !msg) {
      return res.status(400).send('Missing required fields: from, msg');
    }
    const recipientIDs = getRecipientIDs({ userID, from, nextUserID });

    if (!Array.isArray(recipientIDs) || recipientIDs.length === 0) {
      return res.status(400).send('No recipients');
    }

    const forwardTo = (id) => {
      const targetUrl = `http://localhost:${3000 + id}/${command}/${id}`;
      return fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, msg })
      });
    };

    if (recipientIDs.length === 1) {
      try {
        const response = await forwardTo(recipientIDs[0]);
        return res.send(await response.text());
      } catch {
        return res.status(404).send(`User ${recipientIDs[0]} is offline.`);
      }
    }

    await Promise.allSettled(recipientIDs.map(forwardTo));
    res.send('OK');
  });
}

app.get('/register', (req, res) => {
  const assignedID = nextUserID++;
  res.json({ userID: assignedID });
});

commandHelperFunction('w', ({ userID }) => {
  const targetID = Number(userID);
  if (Number.isNaN(targetID)) return [];
  return [targetID];
});

commandHelperFunction('m', ({ from, nextUserID }) => {
  const ids = [];
  for (let id = 1; id < nextUserID; id++) {
    if (String(id) !== String(from)) {
      ids.push(id);
    }
  }
  return ids;
});

app.listen(port, () => {console.log(`Server running on port ${port}`);});