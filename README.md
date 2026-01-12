# PixAI Reverse Proxy

Proxy server translating OpenAI-compatible requests to PixAI's REST API. Includes full-featured web dashboard.

## Why a Proxy?

PixAI uses a task-based API (create task → poll → get results). This proxy handles that complexity and exposes a simple OpenAI-compatible endpoint.

## Features

### Web Dashboard
- 🔐 **Login Protected** - Configurable credentials
- 📑 **Tabbed Interface** - Generate, Queue, History, Favorites, Presets
- 💾 **Persistent Settings** - Saved in localStorage
- 📱 **Mobile Friendly**

### Generation
- 🖼️ **Batch Generation** - 1, 2, or 4 images
- 📐 **Resolution Presets** - 512x512 to 1024x1024
- 🎭 **LoRA Support** - Multiple LoRAs with weights
- 👤 **Face Fix** - ADetailer
- ⬆️ **Upscale** - 1.5x or 2x hires fix
- 🎛️ **ControlNet Tile** - Enhanced upscale detail
- ⚙️ **Full Control** - Steps, CFG, Sampler, Seed
- 🖼️ **Img2Img** - Transform existing images

### Organization
- 📜 **Image History** - Last 50 images
- ⭐ **Favorite Prompts** - Save/load prompts
- 💾 **Model Presets** - Save model + LoRA + settings combos
- 📋 **Generation Queue** - Queue multiple jobs
- 💰 **Cost Tracking** - Estimated credit usage

### API
- 🔌 **OpenAI Compatible** - `/v1/images/generations` or `/v1`
- 🌐 **CORS Enabled** - Works from browsers

---

## Setup

```bash
git clone https://github.com/platberlitz/pixai-proxy.git
cd pixai-proxy
npm install
npm start
```

**Environment variables:**
```bash
ADMIN_USER=myuser      # Default: admin
ADMIN_PASS=mypass      # Default: admin
PORT=3000
```

---

## API

`POST /v1` or `POST /v1/images/generations`

```json
{
  "prompt": "1girl, masterpiece",
  "negative_prompt": "bad quality",
  "width": 768,
  "height": 1024,
  "model": "1648918127446573124",
  "n": 4,
  "steps": 25,
  "cfg_scale": 6,
  "sampler": "Euler a",
  "seed": -1,
  "loras": [{"id": "123", "weight": 0.7}],
  "facefix": true,
  "upscale": 1.5,
  "image_url": "https://...",
  "strength": 0.7
}
```

---

## Use with SillyTavern

Works with [SillyTavern Quick Image Gen](https://github.com/platberlitz/sillytavern-image-gen):

1. Install the ST extension
2. Select **Reverse Proxy**
3. Set URL to `https://your-proxy.com/v1`
4. Enter PixAI API key and model ID

---

## Get PixAI Credentials

- **API Key:** https://pixai.art/en/profile/edit/api
- **Model IDs:** Last number in model page URL

---

## License

MIT
