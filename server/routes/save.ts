import type { RequestHandler } from "express";

export const handleSave: RequestHandler = async (req, res) => {
  const { namespace = 'default', key, data, userId } = req.body || {};
  if (!key || typeof data === 'undefined') return res.status(400).json({ error: 'key and data required' });

  // Prefer Supabase REST if configured
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;
  if (supabaseUrl && supabaseKey) {
    try {
      const table = 'user_storage';
      const payload = {
        namespace,
        key,
        data,
        user_id: userId || null,
        updated_at: new Date().toISOString(),
      };
      const r = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${supabaseKey}`,
          apikey: `${supabaseKey}`,
          Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify(payload),
      });
      if (!r.ok) {
        const txt = await r.text();
        return res.status(502).json({ error: 'supabase_error', detail: txt });
      }
      const json = await r.text();
      return res.json({ ok: true, detail: json });
    } catch (e: any) {
      return res.status(500).json({ error: 'save_failed', message: String(e?.message || e) });
    }
  }

  // No cloud provider configured
  return res.status(501).json({ error: 'no_cloud_provider', message: 'No cloud storage configured. Connect Supabase (or other provider) through Netlify environment variables SUPABASE_URL and SUPABASE_KEY.' });
};
