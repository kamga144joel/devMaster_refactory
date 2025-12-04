import type { RequestHandler } from "express";
import type { CourseRequestBody, CourseResponse } from "@shared/api";
import { safeJsonParse } from "../utils/safe-json";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

export const handleCourse: RequestHandler = async (req, res) => {
  const { language, framework, topic = "bases", steps = 5 } = req.body as CourseRequestBody;
  const apiKey = process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!apiKey && !geminiKey) return res.status(500).json({ error: "missing_keys" });

  const system = `Génère un mini plan de cours progressif (${steps} étapes) pour apprendre ${language}${framework ? ` avec ${framework}` : ''}. Format JSON exact: {"steps":[{"title":"...","summary":"...","objectives":["..."],"codeExample":"..."}]}.`;
  const user = `Sujet: ${topic}`;

  async function tryOpenAI() {
    if (!apiKey) return null as CourseResponse | null;
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
    const parsed = safeJsonParse<CourseResponse>(content);
    return parsed;
  }

  async function tryGemini() {
    if (!geminiKey) return null as CourseResponse | null;
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
    const parsed = safeJsonParse<CourseResponse>(txt);
    return parsed;
  }

  try {
    let result = await tryOpenAI();
    if (!result) result = await tryGemini();
    if (!result) return res.status(502).json({ error: "ai_failed" });
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: "course_failed", message: String(e?.message ?? e) });
  }
};
