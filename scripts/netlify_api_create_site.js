import fs from 'fs';

const token = process.env.NETLIFY_AUTH_TOKEN;
const fetch = globalThis.fetch || (async ()=>{ throw new Error('global fetch not available');})();
if (!token) {
  console.error('NETLIFY_AUTH_TOKEN not set');
  process.exit(1);
}

const siteName = process.argv[2] || 'devmaster-joel-prod';

async function main(){
  try{
    const res = await fetch('https://api.netlify.com/api/v1/sites', {
      method: 'POST',
      headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: siteName })
    });
    let body = null;
    try { body = await res.json(); } catch { body = null; }
    let siteId = null;
    let siteUrl = null;
    if (res.ok && body) {
      siteId = body.id;
      siteUrl = body.ssl_url || body.url;
      console.log('site created', body.name, siteId, siteUrl);
    } else {
      console.warn('Create site failed', body || (await res.text().catch(()=>null)));
      // Try to find existing site by listing sites
      console.log('Attempting to find existing site by name...');
      const listRes = await fetch('https://api.netlify.com/api/v1/sites?per_page=100', { headers: { Authorization: `Bearer ${token}` } });
      const list = await listRes.json();
      const found = Array.isArray(list) ? list.find(s => s.name === siteName || s.ssl_url?.includes(siteName) || s.url?.includes(siteName)) : null;
      if (found) {
        siteId = found.id;
        siteUrl = found.ssl_url || found.url;
        console.log('Found existing site', found.name, siteId, siteUrl);
      } else {
        console.error('Could not create or find site. Aborting.');
        console.error(body);
        process.exit(1);
      }
    }

    const keys = ['MJ_APIKEY_PUBLIC','MJ_APIKEY_PRIVATE','MJ_FROM_EMAIL','CONTACT_RECIPIENT','SUPABASE_URL','SUPABASE_KEY','NEXT_PUBLIC_SUPABASE_ANON_KEY'];
    const envToSet = {};
    for(const k of keys){
      const v = process.env[k];
      if(!v) { console.log('skip env',k,'(not set)'); continue; }
      envToSet[k] = v;
    }
    if(Object.keys(envToSet).length>0){
      console.log('Patching site build_settings.env with',Object.keys(envToSet));
      const patchRes = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}`,{
        method: 'PATCH',
        headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ build_settings: { env: envToSet } })
      });
      let pb = null;
      try{ pb = await patchRes.json(); } catch { pb = await patchRes.text().catch(()=>null); }
      if(!patchRes.ok){ console.error('Failed to patch site envs', pb); }
      else{ console.log('Patched site envs successfully'); }
    } else { console.log('No env vars to set'); }

    console.log('Done. Visit site URL:', siteUrl);
    process.exit(0);
  }catch(e){ console.error(e); process.exit(1); }
}

main();
