const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const qrcode = require('qrcode-terminal');

const app = express();
const port = process.env.PORT || 3000;

let isConnected = false;
let lastQRCode = '';

// Add CORS headers
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// REMOVED the problematic line: app.options('*', ...)

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: false,
        handleSIGINT: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    }
});

// Show QR code in terminal
client.on('qr', (qr) => {
    lastQRCode = qr;
    console.log('\n========== SCAN THIS QR CODE ==========');
    console.log('📱 Open WhatsApp → Settings → Linked Devices');
    console.log('📷 Scan the QR code below:');
    console.log('');
    qrcode.generate(qr, { small: true });
    console.log('');
    console.log('========================================\n');
});

client.on('ready', () => {
    console.log('✅ WhatsApp Client is ready!');
    isConnected = true;
});

client.on('authenticated', () => {
    console.log('✅ Authenticated successfully');
});

client.on('auth_failure', () => {
    console.error('❌ Authentication failed');
    isConnected = false;
});

client.on('disconnected', () => {
    console.log('⚠️ Client disconnected');
    isConnected = false;
});

client.initialize();

app.get('/status', (req, res) => {
    res.json({ success: true, loggedIn: isConnected });
});

app.get('/get-code', async (req, res) => {
    const phoneNumber = req.query.phone;
    if (!phoneNumber) {
        return res.json({ success: false, error: "Phone number required" });
    }

    try {
        if (isConnected) {
            return res.json({ success: true, pairingCode: "CONNECTED" });
        }

        console.log('📱 Requesting pairing code for:', phoneNumber);
        const code = await client.requestPairingCode(phoneNumber);
        console.log('🔑 Pairing code generated:', code);
        console.log('📲 Enter this code in WhatsApp: Settings → Linked Devices → Link with phone number');
        
        // Format the code with hyphens for readability
        let formattedCode = code;
        if (code && code.length === 8 && !code.includes('-')) {
            formattedCode = code.substring(0, 3) + '-' + code.substring(3, 6) + '-' + code.substring(6);
        }
        
        res.json({ success: true, pairingCode: formattedCode });
    } catch (err) {
        console.error('❌ Error generating pairing code:', err);
        res.json({ success: false, error: err.message });
    }
});

app.get('/get-qr', (req, res) => {
    if (lastQRCode) {
        res.json({ success: true, qrCode: lastQRCode });
    } else {
        res.json({ success: false, error: "No QR code available" });
    }
});

app.get('/get-chats', async (req, res) => {
    try {
        if (!isConnected) {
            return res.json({ success: false, error: "Client not connected" });
        }

        const chats = await client.getChats();
        const formattedChats = chats.slice(0, 20).map(chat => {
            let lastMsgText = chat.lastMessage ? chat.lastMessage.body : "";
            if (chat.lastMessage && chat.lastMessage.hasMedia) {
                lastMsgText = "[Media]";
            }

            if (lastMsgText) {
                lastMsgText = lastMsgText.replace(/[^\x00-\x7F\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF]/g, "");
            }

            return {
                id: chat.id._serialized,
                name: chat.name || "Unknown",
                lastMessage: lastMsgText || ""
            };
        });

        res.json({ success: true, chats: formattedChats });
    } catch (err) {
        console.error('❌ Error getting chats:', err);
        res.json({ success: false, error: err.message });
    }
});

app.get('/get-messages', async (req, res) => {
    try {
        const chatId = req.query.id;
        if (!chatId) {
            return res.json({ success: false, error: "Chat ID required" });
        }

        const chat = await client.getChatById(chatId);
        const messages = await chat.fetchMessages({ limit: 25 });

        const formattedMessages = messages.map(msg => {
            let bodyText = msg.body;

            if (msg.hasMedia) {
                switch (msg.type) {
                    case 'image':
                        bodyText = "[Photo]";
                        break;
                    case 'video':
                        bodyText = "[Video]";
                        break;
                    case 'audio':
                    case 'ptt':
                        bodyText = "[Recording]";
                        break;
                    case 'document':
                        bodyText = "[Document]";
                        break;
                    case 'sticker':
                        bodyText = "[Sticker]";
                        break;
                    default:
                        bodyText = "[Media]";
                }
            } else {
                switch (msg.type) {
                    case 'location':
                        bodyText = "[Location]";
                        break;
                    case 'vcard':
                        bodyText = "[Contact]";
                        break;
                    case 'revoked':
                        bodyText = "This message was deleted";
                        break;
                }
            }

            if (bodyText) {
                bodyText = bodyText.replace(/[^\x00-\x7F\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF]/g, "");
                if (bodyText.trim() === "") {
                    bodyText = "[Unsupported Character]";
                }
            } else {
                bodyText = "...";
            }

            return {
                id: msg.id._serialized,
                body: bodyText,
                fromMe: msg.fromMe,
                timestamp: msg.timestamp
            };
        });

        res.json({ success: true, messages: formattedMessages });

    } catch (error) {
        console.error('❌ Error getting messages:', error);
        res.json({ success: false, error: error.message });
    }
});

app.get('/send-message', async (req, res) => {
    try {
        const chatId = req.query.id;
        const messageText = req.query.text;

        if (!chatId || !messageText) {
            return res.json({ success: false, error: "Chat ID and text required" });
        }

        if (!isConnected) {
            return res.json({ success: false, error: "Client not connected" });
        }

        await client.sendMessage(chatId, messageText);
        res.json({ success: true });

    } catch (error) {
        console.error('❌ Error sending message:', error);
        res.json({ success: false, error: error.message });
    }
});

app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${port}`);
    console.log(`📱 Access from WP7: http://YOUR_IP:${port}`);
    console.log('');
    console.log('💡 Two ways to connect:');
    console.log('1. QR Code: Scan the QR code shown in terminal');
    console.log('2. Pairing Code: Request through the app');
    console.log('');
});