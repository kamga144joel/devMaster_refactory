export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({ error: 'method_not_allowed' }) };
  try {
    const body = JSON.parse(event.body || '{}');
    const { email, name } = body;
    if (!email) return { statusCode: 400, body: JSON.stringify({ error: 'missing_email' }) };

    const MJ_APIKEY_PUBLIC = process.env.MJ_APIKEY_PUBLIC;
    const MJ_APIKEY_PRIVATE = process.env.MJ_APIKEY_PRIVATE;
    const MJ_FROM_EMAIL = process.env.MJ_FROM_EMAIL || process.env.CONTACT_RECIPIENT || 'no-reply@devmaster.example';

    if (!MJ_APIKEY_PUBLIC || !MJ_APIKEY_PRIVATE) {
      return { statusCode: 500, body: JSON.stringify({ error: 'missing_mailjet_keys' }) };
    }

    const payload = {
      Messages: [
        {
          From: { Email: MJ_FROM_EMAIL, Name: 'DevMaster' },
          To: [{ Email: email, Name: (name || (email || '').split('@')[0]) }],
          Subject: 'Bienvenue sur DevMaster 🎉',
          TextPart: `Bienvenue sur DevMaster! Merci de vous être inscrit. Visitez https://devmaster.example pour commencer.`,
          HTMLPart: `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <style>
      body { margin:0; padding:0; background:#f2f6fb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
      .wrap { width:100%; padding:24px 0; }
      .container { max-width:600px; margin:0 auto; background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 6px 24px rgba(6,21,34,0.08); }
      .header { background:linear-gradient(90deg,#0ea5e9,#6366f1); padding:28px 32px; color:#fff; text-align:left; }
      .brand { font-size:20px; font-weight:700; letter-spacing:0.2px; }
      .pre { font-size:14px; opacity:0.95; margin-top:6px; }
      .content { padding:28px 32px; color:#0f172a; }
      h1 { margin:0 0 8px 0; font-size:22px; }
      p { margin:0 0 14px 0; color:#334155; line-height:1.5; }
      .btn { display:inline-block; padding:12px 18px; background:#111827; color:#fff; text-decoration:none; border-radius:8px; font-weight:600; }
      .features { display:flex; gap:12px; margin-top:12px; }
      .feature { flex:1; background:#f8fafc; padding:12px; border-radius:8px; font-size:13px; color:#475569; }
      .footer { padding:20px 32px; font-size:13px; color:#64748b; background:#fbfdff; }
      @media (max-width:480px){ .features{flex-direction:column;} .header{padding:20px;} .content{padding:20px;} }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="container" role="article" aria-labelledby="title">
        <div class="header">
          <div class="brand">DevMaster</div>
          <div class="pre">Bienvenue dans votre nouvelle aventure d'apprentissage</div>
        </div>
        <div class="content">
          <h1 id="title">Bonjour ${((name || '') || (email || '').split('@')[0] || 'ami')} 👋</h1>
          <p>Merci d'avoir rejoint DevMaster — la plateforme pour apprendre et pratiquer le code, avec des exercices interactifs, un mentor IA et des parcours adaptés.</p>
          <p>Pour commencer, cliquez sur le bouton ci‑dessous pour découvrir votre tableau de bord et les ressources recommandées.</p>
          <p style="margin-top:18px; display:flex; gap:12px;">
            <a class="btn" href="https://devmaster.example" target="_blank" rel="noopener noreferrer">Découvrir DevMaster</a>
            <a class="btn" href="https://devmaster.example/logout" style="background:transparent; color:#0f172a; border:1px solid #e6edf3; box-shadow:none;">Se déconnecter</a>
          </p>

          <div class="features" style="margin-top:18px;">
            <div class="feature"><strong>Exercices interactifs</strong><br/>Pratiquez avec des corrections instantanées.</div>
            <div class="feature"><strong>Mentor IA</strong><br/>Obtenez de l'aide sur votre code à tout moment.</div>
            <div class="feature"><strong>Parcours</strong><br/>Suivez un chemin pédagogique structuré.</div>
          </div>

          <hr style="border:none;border-top:1px solid #eef2f7;margin:20px 0;" />
          <p style="font-size:13px;color:#64748b;">Si vous avez des questions, répondez simplement à cet email ou consultez notre <a href="https://devmaster.example/help" style="color:#0ea5e9;text-decoration:none;">page d'aide</a>.</p>
        </div>
        <div class="footer">© ${new Date().getFullYear()} DevMaster — Vous recevez cet email car vous vous êtes inscrit sur DevMaster.</div>
      </div>
    </div>
  </body>
</html>`,
      CustomID: 'DevMasterWelcome'
        }
      ]
    };

    const auth = Buffer.from(`${MJ_APIKEY_PUBLIC}:${MJ_APIKEY_PRIVATE}`).toString('base64');
    const res = await fetch('https://api.mailjet.com/v3.1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`
      },
      body: JSON.stringify(payload)
    });

    const text = await res.text().catch(()=>"");
    // Attempt to parse Mailjet response body as JSON for clearer details
    let parsedText = null;
    try { parsedText = JSON.parse(text); } catch {}

    if (!res.ok) {
      const detail = parsedText && typeof parsedText === 'object' ? JSON.stringify(parsedText) : String(text || res.statusText || `status:${res.status}`);
      return { statusCode: 502, body: JSON.stringify({ error: 'mailjet_error', status: res.status, detail }) };
    }

    // success: return parsed JSON when available, otherwise raw text
    const successDetail = parsedText && typeof parsedText === 'object' ? parsedText : String(text || 'ok');
    return { statusCode: 200, body: JSON.stringify({ ok: true, detail: successDetail }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: 'exception', message: String(e?.message || e) }) };
  }
};
