import { useEffect, useState } from "react";
import JSZip from 'jszip';
import { useToast } from "@/hooks/use-toast";

interface Template {
  id: string;
  title: string;
  language: string;
  framework?: string;
  topic: string;
  prompt?: string;
  starter?: string;
  solution?: string;
}

const KEY = 'exercise:templates:v1';

export default function TemplateLibrary({ onApply }: { onApply?: (t: Template)=>void }){
  const [items, setItems] = useState<Template[]>([]);

  useEffect(()=>{
    try{ const raw = localStorage.getItem(KEY); setItems(raw ? JSON.parse(raw) : []); }catch{ setItems([]); }
  },[]);

  const persist = (next: Template[])=>{ setItems(next); localStorage.setItem(KEY, JSON.stringify(next)); };

  const { toast } = useToast();

  const remove = (id:string)=>{ if (!confirm('Supprimer ce template ?')) return; persist(items.filter(i=>i.id!==id)); toast({ title: 'Template supprimé' }); };
  const apply = (t: Template)=>{ onApply?.(t); toast({ title: 'Template appliqué' }); };

  const duplicate = (t:Template)=>{ const copy = {...t, id: Date.now().toString(36), title: t.title + ' (copie)'}; persist([copy, ...items]); toast({ title: 'Template dupliqué' }); };

  const downloadZip = async (t: Template) => {
    try{
      const zip = new JSZip();
      zip.file(`${t.title || 'template'}.json`, JSON.stringify(t, null, 2));
      const blob = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${t.title || 'template'}.zip`;
      a.click();
      URL.revokeObjectURL(a.href);
    }catch(e:any){ toast({ title: 'Erreur', description: String(e?.message || e), variant: 'destructive' }); }
  };

  const [editingId, setEditingId] = useState<string|null>(null);
  const [draft, setDraft] = useState<Template | null>(null);
  const edit = (t:Template)=>{ setEditingId(t.id); setDraft(JSON.parse(JSON.stringify(t))); };
  const cancel = ()=>{ setEditingId(null); setDraft(null); };
  const save = ()=>{ if(!draft) return; const next = items.map(i=> i.id===draft.id ? {...draft, versions: [...((i as any).versions||[]), {ts:Date.now(), data: i}]} : i); persist(next); setEditingId(null); setDraft(null); };

  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium">Templates d'exercices</h4>
        <small className="text-xs text-muted-foreground">{items.length} templates</small>
      </div>
      {!items.length && <p className="text-sm text-muted-foreground">Aucun template — générez un exercice puis cliquez "Enregistrer" pour créer un template.</p>}
      <div className="grid gap-2">
        {items.map(t=> (
          <div key={t.id} className="p-2 rounded-md border bg-background">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">{t.title}</div>
                <div className="text-xs text-muted-foreground">{t.language}{t.framework? ' • '+t.framework : ''}</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={()=>apply(t)} className="text-xs px-2 py-1 rounded-md border">Appliquer</button>
                <button onClick={()=>duplicate(t)} className="text-xs px-2 py-1 rounded-md border">Dupliquer</button>
                <button onClick={()=>downloadZip(t)} className="text-xs px-2 py-1 rounded-md border">Télécharger ZIP</button>
                <button onClick={()=>edit(t)} className="text-xs px-2 py-1 rounded-md border">Éditer</button>
                <button onClick={()=>remove(t.id)} className="text-xs px-2 py-1 rounded-md border text-destructive">Supprimer</button>
              </div>
            </div>
            {editingId===t.id && draft && (
              <div className="mt-3 grid gap-2">
                <input value={draft.title} onChange={(e)=>setDraft({...draft, title: e.target.value})} className="h-9 rounded-md border px-2" />
                <input value={draft.topic} onChange={(e)=>setDraft({...draft, topic: e.target.value})} className="h-9 rounded-md border px-2" />
                <textarea value={draft.prompt||''} onChange={(e)=>setDraft({...draft, prompt: e.target.value})} className="rounded-md border p-2" />
                <div className="flex items-center gap-2">
                  <button onClick={save} className="h-9 px-3 rounded-md bg-primary text-primary-foreground">Sauvegarder</button>
                  <button onClick={cancel} className="h-9 px-3 rounded-md border">Annuler</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
