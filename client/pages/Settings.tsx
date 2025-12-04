import React, { useEffect, useState } from "react";
import JSZip from "jszip";

// Helpers: simple client-side encryption using Web Crypto (PBKDF2 + AES-GCM)
async function deriveKey(passphrase: string, saltBase64: string) {
  const enc = new TextEncoder();
  const passKey = await crypto.subtle.importKey('raw', enc.encode(passphrase), { name: 'PBKDF2' }, false, ['deriveKey']);
  const salt = Uint8Array.from(atob(saltBase64), c => c.charCodeAt(0));
  const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 200000, hash: 'SHA-256' }, passKey, { name: 'AES-GCM', length: 256 }, false, ['encrypt','decrypt']);
  return key;
}
async function encryptString(passphrase: string, plain: string) {
  let salt = localStorage.getItem('keys:enc_salt');
  if (!salt) {
    const s = crypto.getRandomValues(new Uint8Array(16));
    salt = btoa(String.fromCharCode(...s));
    localStorage.setItem('keys:enc_salt', salt);
  }
  const key = await deriveKey(passphrase, salt);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plain));
  const ctArr = new Uint8Array(ct);
  const payload = btoa(String.fromCharCode(...iv)) + ':' + btoa(String.fromCharCode(...ctArr));
  return payload;
}
async function decryptString(passphrase: string, payload: string) {
  try {
    const salt = localStorage.getItem('keys:enc_salt');
    if (!salt) throw new Error('No salt');
    const key = await deriveKey(passphrase, salt);
    const [ivB64, ctB64] = payload.split(':');
    if (!ivB64 || !ctB64) throw new Error('Invalid payload');
    const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0));
    const ct = Uint8Array.from(atob(ctB64), c => c.charCodeAt(0));
    const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, key, ct);
    return new TextDecoder().decode(plainBuf);
  } catch (e) {
    console.warn('decrypt failed', e);
    throw e;
  }
}

import { useToast } from "@/hooks/use-toast";

export default function SettingsPage(){
  const [glossaryAuto, setGlossaryAuto] = useState(()=> (localStorage.getItem('prefs:glossary:autoUpdate') ?? 'true') === 'true');
  const [quizAuto, setQuizAuto] = useState(()=> (localStorage.getItem('prefs:quiz:autoUpdate') ?? 'true') === 'true');
  const [editorAutoSave, setEditorAutoSave] = useState(()=> (localStorage.getItem('prefs:editor:autoSave') ?? 'true') === 'true');
  const [editorTheme, setEditorTheme] = useState(()=> localStorage.getItem('prefs:editor:theme') || 'dark');
  const [workerMode, setWorkerMode] = useState(()=> localStorage.getItem('sandbox:workerMode') || 'cdn');

  useEffect(()=>{ localStorage.setItem('prefs:glossary:autoUpdate', glossaryAuto ? 'true' : 'false'); window.dispatchEvent(new CustomEvent('prefs:changed',{detail:{key:'prefs:glossary:autoUpdate', value: glossaryAuto}})); },[glossaryAuto]);
  useEffect(()=>{ localStorage.setItem('prefs:quiz:autoUpdate', quizAuto ? 'true' : 'false'); window.dispatchEvent(new CustomEvent('prefs:changed',{detail:{key:'prefs:quiz:autoUpdate', value: quizAuto}})); },[quizAuto]);
  useEffect(()=>{ localStorage.setItem('prefs:editor:autoSave', editorAutoSave ? 'true' : 'false'); window.dispatchEvent(new CustomEvent('prefs:changed',{detail:{key:'prefs:editor:autoSave', value: editorAutoSave}})); },[editorAutoSave]);
  useEffect(()=>{ localStorage.setItem('prefs:editor:theme', editorTheme); window.dispatchEvent(new CustomEvent('prefs:changed',{detail:{key:'prefs:editor:theme', value: editorTheme}})); if (editorTheme === 'dark') document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark'); },[editorTheme]);
  useEffect(()=>{ localStorage.setItem('sandbox:workerMode', workerMode); window.dispatchEvent(new CustomEvent('prefs:changed',{detail:{key:'sandbox:workerMode', value: workerMode}})); },[workerMode]);

  // keys: support encrypted storage optional
  const [protectedKeys, setProtectedKeys] = useState(()=> (localStorage.getItem('keys:protected') === '1'));
  const [passphrase, setPassphrase] = useState('');
  const [openaiKey, setOpenaiKey] = useState(()=> localStorage.getItem('keys:openai') || '');
  const [hfKey, setHfKey] = useState(()=> localStorage.getItem('keys:hf') || '');
  const [googleCseKey, setGoogleCseKey] = useState(()=> localStorage.getItem('keys:google:cse') || '');
  const [googleCx, setGoogleCx] = useState(()=> localStorage.getItem('keys:google:cx') || '');
  const [showKeys, setShowKeys] = useState(false);

  // when toggling protection on, encrypt plain keys with passphrase
  useEffect(()=>{ localStorage.setItem('keys:protected', protectedKeys ? '1' : '0'); },[protectedKeys]);

  useEffect(()=>{
    // load encrypted keys if protected
    const init = async ()=>{
      try{
        if (protectedKeys) {
          const eOpen = localStorage.getItem('keys:openai:enc');
          const eHf = localStorage.getItem('keys:hf:enc');
          const eGcse = localStorage.getItem('keys:google:cse:enc');
          const eGcx = localStorage.getItem('keys:google:cx:enc');
          if (eOpen && passphrase) setOpenaiKey(await decryptString(passphrase, eOpen));
          if (eHf && passphrase) setHfKey(await decryptString(passphrase, eHf));
          if (eGcse && passphrase) setGoogleCseKey(await decryptString(passphrase, eGcse));
          if (eGcx && passphrase) setGoogleCx(await decryptString(passphrase, eGcx));
        }
      }catch(e){ console.warn('failed decrypt keys', e); }
    };
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[protectedKeys, passphrase]);

  // persist plain keys if not protected
  useEffect(()=>{ if (!protectedKeys) { localStorage.setItem('keys:openai', openaiKey || ''); } },[openaiKey, protectedKeys]);
  useEffect(()=>{ if (!protectedKeys) { localStorage.setItem('keys:hf', hfKey || ''); } },[hfKey, protectedKeys]);
  useEffect(()=>{ if (!protectedKeys) { localStorage.setItem('keys:google:cse', googleCseKey || ''); } },[googleCseKey, protectedKeys]);
  useEffect(()=>{ if (!protectedKeys) { localStorage.setItem('keys:google:cx', googleCx || ''); } },[googleCx, protectedKeys]);

  const { toast } = useToast();
  const copyToClipboard = async (val: string) => {
    try { await navigator.clipboard.writeText(val); toast({ title: 'Copié', description: 'Valeur copiée' }); } catch { toast({ title: 'Erreur', description: 'Impossible de copier', variant: 'destructive' }); }
  };

  const applyProtect = async () => {
    if (!protectedKeys) return; // enabling protection (encrypt current plain keys)
    if (!passphrase) { toast({ title: 'Erreur', description: 'Entrez une phrase secrète pour chiffrer les clés', variant: 'destructive' }); return; }
    try{
      if (openaiKey) localStorage.setItem('keys:openai:enc', await encryptString(passphrase, openaiKey));
      if (hfKey) localStorage.setItem('keys:hf:enc', await encryptString(passphrase, hfKey));
      if (googleCseKey) localStorage.setItem('keys:google:cse:enc', await encryptString(passphrase, googleCseKey));
      if (googleCx) localStorage.setItem('keys:google:cx:enc', await encryptString(passphrase, googleCx));
      // remove plain keys
      localStorage.removeItem('keys:openai');
      localStorage.removeItem('keys:hf');
      localStorage.removeItem('keys:google:cse');
      localStorage.removeItem('keys:google:cx');
      toast({ title: 'Succès', description: 'Clés chiffrées et stockées localement' });
    }catch(e){ console.warn(e); toast({ title: 'Échec', description: 'Échec du chiffrement', variant: 'destructive' }); }
  };

  const removeProtection = () => {
    // removing protection will keep existing encrypted keys; user can decrypt by entering passphrase
    const ok = confirm('Supprimer la protection ? Les clés chiffrées resteront, vous pourrez les déchiffrer en entrant la phrase secrète plus tard.');
    if (!ok) return;
    setProtectedKeys(false);
  };

  const exportZip = async () => {
    const zip = new JSZip();
    const conv = localStorage.getItem('chat:conversations');
    const hist = localStorage.getItem('chat:history');
    zip.file('conversations.json', JSON.stringify({ conversations: conv ? JSON.parse(conv) : [], history: hist ? JSON.parse(hist) : [] }, null, 2));
    // include keys: if protected include encrypted values, else plain
    const keys:any = {};
    if (protectedKeys) {
      keys.protected = true;
      keys.openai = localStorage.getItem('keys:openai:enc') || null;
      keys.hf = localStorage.getItem('keys:hf:enc') || null;
      keys.google_cse = localStorage.getItem('keys:google:cse:enc') || null;
      keys.google_cx = localStorage.getItem('keys:google:cx:enc') || null;
    } else {
      keys.protected = false;
      keys.openai = localStorage.getItem('keys:openai') || null;
      keys.hf = localStorage.getItem('keys:hf') || null;
      keys.google_cse = localStorage.getItem('keys:google:cse') || null;
      keys.google_cx = localStorage.getItem('keys:google:cx') || null;
    }
    zip.file('keys.json', JSON.stringify(keys, null, 2));
    const blob = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'export.zip';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importZip = async (file: File | null) => {
    if (!file) return;
    try{
      const data = await file.arrayBuffer();
      const js = await JSZip.loadAsync(data);
      if (js.files['conversations.json']) {
        const txt = await js.files['conversations.json'].async('string');
        try{
          const parsed = JSON.parse(txt);
          if (parsed.conversations) localStorage.setItem('chat:conversations', JSON.stringify(parsed.conversations));
          if (parsed.history) localStorage.setItem('chat:history', JSON.stringify(parsed.history));
        }catch(e){/* ignore */}
      }
      if (js.files['keys.json']) {
        const txt = await js.files['keys.json'].async('string');
        try{
          const k = JSON.parse(txt);
          if (k.protected) {
            if (k.openai) localStorage.setItem('keys:openai:enc', k.openai);
            if (k.hf) localStorage.setItem('keys:hf:enc', k.hf);
            if (k.google_cse) localStorage.setItem('keys:google:cse:enc', k.google_cse);
            if (k.google_cx) localStorage.setItem('keys:google:cx:enc', k.google_cx);
            setProtectedKeys(true);
          } else {
            if (k.openai) localStorage.setItem('keys:openai', k.openai);
            if (k.hf) localStorage.setItem('keys:hf', k.hf);
            if (k.google_cse) localStorage.setItem('keys:google:cse', k.google_cse);
            if (k.google_cx) localStorage.setItem('keys:google:cx', k.google_cx);
            setProtectedKeys(false);
          }
        }catch(e){}
      }
      toast({ title: 'Import', description: 'Import terminé' });
    }catch(e){ console.warn(e); toast({ title: 'Erreur', description: 'Échec import ZIP', variant: 'destructive' }); }
  };

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <h1 className="text-2xl font-semibold">Paramètres</h1>
      <p className="text-sm text-muted-foreground mt-2">Gérez vos préférences globales — auto‑mise à jour, éditeur, workers, clés API, export/import.</p>

      <div className="mt-6 rounded-2xl border bg-card p-6 grid gap-4">
        <label className="flex items-center justify-between">
          <span className="text-sm">Glossaire — Auto‑mise à jour</span>
          <input type="checkbox" checked={glossaryAuto} onChange={(e)=>setGlossaryAuto(e.target.checked)} />
        </label>

        <label className="flex items-center justify-between">
          <span className="text-sm">Quiz — Auto‑mise à jour</span>
          <input type="checkbox" checked={quizAuto} onChange={(e)=>setQuizAuto(e.target.checked)} />
        </label>

        <label className="flex items-center justify-between">
          <span className="text-sm">Éditeur — Auto‑sauvegarde</span>
          <input type="checkbox" checked={editorAutoSave} onChange={(e)=>setEditorAutoSave(e.target.checked)} />
        </label>

        <label className="flex items-center justify-between">
          <span className="text-sm">Éditeur — Thème</span>
          <select value={editorTheme} onChange={(e)=>setEditorTheme(e.target.value)} className="rounded-md border bg-background px-2">
            <option value="dark">Sombre</option>
            <option value="light">Clair</option>
          </select>
        </label>

        <label className="flex items-center justify-between">
          <span className="text-sm">Workers</span>
          <select value={workerMode} onChange={(e)=>{ setWorkerMode(e.target.value); }} className="rounded-md border bg-background px-2">
            <option value="cdn">CDN</option>
            <option value="embedded">Embedded</option>
          </select>
        </label>

        <div className="text-sm text-muted-foreground">Protection des clés (optionnel) — chiffrement AES‑GCM local</div>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={protectedKeys} onChange={(e)=> setProtectedKeys(e.target.checked)} />
          <span className="text-sm">Activer protection des clés</span>
        </label>
        <label className="grid gap-1">
          <span className="text-sm">Phrase secrète (nécessaire pour chiffrer/déchiffrer)</span>
          <input value={passphrase} onChange={(e)=>setPassphrase(e.target.value)} placeholder="Phrase secrète" type="password" className="h-10 rounded-md border bg-background px-3 text-sm" />
        </label>
        <div className="flex gap-2">
          <button onClick={applyProtect} disabled={!protectedKeys || !passphrase} className="h-9 px-3 rounded-md border">Chiffrer clés</button>
          <button onClick={removeProtection} disabled={!protectedKeys} className="h-9 px-3 rounded-md border">Supprimer protection</button>
        </div>

        <div className="text-sm text-muted-foreground">Clés API (stockées localement — exposées côté client si non chiffrées)</div>

        <label className="grid gap-1">
          <div className="flex items-center justify-between">
            <span className="text-sm">OpenAI Key</span>
            <div className="flex gap-2 items-center">
              <button onClick={()=>setShowKeys(s=>!s)} className="text-xs px-2 py-1 rounded-md border">{showKeys? 'Masquer':'Afficher'}</button>
              <button onClick={()=>copyToClipboard(openaiKey)} className="text-xs px-2 py-1 rounded-md border">Copier</button>
            </div>
          </div>
          <input value={openaiKey} onChange={(e)=>setOpenaiKey(e.target.value)} placeholder="sk-..." type={showKeys? 'text':'password'} className="h-10 rounded-md border bg-background px-3 text-sm" />
        </label>

        <label className="grid gap-1">
          <div className="flex items-center justify-between">
            <span className="text-sm">Hugging Face Key</span>
            <div className="flex gap-2 items-center">
              <button onClick={()=>setShowKeys(s=>!s)} className="text-xs px-2 py-1 rounded-md border">{showKeys? 'Masquer':'Afficher'}</button>
              <button onClick={()=>copyToClipboard(hfKey)} className="text-xs px-2 py-1 rounded-md border">Copier</button>
            </div>
          </div>
          <input value={hfKey} onChange={(e)=>setHfKey(e.target.value)} placeholder="hf_..." type={showKeys? 'text':'password'} className="h-10 rounded-md border bg-background px-3 text-sm" />
        </label>

        <label className="grid gap-1">
          <div className="flex items-center justify-between">
            <span className="text-sm">Google CSE Key</span>
            <div className="flex gap-2 items-center">
              <button onClick={()=>setShowKeys(s=>!s)} className="text-xs px-2 py-1 rounded-md border">{showKeys? 'Masquer':'Afficher'}</button>
              <button onClick={()=>copyToClipboard(googleCseKey)} className="text-xs px-2 py-1 rounded-md border">Copier</button>
            </div>
          </div>
          <input value={googleCseKey} onChange={(e)=>setGoogleCseKey(e.target.value)} placeholder="API Key" type={showKeys? 'text':'password'} className="h-10 rounded-md border bg-background px-3 text-sm" />
        </label>

        <label className="grid gap-1">
          <div className="flex items-center justify-between">
            <span className="text-sm">Google CX (Search Engine ID)</span>
            <div className="flex gap-2 items-center">
              <button onClick={()=>setShowKeys(s=>!s)} className="text-xs px-2 py-1 rounded-md border">{showKeys? 'Masquer':'Afficher'}</button>
              <button onClick={()=>copyToClipboard(googleCx)} className="text-xs px-2 py-1 rounded-md border">Copier</button>
            </div>
          </div>
          <input value={googleCx} onChange={(e)=>setGoogleCx(e.target.value)} placeholder="cx_..." type={showKeys? 'text':'password'} className="h-10 rounded-md border bg-background px-3 text-sm" />
        </label>

        <div className="flex items-center gap-3">
          <button onClick={exportZip} className="h-9 px-3 rounded-md border">Exporter ZIP</button>
          <label className="h-9 flex items-center px-3 rounded-md border cursor-pointer">
            Importer ZIP
            <input type="file" accept=".zip,.json" onChange={(e)=> importZip(e.target.files ? e.target.files[0] : null)} className="hidden" />
          </label>
        </div>

        <div className="text-sm text-muted-foreground">Les changements sont enregistrés automatiquement et appliqués immédiatement.</div>
      </div>
    </div>
  );
}
