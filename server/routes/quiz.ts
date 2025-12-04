import type { RequestHandler } from "express";
import type { QuizRequestBody, QuizResponse } from "@shared/api";
import { safeJsonParse } from "../utils/safe-json";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

export const handleQuiz: RequestHandler = async (req, res) => {
  const { language, framework, topic = "bases", level = 1, translate = false } = req.body as QuizRequestBody & { translate?: boolean };
  const apiKey = process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const hfKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey && !geminiKey && !hfKey) return res.status(500).json({ error: "missing_keys" });

  const system = `Tu génères un quiz progressif pour ${language}${framework ? ` avec ${framework}` : ''}. Format JSON exact: {"questions":[{"q":"...","options":["A","B","C","D"],"answerIndex":1,"explain":"..."}]}.
- 5 questions courtes.
- options: 3 à 4 propositions.
- Niveau ${level} (1 débutant -> 5 avancé).`;
  const user = `Sujet: ${topic}`;

  // translation helper using HF model
  async function translateText(text: string) {
    if (!translate || !hfKey) return text;
    try {
      const model = process.env.HUGGINGFACE_TRANSLATE_MODEL || 'Helsinki-NLP/opus-mt-en-fr';
      const url = `https://api-inference.huggingface.co/models/${model}`;
      const r = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${hfKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs: text }),
      });
      if (!r.ok) return text;
      const txt = await r.text();
      try {
        const parsed = JSON.parse(txt);
        if (Array.isArray(parsed) && parsed[0]?.translation_text) return parsed[0].translation_text as string;
        if (Array.isArray(parsed) && parsed[0]?.generated_text) return parsed[0].generated_text as string;
        if (typeof parsed === 'string') return parsed;
      } catch {}
      return txt;
    } catch {
      return text;
    }
  }

  // Removed Open Trivia DB - using only AI providers for quiz generation

  async function tryOpenAI() {
    if (!apiKey) return null as QuizResponse | null;
    const r = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
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
    const parsed = safeJsonParse<QuizResponse>(content);
    if (parsed && translate && hfKey) {
      for (const item of parsed.questions || []) {
        try {
          item.q = await translateText(item.q);
          for (let i = 0; i < item.options.length; i++) item.options[i] = await translateText(item.options[i]);
          if (item.explain) item.explain = await translateText(item.explain);
        } catch {}
      }
    }
    return parsed;
  }

  async function tryGemini() {
    if (!geminiKey) return null as QuizResponse | null;
    const r = await fetch(`${GEMINI_API_URL}?key=${geminiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: `${system}\n${user}` }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    });
    if (!r.ok) return null;
    const data = (await r.json()) as any;
    const txt: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
    const parsed = safeJsonParse<QuizResponse>(txt);
    if (parsed && translate && hfKey) {
      for (const item of parsed.questions || []) {
        try {
          item.q = await translateText(item.q);
          for (let i = 0; i < item.options.length; i++) item.options[i] = await translateText(item.options[i]);
          if (item.explain) item.explain = await translateText(item.explain);
        } catch {}
      }
    }
    return parsed;
  }

  try {
    // Use only AI providers for quiz generation
    let result = await tryOpenAI();
    if (!result) result = await tryGemini();
    
    // If AI APIs fail, return error
    if (!result) {
      return res.status(502).json({ 
        error: "IA services unavailable", 
        message: "Les APIs IA ne sont pas disponibles. Vérifiez vos clés API OpenAI et Gemini." 
      });
    }
    
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: "quiz_failed", message: String(e?.message ?? e) });
  }
};
