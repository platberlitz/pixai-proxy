const express = require('express');
const session = require('express-session');
const app = express();

app.use(express.json());
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
.container{max-width:800px;margin:0 auto}
h1{color:#e94560;margin-bottom:5px}
.header{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:10px}
.logout{color:#888;text-decoration:none;font-size:14px}.logout:hover{color:#e94560}
.card{background:#16213e;padding:20px;border-radius:12px;margin-bottom:20px}
label{display:block;margin:12px 0 4px;font-size:14px;color:#aaa}
input,textarea,select{width:100%;padding:10px;border:1px solid #333;border-radius:6px;background:#0f0f23;color:#fff;font-size:14px}
textarea{resize:vertical;min-height:80px}
.row{display:flex;gap:12px}.row>*{flex:1}
button{padding:12px 24px;background:#e94560;border:none;border-radius:6px;color:#fff;font-size:16px;cursor:pointer;margin-top:16px}
button:hover{background:#ff6b6b}button:disabled{background:#555;cursor:wait}
#result{margin-top:20px;display:flex;flex-wrap:wrap;gap:10px;justify-content:center}
#result img{max-width:100%;border-radius:8px}
#status{padding:12px;background:#0f0f23;border-radius:6px;margin-top:12px;display:none}
.info{background:#0f0f23;padding:12px;border-radius:6px;font-size:13px;color:#888;margin-top:12px}
.info code{background:#1a1a2e;padding:2px 6px;border-radius:4px;color:#e94560}
.img-card{background:#0f0f23;padding:8px;border-radius:8px;text-align:center}
.img-card a{color:#e94560;font-size:12px}
</style></head><body>
<div class="container">
<div class="header"><div><h1>🎨 PixAI Proxy</h1><small style="color:#666">Image Generation Dashboard</small></div><a href="/logout" class="logout">Logout</a></div>

<div class="card">
<label>PixAI API Key</label>
<input type="password" id="apiKey" placeholder="Get from pixai.art/en/profile/edit/api">

<label>Prompt</label>
<textarea id="prompt" placeholder="describe your image">masterpiece, best quality, highly detailed, sharp focus, </textarea>

<label>Negative Prompt</label>
<textarea id="negative">lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry, deformed, ugly, duplicate, morbid, mutilated, out of frame, mutation, disfigured, poorly drawn hands, poorly drawn face, extra limbs, malformed limbs, fused fingers, too many fingers, long neck</textarea>

<label>LoRAs (id:weight, comma-separated)</label>
<input id="loras" placeholder="1744880666293972790:0.7">

<div class="row">
<div><label>Resolution</label>
<select id="resolution" onchange="applyRes()">
<option value="512x512">512×512 (Square)</option>
<option value="512x768" selected>512×768 (Portrait)</option>
<option value="768x512">768×512 (Landscape)</option>
<option value="640x640">640×640 (Square HD)</option>
<option value="640x960">640×960 (Portrait HD)</option>
<option value="960x640">960×640 (Landscape HD)</option>
<option value="768x768">768×768 (Square XL)</option>
<option value="768x1024">768×1024 (Portrait XL)</option>
<option value="1024x768">1024×768 (Landscape XL)</option>
<option value="1024x1024">1024×1024 (Square Max)</option>
<option value="custom">Custom</option>
</select></div>
<div><label>Count</label>
<select id="count">
<option value="1">1 image</option>
<option value="2">2 images</option>
<option value="4" selected>4 images</option>
</select></div>
</div>

<div class="row" id="customRes" style="display:none">
<div><label>Width</label><input type="number" id="width" value="512" step="64" min="512" max="1280"></div>
<div><label>Height</label><input type="number" id="height" value="768" step="64" min="512" max="1280"></div>
</div>

<div class="row">
<div><label>Model ID</label><input id="model" value="1648918127446573124" placeholder="PixAI model ID"></div>
<div><label>Style</label>
<select id="style">
<option value="">None</option>
<option value="anime style, ">Anime</option>
<option value="realistic, photorealistic, ">Realistic</option>
<option value="cartoon style, ">Cartoon</option>
<option value="oil painting, ">Oil Painting</option>
<option value="watercolor, ">Watercolor</option>
</select></div>
</div>

<button onclick="generate()" id="genBtn">🎨 Generate Images</button>
<div id="status"></div>
</div>

<div id="result"></div>

<div class="info">
<strong>API Endpoint:</strong> <code>POST <span id="endpoint"></span>/v1/images/generations</code><br><br>
Use with SillyTavern Quick Image Gen: set Proxy URL to <code><span id="endpoint2"></span>/v1/images/generations</code>
</div>
<script>document.getElementById('endpoint').textContent=location.origin;document.getElementById('endpoint2').textContent=location.origin;</script>
</div>

<script>
const fields = ['apiKey','prompt','negative','loras','resolution','count','width','height','model','style'];
function save() { fields.forEach(f => localStorage.setItem('pixai_'+f, document.getElementById(f).value)); }
function load() { fields.forEach(f => { const v = localStorage.getItem('pixai_'+f); if(v) document.getElementById(f).value = v; }); applyRes(); }
window.onload = load;
fields.forEach(f => document.getElementById(f)?.addEventListener('change', save));
fields.forEach(f => document.getElementById(f)?.addEventListener('input', save));

function applyRes() {
    const v = document.getElementById('resolution').value;
    document.getElementById('customRes').style.display = v === 'custom' ? 'flex' : 'none';
    if (v !== 'custom') {
        const [w,h] = v.split('x');
        document.getElementById('width').value = w;
        document.getElementById('height').value = h;
    }
}

async function generate() {
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
    
    const body = {
        prompt: style + document.getElementById('prompt').value,
        negative_prompt: document.getElementById('negative').value,
        width: parseInt(document.getElementById('width').value),
        height: parseInt(document.getElementById('height').value),
        model: document.getElementById('model').value,
        n: count
    };
    if (Object.keys(loraObj).length) body.loras = loraObj;
    
    try {
        status.textContent = '⏳ Creating ' + count + ' image(s)...';
        const res = await fetch('/v1/images/generations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
            body: JSON.stringify(body)
        });
        
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        if (data.data?.length) {
            status.textContent = '✅ Done!';
            result.innerHTML = data.data.map(d => '<div class="img-card"><img src="' + d.url + '"><br><a href="' + d.url + '" download>Download</a></div>').join('');
        } else throw new Error('No images returned');
    } catch(e) {
        status.textContent = '❌ Error: ' + e.message;
    } finally {
        btn.disabled = false;
    }
}
</script></body></html>`));

// API endpoint
const handleGenerate = async (req, res) => {
    const { prompt, negative_prompt, width = 512, height = 768, model, n = 1, loras } = req.body;
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
        if (loras && Object.keys(loras).length) params.lora = loras;
        
        const createRes = await fetch(`${PIXAI_API}/task`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({ parameters: params })
        });
        
        const createData = await createRes.json();
        if (!createData.id) throw new Error(createData.message || 'Failed to create task');
        const taskId = createData.id;
        
        for (let i = 0; i < 60; i++) {
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
