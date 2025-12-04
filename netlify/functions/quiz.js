function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    // Try to extract JSON from markdown code blocks
    const match = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (match) {
      try {
        return JSON.parse(match[1]);
      } catch {}
    }
    return null;
  }
}

async function translateText(text, hfKey) {
  if (!hfKey) return text;
  try {
    const model = process.env.HUGGINGFACE_TRANSLATE_MODEL || 'Helsinki-NLP/opus-mt-en-fr';
    const url = `https://api-inference.huggingface.co/models/${model}`;
    const r = await fetch(url, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${hfKey}`, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ inputs: text }),
    });
    if (!r.ok) return text;
    const parsed = await r.json();
    if (Array.isArray(parsed) && parsed[0]?.translation_text) return parsed[0].translation_text;
    if (Array.isArray(parsed) && parsed[0]?.generated_text) return parsed[0].generated_text;
    return text;
  } catch {
    return text;
  }
}

async function tryOpenAI(apiKey, system, user, translate, hfKey) {
  if (!apiKey) return null;
  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${apiKey}` 
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    });
    if (!r.ok) return null;
    const data = await r.json();
    const content = data.choices?.[0]?.message?.content || '{}';
    const parsed = safeJsonParse(content);
    
    if (parsed && translate && hfKey && parsed.questions) {
      for (const item of parsed.questions) {
        try {
          item.q = await translateText(item.q, hfKey);
          for (let i = 0; i < item.options.length; i++) {
            item.options[i] = await translateText(item.options[i], hfKey);
          }
          if (item.explain) item.explain = await translateText(item.explain, hfKey);
        } catch {}
      }
    }
    return parsed;
  } catch {
    return null;
  }
}

async function tryGemini(geminiKey, system, user, translate, hfKey) {
  if (!geminiKey) return null;
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: `${system}\n${user}` }] }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    });
    if (!r.ok) return null;
    const data = await r.json();
    const txt = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const parsed = safeJsonParse(txt);
    
    if (parsed && translate && hfKey && parsed.questions) {
      for (const item of parsed.questions) {
        try {
          item.q = await translateText(item.q, hfKey);
          for (let i = 0; i < item.options.length; i++) {
            item.options[i] = await translateText(item.options[i], hfKey);
          }
          if (item.explain) item.explain = await translateText(item.explain, hfKey);
        } catch {}
      }
    }
    return parsed;
  } catch {
    return null;
  }
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      body: JSON.stringify({ error: 'method_not_allowed' }) 
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { language, framework, topic = 'bases', level = 1, translate = false } = body;
    
    const apiKey = process.env.OPENAI_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;
    const hfKey = process.env.HUGGINGFACE_API_KEY;
    
    if (!apiKey && !geminiKey) {
      return { 
        statusCode: 500, 
        body: JSON.stringify({ error: 'missing_keys' }) 
      };
    }

    const system = `Tu génères un quiz progressif pour ${language}${framework ? ` avec ${framework}` : ''}. Format JSON exact: {"questions":[{"q":"...","options":["A","B","C","D"],"answerIndex":1,"explain":"..."}]}.
- 5 questions courtes.
- options: 3 à 4 propositions.
- Niveau ${level} (1 débutant -> 5 avancé).`;
    const user = `Sujet: ${topic}`;

    let result = await tryOpenAI(apiKey, system, user, translate, hfKey);
    if (!result) result = await tryGemini(geminiKey, system, user, translate, hfKey);
    
    if (!result) {
      return { 
        statusCode: 502, 
        body: JSON.stringify({ 
          error: 'ai_failed',
          message: 'Les APIs IA ne sont pas disponibles'
        }) 
      };
    }

    return { 
      statusCode: 200, 
      body: JSON.stringify(result),
      headers: { 'Content-Type': 'application/json' }
    };
  } catch (e) {
    return { 
      statusCode: 500, 
      body: JSON.stringify({ 
        error: 'quiz_failed', 
        message: String(e?.message || e) 
      }) 
    };
  }
};
