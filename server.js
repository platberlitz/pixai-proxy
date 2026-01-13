const express = require('express');
const session = require('express-session');
const app = express();

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: process.env.SESSION_SECRET || 'change-me-in-production', resave: false, saveUninitialized: false }));

const PIXAI_API = 'https://api.pixai.art/v1';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin';

// Webhook storage for completed tasks
const webhookResults = new Map();

// Webhook callback endpoint
app.post('/webhook/:taskId', (req, res) => {
    const { taskId } = req.params;
    webhookResults.set(taskId, req.body);
    setTimeout(() => webhookResults.delete(taskId), 300000); // Clean up after 5 min
    res.sendStatus(200);
});

// Check webhook result
app.get('/webhook/:taskId', (req, res) => {
    const result = webhookResults.get(req.params.taskId);
    res.json({ ready: !!result, data: result || null });
});

function auth(req, res, next) {
    if (req.session.loggedIn) return next();
    res.redirect('/login');
}

app.get('/login', (req, res) => res.send(`
<!DOCTYPE html><html><head><title>Login - PixAI Proxy</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>*{box-sizing:border-box}body{font-family:system-ui;background:#1a1a2e;color:#eee;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0}.card{background:#16213e;padding:2rem;border-radius:12px;width:100%;max-width:360px}h1{margin:0 0 1.5rem;text-align:center}input{width:100%;padding:12px;margin:8px 0;border:1px solid #333;border-radius:6px;background:#0f0f23;color:#fff}button{width:100%;padding:12px;background:#e94560;border:none;border-radius:6px;color:#fff;font-size:16px;cursor:pointer;margin-top:12px}button:hover{background:#ff6b6b}</style></head>
<body><div class="card"><h1>🎨 PixAI Proxy</h1><form method="POST" action="/login">
<input name="user" placeholder="Username" required>
<input name="pass" type="password" placeholder="Password" required>
<button type="submit">Login</button></form></div></body></html>`));

app.post('/login', (req, res) => {
    if (req.body.user === ADMIN_USER && req.body.pass === ADMIN_PASS) {
        req.session.loggedIn = true;
        res.redirect('/');
    } else res.redirect('/login?error=1');
});

app.get('/logout', (req, res) => { req.session.destroy(); res.redirect('/login'); });

app.get('/', auth, (req, res) => res.send(`
<!DOCTYPE html><html><head><title>PixAI Proxy</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
:root{--bg:#0d1117;--card:#161b22;--border:#30363d;--text:#c9d1d9;--text-muted:#8b949e;--accent:#58a6ff;--accent-hover:#79c0ff;--success:#3fb950;--danger:#f85149;--input:#0d1117}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;background:var(--bg);color:var(--text);line-height:1.5}
.container{max-width:960px;margin:0 auto;padding:24px}
.header{display:flex;justify-content:space-between;align-items:center;padding-bottom:16px;border-bottom:1px solid var(--border);margin-bottom:24px}
.header h1{font-size:24px;font-weight:600;display:flex;align-items:center;gap:10px}
.header h1 span{background:linear-gradient(135deg,#58a6ff,#a371f7);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.header-right{display:flex;align-items:center;gap:16px}
.credits{font-size:13px;color:var(--text-muted);background:var(--card);padding:6px 12px;border-radius:20px;border:1px solid var(--border)}
.logout{color:var(--text-muted);text-decoration:none;font-size:13px;transition:color .2s}.logout:hover{color:var(--danger)}
.tabs{display:flex;gap:4px;background:var(--card);padding:4px;border-radius:8px;margin-bottom:20px;overflow-x:auto}
.tab{padding:8px 16px;background:transparent;border:none;border-radius:6px;color:var(--text-muted);cursor:pointer;font-size:14px;font-weight:500;white-space:nowrap;transition:all .2s}
.tab:hover{color:var(--text);background:var(--bg)}
.tab.active{background:var(--accent);color:#fff}
.tab-content{display:none}.tab-content.active{display:block}
.card{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:20px;margin-bottom:16px}
.card-header{font-size:16px;font-weight:600;margin-bottom:16px;display:flex;align-items:center;gap:8px}
.card-header svg{width:20px;height:20px}
.form-group{margin-bottom:16px}
.form-label{display:block;font-size:13px;font-weight:500;color:var(--text-muted);margin-bottom:6px}
.form-hint{font-size:11px;color:var(--text-muted);margin-top:4px}
input,textarea,select{width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:6px;background:var(--input);color:var(--text);font-size:14px;transition:border-color .2s}
input:focus,textarea:focus,select:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px rgba(88,166,255,0.15)}
textarea{resize:vertical;min-height:80px;font-family:inherit}
select{cursor:pointer}
.row{display:grid;gap:12px}.row-2{grid-template-columns:1fr 1fr}.row-3{grid-template-columns:1fr 1fr 1fr}.row-4{grid-template-columns:1fr 1fr 1fr 1fr}
@media(max-width:640px){.row-2,.row-3,.row-4{grid-template-columns:1fr}}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:10px 16px;border:none;border-radius:6px;font-size:14px;font-weight:500;cursor:pointer;transition:all .2s}
.btn-primary{background:var(--accent);color:#fff}.btn-primary:hover{background:var(--accent-hover)}
.btn-secondary{background:var(--card);color:var(--text);border:1px solid var(--border)}.btn-secondary:hover{background:var(--border)}
.btn-danger{background:var(--danger);color:#fff}.btn-danger:hover{opacity:.9}
.btn-sm{padding:6px 10px;font-size:12px}
.btn:disabled{opacity:.5;cursor:not-allowed}
.btn-group{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px}
.checkbox-group{display:flex;flex-wrap:wrap;gap:16px;margin-top:8px}
.checkbox-label{display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer}
.checkbox-label input{width:auto;margin:0}
.status{padding:12px 16px;border-radius:8px;margin-top:16px;font-size:14px;display:none}
.status.show{display:block}
.status-info{background:rgba(88,166,255,0.1);border:1px solid rgba(88,166,255,0.3);color:var(--accent)}
.status-success{background:rgba(63,185,80,0.1);border:1px solid rgba(63,185,80,0.3);color:var(--success)}
.status-error{background:rgba(248,81,73,0.1);border:1px solid rgba(248,81,73,0.3);color:var(--danger)}
.result-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;margin-top:20px}
.result-item{background:var(--card);border:1px solid var(--border);border-radius:8px;overflow:hidden;transition:transform .2s}
.result-item:hover{transform:translateY(-2px)}
.result-item img{width:100%;display:block;cursor:pointer}
.result-item-actions{padding:8px;display:flex;justify-content:center}
.result-item-actions a{color:var(--accent);font-size:12px;text-decoration:none}
.history-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px;max-height:500px;overflow-y:auto}
.history-item{border-radius:6px;overflow:hidden;cursor:pointer;transition:transform .2s;border:2px solid transparent}
.history-item:hover{transform:scale(1.02);border-color:var(--accent)}
.history-item img{width:100%;display:block}
.list-item{background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;gap:12px}
.list-item-text{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px}
.list-item-actions{display:flex;gap:6px}
.api-info{background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:16px;margin-top:20px}
.api-info-title{font-size:12px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px}
.api-info code{background:var(--card);padding:2px 8px;border-radius:4px;font-size:13px;color:var(--accent)}
.modal{display:none;position:fixed;inset:0;background:rgba(0,0,0,.9);z-index:1000;justify-content:center;align-items:center}
.modal.show{display:flex}
.modal img{max-width:90vw;max-height:90vh;border-radius:8px}
.badge{display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;padding:0 6px;border-radius:10px;font-size:11px;font-weight:600;background:var(--accent);color:#fff;margin-left:6px}
.divider{height:1px;background:var(--border);margin:20px 0}
.section-title{font-size:13px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:12px}
</style></head><body>
<div class="container">
<div class="header">
<h1>🎨 <span>PixAI Proxy</span></h1>
<div class="header-right">
<div class="credits">Session: <span id="sessionCost">0</span> credits</div>
<a href="/logout" class="logout">Sign out</a>
</div>
</div>

<div class="tabs">
<button class="tab active" onclick="showTab('pixai')">PixAI</button>
<button class="tab" onclick="showTab('naistera')">Naistera</button>
<button class="tab" onclick="showTab('history')">History</button>
<button class="tab" onclick="showTab('favorites')">Favorites</button>
<button class="tab" onclick="showTab('presets')">Presets</button>
<button class="tab" onclick="showTab('queue')">Queue<span id="queueCount" class="badge" style="display:none"></span></button>
</div>

<!-- PixAI Tab -->
<div id="tab-pixai" class="tab-content active">
<div class="card">
<div class="card-header">⚙️ PixAI Settings</div>

<div class="form-group">
<label class="form-label">API Key</label>
<input type="password" id="apiKey" placeholder="Get from pixai.art/profile/edit/api">
</div>

<div class="row row-2">
<div class="form-group">
<label class="form-label">Model ID</label>
<input id="model" value="1648918127446573124">
<div class="form-hint">Find models at pixai.art/model</div>
</div>
<div class="form-group">
<label class="form-label">LoRAs (id:weight)</label>
<input id="loras" placeholder="1744880666293972790:0.7, ...">
</div>
</div>

<div class="divider"></div>
<div class="section-title">Prompt</div>

<div class="form-group">
<div style="display:flex;justify-content:space-between;align-items:center">
<label class="form-label" style="margin:0">Prompt</label>
<button class="btn btn-sm btn-secondary" onclick="saveFavorite()">⭐ Save</button>
</div>
<textarea id="prompt" style="margin-top:6px">masterpiece, best quality, highly detailed, </textarea>
</div>

<div class="form-group">
<label class="form-label">Negative Prompt</label>
<textarea id="negative">lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, jpeg artifacts, signature, watermark, blurry, deformed, ugly</textarea>
</div>

<div class="row row-2">
<div class="form-group">
<label class="form-label">Style Prefix</label>
<select id="style">
<option value="">None</option>
<option value="anime, cel shading, vibrant colors, ">Anime</option>
<option value="realistic, photorealistic, 8k uhd, ">Photorealistic</option>
<option value="digital painting, concept art, ">Digital Art</option>
<option value="oil painting, classical, ">Oil Painting</option>
<option value="watercolor painting, ">Watercolor</option>
<option value="pencil sketch, graphite, ">Pencil Sketch</option>
<option value="pixel art, 16-bit, ">Pixel Art</option>
<option value="3d render, octane render, ">3D Render</option>
<option value="cyberpunk, neon lights, ">Cyberpunk</option>
<option value="fantasy art, magical, ">Fantasy</option>
<option value="manga style, screentone, ">Manga</option>
<option value="chibi, kawaii, ">Chibi</option>
<option value="studio ghibli style, ">Ghibli</option>
</select>
</div>
<div class="form-group">
<label class="form-label">Image URL (img2img)</label>
<input id="imgUrl" placeholder="Optional - leave empty for txt2img">
</div>
</div>

<div class="divider"></div>
<div class="section-title">Generation Parameters</div>

<div class="row row-4">
<div class="form-group">
<label class="form-label">Width</label>
<select id="width">
<option value="512">512</option>
<option value="576">576</option>
<option value="640">640</option>
<option value="704">704</option>
<option value="768">768</option>
<option value="832">832</option>
<option value="896">896</option>
<option value="960">960</option>
<option value="1024">1024</option>
</select>
</div>
<div class="form-group">
<label class="form-label">Height</label>
<select id="height">
<option value="512">512</option>
<option value="576">576</option>
<option value="640">640</option>
<option value="704">704</option>
<option value="768" selected>768</option>
<option value="832">832</option>
<option value="896">896</option>
<option value="960">960</option>
<option value="1024">1024</option>
</select>
</div>
<div class="form-group">
<label class="form-label">Batch Size</label>
<select id="count">
<option value="1">1</option>
<option value="2">2</option>
<option value="4" selected>4</option>
</select>
</div>
<div class="form-group">
<label class="form-label">Seed</label>
<input type="number" id="seed" value="-1">
</div>
</div>

<div class="row row-4">
<div class="form-group">
<label class="form-label">Sampler</label>
<select id="sampler">
<option value="Euler a">Euler a</option>
<option value="Euler">Euler</option>
<option value="DPM++ 2M Karras">DPM++ 2M Karras</option>
<option value="DPM++ SDE Karras">DPM++ SDE Karras</option>
<option value="DDIM">DDIM</option>
</select>
</div>
<div class="form-group">
<label class="form-label">Steps</label>
<input type="number" id="steps" value="25" min="8" max="50">
</div>
<div class="form-group">
<label class="form-label">CFG Scale</label>
<input type="number" id="cfg" value="6" min="1" max="20" step="0.5">
</div>
<div class="form-group">
<label class="form-label">Img2Img Strength</label>
<input type="number" id="imgStrength" value="0.7" min="0.1" max="1" step="0.1">
</div>
</div>

<div class="row row-3">
<div class="form-group">
<label class="form-label">Upscale</label>
<select id="upscale">
<option value="1">None</option>
<option value="1.5">1.5x</option>
<option value="2">2x</option>
</select>
</div>
<div class="form-group">
<label class="form-label">Upscale Denoise</label>
<input type="number" id="upscaleDenoise" value="0.4" min="0" max="1" step="0.1">
</div>
<div class="form-group" style="display:flex;align-items:end;padding-bottom:10px">
<div class="checkbox-group">
<label class="checkbox-label"><input type="checkbox" id="facefix"> Face Fix</label>
<label class="checkbox-label"><input type="checkbox" id="tile"> Tile</label>
</div>
</div>
</div>

<div class="btn-group">
<button class="btn btn-secondary" onclick="window.open('https://pixai.art/model','_blank')">🔍 Browse Models</button>
<button class="btn btn-secondary" onclick="savePreset()">💾 Save Preset</button>
<button class="btn btn-secondary" onclick="generate(true)">📋 Add to Queue</button>
<button class="btn btn-primary" onclick="generate()" id="genBtn">🎨 Generate</button>
</div>

<div id="status" class="status"></div>
</div>

<div id="result" class="result-grid"></div>

<div class="api-info">
<div class="api-info-title">API Endpoint</div>
<code>POST <span id="endpoint"></span>/v1/images/generations</code>
<div class="form-hint" style="margin-top:8px">
PixAI parameters: prompt, negative_prompt, width, height, model, n, steps, cfg_scale, sampler, seed, loras, facefix, upscale, upscaleDenoise, tile, image_url, strength
</div>
</div>
</div>

<!-- Naistera Tab -->
<div id="tab-naistera" class="tab-content">
<div class="card">
<div class="card-header">🌟 Naistera</div>
<p style="color:var(--text-muted);font-size:13px;margin-bottom:16px">Simple anime image generation. Get token from <a href="https://t.me/naistera_blocks_bot" target="_blank" style="color:var(--accent)">@naistera_blocks_bot</a> on Telegram.</p>

<div class="form-group">
<label class="form-label">Token</label>
<input type="password" id="naisteraToken" placeholder="Your Naistera token">
</div>

<div class="form-group">
<label class="form-label">Prompt</label>
<textarea id="naisteraPrompt">1girl, anime, cute, smile, </textarea>
<div class="form-hint">Anime style is auto-added. For realistic, include "realistic" or "photo" in prompt.</div>
</div>

<div class="row row-3">
<div class="form-group">
<label class="form-label">Aspect Ratio</label>
<select id="naisteraAspect">
<option value="1:1">1:1 (Square)</option>
<option value="16:9">16:9 (Wide)</option>
<option value="9:16">9:16 (Portrait)</option>
<option value="3:2">3:2</option>
<option value="2:3">2:3</option>
</select>
</div>
<div class="form-group">
<label class="form-label">Preset</label>
<select id="naisteraPreset">
<option value="">None</option>
<option value="digital">Digital (adds "digital art")</option>
<option value="realism">Realism (adds "realistic image")</option>
</select>
</div>
<div class="form-group">
<label class="form-label">Count</label>
<select id="naisteraCount">
<option value="1">1</option>
<option value="2">2</option>
<option value="4">4</option>
</select>
</div>
</div>

<div class="btn-group">
<button class="btn btn-primary" onclick="generateNaistera()" id="naisteraBtn">🎨 Generate</button>
</div>

<div id="naisteraStatus" class="status"></div>
</div>

<div id="naisteraResult" class="result-grid"></div>

<div class="api-info">
<div class="api-info-title">API Endpoint</div>
<code>POST <span class="endpoint-url"></span>/naistera/v1/images/generations</code>
<div class="form-hint" style="margin-top:8px">
<strong>Available parameters:</strong> prompt, aspect_ratio (1:1, 16:9, 9:16, 3:2, 2:3), preset (digital, realism), n (count)
</div>
<div class="form-hint">
<strong>Note:</strong> Naistera has no sampler, steps, CFG, or model selection - it uses fixed settings on their backend.
</div>
</div>
</div>

<!-- History Tab -->
<div id="tab-history" class="tab-content">
<div class="card">
<div class="card-header">📜 Generation History</div>
<p style="color:var(--text-muted);font-size:13px;margin-bottom:16px">Click an image to view full size. Stored locally in your browser.</p>
<div id="historyGrid" class="history-grid"></div>
<div class="btn-group">
<button class="btn btn-danger btn-sm" onclick="clearHistory()">Clear History</button>
</div>
</div>
</div>

<!-- Favorites Tab -->
<div id="tab-favorites" class="tab-content">
<div class="card">
<div class="card-header">⭐ Favorite Prompts</div>
<div id="favoritesList"></div>
</div>
</div>

<!-- Presets Tab -->
<div id="tab-presets" class="tab-content">
<div class="card">
<div class="card-header">💾 Model Presets</div>
<p style="color:var(--text-muted);font-size:13px;margin-bottom:16px">Save model + LoRA + settings combinations for quick access.</p>
<div id="presetsList"></div>
</div>
</div>

<!-- Queue Tab -->
<div id="tab-queue" class="tab-content">
<div class="card">
<div class="card-header">📋 Generation Queue</div>
<p style="color:var(--text-muted);font-size:13px;margin-bottom:16px">Queue multiple generations to run sequentially.</p>
<div id="queueList"></div>
<div class="btn-group">
<button class="btn btn-primary" onclick="processQueue()" id="processQueueBtn">▶️ Process Queue</button>
<button class="btn btn-secondary" onclick="clearQueue()">Clear Queue</button>
</div>
</div>
</div>

</div>

<div id="modal" class="modal" onclick="this.classList.remove('show')">
<img id="modalImg" src="">
</div>

<script>
document.getElementById('endpoint').textContent=location.origin;
document.querySelectorAll('.endpoint-url').forEach(el=>el.textContent=location.origin);

const fields = ['apiKey','prompt','negative','loras','count','width','height','model','style','upscale','upscaleDenoise','sampler','steps','cfg','seed','imgUrl','imgStrength','naisteraToken','naisteraPrompt','naisteraAspect','naisteraPreset'];
const checkboxes = ['facefix','tile'];

function save() { 
    fields.forEach(f => localStorage.setItem('pixai_'+f, document.getElementById(f)?.value || ''));
    checkboxes.forEach(f => localStorage.setItem('pixai_'+f, document.getElementById(f)?.checked || false));
}
function load() { 
    fields.forEach(f => { const v = localStorage.getItem('pixai_'+f); if(v && document.getElementById(f)) document.getElementById(f).value = v; });
    checkboxes.forEach(f => { if(document.getElementById(f)) document.getElementById(f).checked = localStorage.getItem('pixai_'+f) === 'true'; });
    loadHistory(); loadFavorites(); loadPresets(); renderQueue();
}
window.onload = load;
fields.forEach(f => document.getElementById(f)?.addEventListener('change', save));
fields.forEach(f => document.getElementById(f)?.addEventListener('input', save));
checkboxes.forEach(f => document.getElementById(f)?.addEventListener('change', save));

function showTab(name) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelector('.tab[onclick*="'+name+'"]').classList.add('active');
    document.getElementById('tab-'+name).classList.add('active');
}

function showStatus(el, msg, type='info') {
    el.className = 'status show status-'+type;
    el.textContent = msg;
}

// History
function getHistory() { return JSON.parse(localStorage.getItem('pixai_history') || '[]'); }
function saveHistoryData(h) { localStorage.setItem('pixai_history', JSON.stringify(h.slice(0, 100))); }
function addToHistory(urls, prompt) {
    const h = getHistory();
    urls.forEach(url => h.unshift({ url, prompt, date: Date.now() }));
    saveHistoryData(h); loadHistory();
}
function loadHistory() {
    const h = getHistory();
    document.getElementById('historyGrid').innerHTML = h.map(item => 
        '<div class="history-item" onclick="showModal(\\''+item.url.replace(/'/g,"\\\\'")+'\\')"><img src="'+item.url+'" loading="lazy"></div>'
    ).join('') || '<p style="color:var(--text-muted)">No history yet</p>';
}
function clearHistory() { if(confirm('Clear all history?')) { localStorage.removeItem('pixai_history'); loadHistory(); } }
function showModal(url) { document.getElementById('modalImg').src = url; document.getElementById('modal').classList.add('show'); }

// Favorites
function getFavorites() { return JSON.parse(localStorage.getItem('pixai_favorites') || '[]'); }
function saveFavorites(f) { localStorage.setItem('pixai_favorites', JSON.stringify(f)); }
function saveFavorite() {
    const prompt = document.getElementById('prompt').value;
    if (!prompt.trim()) return alert('Enter a prompt first');
    const f = getFavorites();
    f.unshift({ prompt, date: Date.now() });
    saveFavorites(f); loadFavorites();
    alert('Prompt saved to favorites!');
}
function loadFavorites() {
    const f = getFavorites();
    document.getElementById('favoritesList').innerHTML = f.map((item, i) => 
        '<div class="list-item"><span class="list-item-text">'+item.prompt.substring(0,80)+'</span><div class="list-item-actions"><button class="btn btn-sm btn-primary" onclick="useFavorite('+i+')">Use</button><button class="btn btn-sm btn-secondary" onclick="deleteFavorite('+i+')">✕</button></div></div>'
    ).join('') || '<p style="color:var(--text-muted)">No favorites yet. Click ⭐ Save next to the prompt field.</p>';
}
function useFavorite(i) { document.getElementById('prompt').value = getFavorites()[i].prompt; showTab('pixai'); save(); }
function deleteFavorite(i) { const f = getFavorites(); f.splice(i, 1); saveFavorites(f); loadFavorites(); }

// Presets
function getPresets() { return JSON.parse(localStorage.getItem('pixai_presets') || '[]'); }
function savePresets(p) { localStorage.setItem('pixai_presets', JSON.stringify(p)); }
function savePreset() {
    const name = prompt('Preset name:');
    if (!name) return;
    const p = getPresets();
    p.unshift({
        name, model: document.getElementById('model').value, loras: document.getElementById('loras').value,
        sampler: document.getElementById('sampler').value, steps: document.getElementById('steps').value,
        cfg: document.getElementById('cfg').value, width: document.getElementById('width').value,
        height: document.getElementById('height').value,
        facefix: document.getElementById('facefix').checked, date: Date.now()
    });
    savePresets(p); loadPresets();
}
function loadPresets() {
    const p = getPresets();
    document.getElementById('presetsList').innerHTML = p.map((item, i) => 
        '<div class="list-item"><span class="list-item-text">'+item.name+' (Model: '+item.model.substring(0,12)+'...)</span><div class="list-item-actions"><button class="btn btn-sm btn-primary" onclick="usePreset('+i+')">Load</button><button class="btn btn-sm btn-secondary" onclick="deletePreset('+i+')">✕</button></div></div>'
    ).join('') || '<p style="color:var(--text-muted)">No presets yet. Click 💾 Save Preset to create one.</p>';
}
function usePreset(i) {
    const p = getPresets()[i];
    document.getElementById('model').value = p.model;
    document.getElementById('loras').value = p.loras || '';
    document.getElementById('sampler').value = p.sampler;
    document.getElementById('steps').value = p.steps;
    document.getElementById('cfg').value = p.cfg;
    if(p.width) document.getElementById('width').value = p.width;
    if(p.height) document.getElementById('height').value = p.height;
    document.getElementById('facefix').checked = p.facefix;
    save(); showTab('pixai');
}
function deletePreset(i) { const p = getPresets(); p.splice(i, 1); savePresets(p); loadPresets(); }

// Queue
let queue = [];
let sessionCredits = parseInt(localStorage.getItem('pixai_session_credits') || '0');

function addToQueue() {
    const style = document.getElementById('style').value;
    queue.push({
        prompt: style + document.getElementById('prompt').value,
        negative_prompt: document.getElementById('negative').value,
        width: parseInt(document.getElementById('width').value),
        height: parseInt(document.getElementById('height').value),
        model: document.getElementById('model').value,
        n: parseInt(document.getElementById('count').value),
        steps: parseInt(document.getElementById('steps').value),
        cfg_scale: parseFloat(document.getElementById('cfg').value),
        sampler: document.getElementById('sampler').value,
        facefix: document.getElementById('facefix').checked
    });
    renderQueue();
    showTab('queue');
}
function renderQueue() {
    const badge = document.getElementById('queueCount');
    if(queue.length) { badge.textContent = queue.length; badge.style.display = 'inline-flex'; }
    else { badge.style.display = 'none'; }
    document.getElementById('queueList').innerHTML = queue.map((item, i) => 
        '<div class="list-item"><span class="list-item-text">'+item.prompt.substring(0,50)+'... ('+item.n+' imgs)</span><div class="list-item-actions"><button class="btn btn-sm btn-secondary" onclick="removeFromQueue('+i+')">✕</button></div></div>'
    ).join('') || '<p style="color:var(--text-muted)">Queue is empty. Use "Add to Queue" button when generating.</p>';
}
function removeFromQueue(i) { queue.splice(i, 1); renderQueue(); }
function clearQueue() { queue = []; renderQueue(); }
async function processQueue() {
    if (!queue.length) return alert('Queue is empty');
    const apiKey = document.getElementById('apiKey').value;
    if (!apiKey) return alert('Enter API key first');
    
    const btn = document.getElementById('processQueueBtn');
    btn.disabled = true;
    
    for (let i = 0; i < queue.length; i++) {
        btn.textContent = 'Processing '+(i+1)+'/'+queue.length+'...';
        try {
            const res = await fetch('/v1', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
                body: JSON.stringify(queue[i])
            });
            const data = await res.json();
            if (data.data?.length) {
                addToHistory(data.data.map(d => d.url), queue[i].prompt);
                trackCredits(queue[i].n, queue[i].facefix);
            }
        } catch(e) { console.error(e); }
    }
    queue = [];
    renderQueue();
    btn.disabled = false;
    btn.textContent = '▶️ Process Queue';
    showTab('history');
}

// Cost tracking
function trackCredits(count, facefix) {
    const cost = count * (facefix ? 2 : 1);
    sessionCredits += cost;
    localStorage.setItem('pixai_session_credits', sessionCredits);
    document.getElementById('sessionCost').textContent = sessionCredits;
}

async function generateNaistera() {
    const token = document.getElementById('naisteraToken').value;
    const prompt = document.getElementById('naisteraPrompt').value;
    const aspect = document.getElementById('naisteraAspect').value;
    const preset = document.getElementById('naisteraPreset').value;
    const count = parseInt(document.getElementById('naisteraCount').value);
    const status = document.getElementById('naisteraStatus');
    const result = document.getElementById('naisteraResult');
    const btn = document.getElementById('naisteraBtn');
    
    if (!token) return alert('Enter Naistera token');
    if (!prompt) return alert('Enter prompt');
    
    btn.disabled = true;
    showStatus(status, '⏳ Generating '+count+' image(s)...', 'info');
    result.innerHTML = '';
    save();
    
    try {
        const res = await fetch('/naistera/v1/images/generations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({ prompt, aspect_ratio: aspect, preset, n: count })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error.message || data.error);
        
        const urls = data.data.map(d => 'data:image/png;base64,' + d.b64_json);
        result.innerHTML = urls.map(url => 
            '<div class="result-item"><img src="'+url+'" onclick="showModal(\\''+url.substring(0,50)+'...\\')"><div class="result-item-actions"><a href="'+url+'" download="naistera.png">Download</a></div></div>'
        ).join('');
        showStatus(status, '✅ Generated '+count+' image(s)', 'success');
        addToHistory(urls, prompt);
    } catch (e) {
        showStatus(status, '❌ '+e.message, 'error');
    } finally {
        btn.disabled = false;
    }
}

async function generate(addQueue = false) {
    if (addQueue) { addToQueue(); return; }
    const btn = document.getElementById('genBtn');
    const status = document.getElementById('status');
    const result = document.getElementById('result');
    const apiKey = document.getElementById('apiKey').value;
    const style = document.getElementById('style').value;
    const count = parseInt(document.getElementById('count').value);
    
    if (!apiKey) return alert('Enter your PixAI API key');
    if (!document.getElementById('prompt').value) return alert('Enter a prompt');
    
    btn.disabled = true;
    result.innerHTML = '';
    save();
    
    const loraObj = {};
    document.getElementById('loras').value.split(',').filter(l => l.trim()).forEach(l => {
        const [id, weight] = l.trim().split(':');
        if (id) loraObj[id.trim()] = parseFloat(weight) || 0.7;
    });
    
    const upscale = parseFloat(document.getElementById('upscale').value);
    const upscaleDenoise = parseFloat(document.getElementById('upscaleDenoise').value);
    const seed = parseInt(document.getElementById('seed').value);
    const imgUrl = document.getElementById('imgUrl').value.trim();
    const promptText = style + document.getElementById('prompt').value;
    const body = {
        prompt: promptText,
        negative_prompt: document.getElementById('negative').value,
        width: parseInt(document.getElementById('width').value),
        height: parseInt(document.getElementById('height').value),
        model: document.getElementById('model').value,
        n: count,
        steps: parseInt(document.getElementById('steps').value),
        cfg_scale: parseFloat(document.getElementById('cfg').value),
        sampler: document.getElementById('sampler').value,
        seed: seed >= 0 ? seed : undefined,
        facefix: document.getElementById('facefix').checked,
        upscale: upscale > 1 ? upscale : undefined,
        upscaleDenoise: upscale > 1 ? upscaleDenoise : undefined,
        tile: document.getElementById('tile').checked || undefined,
        image_url: imgUrl || undefined,
        strength: imgUrl ? parseFloat(document.getElementById('imgStrength').value) : undefined
    };
    if (Object.keys(loraObj).length) body.loras = loraObj;
    
    try {
        showStatus(status, '⏳ Generating '+count+' image(s)...'+(imgUrl?' (img2img)':''), 'info');
        const res = await fetch('/v1', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
            body: JSON.stringify(body)
        });
        
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        if (data.data?.length) {
            showStatus(status, '✅ Generated '+data.data.length+' image(s)', 'success');
            const urls = data.data.map(d => d.url);
            addToHistory(urls, promptText);
            trackCredits(count, document.getElementById('facefix').checked);
            result.innerHTML = urls.map(url => '<div class="result-item"><img src="'+url+'" onclick="showModal(\\''+url+'\\')"><div class="result-item-actions"><a href="'+url+'" download>Download</a></div></div>').join('');
        } else throw new Error('No images returned');
    } catch(e) {
        showStatus(status, '❌ '+e.message, 'error');
    } finally {
        btn.disabled = false;
    }
}
</script></body></html>`));

// API endpoint
const handleGenerate = async (req, res) => {
    const { prompt, negative_prompt, width = 512, height = 768, model, n = 1, loras, facefix, upscale, upscaleDenoise, tile, steps, cfg_scale, sampler, seed, image_url, strength } = req.body;
    const apiKey = req.headers.authorization?.replace('Bearer ', '');
    
    if (!apiKey) return res.status(401).json({ error: 'API key required' });
    
    try {
        const params = {
            prompts: prompt,
            modelId: model || '1648918127446573124',
            width: Math.max(512, Math.min(1280, width)),
            height: Math.max(512, Math.min(1280, height)),
            batchSize: Math.min(n, 4)
        };
        if (negative_prompt) params.negativePrompts = negative_prompt;
        if (steps) params.samplingSteps = steps;
        if (cfg_scale) params.cfgScale = cfg_scale;
        if (sampler) params.samplingMethod = sampler;
        if (seed !== undefined && seed >= 0) params.seed = seed;
        if (image_url) { params.mediaUrl = image_url; params.strength = strength || 0.7; }
        
        if (loras) {
            if (Array.isArray(loras)) {
                params.lora = {};
                loras.forEach(l => { if (l.id) params.lora[l.id] = l.weight || 0.7; });
            } else if (Object.keys(loras).length) {
                params.lora = loras;
            }
        }
        if (facefix) params.enableADetailer = true;
        if (upscale && upscale > 1) {
            params.upscale = upscale;
            if (upscaleDenoise) params.upscaleDenoisingStrength = upscaleDenoise;
        }
        if (tile) params.enableTile = true;
        
        const createRes = await fetch(`${PIXAI_API}/task`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({ parameters: params })
        });
        
        const createData = await createRes.json();
        if (!createData.id) throw new Error(createData.message || 'Failed to create task');
        const taskId = createData.id;
        
        for (let i = 0; i < 90; i++) {
            await new Promise(r => setTimeout(r, 2000));
            
            const statusRes = await fetch(`${PIXAI_API}/task/${taskId}`, {
                headers: { 'Authorization': `Bearer ${apiKey}` }
            });
            const task = await statusRes.json();
            
            if (task.status === 'completed' && task.outputs?.mediaUrls?.length) {
                return res.json({
                    data: task.outputs.mediaUrls.filter(u => u).map(url => ({ url }))
                });
            }
            if (task.status === 'failed') throw new Error('Generation failed');
        }
        throw new Error('Timeout');
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};
app.post('/v1/images/generations', handleGenerate);
app.post('/v1', handleGenerate);

// Naistera proxy - OpenAI chat completions compatible
const NAISTERA_API = 'https://naistera.org/prompt';

app.post('/naistera/v1/chat/completions', async (req, res) => {
    try {
        const apiKey = req.headers.authorization?.replace('Bearer ', '');
        if (!apiKey) return res.status(401).json({ error: 'Missing API key' });
        
        const { messages, model } = req.body;
        const lastMsg = messages?.filter(m => m.role === 'user').pop();
        if (!lastMsg) return res.status(400).json({ error: 'No user message' });
        
        // Extract prompt from message content
        let prompt = typeof lastMsg.content === 'string' ? lastMsg.content : 
            lastMsg.content?.find(c => c.type === 'text')?.text || '';
        
        // Parse aspect ratio and preset from prompt or model name
        let aspect_ratio = '1:1', preset = '';
        const aspectMatch = prompt.match(/\[(\d+:\d+)\]/);
        if (aspectMatch) { aspect_ratio = aspectMatch[1]; prompt = prompt.replace(aspectMatch[0], '').trim(); }
        const presetMatch = prompt.match(/\[(digital|realism)\]/i);
        if (presetMatch) { preset = presetMatch[1].toLowerCase(); prompt = prompt.replace(presetMatch[0], '').trim(); }
        
        // Build URL
        const params = new URLSearchParams({ token: apiKey });
        if (aspect_ratio) params.append('aspect_ratio', aspect_ratio);
        if (preset) params.append('preset', preset);
        
        const url = `${NAISTERA_API}/${encodeURIComponent(prompt)}?${params}`;
        const imgRes = await fetch(url);
        
        if (!imgRes.ok) throw new Error(`Naistera error: ${imgRes.status}`);
        
        const buffer = await imgRes.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        const contentType = imgRes.headers.get('content-type') || 'image/png';
        const dataUrl = `data:${contentType};base64,${base64}`;
        
        // Return OpenAI-compatible response
        res.json({
            id: 'naistera-' + Date.now(),
            object: 'chat.completion',
            created: Math.floor(Date.now() / 1000),
            model: model || 'naistera',
            choices: [{
                index: 0,
                message: {
                    role: 'assistant',
                    content: `![Generated Image](${dataUrl})`
                },
                finish_reason: 'stop'
            }]
        });
    } catch (e) {
        res.status(500).json({ error: { message: e.message } });
    }
});

// Naistera images/generations endpoint
app.post('/naistera/v1/images/generations', async (req, res) => {
    try {
        const apiKey = req.headers.authorization?.replace('Bearer ', '');
        if (!apiKey) return res.status(401).json({ error: { message: 'Missing API key' } });
        
        let { prompt, aspect_ratio, preset, n = 1, width, height, style } = req.body;
        if (!prompt) return res.status(400).json({ error: { message: 'Missing prompt' } });
        
        // Force anime style unless explicitly requesting realistic/photo
        const lowerPrompt = prompt.toLowerCase();
        if (!lowerPrompt.includes('realistic') && !lowerPrompt.includes('photo') && !lowerPrompt.includes('3d render')) {
            prompt = 'anime style, anime, 2d, ' + prompt;
        }
        
        // Determine aspect ratio from width/height if not provided
        let ar = aspect_ratio;
        if (!ar && width && height) {
            const ratio = width / height;
            if (ratio > 1.5) ar = '16:9';
            else if (ratio < 0.67) ar = '9:16';
            else if (ratio > 1.2) ar = '3:2';
            else if (ratio < 0.83) ar = '2:3';
            else ar = '1:1';
        }
        
        const params = new URLSearchParams({ token: apiKey });
        if (ar) params.append('aspect_ratio', ar);
        if (preset) params.append('preset', preset);
        
        const results = [];
        for (let i = 0; i < Math.min(n || 1, 4); i++) {
            const url = `${NAISTERA_API}/${encodeURIComponent(prompt)}?${params}`;
            console.log('Naistera request:', url.replace(apiKey, '***'));
            const imgRes = await fetch(url);
            
            if (!imgRes.ok) {
                const text = await imgRes.text();
                console.error('Naistera error:', imgRes.status, text);
                throw new Error(`Naistera error: ${imgRes.status} - ${text}`);
            }
            
            const buffer = await imgRes.arrayBuffer();
            const base64 = Buffer.from(buffer).toString('base64');
            results.push({ b64_json: base64 });
        }
        
        res.json({ data: results });
    } catch (e) {
        console.error('Naistera proxy error:', e.message);
        res.status(500).json({ error: { message: e.message } });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`PixAI proxy running on http://localhost:${PORT}`));
