import type { RequestHandler } from 'express';
import { loadDataFile } from '../utils/data-loader';

interface WelcomeEmail {
  name: string;
  email: string;
  sent_at: string;
}

export const handleWelcomeList: RequestHandler = async (_req, res) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    if (!supabaseUrl || !supabaseKey) return res.status(501).json({ error: 'no_cloud_provider', message: 'No Supabase configured' });

    const table = 'welcome_emails';
    const r = await fetch(`${supabaseUrl}/rest/v1/${table}?select=name,email,sent_at&order=sent_at.desc`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${supabaseKey}`,
        apikey: `${supabaseKey}`,
        Accept: 'application/json'
      }
    });
    
    if (!r.ok) {
      const txt = await r.text();
      console.warn('Supabase welcome-list request failed:', txt);
      
      // Fallback to local file storage
      const data = await loadDataFile<WelcomeEmail[]>('welcome_emails.json');
      
      if (data) {
        console.log('Successfully read fallback file with', data.length, 'entries');
        return res.json({ ok: true, data, source: 'fallback_file' });
      } else {
        console.warn('Could not find fallback file');
        // Final fallback: return empty array instead of error
        return res.json({ ok: true, data: [], source: 'empty_fallback', warning: 'Could not access Supabase or local file' });
      }
    }
    
    const json = await r.json();
    return res.json({ ok: true, data: json, source: 'supabase' });
  } catch (e: any) {
    console.error('Error in handleWelcomeList:', e);
    return res.status(500).json({ error: 'exception', message: String(e?.message || e) });
  }
};
