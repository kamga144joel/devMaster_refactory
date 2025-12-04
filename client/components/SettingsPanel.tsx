import React, { useEffect, useState } from 'react';

export default function SettingsPanel({ open, onClose }:{ open:boolean; onClose: ()=>void }){
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

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-lg p-6 shadow-lg">
        <h3 className="text-lg font-semibold">Paramètres utilisateur</h3>
        <div className="grid gap-4 mt-4">
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
            <select value={workerMode} onChange={(e)=>setWorkerMode(e.target.value)} className="rounded-md border bg-background px-2">
              <option value="cdn">CDN</option>
              <option value="embedded">Embedded</option>
            </select>
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="h-9 px-3 rounded-md border">Fermer</button>
        </div>
      </div>
    </div>
  );
}
