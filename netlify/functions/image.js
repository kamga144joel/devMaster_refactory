export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({ error: 'method_not_allowed' }) };
  try {
    const body = JSON.parse(event.body || '{}');
    const prompt = String(body.prompt || '').trim();
    const provider = body.provider || 'auto';
    if (!prompt) return { statusCode: 400, body: JSON.stringify({ error: 'missing_prompt' }) };

    const openaiKey = process.env.OPENAI_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;
    const hfKey = process.env.HUGGINGFACE_API_KEY;
    const deepaiKey = process.env.DEEPAI_API_KEY;

    const OPENAI_IMAGES_URL = 'https://api.openai.com/v1/images/generations';
    let lastError = null;

    async function genOpenAI() {
      if (!openaiKey) return null;
      const usedModel = process.env.OPENAI_IMAGE_MODEL || 'dall-e-3';
      const r = await fetch(OPENAI_IMAGES_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` }, body: JSON.stringify({ prompt, model: usedModel, size: body.size || '1024x1024', n: 1 }) });
      if (!r.ok) { lastError = { provider: 'openai', status: r.status, body: await r.text().catch(()=>'') }; return null; }
      const data = await r.json();
      const images = (data?.data || []).map(d=> ({ url: d.url, b64: d.b64_json }));
      return { images };
    }

    async function genGemini() {
      if (!geminiKey) return null;
      const model = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.0-flash-exp-image-generation';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseModalities: ['IMAGE'] } }) });
      if (!r.ok) { lastError = { provider: 'gemini', status: r.status, body: await r.text().catch(()=>'') }; return null; }
      const data = await r.json();
      const parts = data?.candidates?.[0]?.content?.parts || [];
      const images = parts.filter(p=> p?.inline_data?.data).map(p=> ({ b64: p.inline_data.data, mime: p.inline_data.mime_type }));
      return { images };
    }

    async function genHF() {
      if (!hfKey) return null;
      const hfModel = process.env.HUGGINGFACE_IMAGE_MODEL || 'stabilityai/stable-diffusion-2';
      const url = `https://api-inference.huggingface.co/models/${hfModel}`;
      const r = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${hfKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ inputs: prompt, options: { wait_for_model: true } }) });
      if (!r.ok) { lastError = { provider: 'huggingface', status: r.status, body: await r.text().catch(()=>'') }; return null; }
      const contentType = (r.headers.get('content-type') || '').toLowerCase();
      if (contentType.startsWith('image/')) {
        const arr = await r.arrayBuffer(); const buf = Buffer.from(arr); const b64 = buf.toString('base64'); return { images: [{ b64, mime: contentType }] };
      }
      const txt = await r.text().catch(()=>'');
      try { const parsed = JSON.parse(txt); const imgs = (parsed?.data || []).map(d=> ({ b64: d?.b64, mime: d?.mime || 'image/png' })); if (imgs.length) return { images: imgs }; } catch {}
      lastError = { provider: 'huggingface', status: 200, body: txt }; return null;
    }

    let out = null;
    if (provider === 'openai') out = await genOpenAI();
    else if (provider === 'gemini') out = await genGemini();
    else if (provider === 'huggingface') out = await genHF();
    else {
      out = await genOpenAI(); if (!out) out = await genGemini(); if (!out) out = await genHF();
    }
    if (!out) return { statusCode: 502, body: JSON.stringify({ error: 'image_generation_failed', detail: lastError }) };
    return { statusCode: 200, body: JSON.stringify(out) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: 'image_generation_error', message: String(e?.message || e) }) };
  }
};
