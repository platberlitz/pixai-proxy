# PixAI Reverse Proxy

A proxy server with web UI that translates OpenAI-compatible image generation requests to PixAI's GraphQL API.

## Features

- 🔐 Login-protected web dashboard
- 🎨 Built-in image generation UI with style presets
- 🔌 OpenAI-compatible API endpoint for external tools
- 📱 Mobile-friendly interface

## Setup

```bash
git clone https://github.com/platberlitz/pixai-proxy.git
cd pixai-proxy
npm install
npm start
```

## Configuration

Set environment variables:

```bash
export ADMIN_USER=myusername
export ADMIN_PASS=mypassword
export SESSION_SECRET=random-secret-string
export PORT=3000
```

Default login: `admin` / `admin` (change this!)

## Web UI

Visit `http://localhost:3000` to access the dashboard:
- Enter your PixAI API key
- Write prompts and generate images
- Choose from style presets
- Download generated images

## API Endpoint

`POST /v1/images/generations`

**Headers:**
- `Authorization: Bearer YOUR_PIXAI_API_KEY`

**Body:**
```json
{
  "prompt": "a cute anime girl",
  "negative_prompt": "bad quality",
  "width": 512,
  "height": 512,
  "model": "1648918127446573124"
}
```

## Deploy on Oracle Cloud Free VM

```bash
# Install Node.js
sudo apt update
sudo apt install -y nodejs npm

# Clone and setup
git clone https://github.com/platberlitz/pixai-proxy.git
cd pixai-proxy
npm install

# Set credentials
export ADMIN_USER=yourusername
export ADMIN_PASS=yourpassword
export SESSION_SECRET=$(openssl rand -hex 32)

# Run with PM2
sudo npm install -g pm2
pm2 start server.js --name pixai-proxy
pm2 save
pm2 startup
```

Open port 3000 in Oracle Cloud security list.

## Use with SillyTavern Quick Image Gen

- Provider: Reverse Proxy
- URL: `http://YOUR_VM_IP:3000/v1/images/generations`
- API Key: Your PixAI API key
