require('dotenv').config();
const express = require('express');
const app = express();
const port = 4000;

app.use(express.json());
let nextUserID = 1;

// username state
const usernamesById = {};     // id -> username
const idsByUsername = {};     // username -> id

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
  const idKey = String(assignedID);
  const defaultName = `User${assignedID}`;

  // initialise default username based on ID
  usernamesById[idKey] = defaultName;
  idsByUsername[defaultName] = idKey;

  res.json({ userID: assignedID });
});

// w: whisper to a single user, by id or username
commandHelperFunction('w', ({ userID }) => {
  if (!userID) return [];

  const numeric = Number(userID);
  if (!Number.isNaN(numeric)) {
    return [numeric];
  }

  const resolved = idsByUsername[userID];
  if (!resolved) return [];
  return [Number(resolved)];
});

// m: message all users except sender
commandHelperFunction('m', ({ from, nextUserID }) => {
  const ids = [];
  for (let id = 1; id < nextUserID; id++) {
    if (String(id) !== String(from)) {
      ids.push(id);
    }
  }
  return ids;
});

// username: get or set your username
app.post('/username', (req, res) => {
  const { from, msg } = req.body || {};

  if (!from) {
    return res.status(400).send('Missing user id');
  }

  const idKey = String(from);
  const proposed = (msg || '').trim();

  // No value: show current username
  if (!proposed) {
    const current = usernamesById[idKey];
    if (!current) {
      return res.send('No username set');
    }
    return res.send(`Your username is ${current}`);
  }

  // Check if username already taken by another user
  const existingOwner = idsByUsername[proposed];
  if (existingOwner && String(existingOwner) !== idKey) {
    return res.status(400).send('Username already taken');
  }

  // Update mappings
  const old = usernamesById[idKey];
  if (old && old !== proposed) {
    delete idsByUsername[old];
  }

  usernamesById[idKey] = proposed;
  idsByUsername[proposed] = idKey;

  return res.send(`Username set to ${proposed}`);
});

// clientlist: list all registered client usernames
app.get('/clientlist', (req, res) => {
  const names = [];
  for (let id = 1; id < nextUserID; id++) {
    const idKey = String(id);
    const name = usernamesById[idKey] || `User${id}`;
    names.push(name);
  }
  if (names.length === 0) {
    return res.send('No clients.');
  }
  res.send(names.join('\n'));
});
app.post('/kick', (req, res) => {
  const { userID, msg, from, reason } = req.body || {};
  if (!from || !msg || !userID) {
    return res.status(400).send('Missing required fields: from, msg, userID');
  }

  if (msg !== process.env.ADMIN_PASSWORD) {
    return res.status(403).send('Incorrect admin password.');
  }

  // Resolve numeric id from either numeric id or username
  let numeric = Number(userID);
  if (Number.isNaN(numeric)) {
    const resolved = idsByUsername[userID];
    if (!resolved) return res.status(404).send('User not found');
    numeric = Number(resolved);
  }

  const targetId = numeric;
  const targetUrl = `http://localhost:${3000 + targetId}/kick/${targetId}`;

  fetch(targetUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, reason })
  })
    .then(async (r) => {
      const text = await r.text();
      return res.send(text || 'User kicked successfully.');
    })
    .catch(() => {
      return res.status(404).send(`User ${targetId} is offline or unreachable.`);
    });
});
app.listen(port, () => {console.log(`Server running on port ${port}`);});