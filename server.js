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
*{box-sizing:border-box}body{font-family:system-ui;background:#1a1a2e;color:#eee;margin:0;padding:20px}
.container{max-width:900px;margin:0 auto}
h1{color:#e94560;margin-bottom:5px}h3{color:#e94560;margin:0 0 10px}
.header{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:10px}
.logout{color:#888;text-decoration:none;font-size:14px}.logout:hover{color:#e94560}
.card{background:#16213e;padding:20px;border-radius:12px;margin-bottom:20px}
.tabs{display:flex;gap:8px;margin-bottom:16px}
.tab{padding:8px 16px;background:#0f0f23;border:none;border-radius:6px;color:#888;cursor:pointer}
.tab.active{background:#e94560;color:#fff}
.tab-content{display:none}.tab-content.active{display:block}
label{display:block;margin:12px 0 4px;font-size:14px;color:#aaa}
input,textarea,select{width:100%;padding:10px;border:1px solid #333;border-radius:6px;background:#0f0f23;color:#fff;font-size:14px}
textarea{resize:vertical;min-height:80px}
.row{display:flex;gap:12px;flex-wrap:wrap}.row>*{flex:1;min-width:120px}
button{padding:10px 20px;background:#e94560;border:none;border-radius:6px;color:#fff;font-size:14px;cursor:pointer}
button:hover{background:#ff6b6b}button:disabled{background:#555;cursor:wait}
.btn-sm{padding:6px 12px;font-size:12px}
.btn-secondary{background:#333}
#result{margin-top:20px;display:flex;flex-wrap:wrap;gap:10px;justify-content:center}
#status{padding:12px;background:#0f0f23;border-radius:6px;margin-top:12px;display:none}
.img-card{background:#0f0f23;padding:8px;border-radius:8px;text-align:center;max-width:200px}
.img-card img{max-width:100%;border-radius:4px;cursor:pointer}
.img-card a{color:#e94560;font-size:12px}
.history-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;max-height:400px;overflow-y:auto}
.history-item{background:#0f0f23;padding:6px;border-radius:6px;cursor:pointer;position:relative}
.history-item img{width:100%;border-radius:4px}
.history-item:hover{outline:2px solid #e94560}
.preset-item,.fav-item{background:#0f0f23;padding:10px;border-radius:6px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center}
.preset-item span,.fav-item span{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.info{background:#0f0f23;padding:12px;border-radius:6px;font-size:13px;color:#888;margin-top:12px}
.info code{background:#1a1a2e;padding:2px 6px;border-radius:4px;color:#e94560}
.modal{display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);z-index:1000;justify-content:center;align-items:center}
.modal img{max-width:90%;max-height:90%;border-radius:8px}
</style></head><body>
<div class="container">
<div class="header"><div><h1>🎨 PixAI Proxy</h1><small style="color:#666">Image Generation Dashboard</small></div><div><span id="creditDisplay" style="color:#888;margin-right:16px;"></span><a href="/logout" class="logout">Logout</a></div></div>

<div class="tabs">
<button class="tab active" onclick="showTab('generate')">Generate</button>
<button class="tab" onclick="showTab('queue')">Queue <span id="queueCount"></span></button>
<button class="tab" onclick="showTab('history')">History</button>
<button class="tab" onclick="showTab('favorites')">Favorites</button>
<button class="tab" onclick="showTab('presets')">Presets</button>
</div>

<div id="tab-generate" class="tab-content active">
<div class="card">
<label>PixAI API Key</label>
<input type="password" id="apiKey" placeholder="Get from pixai.art/en/profile/edit/api">

<label>Prompt <button class="btn-sm btn-secondary" onclick="saveFavorite()" style="float:right">⭐ Save</button></label>
<textarea id="prompt" placeholder="describe your image">masterpiece, best quality, highly detailed, sharp focus, </textarea>

<label>Negative Prompt</label>
<textarea id="negative">lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry, deformed, ugly, duplicate, morbid, mutilated, out of frame, mutation, disfigured, poorly drawn hands, poorly drawn face, extra limbs, malformed limbs, fused fingers, too many fingers, long neck</textarea>

<label>LoRAs (id:weight, comma-separated)</label>
<input id="loras" placeholder="1744880666293972790:0.7">

<div class="row">
<div><label>Resolution</label>
<select id="resolution" onchange="applyRes()">
<option value="512x512">512×512</option>
<option value="512x768" selected>512×768</option>
<option value="768x512">768×512</option>
<option value="768x1024">768×1024</option>
<option value="1024x768">1024×768</option>
<option value="1024x1024">1024×1024</option>
<option value="custom">Custom</option>
</select></div>
<div><label>Count</label>
<select id="count">
<option value="1">1</option>
<option value="2">2</option>
<option value="4" selected>4</option>
</select></div>
</div>

<div class="row" id="customRes" style="display:none">
<div><label>Width</label><input type="number" id="width" value="512" step="64" min="512" max="1280"></div>
<div><label>Height</label><input type="number" id="height" value="768" step="64" min="512" max="1280"></div>
</div>

<div class="row">
<div><label>Model ID</label><input id="model" value="1648918127446573124"></div>
<div><label>Sampler</label>
<select id="sampler">
<option value="Euler a">Euler a</option>
<option value="Euler">Euler</option>
<option value="DPM++ 2M Karras">DPM++ 2M Karras</option>
<option value="DPM++ SDE Karras">DPM++ SDE Karras</option>
<option value="DDIM">DDIM</option>
</select></div>
</div>

<div class="row">
<div><label>Steps</label><input type="number" id="steps" value="25" min="8" max="50"></div>
<div><label>CFG</label><input type="number" id="cfg" value="6" min="1" max="15" step="0.5"></div>
<div><label>Seed</label><input type="number" id="seed" value="-1"></div>
</div>

<div class="row">
<div><label>Style</label>
<select id="style">
<option value="">None</option>
<option value="anime style, ">Anime</option>
<option value="realistic, photorealistic, ">Realistic</option>
</select></div>
<div><label>Upscale</label>
<select id="upscale">
<option value="1">None</option>
<option value="1.5">1.5x</option>
<option value="2">2x</option>
</select></div>
</div>

<div class="row" style="margin-top:12px">
<label><input type="checkbox" id="facefix"> Face Fix</label>
<label><input type="checkbox" id="tile"> ControlNet Tile</label>
</div>

<div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap">
<button onclick="window.open('https://pixai.art/model','_blank')" class="btn-secondary">🔍 Models</button>
<button onclick="savePreset()">💾 Preset</button>
<button onclick="generate(true)" class="btn-secondary">📋 Queue</button>
<button onclick="generate()" id="genBtn">🎨 Generate</button>
</div>
<div id="status"></div>
</div>
<div id="result"></div>
</div>

<div id="tab-history" class="tab-content">
<div class="card">
<h3>📜 Generation History</h3>
<p style="color:#666;font-size:13px">Click an image to view full size. History is stored in your browser.</p>
<div id="historyGrid" class="history-grid"></div>
<button onclick="clearHistory()" class="btn-secondary btn-sm" style="margin-top:12px">Clear History</button>
</div>
</div>

<div id="tab-favorites" class="tab-content">
<div class="card">
<h3>⭐ Favorite Prompts</h3>
<div id="favoritesList"></div>
</div>
</div>

<div id="tab-presets" class="tab-content">
<div class="card">
<h3>💾 Model Presets</h3>
<p style="color:#666;font-size:13px">Save model + LoRA + settings combinations for quick access.</p>
<div id="presetsList"></div>
</div>
</div>

<div id="tab-queue" class="tab-content">
<div class="card">
<h3>📋 Generation Queue</h3>
<p style="color:#666;font-size:13px">Queue multiple generations to run sequentially.</p>
<div id="queueList"></div>
<div style="margin-top:12px">
<button onclick="processQueue()" id="processQueueBtn">▶️ Process Queue</button>
<button onclick="clearQueue()" class="btn-secondary">Clear Queue</button>
</div>
</div>
</div>

<div class="info">
<strong>API:</strong> <code>POST <span id="endpoint"></span>/v1</code> | <strong>Session Cost:</strong> <span id="sessionCost">0</span> credits (estimated)
</div>
</div>

<div id="modal" class="modal" onclick="this.style.display='none'">
<img id="modalImg" src="">
</div>

<script>
document.getElementById('endpoint').textContent=location.origin;

const fields = ['apiKey','prompt','negative','loras','resolution','count','width','height','model','style','upscale','sampler','steps','cfg','seed'];
const checkboxes = ['facefix','tile'];

function save() { 
    fields.forEach(f => localStorage.setItem('pixai_'+f, document.getElementById(f)?.value || ''));
    checkboxes.forEach(f => localStorage.setItem('pixai_'+f, document.getElementById(f)?.checked || false));
}
function load() { 
    fields.forEach(f => { const v = localStorage.getItem('pixai_'+f); if(v && document.getElementById(f)) document.getElementById(f).value = v; });
    checkboxes.forEach(f => { if(document.getElementById(f)) document.getElementById(f).checked = localStorage.getItem('pixai_'+f) === 'true'; });
    applyRes(); loadHistory(); loadFavorites(); loadPresets();
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

function applyRes() {
    const v = document.getElementById('resolution').value;
    document.getElementById('customRes').style.display = v === 'custom' ? 'flex' : 'none';
    if (v !== 'custom') {
        const [w,h] = v.split('x');
        document.getElementById('width').value = w;
        document.getElementById('height').value = h;
    }
}

// History
function getHistory() { return JSON.parse(localStorage.getItem('pixai_history') || '[]'); }
function saveHistory(h) { localStorage.setItem('pixai_history', JSON.stringify(h.slice(0, 50))); }
function addToHistory(urls, prompt) {
    const h = getHistory();
    urls.forEach(url => h.unshift({ url, prompt, date: Date.now() }));
    saveHistory(h); loadHistory();
}
function loadHistory() {
    const h = getHistory();
    document.getElementById('historyGrid').innerHTML = h.map((item, i) => 
        '<div class="history-item" onclick="showModal(\\''+item.url+'\\')"><img src="'+item.url+'" loading="lazy"></div>'
    ).join('') || '<p style="color:#666">No history yet</p>';
}
function clearHistory() { if(confirm('Clear all history?')) { localStorage.removeItem('pixai_history'); loadHistory(); } }
function showModal(url) { document.getElementById('modalImg').src = url; document.getElementById('modal').style.display = 'flex'; }

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
        '<div class="fav-item"><span>'+item.prompt.substring(0,60)+'...</span><button class="btn-sm" onclick="useFavorite('+i+')">Use</button><button class="btn-sm btn-secondary" onclick="deleteFavorite('+i+')">✕</button></div>'
    ).join('') || '<p style="color:#666">No favorites yet. Click ⭐ Save next to the prompt field.</p>';
}
function useFavorite(i) { document.getElementById('prompt').value = getFavorites()[i].prompt; showTab('generate'); }
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
        cfg: document.getElementById('cfg').value, resolution: document.getElementById('resolution').value,
        facefix: document.getElementById('facefix').checked, date: Date.now()
    });
    savePresets(p); loadPresets();
}
function loadPresets() {
    const p = getPresets();
    document.getElementById('presetsList').innerHTML = p.map((item, i) => 
        '<div class="preset-item"><span>'+item.name+' ('+item.model.substring(0,10)+'...)</span><button class="btn-sm" onclick="usePreset('+i+')">Load</button><button class="btn-sm btn-secondary" onclick="deletePreset('+i+')">✕</button></div>'
    ).join('') || '<p style="color:#666">No presets yet. Click 💾 Save Preset to create one.</p>';
}
function usePreset(i) {
    const p = getPresets()[i];
    document.getElementById('model').value = p.model;
    document.getElementById('loras').value = p.loras || '';
    document.getElementById('sampler').value = p.sampler;
    document.getElementById('steps').value = p.steps;
    document.getElementById('cfg').value = p.cfg;
    document.getElementById('resolution').value = p.resolution;
    document.getElementById('facefix').checked = p.facefix;
    applyRes(); save(); showTab('generate');
}
function deletePreset(i) { const p = getPresets(); p.splice(i, 1); savePresets(p); loadPresets(); }

// Queue
let queue = [];
let sessionCredits = parseInt(localStorage.getItem('pixai_session_credits') || '0');
document.getElementById('sessionCost').textContent = sessionCredits;

function getQueue() { return queue; }
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
    document.getElementById('queueCount').textContent = queue.length ? '('+queue.length+')' : '';
    document.getElementById('queueList').innerHTML = queue.map((item, i) => 
        '<div class="preset-item"><span>'+item.prompt.substring(0,40)+'... ('+item.n+' imgs)</span><button class="btn-sm btn-secondary" onclick="removeFromQueue('+i+')">✕</button></div>'
    ).join('') || '<p style="color:#666">Queue is empty. Use "Add to Queue" button when generating.</p>';
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

// Cost tracking (estimates)
function trackCredits(count, facefix) {
    const cost = count * (facefix ? 2 : 1);
    sessionCredits += cost;
    localStorage.setItem('pixai_session_credits', sessionCredits);
    document.getElementById('sessionCost').textContent = sessionCredits;
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
    status.style.display = 'block';
    result.innerHTML = '';
    
    const loraObj = {};
    document.getElementById('loras').value.split(',').filter(l => l.trim()).forEach(l => {
        const [id, weight] = l.trim().split(':');
        if (id) loraObj[id.trim()] = parseFloat(weight) || 0.7;
    });
    
    const upscale = parseFloat(document.getElementById('upscale').value);
    const seed = parseInt(document.getElementById('seed').value);
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
        tile: document.getElementById('tile').checked || undefined
    };
    if (Object.keys(loraObj).length) body.loras = loraObj;
    
    try {
        status.textContent = '⏳ Generating ' + count + ' image(s)...';
        const res = await fetch('/v1', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
            body: JSON.stringify(body)
        });
        
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        if (data.data?.length) {
            status.textContent = '✅ Done!';
            const urls = data.data.map(d => d.url);
            addToHistory(urls, promptText);
            trackCredits(count, document.getElementById('facefix').checked);
            result.innerHTML = urls.map(url => '<div class="img-card"><img src="'+url+'" onclick="showModal(\\''+url+'\\')"><br><a href="'+url+'" download>Download</a></div>').join('');
        } else throw new Error('No images returned');
    } catch(e) {
        status.textContent = '❌ ' + e.message;
    } finally {
        btn.disabled = false;
    }
}
renderQueue();
</script></body></html>`));

// API endpoint
const handleGenerate = async (req, res) => {
    const { prompt, negative_prompt, width = 512, height = 768, model, n = 1, loras, facefix, upscale, upscaleDenoise, tile, steps, cfg_scale, sampler, seed } = req.body;
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`PixAI proxy running on http://localhost:${PORT}`));
