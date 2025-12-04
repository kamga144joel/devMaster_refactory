import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

import { LANGS, FRAMEWORKS, TOP_LANGS, TOP_FRAMEWORKS } from "@/lib/platforms";

export default function Admin() {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [hint, setHint] = useState('');
  const [solution, setSolution] = useState('');
  const [langs, setLangs] = useState<string[]>([]);
  const [fws, setFws] = useState<string[]>([]);
  const [existing, setExisting] = useState<any[]>([]);

  const [adminUser, setAdminUser] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(()=>{ try{ const raw = localStorage.getItem('custom:exercises'); setExisting(raw?JSON.parse(raw):[]); }catch(e){ setExisting([]); } },[]);

  useEffect(()=>{
    try{
      const ok = localStorage.getItem('devmaster:admin_authenticated');
      setAuthenticated(!!ok);
    }catch(e){ setAuthenticated(false); }
  },[]);

  const toggle = (arr: string[], v:string) => arr.includes(v) ? arr.filter(x=>x!==v) : [...arr, v];

  const login = (e?: React.FormEvent) => {
    if(e) e.preventDefault();
    const u = (adminUser || '').trim();
    const p = (adminPass || '').trim();
    
    if(!u || !p) { 
      toast({ 
        title: 'Erreur', 
        description: 'Nom d\'utilisateur et mot de passe requis', 
        variant: 'destructive' 
      }); 
      return; 
    }
    
    const adminUsername = import.meta.env.VITE_ADMIN_USERNAME || 'admin';
    const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';
    
    if(u === adminUsername && p === adminPassword) {
      localStorage.setItem('devmaster:admin_authenticated','1');
      setAuthenticated(true);
      toast({ 
        title: 'Authentifié', 
        description: 'Accès admin accordé.' 
      });
      setAdminPass('');
    } else {
      toast({ 
        title: 'Accès refusé', 
        description: 'Nom d\'utilisateur ou mot de passe incorrect.', 
        variant: 'destructive' 
      });
    }
  };

  const logout = () => {
    localStorage.removeItem('devmaster:admin_authenticated');
    setAuthenticated(false);
    toast({ title: 'Déconnecté', description: 'Vous avez été déconnecté.' });
    // optionally redirect to home
    window.location.href = '/';
  };

  const [welcomeList, setWelcomeList] = useState<Array<{name:string,email:string,sent_at:string}>>([]);
  const fetchWelcomeList = async () => {
    try{
      const r = await fetch('/api/welcome-list');
      const j = await r.json();
      if(r.ok && j?.ok){ setWelcomeList(j.data || []); }
      else { toast({ title: 'Erreur', description: String(j?.message || j?.error || 'Impossible de récupérer la liste'), variant: 'destructive' }); }
    }catch(e:any){ toast({ title: 'Erreur', description: String(e?.message||e), variant: 'destructive' }); }
  };

  useEffect(()=>{ if(authenticated) fetchWelcomeList(); },[authenticated]);

  const save = async () => {
    if(!title.trim() || !prompt.trim()) { toast({ title: 'Erreur', description: 'Titre et prompt requis', variant: 'destructive' }); return; }
    const item = { id: 'custom:'+Date.now(), title: title.trim(), prompt: prompt.trim(), hint: hint.trim(), solution: solution.trim(), languages: langs, frameworks: fws };
    const next = [item, ...existing];
    try{ localStorage.setItem('custom:exercises', JSON.stringify(next)); window.dispatchEvent(new CustomEvent('custom:exercises:changed')); setExisting(next); toast({ title: 'Créé', description: 'Exercice ajouté localement' });
      // try server save
      try{ await fetch('/api/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ namespace: 'custom', key: `custom:${item.id}`, data: item }) }); }catch(e){}
      setTitle(''); setPrompt(''); setHint(''); setSolution(''); setLangs([]); setFws([]);
    }catch(e:any){ toast({ title: 'Erreur', description: String(e?.message||e), variant: 'destructive' }); }
  };

  if(!authenticated){
    return (
      <div className="container mx-auto py-12 max-w-md">
        <h1 className="text-2xl font-semibold mb-4">Connexion admin</h1>
        <form onSubmit={login} className="grid gap-3">
          <input placeholder="Nom d'utilisateur" value={adminUser} onChange={e=>setAdminUser(e.target.value)} className="w-full p-2 border rounded" />
          <input placeholder="Mot de passe" type="password" value={adminPass} onChange={e=>setAdminPass(e.target.value)} className="w-full p-2 border rounded" />
          <div className="flex items-center gap-3">
            <button type="submit" className="px-4 py-2 rounded-md bg-primary text-primary-foreground">Se connecter</button>
            <button type="button" onClick={()=>{ setAdminUser(''); setAdminPass(''); }} className="px-3 py-2 rounded-md border">Effacer</button>
          </div>
          <p className="text-sm text-muted-foreground">Accès réservé aux administrateurs.</p>
        </form>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Admin : créer/tagger des exercices</h1>
        <button onClick={logout} className="px-3 py-2 rounded-md border">Se déconnecter</button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm">Titre</label>
          <input className="w-full p-2 border rounded mt-1" value={title} onChange={e=>setTitle(e.target.value)} />
          <label className="text-sm mt-2">Prompt</label>
          <textarea className="w-full p-2 border rounded mt-1" value={prompt} onChange={e=>setPrompt(e.target.value)} />
          <label className="text-sm mt-2">Indice</label>
          <input className="w-full p-2 border rounded mt-1" value={hint} onChange={e=>setHint(e.target.value)} />
          <label className="text-sm mt-2">Solution</label>
          <textarea className="w-full p-2 border rounded mt-1" value={solution} onChange={e=>setSolution(e.target.value)} />
          <div className="mt-2">
            <label className="text-sm">Langages (multiselect)</label>
            <div className="grid grid-cols-2 gap-2 mt-1 max-h-40 overflow-auto border p-2 rounded">
              {LANGS.map(l=> (
                <label key={l} className="inline-flex items-center gap-2"><input type="checkbox" checked={langs.includes(l)} onChange={()=>setLangs(toggle(langs,l))} />{l}</label>
              ))}
            </div>
          </div>
          <div className="mt-2">
            <label className="text-sm">Frameworks (multiselect)</label>
            <div className="grid grid-cols-2 gap-2 mt-1 max-h-40 overflow-auto border p-2 rounded">
              {FRAMEWORKS.map(f=> (
                <label key={f} className="inline-flex items-center gap-2"><input type="checkbox" checked={fws.includes(f)} onChange={()=>setFws(toggle(fws,f))} />{f}</label>
              ))}
            </div>
          </div>
          <div className="mt-4">
            <button onClick={save} className="px-4 py-2 rounded-md bg-primary text-primary-foreground">Créer</button>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Exercices personnalisés</h3>
          <div className="grid gap-3 max-h-96 overflow-auto">
            {existing.map((e,i)=> (
              <div key={e.id} className="p-3 border rounded">
                <div className="flex items-center justify-between"><strong>{e.title}</strong><button onClick={()=>{ const next = existing.filter((x:any)=>x.id!==e.id); localStorage.setItem('custom:exercises', JSON.stringify(next)); setExisting(next); window.dispatchEvent(new CustomEvent('custom:exercises:changed')); }} className="text-sm">Supprimer</button></div>
                <div className="text-sm text-muted-foreground mt-1">{e.prompt}</div>
              </div>
            ))}
            {existing.length===0 && <div className="text-sm text-muted-foreground">Aucun exercice personnalisé</div>}
          </div>
        </div>
      </div>
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-3">Utilisateurs (emails de bienvenue envoyés)</h2>
        <div className="mb-2 flex items-center gap-2">
          <button onClick={fetchWelcomeList} className="px-3 py-1 rounded-md border">Rafraîchir</button>
          <div className="text-sm text-muted-foreground">{welcomeList.length} enregistré(s)</div>
        </div>
        <div className="max-h-72 overflow-auto border rounded p-2">
          {welcomeList.length===0 && <div className="text-sm text-muted-foreground">Aucune entrée</div>}
          {welcomeList.map((w,i)=> (
            <div key={i} className="py-2 border-b last:border-b-0">
              <div className="font-medium">{w.name || '(nom manquant)'}</div>
              <div className="text-sm text-muted-foreground">{w.email} · <span className="italic text-xs">{new Date(w.sent_at).toLocaleString()}</span></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
