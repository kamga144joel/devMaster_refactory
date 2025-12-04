import { safeJsonParse, tryOpenAIChat, tryGeminiChat } from './_utils.js';

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({ error: 'method_not_allowed' }) };
  try {
    const body = JSON.parse(event.body || '{}');
    const term = String(body.term || body.query || '').trim();
    const language = body.language || '';
    const framework = body.framework || '';
    if (!term) return { statusCode: 400, body: JSON.stringify({ error: 'missing_term' }) };

    const sys = `Tu es un assistant pédagogique. Retourne UNIQUEMENT un JSON valide sans explication.`;
    const user = `Crée une fiche de glossaire claire pour le terme: "${term}"${language?`, dans le contexte du langage ${language}`:''}${framework?`, et du framework ${framework}`:''}. Exemple de structure: {"key":"${term}","title":"","desc":"","code":""}`;

    const openaiKey = process.env.OPENAI_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    let out = null;
    if (openaiKey) {
      const txt = await tryOpenAIChat(openaiKey, sys, user);
      const parsed = safeJsonParse(txt || '');
      if (parsed && parsed.key) out = { item: { key: String(parsed.key), title: String(parsed.title || ''), desc: String(parsed.desc || ''), code: String(parsed.code || '') } };
    }
    if (!out && geminiKey) {
      const txt = await tryGeminiChat(geminiKey, sys, user);
      const parsed = safeJsonParse(txt || '');
      if (parsed && parsed.key) out = { item: { key: String(parsed.key), title: String(parsed.title || ''), desc: String(parsed.desc || ''), code: String(parsed.code || '') } };
    }
    if (!out) return { statusCode: 502, body: JSON.stringify({ error: 'ai_failed' }) };
    return { statusCode: 200, body: JSON.stringify(out) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: 'glossary_failed', message: String(e?.message || e) }) };
  }
};
