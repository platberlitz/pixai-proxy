# PixAI Reverse Proxy

A proxy server that translates OpenAI-compatible image generation requests to PixAI's REST API.

## Why a Proxy?

PixAI doesn't offer a standard OpenAI-compatible API. Their system requires:
1. Creating a task
2. Polling for completion
3. Retrieving image URLs

This proxy handles all that complexity and exposes a simple endpoint that works with tools like [SillyTavern Quick Image Gen](https://github.com/platberlitz/sillytavern-image-gen).

## Features

### Web Dashboard
- 🔐 **Login Protected** - Configurable username/password
- 🎨 **Built-in Image Generator** - Full-featured UI
- 💾 **Persistent Settings** - Saved in browser localStorage
- 📱 **Mobile Friendly** - Responsive design

### Generation Options
- 🖼️ **Batch Generation** - Generate 1, 2, or 4 images at once
- 📐 **Resolution Presets** - Common sizes from 512x512 to 1024x1024
- 🎭 **LoRA Support** - Add multiple LoRAs with weights
- 👤 **Face Fix** - ADetailer for better faces
- ⬆️ **Upscale/Hires** - 1.5x or 2x with configurable denoise
- 🎛️ **ControlNet Tile** - Enhanced detail during upscale
- ⚙️ **Full Control** - Steps, CFG, Sampler, Seed
- 🎨 **Style Presets** - Anime, Realistic, Cartoon, etc.

### API Endpoint
- 🔌 **OpenAI Compatible** - Works with any tool expecting `/v1/images/generations`
- 🔗 **Flexible URLs** - Accepts both `/v1` and `/v1/images/generations`
- 🌐 **CORS Enabled** - Works from browser-based tools

---

## Setup

```bash
git clone https://github.com/platberlitz/pixai-proxy.git
cd pixai-proxy
npm install
npm start
```

## Configuration

Environment variables (optional):

```bash
export ADMIN_USER=myusername    # Default: admin
export ADMIN_PASS=mypassword    # Default: admin
export SESSION_SECRET=random-string
export PORT=3000
```

---

## Web Dashboard

Visit `http://localhost:3000` after starting:

1. Login with your credentials
2. Enter your PixAI API key (saved in browser)
3. Configure generation settings
4. Click Generate!

### Dashboard Settings

| Setting | Description |
|---------|-------------|
| API Key | Your PixAI API key |
| Prompt | What to generate (quality tags pre-filled) |
| Negative Prompt | What to avoid (defaults pre-filled) |
| LoRAs | Format: `id:weight, id:weight` |
| Resolution | Preset sizes or custom |
| Count | 1, 2, or 4 images |
| Model ID | PixAI model version ID |
| Sampler | Euler a, DPM++ 2M Karras, etc. |
| Steps | 8-50 |
| CFG Scale | 1-15 |
| Seed | -1 for random |
| Upscale | None, 1.5x, or 2x |
| Face Fix | Enable ADetailer |
| ControlNet Tile | Enhanced upscale detail |

---

## API Usage

### Endpoint

`POST /v1/images/generations` or `POST /v1`

### Headers

```
Authorization: Bearer YOUR_PIXAI_API_KEY
Content-Type: application/json
```

### Request Body

```json
{
  "prompt": "1girl, anime style, masterpiece",
  "negative_prompt": "bad quality, blurry",
  "width": 768,
  "height": 1024,
  "model": "1648918127446573124",
  "n": 4,
  "steps": 25,
  "cfg_scale": 6,
  "sampler": "Euler a",
  "seed": 12345,
  "loras": [{"id": "1744880666293972790", "weight": 0.7}],
  "facefix": true,
  "upscale": 1.5,
  "upscaleDenoise": 0.6,
  "tile": true
}
```

### Response

```json
{
  "data": [
    {"url": "https://..."},
    {"url": "https://..."}
  ]
}
```

---

## Use with SillyTavern

This proxy works with [SillyTavern Quick Image Gen](https://github.com/platberlitz/sillytavern-image-gen):

1. Install the ST extension
2. Select **Reverse Proxy** as provider
3. Set Proxy URL to `https://your-proxy.com/v1`
4. Enter your PixAI API key
5. Enter a model ID
6. Configure LoRAs, steps, CFG, etc.
7. Generate!

---

## Get PixAI API Key

1. Go to https://pixai.art/en/profile/edit/api
2. Sign in if needed
3. Generate API key

## Get Model/LoRA IDs

1. Browse models at https://pixai.art/model
2. Click a model, then select a version
3. The ID is the last number in the URL

Example: `https://pixai.art/model/123/456` → Model ID is `456`

---

## License

MIT
