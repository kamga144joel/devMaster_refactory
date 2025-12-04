import { tryOpenAIChat, tryGeminiChat } from './_utils.js';

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({ error: 'method_not_allowed' }) };
  try {
    const body = JSON.parse(event.body || '{}');
    const messages = Array.isArray(body.messages) ? body.messages : (body.message ? [{ role: 'user', content: String(body.message) }] : []);
    if (!messages.length) return { statusCode: 400, body: JSON.stringify({ error: 'messages required' }) };

    const apiKey = process.env.OPENAI_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    const system = 'You are a helpful assistant.';
    const user = messages.map(m=> `${m.role}: ${m.content}`).join('\n');

    let reply = null;
    if (apiKey) reply = await tryOpenAIChat(apiKey, system, user, body.model);
    if (!reply && geminiKey) reply = await tryGeminiChat(geminiKey, system, user, body.model);
    if (!reply) return { statusCode: 502, body: JSON.stringify({ error: 'ai_failed' }) };
    return { statusCode: 200, body: JSON.stringify({ reply }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: 'chat_failed', message: String(e?.message || e) }) };
  }
};
