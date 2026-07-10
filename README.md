### WhatsAppWP7
A fork of WojkalTech's WhatsApp webview client for Android 2.3+ that requires a self-hosted Node.js server to function.

check his original version, credits all to him: https://github.com/WojkalTech/WhatsAppLegacy
support group: https://t.me/W7Mobile

## Setup Guide (5~10 Minutes)
Here is how to make whatsapp work under the wtsppi (beta) app.

## Pre-requesties
- Nodejs (latest)
- Visual Studio Code (Recommended)

## Recommended Method: Self Host
# Step1:
1. Download latest release from this repo.
2. Create a directory on desktop, you can call whatever you want (for example: wawp7)
3. copy and paste the files to it.
4. open vscode, open folder, open the folder where you stores servers files mentioned in step 2.
5. type this in vscode cmd terminal: npm install whatsapp-web.js express qrcode-terminal
6. type this in vscode cmd terminal after install these: node server.js --host 0.0.0.0

# Step2 | Windows Phone side:
1. Install Wtspii.xap, included in this repo also, ensure your Windows Phone 7 device is jailbroken
2. Ensure your phone shares same wifi as your self hosted pc.
3. Opens Wtspii in your WP7, then, you should see 2 fields for logging in, one is phone, one is ip:port
4. On your PC, open cmd and type "ipconfig" to find your ip address
5. afterwards, on your phone, type your phone number withOUT a "+" symboal, example if your phone is +1 123-456-7890, it should be:
11234567890
6. for ip address field, type: <youripaddress>:3000
7. Go back to your pc, check terminal, there should be a # QRCode , which generated inside terminal, scan it.
8. done! now just go ahead and login in wp7 app side, and enjoy your whatsapp!

