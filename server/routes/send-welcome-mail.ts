import type { RequestHandler } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const handleSendWelcome: RequestHandler = async (req, res) => {
  try {
    const { email, name } = req.body || {};
    if (!email) return res.status(400).json({ error: 'missing_email' });

    const MJ_APIKEY_PUBLIC = process.env.MJ_APIKEY_PUBLIC;
    const MJ_APIKEY_PRIVATE = process.env.MJ_APIKEY_PRIVATE;
    const MJ_FROM_EMAIL = process.env.MJ_FROM_EMAIL || process.env.CONTACT_RECIPIENT || 'no-reply@devmaster.example';

    if (!MJ_APIKEY_PUBLIC || !MJ_APIKEY_PRIVATE) {
      return res.status(500).json({ error: 'missing_mailjet_keys' });
    }

    const payload = {
      Messages: [
        {
          From: { Email: MJ_FROM_EMAIL, Name: 'DevMaster' },
          To: [{ Email: email, Name: String((name || (email || '').split('@')[0] || '')) }],
          Subject: 'Bienvenue sur DevMaster 🎉',
          TextPart: `Bienvenue sur DevMaster! Merci de vous être inscrit. Visitez https://devmaster.example pour commencer.`,
          HTMLPart: `<!doctype html><html><head><meta charset=\"utf-8\"/><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"/></head><body><h1>Bienvenue ${String((name || (email || '').split('@')[0] || ''))}</h1><p>Merci de vous être inscrit sur DevMaster.</p></body></html>`,
          CustomID: 'DevMasterWelcome'
        }
      ]
    };

    const auth = Buffer.from(`${MJ_APIKEY_PUBLIC}:${MJ_APIKEY_PRIVATE}`).toString('base64');
    const resp = await fetch('https://api.mailjet.com/v3.1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`
      },
      body: JSON.stringify(payload)
    });

    const text = await resp.text();
    if (!resp.ok) return res.status(502).json({ error: 'mailjet_error', detail: text });

    // Try to record in Supabase if configured; otherwise fall back to local file storage
    const rec = { name: String(name || ''), email: String(email), sent_at: new Date().toISOString() };
    try {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_KEY;
      if (supabaseUrl && supabaseKey) {
        const table = 'welcome_emails';
        const r = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${supabaseKey}`,
            apikey: `${supabaseKey}`,
            Prefer: 'resolution=merge-duplicates'
          },
          body: JSON.stringify(rec)
        });
        if (!r.ok) {
          const txt = await r.text();
          console.warn('Supabase insert failed, will fallback to local file', txt);
          // fallback to local file
          const fs = await import('fs');
          const filePath = path.join(__dirname, '../data/welcome_emails.json');
          try {
            const cur = JSON.parse(fs.readFileSync(filePath, 'utf-8') || '[]');
            cur.unshift(rec);
            fs.writeFileSync(filePath, JSON.stringify(cur, null, 2));
          } catch (err) {
            console.warn('Failed to write local welcome_emails file', err);
          }
        }
      } else {
        // Supabase not configured: use local file
        const fs = await import('fs');
        const filePath = path.join(__dirname, '../data/welcome_emails.json');
        try {
          const cur = JSON.parse(fs.readFileSync(filePath, 'utf-8') || '[]');
          cur.unshift(rec);
          fs.writeFileSync(filePath, JSON.stringify(cur, null, 2));
        } catch (err) {
          console.warn('Failed to write local welcome_emails file', err);
        }
      }
    } catch (e) {
      // final fallback to local file
      console.warn('Failed to record welcome email in Supabase (exception), falling back to local file', e);
      try {
        const fs = await import('fs');
        const filePath = path.join(__dirname, '../data/welcome_emails.json');
        const cur = JSON.parse(fs.readFileSync(filePath, 'utf-8') || '[]');
        cur.unshift(rec);
        fs.writeFileSync(filePath, JSON.stringify(cur, null, 2));
      } catch (err) {
        console.warn('Failed to write local welcome_emails file', err);
      }
    }

    return res.json({ ok: true, detail: text });
  } catch (e: any) {
    return res.status(500).json({ error: 'exception', message: String(e?.message || e) });
  }
};
