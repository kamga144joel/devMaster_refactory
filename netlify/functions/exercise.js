import { safeJsonParse, tryOpenAIChat, tryGeminiChat } from './_utils.js';

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({ error: 'method_not_allowed' }) };
  try {
    const body = JSON.parse(event.body || '{}');
    const topic = String(body.topic || '').trim();
    const language = body.language || 'JavaScript';
    const framework = body.framework || '';
    if (!topic || topic.length < 2) return { statusCode: 400, body: JSON.stringify({ error: 'topic required' }) };

    const system = `Tu génères un petit exercice pour débutant en ${language}${framework?` avec ${framework}`:''}. Format JSON exact: {"title":"...","prompt":"...","starter":"...","solution":"..."}.`;
    const user = `Sujet: ${topic}`;

    const openaiKey = process.env.OPENAI_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    let result = null;
    if (openaiKey) {
      const txt = await tryOpenAIChat(openaiKey, system, user);
      const parsed = safeJsonParse(txt || '{}');
      if (parsed) result = { exercise: parsed };
    }
    if (!result && geminiKey) {
      const txt = await tryGeminiChat(geminiKey, system, user);
      const parsed = safeJsonParse(txt || '{}');
      if (parsed) result = { exercise: parsed };
    }
    if (!result) return { statusCode: 502, body: JSON.stringify({ error: 'ai_failed' }) };

    return { statusCode: 200, body: JSON.stringify(result) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: 'exercise_failed', message: String(e?.message || e) }) };
  }
};
