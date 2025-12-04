import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import JSZip from 'jszip';

interface CourseSaved {
  id: string;
  title: string;
  language: string;
  framework?: string;
  steps: any[];
}
const KEY = 'course:library:v1';

export default function CourseLibrary(){
  const [items, setItems] = useState<CourseSaved[]>([]);
  useEffect(()=>{ try{ const raw = localStorage.getItem(KEY); setItems(raw?JSON.parse(raw):[]); }catch{ setItems([]); } },[]);
  const persist = (next: CourseSaved[])=>{ setItems(next); localStorage.setItem(KEY, JSON.stringify(next)); };
  const { toast } = useToast();
  const remove = (id:string)=>{ if (!confirm('Supprimer ce cours ?')) return; persist(items.filter(i=>i.id!==id)); toast({ title: 'Cours supprimé' }); };
  const download = (c:CourseSaved)=>{
    const blob = new Blob([JSON.stringify(c, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${c.title || 'course'}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const duplicate = (c:CourseSaved)=>{
    const copy = { ...c, id: Date.now().toString(36), title: `${c.title} (copie)` };
    persist([copy, ...items]);
    toast({ title: 'Cours dupliqué' });
  };

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<CourseSaved | null>(null);

  const edit = (c:CourseSaved)=>{ setEditingId(c.id); setDraft(JSON.parse(JSON.stringify(c))); };
  const cancelEdit = ()=>{ setEditingId(null); setDraft(null); };
  const saveEdit = ()=>{
    if (!draft) return;
    // push current into versions
    const idx = items.findIndex(i=>i.id===draft.id);
    const next = [...items];
    const prev = items[idx];
    const withVersions = { ...draft } as any;
    (withVersions as any).versions = (prev as any).versions || [];
    (withVersions as any).versions.unshift({ ts: Date.now(), steps: prev.steps });
    next[idx] = withVersions;
    persist(next);
    setEditingId(null); setDraft(null);
  };

  const restoreVersion = (id:string, verIdx:number)=>{
    const idx = items.findIndex(i=>i.id===id);
    if (idx===-1) return;
    const it = items[idx] as any;
    const version = it.versions?.[verIdx];
    if (!version) return;
    const next = [...items];
    // push current to versions
    const current = { ts: Date.now(), steps: next[idx].steps };
    next[idx] = { ...next[idx], steps: version.steps, versions: [current, ...(next[idx] as any).versions || []] } as any;
    persist(next);
  };

  const downloadZip = async (c:CourseSaved)=>{
    try{
      const zip = new JSZip();
      // add json
      zip.file(`${c.title || 'course'}.json`, JSON.stringify(c, null, 2));
      // try to generate pdf from server
      try{
        const r = await fetch('/api/export/course', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ course: c, title: c.title }) });
        if (r.ok){
          const data = await r.json();
          if (data?.pdfB64){
            const bin = atob(data.pdfB64);
            const len = bin.length;
            const bytes = new Uint8Array(len);
            for (let i=0;i<len;i++) bytes[i] = bin.charCodeAt(i);
            zip.file(`${c.title || 'course'}.pdf`, bytes, { binary: true });
          }
        }
      }catch(e) { /* ignore pdf generation errors */ }
      const blob = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${c.title || 'course'}.zip`;
      a.click();
      URL.revokeObjectURL(a.href);
    }catch(e:any){ toast({ title: 'Erreur', description: String(e?.message || e), variant: 'destructive' }); }
  };

  const exportCourse = async (c:CourseSaved)=>{
    try{
      const r = await fetch('/api/export/course', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ course: c, title: c.title }) });
      if (!r.ok) throw new Error('Export failed');
      const data = await r.json();
      // data.pdfB64 and data.json
      if (data?.pdfB64) {
        const bin = atob(data.pdfB64);
        const len = bin.length;
        const bytes = new Uint8Array(len);
        for (let i=0;i<len;i++) bytes[i] = bin.charCodeAt(i);
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${c.title || 'course'}.pdf`;
        a.click(); URL.revokeObjectURL(a.href);
      }
      // also download json
      const blobJson = new Blob([JSON.stringify(c,null,2)], { type: 'application/json' });
      const aj = document.createElement('a'); aj.href = URL.createObjectURL(blobJson); aj.download = `${c.title||'course'}.json`; aj.click(); URL.revokeObjectURL(aj.href);
    }catch(e:any){ toast({ title: 'Erreur', description: String(e?.message||e), variant: 'destructive' }); }
  };

  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium">Cours enregistrés</h4>
        <small className="text-xs text-muted-foreground">{items.length}</small>
      </div>
      {!items.length && <p className="text-sm text-muted-foreground">Aucun cours sauvegardé.</p>}
      <div className="grid gap-2">
        {items.map(it=> (
          <div key={it.id} className="p-2 rounded-md border bg-background">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">{it.title}</div>
                <div className="text-xs text-muted-foreground">{it.language}{it.framework? ' • '+it.framework : ''}</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={()=>download(it)} className="text-xs px-2 py-1 rounded-md border">Télécharger</button>
                <button onClick={()=>duplicate(it)} className="text-xs px-2 py-1 rounded-md border">Dupliquer</button>
                <button onClick={()=>edit(it)} className="text-xs px-2 py-1 rounded-md border">Éditer</button>
                <button onClick={()=>downloadZip(it)} className="text-xs px-2 py-1 rounded-md border">Télécharger ZIP</button>
                <button onClick={()=>exportCourse(it)} className="text-xs px-2 py-1 rounded-md border">Exporter</button>
                <button onClick={()=>remove(it.id)} className="text-xs px-2 py-1 rounded-md border text-destructive">Supprimer</button>
              </div>
            </div>
            {editingId===it.id && draft && (
              <div className="mt-3 grid gap-2">
                <input value={draft.title} onChange={(e)=>setDraft({...draft, title: e.target.value})} className="h-9 rounded-md border px-2" />
                <div className="grid gap-2">
                  {draft.steps.map((s:any, si:number)=> (
                    <div key={si} className="grid gap-1">
                      <input value={s.title} onChange={(e)=>{ const d= {...draft}; d.steps[si].title = e.target.value; setDraft(d); }} className="h-9 rounded-md border px-2" />
                      <textarea value={s.summary} onChange={(e)=>{ const d= {...draft}; d.steps[si].summary = e.target.value; setDraft(d); }} className="rounded-md border p-2" />
                      <textarea value={s.codeExample} onChange={(e)=>{ const d= {...draft}; d.steps[si].codeExample = e.target.value; setDraft(d); }} className="rounded-md border p-2" />
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={saveEdit} className="h-9 px-3 rounded-md bg-primary text-primary-foreground">Sauvegarder</button>
                  <button onClick={cancelEdit} className="h-9 px-3 rounded-md border">Annuler</button>
                </div>
                <div className="mt-2">
                  <h5 className="text-sm font-medium">Versions</h5>
                  {(it as any).versions && (it as any).versions.length ? (
                    <ul className="text-xs text-muted-foreground list-disc pl-5">
                      {(it as any).versions.map((v:any, vi:number)=> (
                        <li key={vi}>Version {vi+1} — {new Date(v.ts).toLocaleString()} <button onClick={()=>restoreVersion(it.id, vi)} className="ml-2 text-xs underline">Restaurer</button></li>
                      ))}
                    </ul>
                  ) : <p className="text-xs text-muted-foreground">Aucune version</p>}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
