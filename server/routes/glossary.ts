import type { RequestHandler } from "express";
import type { GlossaryRequestBody, GlossaryResponse } from "@shared/api";
import { safeJsonParse } from "../utils/safe-json";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

export const handleGlossary: RequestHandler = async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!apiKey && !geminiKey) return res.status(500).json({ error: "missing_keys" });

  const { term, language, framework } = (req.body || {}) as GlossaryRequestBody;
  const t = String(term || "").trim();
  if (!t) return res.status(400).json({ error: "missing_term" });

  const sys = `Tu es un assistant pédagogique. Retourne UNIQUEMENT un JSON valide sans explication.`;
  const user = `Crée une fiche de glossaire claire pour le terme: "${t}"${language ? `, dans le contexte du langage ${language}` : ''}${framework ? ` et du framework ${framework}` : ''}.
Exemple de structure demandée:
{
  "key": "variables",
  "title": "Variables",
  "desc": "Définition simple et concrète (1-3 phrases).",
  "code": "un court extrait de code lié au langage/framework s'il est précisé"
}`;

  async function tryOpenAI() {
    if (!apiKey) return null as GlossaryResponse | null;
    const r = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        temperature: 0.2,
        messages: [ { role: "system", content: sys }, { role: "user", content: user } ],
        response_format: { type: "json_object" }
      }),
    });
    if (!r.ok) return null;
    const data = (await r.json()) as any;
    const text = data.choices?.[0]?.message?.content ?? "";
    const parsed = safeJsonParse(text);
    if (!parsed || !parsed.key) return null;
    return { item: { key: String(parsed.key), title: String(parsed.title), desc: String(parsed.desc), code: String(parsed.code ?? "") } };
  }

  async function tryGemini() {
    if (!geminiKey) return null as GlossaryResponse | null;
    const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: `${sys}\n\n${user}` }] }], generationConfig: { responseMimeType: "application/json" } }),
    });
    if (!r.ok) return null;
    const data = (await r.json()) as any;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const parsed = safeJsonParse(text);
    if (!parsed || !parsed.key) return null;
    return { item: { key: String(parsed.key), title: String(parsed.title), desc: String(parsed.desc), code: String(parsed.code ?? "") } };
  }

  try {
    let out = await tryOpenAI();
    if (!out) out = await tryGemini();
    if (!out) return res.status(502).json({ error: "ai_failed" });
    res.json(out);
  } catch (e: any) {
    res.status(500).json({ error: "glossary_failed", message: String(e?.message ?? e) });
  }
};
