const token = process.env.NETLIFY_AUTH_TOKEN;
if(!token){ console.error('NETLIFY_AUTH_TOKEN not set'); process.exit(1); }
const fetch = globalThis.fetch;
const site = process.argv[2] || 'devmaster-joel-prod';
const keys = ['MJ_APIKEY_PUBLIC','MJ_APIKEY_PRIVATE','MJ_FROM_EMAIL','CONTACT_RECIPIENT','SUPABASE_URL','SUPABASE_KEY','NEXT_PUBLIC_SUPABASE_ANON_KEY'];
(async()=>{
  try{
    // find site id
    const listRes = await fetch('https://api.netlify.com/api/v1/sites?per_page=100',{ headers:{ Authorization: `Bearer ${token}`} });
    const list = await listRes.json();
    const found = list.find(s=> s.name===site || s.ssl_url?.includes(site) || s.url?.includes(site));
    if(!found){ console.error('Site not found'); process.exit(1); }
    const siteId = found.id;
    console.log('Using site', found.name, siteId);
    for(const k of keys){
      const v = process.env[k];
      if(!v){ console.log('skip',k); continue; }
      // try POST /sites/:site_id/env
      try{
        const res = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/env`,{
          method:'POST', headers:{ Authorization:`Bearer ${token}`, 'Content-Type':'application/json' },
          body: JSON.stringify({ key: k, value: v, context:'production' })
        });
        const tx = await (async()=>{ try{return await res.json(); }catch(e){ return await res.text(); }})();
        if(res.ok){ console.log('POST env success', k); continue; }
        console.warn('POST env failed', k, tx);
      }catch(e){ console.warn('POST error',k,e.message); }
      // try PUT /sites/:site_id/env/:key
      try{
        const res2 = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/env/${encodeURIComponent(k)}`,{
          method:'PUT', headers:{ Authorization:`Bearer ${token}`, 'Content-Type':'application/json' }, body: JSON.stringify({ key:k, value: v, context:'production' })
        });
        const tx2 = await (async()=>{ try{return await res2.json(); }catch(e){ return await res2.text(); }})();
        if(res2.ok){ console.log('PUT env success', k); continue; }
        console.warn('PUT env failed', k, tx2);
      }catch(e){ console.warn('PUT error',k,e.message); }
      // fallback: patch build_settings
      try{
        const patch = {};
        patch[k]=v;
        const res3 = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}`,{
          method:'PATCH', headers:{ Authorization:`Bearer ${token}`, 'Content-Type':'application/json' }, body: JSON.stringify({ build_settings:{ env: patch } })
        });
        const tx3 = await (async()=>{ try{return await res3.json(); }catch(e){ return await res3.text(); }})();
        if(res3.ok){ console.log('PATCH env success via build_settings for',k); continue; }
        console.warn('PATCH env failed for',k,tx3);
      }catch(e){ console.warn('PATCH error',k,e.message); }
      console.error('All attempts failed for',k);
    }
    console.log('Done');
  }catch(e){ console.error('Error',e); process.exit(1);} 
})();
