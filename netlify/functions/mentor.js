import { safeJsonParse, tryOpenAIChat, tryGeminiChat } from './_utils.js';

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({ error: 'method_not_allowed' }) };
  try {
    const body = JSON.parse(event.body || '{}');
    const message = (body.message || '').toString().slice(0, 4000);
    const code = (body.code || '').toString().slice(0, 10000);
    const language = body.language || 'JavaScript';
    const framework = body.framework;
    if (!message && !code) return { statusCode: 400, body: JSON.stringify({ error: 'message or code required' }) };

    const system = `Tu es un mentor patient pour debutants. Explique simplement et montre des exemples.`;
    const user = [framework ? `Contexte framework: ${framework}` : '', `Question: ${message}`, code ? `\nCode (${language}):\n${code}` : ''].filter(Boolean).join('\n');

    const openaiKey = process.env.OPENAI_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    let answer = null;
    if (openaiKey) answer = await tryOpenAIChat(openaiKey, system, user);
    if (!answer && geminiKey) answer = await tryGeminiChat(geminiKey, system, user);
    if (!answer) return { statusCode: 502, body: JSON.stringify({ error: 'ai_failed' }) };
    return { statusCode: 200, body: JSON.stringify({ answer }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: 'mentor_failed', message: String(e?.message || e) }) };
  }
};
