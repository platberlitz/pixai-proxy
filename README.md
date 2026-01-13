# PixAI Reverse Proxy

Proxy server translating OpenAI-compatible requests to PixAI and Naistera APIs. Includes full-featured web dashboard.

## Why a Proxy?

PixAI uses a task-based API (create task → poll → get results). Naistera returns images directly but isn't OpenAI-compatible. This proxy handles that complexity and exposes simple OpenAI-compatible endpoints.

## Features

### Web Dashboard
- 🔐 **Login Protected** - Configurable credentials
- 📑 **Tabbed Interface** - Generate, Naistera, Queue, History, Favorites, Presets
- 💾 **Persistent Settings** - Saved in localStorage
- 📱 **Mobile Friendly**

### PixAI Generation
- 🖼️ **Batch Generation** - 1, 2, or 4 images
- 📐 **Resolution Presets** - 512x512 to 1024x1024
- 🎭 **LoRA Support** - Multiple LoRAs with weights
- 👤 **Face Fix** - ADetailer
- ⬆️ **Upscale** - 1.5x or 2x hires fix
- 🎛️ **ControlNet Tile** - Enhanced upscale detail
- ⚙️ **Full Control** - Steps, CFG, Sampler, Seed
- 🖼️ **Img2Img** - Transform existing images

### Naistera Generation
- 🌟 **Simple API** - Just prompt and go
- 📐 **Aspect Ratios** - 1:1, 16:9, 9:16, 3:2, 2:3
- 🎨 **Presets** - Digital Art, Realism

### Organization
- 📜 **Image History** - Last 50 images
- ⭐ **Favorite Prompts** - Save/load prompts
- 💾 **Model Presets** - Save model + LoRA + settings combos
- 📋 **Generation Queue** - Queue multiple jobs
- 💰 **Cost Tracking** - Estimated credit usage

### API
- 🔌 **OpenAI Compatible** - Multiple endpoints
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

## API Endpoints

### PixAI

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

### Naistera

**Images Generation:**
`POST /naistera/v1/images/generations`

```json
{
  "prompt": "a beautiful sunset",
  "aspect_ratio": "16:9",
  "preset": "digital",
  "n": 1
}
```

**Chat Completions (OpenAI compatible):**
`POST /naistera/v1/chat/completions`

```json
{
  "messages": [{"role": "user", "content": "a beautiful sunset [16:9] [digital]"}]
}
```

Use `[aspect]` and `[preset]` in prompt to set options.

---

## Get API Credentials

### PixAI
- **API Key:** https://pixai.art/en/profile/edit/api
- **Model IDs:** Last number in model page URL

### Naistera
- **Token:** Get from [@naistera_blocks_bot](https://t.me/naistera_blocks_bot) on Telegram

---

## Use with SillyTavern

Works with [SillyTavern Quick Image Gen](https://github.com/platberlitz/sillytavern-image-gen):

**For PixAI:**
1. Select **Reverse Proxy**
2. Set URL to `https://your-proxy.com/v1`
3. Enter PixAI API key and model ID

**For Naistera:**
1. Select **Reverse Proxy**
2. Set URL to `https://your-proxy.com/naistera/v1/images/generations`
3. Enter Naistera token

---

## License

MIT
