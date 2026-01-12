const express = require('express');
const app = express();
app.use(express.json());

const PIXAI_API = 'https://api.pixai.art/graphql';

app.post('/v1/images/generations', async (req, res) => {
    const { prompt, negative_prompt, width = 512, height = 512, model } = req.body;
    const apiKey = req.headers.authorization?.replace('Bearer ', '');
    
    if (!apiKey) return res.status(401).json({ error: 'API key required' });
    
    try {
        // Create generation task
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
                        modelId: model || '1648918127446573124', // Default anime model
                        samplingSteps: 25,
                        cfgScale: 7
                    }
                }
            })
        });
        
        const createData = await createRes.json();
        const taskId = createData.data?.generateImage?.task?.id;
        if (!taskId) throw new Error('Failed to create task');
        
        // Poll for completion
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
                const mediaId = task.outputs[0].mediaId;
                return res.json({
                    data: [{ url: `https://imagedelivery.net/5ejkUOtsMH5sf63fw6q33Q/${mediaId}/public` }]
                });
            }
            if (task?.status === 'failed') throw new Error('Generation failed');
        }
        throw new Error('Timeout');
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.listen(3000, () => console.log('PixAI proxy running on http://localhost:3000'));
