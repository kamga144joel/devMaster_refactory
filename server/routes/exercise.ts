import type { RequestHandler } from "express";
import type { ExerciseRequestBody, ExerciseResponse } from "@shared/api";
import { safeJsonParse } from "../utils/safe-json";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

export const handleExercise: RequestHandler = async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!apiKey && !geminiKey) return res.status(500).json({ error: "Missing OPENAI_API_KEY and GEMINI_API_KEY" });

  const { topic, language = "JavaScript", framework, translate = false } = req.body as ExerciseRequestBody & { translate?: boolean };
  if (!topic || topic.length < 2) {
    return res.status(400).json({ error: "topic required" });
  }

  const system = `Tu génères un petit exercice pour débutant en ${language}${framework ? ` avec ${framework}` : ""}. Format JSON exact: {"title":"...","prompt":"...","starter":"...","solution":"..."}.\n- Exercice réalisable en < 5 minutes.\n- starter est un squelette minimal.\n- solution tient en 10 lignes max.`;
  const user = `Sujet: ${topic}`;

  async function tryOpenAI() {
    if (!apiKey) return null as ExerciseResponse | null;
    const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
    const r = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (!r.ok) return null;
    const data = (await r.json()) as any;
    const content = data.choices?.[0]?.message?.content ?? "{}";
    const parsed = safeJsonParse<any>(content);
    if (!parsed) return null;
    return { exercise: parsed } as ExerciseResponse;
  }

  async function tryGemini() {
    if (!geminiKey) return null as ExerciseResponse | null;
    const r = await fetch(`${GEMINI_API_URL}?key=${geminiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: `${system}\nSujet: ${topic}` }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    });
    if (!r.ok) return null;
    const data = (await r.json()) as any;
    const txt: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
    const parsed = safeJsonParse<any>(txt);
    if (!parsed) return null;
    return { exercise: parsed } as ExerciseResponse;
  }

  try {
    let result = await tryOpenAI();
    if (!result) result = await tryGemini();
    if (!result) return res.status(502).json({ error: "ai_failed" });

    // translate exercise fields if requested and HF key present
    const hfKey = process.env.HUGGINGFACE_API_KEY;
    if (translate && hfKey && result?.exercise) {
      try {
        const model = process.env.HUGGINGFACE_TRANSLATE_MODEL || 'Helsinki-NLP/opus-mt-en-fr';
        const url = `https://api-inference.huggingface.co/models/${model}`;
        const fields = ['title','prompt','starter','solution'];
        const texts = fields.map(f=> String(result.exercise[f] || ''));
        const r = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${hfKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ inputs: texts }) });
        if (r.ok) {
          const txt = await r.text();
          try {
            const parsed = JSON.parse(txt);
            const out: string[] = [];
            if (Array.isArray(parsed)) {
              for (const p of parsed) {
                if (p?.translation_text) out.push(p.translation_text);
                else if (p?.generated_text) out.push(p.generated_text);
                else if (typeof p === 'string') out.push(p);
                else out.push('');
              }
            } else if (typeof parsed === 'string') out.push(parsed);
            if (out.length === texts.length) {
              for (let i=0;i<fields.length;i++) result.exercise[fields[i]] = out[i] || result.exercise[fields[i]];
            }
          } catch (e:any) {
            // ignore
          }
        }
      } catch {}
    }

    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: "exercise_failed", message: String(e?.message ?? e).slice(0, 300) });
  }
};
