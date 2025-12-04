import type { RequestHandler } from "express";
import type { ChatRequestBody, ChatProvider } from "@shared/api";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

export const handleChat: RequestHandler = async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const deepaiKey = process.env.DEEPAI_API_KEY;
  if (!apiKey && !geminiKey && !deepaiKey) return res.status(500).json({ error: "missing_keys" });

  const body = req.body as ChatRequestBody & { provider?: ChatProvider; model?: string };
  const messages = body.messages?.slice(-30) ?? [];
  const provider: ChatProvider = (body.provider ?? "auto");
  const model = body.model?.trim();

  async function tryOpenAI() {
    if (!apiKey) return null as string | null;
    const usedModel = model || process.env.OPENAI_MODEL || "gpt-4o-mini";
    const r = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: usedModel, temperature: 0.5, messages }),
    });
    if (!r.ok) return null;
    const data = (await r.json()) as any;
    return data.choices?.[0]?.message?.content ?? null;
  }

  async function tryGemini() {
    if (!geminiKey) return null as string | null;
    const usedModel = model || process.env.GEMINI_MODEL || "gemini-1.5-flash";
    // Convert OpenAI-style messages to a single text prompt for Gemini
    const text = messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n\n");
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${usedModel}:generateContent?key=${geminiKey}`;
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text }] }] }),
    });
    if (!r.ok) return null;
    const data = (await r.json()) as any;
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
  }

  async function tryHuggingFace() {
    const hfKey = process.env.HUGGINGFACE_API_KEY;
    if (!hfKey) return null as string | null;
    const hfModel = process.env.HUGGINGFACE_CHAT_MODEL || "tiiuae/falcon-7b-instruct";
    // Convert messages to a single prompt (simple approach)
    const prompt = messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n\n") + "\n\nASSISTANT:";
    const url = `https://api-inference.huggingface.co/models/${hfModel}`;
    try {
      const r = await fetch(url, {
        method: "POST",
        headers: { "Authorization": `Bearer ${hfKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ inputs: prompt, parameters: { max_new_tokens: 512 } }),
      });
      if (!r.ok) return null;
      const txt = await r.text();
      // Some HF responses are JSON with generated_text
      try {
        const parsed = JSON.parse(txt);
        if (typeof parsed === 'string') return parsed;
        if (Array.isArray(parsed) && parsed.length && parsed[0].generated_text) return parsed[0].generated_text as string;
        if (parsed?.generated_text) return parsed.generated_text as string;
      } catch {}
      return txt;
    } catch (e:any) {
      return null;
    }
  }

  async function tryDeepAI() {
    const daKey = process.env.DEEPAI_API_KEY;
    if (!daKey) return null as string | null;
    try {
      const form = new URLSearchParams();
      const prompt = messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');
      form.append('text', prompt || '');
      const r = await fetch('https://api.deepai.org/api/text-generator', { method: 'POST', body: form, headers: { 'api-key': daKey } });
      if (!r.ok) return null;
      const data = await r.json().catch(()=>null) as any;
      return data?.output ?? data?.output_text ?? null;
    } catch { return null; }
  }

  // Helpers for image generation (reuse logic similar to server/routes/image.ts)
  async function genImageUsingProviders(promptText: string, providerPref?: ChatProvider) {
    const openaiKey = process.env.OPENAI_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;
    const hfKey = process.env.HUGGINGFACE_API_KEY;
    const daKey = process.env.DEEPAI_API_KEY;

    async function genOpenAIImage() {
      if (!openaiKey) return null as any;
      try {
        const url = "https://api.openai.com/v1/images/generations";
        const usedModel = process.env.OPENAI_IMAGE_MODEL || "dall-e-3";
        const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` }, body: JSON.stringify({ prompt: promptText, model: usedModel, size: '1024x1024', n: 1 }) });
        if (!r.ok) return null;
        const data = await r.json().catch(()=>null) as any;
        const images = (data?.data || []).map((d:any)=> ({ url: d.url || undefined, b64: d.b64_json || undefined, mime: d.b64_json ? 'image/png' : undefined }));
        if (!images.length) return null;
        return images;
      } catch { return null; }
    }

    async function genGeminiImage() {
      if (!geminiKey) return null as any;
      try {
        const model = process.env.GEMINI_IMAGE_MODEL || "gemini-2.0-flash-exp-image-generation";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
        const body = { contents: [{ parts: [{ text: promptText }] }], generationConfig: { responseModalities: ["IMAGE"] } } as any;
        const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (!r.ok) return null;
        const data = await r.json().catch(()=>null) as any;
        const parts = data?.candidates?.[0]?.content?.parts || [];
        const images = parts.filter((p:any)=> p?.inline_data?.data).map((p:any)=> ({ b64: p.inline_data.data, mime: p.inline_data.mime_type || 'image/png' }));
        if (!images.length) return null;
        return images;
      } catch { return null; }
    }

    async function genDeepAIImage() {
      if (!daKey) return null as any;
      try {
        const form = new URLSearchParams();
        form.append('text', promptText);
        const r = await fetch('https://api.deepai.org/api/text2img', { method: 'POST', body: form, headers: { 'api-key': daKey } });
        if (!r.ok) return null;
        const data = await r.json().catch(()=>null) as any;
        // DeepAI often returns an output_url or output array
        const url = data?.output_url || data?.output?.[0] || data?.output?.url;
        if (url) return [{ url }];
        return null;
      } catch { return null; }
    }

    async function genHuggingFaceImage() {
      if (!hfKey) return null as any;
      try {
        const hfModel = process.env.HUGGINGFACE_IMAGE_MODEL || "stabilityai/stable-diffusion-2";
        const url = `https://api-inference.huggingface.co/models/${hfModel}`;
        const r = await fetch(url, { method: 'POST', headers: { 'Authorization': `Bearer ${hfKey}`, 'Content-Type': 'application/json', 'Accept': '*/*' }, body: JSON.stringify({ inputs: promptText, options: { wait_for_model: true } }) });
        if (!r.ok) return null;
        const contentType = (r.headers.get('content-type')||'').toLowerCase();
        if (contentType.startsWith('image/')) {
          const arr = await r.arrayBuffer();
          const buf = Buffer.from(arr);
          return [{ b64: buf.toString('base64'), mime: contentType }];
        }
        const txt = await r.text().catch(()=>"");
        try {
          const parsed = JSON.parse(txt);
          if (parsed?.data && Array.isArray(parsed.data)) {
            const imgs = parsed.data.map((d:any)=> ({ b64: d?.b64 || d?.image || undefined, mime: d?.mime || 'image/png' })).filter(Boolean);
            if (imgs.length) return imgs;
          }
        } catch {}
        return null;
      } catch { return null; }
    }

    // prefer providerPref if provided
    if (providerPref === 'openai') return await genOpenAIImage();
    if (providerPref === 'gemini') return await genGeminiImage();
    if (providerPref === 'deepai') return await genDeepAIImage();
    if (providerPref === 'huggingface') return await genHuggingFaceImage();

    // auto
    let out = await genOpenAIImage();
    if (out) return out;
    out = await genGeminiImage();
    if (out) return out;
    out = await genDeepAIImage();
    if (out) return out;
    out = await genHuggingFaceImage();
    return out;
  }

  // Helpers for export (PDF/DOCX) returning base64
  async function genPdfFromText(content: string, title = 'Document') {
    const PDFDocument = (await import('pdfkit')).default;
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (c:any)=> chunks.push(Buffer.from(c)));
    const ended = new Promise<Buffer>((resolve, reject)=>{
      doc.on('end', ()=> resolve(Buffer.concat(chunks)));
      doc.on('error', (err:any)=> reject(err));
    });
    doc.fontSize(20).text(title, { underline: false });
    doc.moveDown();
    doc.fontSize(12).text(String(content), { align: 'left' });
    doc.end();
    const buf = await ended;
    return buf.toString('base64');
  }

  async function genDocxFromText(content: string, title = 'Document') {
    const { Document, Packer, Paragraph } = await import('docx');
    const paragraphs: any[] = String(content).split(/\n\n+/).map((block)=> new Paragraph(block.replace(/\n/g,'\n')));
    const doc = new Document({ sections: [{ properties: {}, children: paragraphs }] });
    const buffer = await Packer.toBuffer(doc as any);
    return buffer.toString('base64');
  }

  try {
    // check if last user message is a command
    const lastUser = messages.length ? messages[messages.length-1] : null;
    const lastContent = lastUser?.role === 'user' ? String(lastUser.content || '') : '';

    if (lastContent.startsWith('/image')) {
      // /image <prompt>
      const parts = lastContent.split(/\s+/, 2);
      const promptText = lastContent.slice(7).trim() || messages.slice(0,-1).map(m=> (m.role==='user'? 'User: '+m.content : 'Assistant: '+m.content)).join('\n');
      const imgs = await genImageUsingProviders(promptText, provider);
      if (!imgs) return res.status(502).json({ error: 'image_generation_failed' });
      // return a special formatted reply containing images as base64
      return res.json({ reply: `__IMAGES__${JSON.stringify({ images: imgs })}` });
    }

    if (lastContent.startsWith('/export')) {
      // /export pdf or /export docx
      const tokens = lastContent.split(/\s+/);
      const fmt = tokens[1] === 'docx' ? 'docx' : 'pdf';
      // get last assistant content
      const lastAssistant = messages.slice().reverse().find(m=> m.role === 'assistant')?.content || '';
      const title = 'Export';
      if (fmt === 'pdf') {
        const b64 = await genPdfFromText(lastAssistant, title);
        return res.json({ reply: `__FILE__${JSON.stringify({ filename: `${title}.pdf`, b64, mime: 'application/pdf' })}` });
      } else {
        const b64 = await genDocxFromText(lastAssistant, title);
        return res.json({ reply: `__FILE__${JSON.stringify({ filename: `${title}.docx`, b64, mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })}` });
      }
    }

    let reply: string | null = null;
    if (provider === "openai") reply = await tryOpenAI();
    else if (provider === "gemini") reply = await tryGemini();
    else if (provider === "huggingface") reply = await tryHuggingFace();
    else if (provider === "deepai") reply = await tryDeepAI();
    else {
      reply = await tryOpenAI();
      if (!reply) reply = await tryGemini();
      if (!reply) reply = await tryDeepAI();
      if (!reply) reply = await tryHuggingFace();
    }
    if (!reply) return res.status(502).json({ error: "ai_failed" });
    res.json({ reply });
  } catch (e: any) {
    res.status(500).json({ error: "chat_failed", message: String(e?.message ?? e) });
  }
};
