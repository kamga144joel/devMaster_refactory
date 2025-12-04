import type { RequestHandler } from "express";
import type { MentorRequestBody } from "@shared/api";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

export const handleMentor: RequestHandler = async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!apiKey && !geminiKey) {
    res.status(500).json({ error: "Missing OPENAI_API_KEY and GEMINI_API_KEY" });
    return;
  }

  const body = req.body as MentorRequestBody;
  const message = (body.message ?? "").slice(0, 4000);
  const code = (body.code ?? "").slice(0, 10000);
  const language = body.language ?? "JavaScript";
  const framework = body.framework;

  if (!message && !code) {
    res.status(400).json({ error: "message or code required" });
    return;
  }

  const system = `Tu es un mentor patient pour débutants en programmation.\n- Explique simplement, étape par étape.\n- Montre de petits exemples minimalistes.\n- Si du code est fourni, détecte erreurs et propose une version corrigée.\n- Fournis une checklist des points clés à retenir.\n- Évite le jargon inutile.`;

  const user = [
    framework ? `Contexte framework: ${framework}` : "",
    `Question: ${message}`,
    code ? `\nCode (${language}${framework ? ` / ${framework}` : ""}):\n\n${code}` : "",
  ].filter(Boolean).join("\n");

  async function tryOpenAI() {
    if (!apiKey) return null as string | null;
    const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
    const resp = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (!resp.ok) return null;
    const data = (await resp.json()) as any;
    return (data.choices?.[0]?.message?.content as string) ?? null;
  }

  async function tryGemini() {
    if (!geminiKey) return null as string | null;
    const r = await fetch(`${GEMINI_API_URL}?key=${geminiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          { role: "user", parts: [{ text: `${system}\n\n${user}` }] },
        ],
      }),
    });
    if (!r.ok) return null;
    const data = (await r.json()) as any;
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
  }

  try {
    let answer = await tryOpenAI();
    if (!answer) answer = await tryGemini();
    if (!answer) {
      return res.status(502).json({ error: "ai_failed" });
    }
    res.json({ answer });
  } catch (err: any) {
    res.status(500).json({ error: "mentor_failed", message: String(err?.message ?? err).slice(0, 300) });
  }
};
