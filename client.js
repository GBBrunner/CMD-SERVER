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
      res.send('ACK');
    });

    // Broadcast receiver
    app.post('/m/:userID', (req, res) => {
      const { from, msg } = req.body;
      console.log(`\n[MESSAGE] User ${from}: ${msg}`);
      rl.prompt();
      res.send('ACK');
    });

    app.listen(port, () => {
      console.log(`Welcome, User ${myID} (Port ${port})`);
      console.log(`Usage: w [id] [message]`);
      rl.prompt();
    });

    // 3. Handle Interactive Input
    rl.on('line', async (line) => {
      const parts = line.trim().split(' ');
      const [cmd, target, ...msgParts] = parts;
      const msg = msgParts.join(' ');

      if (cmd === 'w' && target && msg) {
        try {
          const res = await fetch('http://localhost:4000/w', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userID: target, from: myID, msg: msg })
          });
          const status = await res.text();
          console.log(`Status: ${status}`);
        } catch (e) {
          console.log('Error: Server unreachable.');
        }
      } else if (cmd === 'm' && msg) {
        try {
          const res = await fetch('http://localhost:4000/m', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ from: myID, msg })
          });
          const status = await res.text();
          console.log(`Status: ${status}`);
        } catch (e) {
          console.log('Error: Server unreachable.');
        }
      } else if (line === 'exit') {
        process.exit(0);
      } else {
        console.log('Invalid command. Use: w [id] [message]');
      }
      rl.prompt();
    });

  } catch (e) {
    console.error('Failed to connect to central server.');
    process.exit(1);
  }
}

init();