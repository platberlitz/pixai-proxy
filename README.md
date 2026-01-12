# PixAI Reverse Proxy

A simple proxy server that translates OpenAI-compatible image generation requests to PixAI's GraphQL API.

## Setup

```bash
git clone https://github.com/platberlitz/pixai-proxy.git
cd pixai-proxy
npm install
npm start
```

Server runs on port 3000 by default. Set `PORT` env var to change.

## Usage

**Endpoint:** `POST /v1/images/generations`

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

**Response:**
```json
{
  "data": [{ "url": "https://imagedelivery.net/..." }]
}
```

## Get PixAI API Key

1. Go to https://pixai.art
2. Sign in/create account
3. Go to Settings → API
4. Generate API key

## Deploy on Oracle Cloud Free VM

```bash
# Install Node.js
sudo apt update
sudo apt install -y nodejs npm

# Clone and run
git clone https://github.com/platberlitz/pixai-proxy.git
cd pixai-proxy
npm install

# Run with PM2 (recommended)
sudo npm install -g pm2
pm2 start server.js --name pixai-proxy
pm2 save
pm2 startup

# Or run directly
PORT=3000 node server.js
```

Open port 3000 in Oracle Cloud security list/firewall.

## Use with SillyTavern Quick Image Gen

- Provider: Reverse Proxy
- URL: `http://YOUR_VM_IP:3000/v1/images/generations`
- API Key: Your PixAI API key
- Model: PixAI model ID (optional)
