# PixAI Reverse Proxy

A proxy server that translates OpenAI-compatible image generation requests to PixAI's REST API.

## Why a Proxy?

PixAI doesn't offer a standard OpenAI-compatible `/v1/images/generations` endpoint. Their API uses a task-based system where you:
1. Create a task
2. Poll for completion
3. Retrieve the image URLs

This proxy handles all of that complexity and exposes a simple OpenAI-compatible endpoint that works with tools like [SillyTavern Quick Image Gen](https://github.com/platberlitz/sillytavern-image-gen).

## Features

- 🔐 Login-protected web dashboard
- 🎨 Built-in image generation UI with style presets
- 🔌 OpenAI-compatible API endpoint for external tools
- 🎭 LoRA support
- 👤 Face fix (ADetailer) option
- 📱 Mobile-friendly interface
- 💾 Settings persist in browser

## Setup

```bash
git clone https://github.com/platberlitz/pixai-proxy.git
cd pixai-proxy
npm install
npm start
```

## Configuration

Set environment variables (optional):

```bash
export ADMIN_USER=myusername
export ADMIN_PASS=mypassword
export SESSION_SECRET=random-secret-string
export PORT=3000
```

Default login: `admin` / `admin` (change this in production!)

## Web UI

Visit `http://localhost:3000` to access the dashboard:
- Enter your PixAI API key (saved in browser)
- Write prompts and generate images
- Add LoRAs by ID
- Enable face fix
- Choose resolution and batch size
- Download generated images

## API Endpoint

`POST /v1/images/generations` or `POST /v1`

**Headers:**
- `Authorization: Bearer YOUR_PIXAI_API_KEY`

**Body:**
```json
{
  "prompt": "1girl, anime style, masterpiece",
  "negative_prompt": "bad quality, blurry",
  "width": 512,
  "height": 768,
  "model": "1648918127446573124",
  "n": 4,
  "loras": [{"id": "1744880666293972790", "weight": 0.7}],
  "facefix": true
}
```

**Response:**
```json
{
  "data": [
    {"url": "https://..."},
    {"url": "https://..."}
  ]
}
```

## Use with SillyTavern

This proxy is designed to work with [SillyTavern Quick Image Gen](https://github.com/platberlitz/sillytavern-image-gen):

1. Install the ST extension
2. Select **Reverse Proxy** as provider
3. Set Proxy URL to `https://your-proxy-url.com/v1`
4. Enter your PixAI API key
5. Enter a PixAI model ID
6. Optionally add LoRAs and enable face fix

## Get PixAI API Key

1. Go to https://pixai.art/en/profile/edit/api
2. Sign in if needed
3. Generate API key

## Get Model/LoRA IDs

1. Browse models at https://pixai.art/model
2. Click on a model, then select a version
3. The ID is the last number in the URL

Example: `https://pixai.art/model/123/456` → Model ID is `456`

## License

MIT
