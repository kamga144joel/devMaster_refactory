import type { RequestHandler } from "express";
import type { ImageRequestBody, ImageProvider } from "@shared/api";

const OPENAI_IMAGES_URL = "https://api.openai.com/v1/images/generations";
const GEMINI_IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.0-flash-exp-image-generation";

export const handleImage: RequestHandler = async (req, res) => {
  const openaiKey = process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const hfKey = process.env.HUGGINGFACE_API_KEY;
  const deepaiKey = process.env.DEEPAI_API_KEY;
  if (!openaiKey && !geminiKey && !hfKey && !deepaiKey) return res.status(500).json({ error: "missing_keys" });

  const { prompt, provider = "auto", model, size = "1024x1024", n = 1 } = (req.body || {}) as ImageRequestBody & { provider?: ImageProvider };
  if (!prompt || typeof prompt !== "string") return res.status(400).json({ error: "missing_prompt" });

  let lastError: any = null;

  async function genOpenAI() {
    if (!openaiKey) return null as any;
    const usedModel = model || process.env.OPENAI_IMAGE_MODEL || "dall-e-3";
    const r = await fetch(OPENAI_IMAGES_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${openaiKey}` },
      body: JSON.stringify({ prompt, model: usedModel, size, n: Math.max(1, Math.min(1, n)) }), // DALL��E 3 supports n=1
    });
    if (!r.ok) {
      const body = await r.text().catch(() => "");
      lastError = { provider: "openai", status: r.status, body };
      return null;
    }
    const data = (await r.json()) as any;
    const images = (data?.data || []).map((d: any)=> ({ url: d.url || undefined, b64: d.b64_json || undefined, mime: d.b64_json ? "image/png" : undefined }));
    if (!images.length) { lastError = { provider: "openai", status: 200, body: "no_images" }; return null; }
    return { images };
  }

  async function genGemini() {
    if (!geminiKey) return null as any;
    const usedModel = model || GEMINI_IMAGE_MODEL;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${usedModel}:generateContent?key=${geminiKey}`;
    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ["IMAGE"] },
    } as any;
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!r.ok) {
      const b = await r.text().catch(() => "");
      lastError = { provider: "gemini", status: r.status, body: b };
      return null;
    }
    const data = (await r.json()) as any;
    const parts = data?.candidates?.[0]?.content?.parts || [];
    const images = parts
      .filter((p: any)=> p?.inline_data?.data)
      .map((p: any)=> ({ b64: p.inline_data.data, mime: p.inline_data.mime_type || "image/png" }));
    if (!images.length) { lastError = { provider: "gemini", status: 200, body: "no_images" }; return null; }
    return { images };
  }

  async function genHuggingFace() {
    const hfKey = process.env.HUGGINGFACE_API_KEY;
    if (!hfKey) return null as any;
    const hfModel = process.env.HUGGINGFACE_IMAGE_MODEL || "stabilityai/stable-diffusion-2";
    const url = `https://api-inference.huggingface.co/models/${hfModel}`;
    try {
      const r = await fetch(url, {
        method: "POST",
        headers: { "Authorization": `Bearer ${hfKey}`, "Content-Type": "application/json", "Accept": "*/*" },
        body: JSON.stringify({ inputs: prompt, options: { wait_for_model: true } }),
      });
      if (!r.ok) {
        const b = await r.text().catch(() => "");
        lastError = { provider: "huggingface", status: r.status, body: b };
        return null;
      }
      const contentType = (r.headers.get("content-type") || "").toLowerCase();
      if (contentType.startsWith("image/")) {
        const arr = await r.arrayBuffer();
        const buf = Buffer.from(arr);
        const b64 = buf.toString("base64");
        return { images: [{ b64, mime: contentType }] };
      }
      // Some endpoints return JSON with base64 data
      const txt = await r.text().catch(() => "");
      try {
        const parsed = JSON.parse(txt);
        if (parsed?.data && Array.isArray(parsed.data)) {
          const imgs = parsed.data.map((d: any) => ({ b64: d?.b64 || d?.image || undefined, mime: d?.mime || 'image/png' })).filter(Boolean);
          if (imgs.length) return { images: imgs };
        }
      } catch (_) {}
      lastError = { provider: "huggingface", status: 200, body: txt };
      return null;
    } catch (e:any) {
      lastError = { provider: "huggingface", error: String(e?.message ?? e) };
      return null;
    }
  }

  async function genDeepAI() {
    const daKey = process.env.DEEPAI_API_KEY;
    if (!daKey) return null as any;
    try {
      const form = new URLSearchParams();
      form.append('text', prompt);
      const r = await fetch('https://api.deepai.org/api/text2img', { method: 'POST', body: form, headers: { 'api-key': daKey } });
      if (!r.ok) {
        const b = await r.text().catch(() => "");
        lastError = { provider: 'deepai', status: r.status, body: b };
        return null;
      }
      const data = await r.json().catch(()=>null) as any;
      const url = data?.output_url || (Array.isArray(data?.output) && data.output[0]) || data?.output?.url;
      if (url) return { images: [{ url }] };
      lastError = { provider: 'deepai', status: 200, body: JSON.stringify(data) };
      return null;
    } catch (e:any) {
      lastError = { provider: 'deepai', error: String(e?.message ?? e) };
      return null;
    }
  }

  try {
    let out: any = null;
    if (provider === "openai") out = await genOpenAI();
    else if (provider === "gemini") out = await genGemini();
    else if (provider === "huggingface") out = await genHuggingFace();
    else if (provider === "deepai") out = await genDeepAI();
    else {
      out = await genOpenAI();
      if (!out) out = await genGemini();
      if (!out) out = await genDeepAI();
      if (!out) out = await genHuggingFace();
    }
    if (!out) return res.status(502).json({ error: "image_generation_failed", detail: lastError });
    res.json(out);
  } catch (e: any) {
    res.status(500).json({ error: "image_generation_error", message: String(e?.message ?? e) });
  }
};
