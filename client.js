const express = require('express');
const readline = require('node:readline');
const app = express();
app.use(express.json());

let myID = null;

async function serverRequest(path, method = 'GET', body = null) {
  try {
    const url = `http://localhost:4000${path}`;
    const options = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) options.body = JSON.stringify(body);
    const res = await fetch(url, options);
    return await res.text();
  } catch (e) {
    throw new Error('Server unreachable.');
  }
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '> '
});

async function runClient() {
  try {
    // 1. Register with the central server
    const response = await fetch('http://localhost:4000/register');
    const data = await response.json();
    myID = data.userID;
    const port = 3000 + myID;

    // Privatly whisper to a single user, by id or username
    app.post('/w/:userID', (req, res) => {
      const { from, msg } = req.body;
      console.log(`\n[WHISPER] User ${from}: ${msg}`);
      rl.prompt(); // Keep the prompt visible
      res.send('ok');
    });

    // Send a message to all clients connected
    app.post('/m/:userID', (req, res) => {
      const { from, msg } = req.body;
      console.log(`\n[MESSAGE] User ${from}: ${msg}`);
      rl.prompt();
      res.send('ok');
    });

    // Handle server-initiated kick
    app.post('/kick/:userID', (req, res) => {
      const { from, reason } = req.body || {};
      console.log(`\n[KICK] You were kicked by User ${from}${reason ? `: ${reason}` : ''} Exiting...`);
      res.send('kicked');
      process.exit(0);
    });
    // Port is 3000 + userID, so we can have multiple clients on the same machine
    app.listen(port, () => {
      console.log(`Welcome, User ${myID} (Port ${port})`);
      rl.prompt();
    });

    // 3. Handle Interactive Input
    rl.on('line', async (line) => {
      const parts = line.trim().split(' ').filter(Boolean);
      const [cmd, ...rest] = parts;
      const invalidMsg = 'Invalid command, do /help for command list';

      if (cmd === '/help') {
        console.log('Commands:');
        console.log('  w [id] [message]   Whisper a user');
        console.log('  m [message]        Message all users');
        console.log('  username [name]    Get or set your username');
        console.log('  clientlist         List all client usernames');
        console.log('  exit               Quit');
        console.log('  kick [id] [admin password] Kick a user (admin only)');
        rl.prompt();
        return;
      }

      if (cmd === 'w') {
        // Take the first word as the recipient, and the rest as the message
        const target = rest[0];
        const msg = rest.slice(1).join(' ');
        if (!target || !msg) {
          console.log(invalidMsg);
          rl.prompt();
          return;
        }
        try {
          const status = await serverRequest('/w', 'POST', { userID: target, from: myID, msg: msg });
          console.log(`Status: ${status}`);
        } catch (e) {
          console.error('Error: Server unreachable.');
        }
      } else if (cmd === 'm') {
        const msg = rest.join(' ');
        if (!msg) {
          console.error(invalidMsg);
          rl.prompt();
          return;
        }
        try {
          const status = await serverRequest('/m', 'POST', { from: myID, msg });
          console.log(`Status: ${status}`);
        } catch (e) {
          console.error('Error: Server unreachable.');
        }
      } else if (cmd === 'kick') {
        const target = rest[0];
        const password = rest[1];
        const kickMsg = rest.slice(2).join(' ') || '';
        if (!target || !password) {
          console.error(invalidMsg);
          rl.prompt();
          return;
        }
        try {
          const status = await serverRequest('/kick', 'POST', { userID: target, from: myID, msg: password, reason: kickMsg });
          console.log(`Status: ${status}`);
        } catch (e) {
          console.error('Error: Server unreachable.');
        }
      } else if (cmd === 'username') {
        const newName = rest.join(' ').trim();
        try {
          const body = newName
            ? { from: myID, msg: newName }
            : { from: myID };

          const text = await serverRequest('/username', 'POST', body);
          console.log(text);
        } catch (e) {
          console.error('Error: Server unreachable.');
        }
      } else if (cmd === 'clientlist') {
        try {
          const text = await serverRequest('/clientlist');
          console.log(text);
        } catch (e) {
          console.error('Error: Server unreachable.');
        }
      } else if (line === 'exit') {
        process.exit(0);
      } else {
        console.error(invalidMsg);
      }
      rl.prompt();
    });

  } catch (e) {
    console.error('Failed to connect to central server.');
    process.exit(1);
  }
}

runClient();