export function safeJsonParse(s) {
  try {
    if (!s || typeof s !== 'string') return null;
    return JSON.parse(s);
  } catch { return null; }
}

export async function tryOpenAIChat(apiKey, system, user, modelOverride) {
  if (!apiKey) return null;
  const url = 'https://api.openai.com/v1/chat/completions';
  const model = modelOverride || process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, temperature: 0.3, messages: [{ role: 'system', content: system }, { role: 'user', content: user }] })
  });
  if (!r.ok) return null;
  const data = await r.json();
  return data?.choices?.[0]?.message?.content ?? null;
}

export async function tryGeminiChat(geminiKey, system, user, modelOverride) {
  if (!geminiKey) return null;
  const model = modelOverride || process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: `${system}\n\n${user}` }] }] })
  });
  if (!r.ok) return null;
  const data = await r.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
}
