const express = require('express');
const session = require('express-session');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: process.env.SESSION_SECRET || 'change-me-in-production', resave: false, saveUninitialized: false }));

const PIXAI_API = 'https://api.pixai.art/graphql';
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
#result{margin-top:20px;text-align:center}
#result img{max-width:100%;border-radius:8px;margin-top:10px}
#status{padding:12px;background:#0f0f23;border-radius:6px;margin-top:12px;display:none}
.info{background:#0f0f23;padding:12px;border-radius:6px;font-size:13px;color:#888;margin-top:12px}
.info code{background:#1a1a2e;padding:2px 6px;border-radius:4px;color:#e94560}
</style></head><body>
<div class="container">
<div class="header"><div><h1>🎨 PixAI Proxy</h1><small style="color:#666">Image Generation Dashboard</small></div><a href="/logout" class="logout">Logout</a></div>

<div class="card">
<label>PixAI API Key</label>
<input type="password" id="apiKey" placeholder="Get from pixai.art/settings/api">

<label>Prompt</label>
<textarea id="prompt" placeholder="a cute anime girl, detailed, colorful"></textarea>

<label>Negative Prompt</label>
<textarea id="negative" placeholder="bad quality, blurry, deformed">lowres, bad anatomy, bad hands, text, error, worst quality, low quality, blurry</textarea>

<div class="row">
<div><label>Width</label><input type="number" id="width" value="512" step="64" min="256" max="1024"></div>
<div><label>Height</label><input type="number" id="height" value="512" step="64" min="256" max="1024"></div>
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

<button onclick="generate()" id="genBtn">🎨 Generate Image</button>
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
async function generate() {
    const btn = document.getElementById('genBtn');
    const status = document.getElementById('status');
    const result = document.getElementById('result');
    const apiKey = document.getElementById('apiKey').value;
    const style = document.getElementById('style').value;
    
    if (!apiKey) return alert('Enter your PixAI API key');
    if (!document.getElementById('prompt').value) return alert('Enter a prompt');
    
    btn.disabled = true;
    btn.textContent = 'Generating...';
    status.style.display = 'block';
    status.textContent = '⏳ Creating task...';
    result.innerHTML = '';
    
    try {
        const res = await fetch('/v1/images/generations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
            body: JSON.stringify({
                prompt: style + document.getElementById('prompt').value,
                negative_prompt: document.getElementById('negative').value,
                width: parseInt(document.getElementById('width').value),
                height: parseInt(document.getElementById('height').value),
                model: document.getElementById('model').value
            })
        });
        
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        if (data.data?.[0]?.url) {
            status.textContent = '✅ Done!';
            result.innerHTML = '<img src="' + data.data[0].url + '"><br><a href="' + data.data[0].url + '" download style="color:#e94560">Download</a>';
        } else throw new Error('No image returned');
    } catch(e) {
        status.textContent = '❌ Error: ' + e.message;
    } finally {
        btn.disabled = false;
        btn.textContent = '🎨 Generate Image';
    }
}
</script></body></html>`));

// API endpoint
app.post('/v1/images/generations', async (req, res) => {
    const { prompt, negative_prompt, width = 512, height = 512, model } = req.body;
    const apiKey = req.headers.authorization?.replace('Bearer ', '');
    
    if (!apiKey) return res.status(401).json({ error: 'API key required' });
    
    try {
        const createRes = await fetch(PIXAI_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({
                query: `mutation($input: GenerateImageInput!) { generateImage(input: $input) { task { id } } }`,
                variables: {
                    input: {
                        prompts: prompt,
                        negativePrompts: negative_prompt || '',
                        width, height,
                        modelId: model || '1648918127446573124',
                        samplingSteps: 25,
                        cfgScale: 7
                    }
                }
            })
        });
        
        const createData = await createRes.json();
        const taskId = createData.data?.generateImage?.task?.id;
        if (!taskId) throw new Error(createData.errors?.[0]?.message || 'Failed to create task');
        
        for (let i = 0; i < 60; i++) {
            await new Promise(r => setTimeout(r, 2000));
            
            const statusRes = await fetch(PIXAI_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                body: JSON.stringify({
                    query: `query($id: ID!) { task(id: $id) { status outputs { mediaId } } }`,
                    variables: { id: taskId }
                })
            });
            
            const statusData = await statusRes.json();
            const task = statusData.data?.task;
            
            if (task?.status === 'completed' && task.outputs?.[0]?.mediaId) {
                return res.json({
                    data: [{ url: `https://imagedelivery.net/5ejkUOtsMH5sf63fw6q33Q/${task.outputs[0].mediaId}/public` }]
                });
            }
            if (task?.status === 'failed') throw new Error('Generation failed');
        }
        throw new Error('Timeout');
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`PixAI proxy running on http://localhost:${PORT}`));
