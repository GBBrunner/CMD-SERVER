const express = require('express');
const readline = require('node:readline');
const app = express();
app.use(express.json());

let myID = null;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '> '
});

async function init() {
  try {
    // 1. Register with the central server
    const response = await fetch('http://localhost:4000/register');
    const data = await response.json();
    myID = data.userID;
    const port = 3000 + myID;

    // 2. Setup message receiver
    app.post('/w/:userID', (req, res) => {
      const { from, msg } = req.body;
      console.log(`\n[WHISPER] User ${from}: ${msg}`);
      rl.prompt(); // Keep the prompt visible
      res.send('ok');
    });

    // Broadcast receiver
    app.post('/m/:userID', (req, res) => {
      const { from, msg } = req.body;
      console.log(`\n[MESSAGE] User ${from}: ${msg}`);
      rl.prompt();
      res.send('ok');
    });

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
        console.log('  exit               Quit');
        rl.prompt();
        return;
      }

      if (cmd === 'w') {
        const target = rest[0];
        const msg = rest.slice(1).join(' ');
        if (!target || !msg) {
          console.log(invalidMsg);
          rl.prompt();
          return;
        }
        try {
          const res = await fetch('http://localhost:4000/w', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userID: target, from: myID, msg: msg })
          });
          const status = await res.text();
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
          const res = await fetch('http://localhost:4000/m', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ from: myID, msg })
          });
          const status = await res.text();
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

          const res = await fetch('http://localhost:4000/username', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          });
          const text = await res.text();
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

init();