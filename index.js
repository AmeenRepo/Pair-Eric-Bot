const express = require('express');
const bodyParser = require('body-parser');
const { makeWASocket, useSingleFileAuthState, generateWAMessageFromContent, proto } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

let phoneNumber;
const sessionFile = './auth_info.json';
const { state, saveState } = useSingleFileAuthState(sessionFile);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.post('/generate-code', async (req, res) => {
    phoneNumber = req.body.phoneNumber;

    const sock = makeWASocket({
        auth: state
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, qr } = update;
        if (qr) {
            const pairingCode = Math.random().toString().slice(-8);
            console.log(`Pairing code: ${pairingCode}`);
            res.send(`Pairing code generated: ${pairingCode}`);
        } else if (connection === 'open') {
            console.log('Connected to WhatsApp');
            const creds = fs.readFileSync(sessionFile, 'utf8');
            sock.sendMessage(`${phoneNumber}@s.whatsapp.net`, { text: `Here is your creds.json file:\n\`\`\`${creds}\`\`\`` });
            console.log('creds.json sent to your WhatsApp');
        }
    });

    sock.ev.on('creds.update', saveState);
});

app.listen(process.env.PORT || 3000, () => {
    console.log('Server is running on port 3000');
});
