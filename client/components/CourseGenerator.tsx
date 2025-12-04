import { useState } from "react";
import JSZip from 'jszip';
import { useToast } from "@/hooks/use-toast";

import { LANGS, FRAMEWORKS, TOP_LANGS, TOP_FRAMEWORKS } from "@/lib/platforms";

const LEVELS = ["Débutant","Intermédiaire","Avancé"] as const;

export default function CourseGenerator(){
  const [title, setTitle] = useState('Cours');
  const [topic, setTopic] = useState('bases');
  const [language, setLanguage] = useState<(typeof LANGS)[number]>((localStorage.getItem('learn:lang') as any) || 'JavaScript');
  const [framework, setFramework] = useState<(typeof FRAMEWORKS)[number]>((localStorage.getItem('learn:fw') as any) || 'Aucun');
  const [selectedLevels, setSelectedLevels] = useState<string[]>([...LEVELS]);
  const [stepsPerLevel, setStepsPerLevel] = useState(4);
  const [loading, setLoading] = useState(false);
  const [course, setCourse] = useState<any|null>(null);
  const [err, setErr] = useState<string | null>(null);

  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [editableCourse, setEditableCourse] = useState<any|null>(null);

  const toggleLevel = (lvl:string)=>{
    setSelectedLevels(prev => prev.includes(lvl) ? prev.filter(p=>p!==lvl) : [...prev, lvl]);
  };

  async function generate(){
    if (!selectedLevels.length) { toast({ title: 'Erreur', description: 'Sélectionnez au moins un niveau', variant: 'destructive' }); return; }
    setLoading(true); setErr(null); setCourse(null);
    try{
      const assembled: any = { id: Date.now().toString(36), title: title || topic, language, framework: framework === 'Aucun' ? undefined : framework, levels: [], steps: [] };
      for (let lvl of selectedLevels){
        const body = { language, framework: framework === 'Aucun' ? undefined : framework, topic: `${lvl} — ${topic}`, steps: stepsPerLevel };
        const r = await fetch('/api/course', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (!r.ok) {
          const txt = await r.text();
          throw new Error(`AI génération échouée (${r.status}): ${txt}`);
        }
        const data = await r.json();
        const lvlSteps = Array.isArray(data.steps) ? data.steps : [];
        assembled.levels.push({ level: lvl, steps: lvlSteps });
        for (let s of lvlSteps){
          assembled.steps.push({ ...s, level: lvl });
        }
      }
      setCourse(assembled);
      toast({ title: 'Cours généré', description: `${assembled.levels.length} niveaux crées` });
    }catch(e:any){ setErr(String(e?.message || e)); toast({ title: 'Gén��ration échouée', description: String(e?.message || e) }); }
    finally{ setLoading(false); }
  }

  const saveToLibrary = ()=>{
    if (!course) { toast({ title: 'Erreur', description: 'Aucun cours à sauvegarder', variant: 'destructive' }); return; }
    try{
      const KEY = 'course:library:v1';
      const raw = localStorage.getItem(KEY);
      const arr = raw ? JSON.parse(raw) : [];
      const save = { id: course.id, title: course.title, language: course.language, framework: course.framework, steps: course.steps, versions: course.versions || [] };
      arr.unshift(save);
      localStorage.setItem(KEY, JSON.stringify(arr));
      toast({ title: 'Cours sauvegardé' });
    }catch(e:any){ console.error(e); toast({ title: 'Impossible de sauvegarder' }); }
  };

  const exportPdf = async ()=>{
    if (!course) { toast({ title: 'Erreur', description: 'Aucun cours à exporter', variant: 'destructive' }); return; }
    try{
      const r = await fetch('/api/export/course', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ course, title: course.title }) });
      if (!r.ok) throw new Error('Export PDF échoué');
      const data = await r.json();
      if (data?.pdfB64){
        const bin = atob(data.pdfB64);
        const len = bin.length;
        const bytes = new Uint8Array(len);
        for (let i=0;i<len;i++) bytes[i] = bin.charCodeAt(i);
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${course.title||'cours'}.pdf`; a.click(); URL.revokeObjectURL(a.href);
        toast({ title: 'PDF prêt' });
      }
    }catch(e:any){ toast({ title: String(e?.message || e) }); }
  };

  const downloadZip = async ()=>{
    if (!course) { toast({ title: 'Erreur', description: 'Aucun cours', variant: 'destructive' }); return; }
    try{
      const zip = new JSZip();
      zip.file(`${course.title||'course'}.json`, JSON.stringify(course, null, 2));
      try{
        const r = await fetch('/api/export/course', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ course, title: course.title }) });
        if (r.ok){
          const data = await r.json();
          if (data?.pdfB64){
            const bin = atob(data.pdfB64);
            const len = bin.length;
            const bytes = new Uint8Array(len);
            for (let i=0;i<len;i++) bytes[i] = bin.charCodeAt(i);
            zip.file(`${course.title||'course'}.pdf`, bytes, { binary: true });
          }
        }
      }catch(e){ /* ignore */ }
      const blob = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${course.title||'course'}.zip`; a.click(); URL.revokeObjectURL(a.href);
      toast({ title: 'ZIP prêt' });
    }catch(e:any){ toast({ title: String(e?.message || e) }); }
  };

  const startEdit = ()=>{
    if (!course) return;
    setEditableCourse(JSON.parse(JSON.stringify(course)));
    setEditing(true);
  };

  const cancelEdit = ()=>{
    setEditableCourse(null);
    setEditing(false);
    toast({ title: 'Édition annulée' });
  };

  const saveEdits = ()=>{
    if (!course || !editableCourse) return;
    const prev = JSON.parse(JSON.stringify(course));
    const next = JSON.parse(JSON.stringify(editableCourse));
    next.versions = next.versions || [];
    next.versions.unshift({ ts: Date.now(), data: prev });
    setCourse(next);
    setEditableCourse(null);
    setEditing(false);
    toast({ title: 'Modifications enregistrées' });
  };

  const duplicateCourse = ()=>{
    if (!course) return;
    const copy = JSON.parse(JSON.stringify(course));
    copy.id = Date.now().toString(36);
    copy.title = (copy.title || 'Cours') + ' (copie)';
    setCourse(copy);
    toast({ title: 'Cours dupliqué' });
  };

  return (
    <div className="rounded-2xl border bg-card p-6 grid gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Générateur de cours complet</h2>
          <p className="text-sm text-muted-foreground mt-1">Génère des cours complets, détaillés et adaptés à tous niveaux.</p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Titre du cours" className="h-10 rounded-md border px-3 bg-background" />
        <input value={topic} onChange={(e)=>setTopic(e.target.value)} placeholder="Sujet (ex: Promises, CSS Grid, Routing)" className="h-10 rounded-md border px-3 bg-background" />
        <select value={language} onChange={(e)=>setLanguage(e.target.value as any)} className="h-10 rounded-md border px-3 bg-background">
          {LANGS.map(l=> <option key={l} value={l}>{l}</option>)}
        </select>
        <select value={framework} onChange={(e)=>setFramework(e.target.value as any)} className="h-10 rounded-md border px-3 bg-background">
          {FRAMEWORKS.map(f=> <option key={f} value={f}>{f}</option>)}
        </select>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm">Niveaux</label>
          {LEVELS.map(l=> (
            <label key={l} className="inline-flex items-center gap-2 text-sm ml-2">
              <input type="checkbox" checked={selectedLevels.includes(l)} onChange={()=>toggleLevel(l)} /> {l}
            </label>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm">Étapes par niveau</label>
          <input type="number" value={stepsPerLevel} onChange={(e)=> setStepsPerLevel(Math.max(1, Number(e.target.value)||1))} className="h-9 w-20 rounded-md border px-2 bg-background" />
        </div>
        <div className="ml-auto">
          <button onClick={generate} disabled={loading} className="h-10 px-4 rounded-md bg-primary text-primary-foreground">{loading? 'Génération…' : 'Générer cours'}</button>
        </div>
      </div>

      {err && <p className="text-sm text-destructive">{err}</p>}

      {course && (
        <div className="grid gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">Aperçu: {course.title}</h3>
            <div className="flex items-center gap-2">
              <button onClick={saveToLibrary} className="text-xs px-2 py-1 rounded-md border">Sauvegarder</button>
              <button onClick={exportPdf} className="text-xs px-2 py-1 rounded-md border">Exporter PDF</button>
              <button onClick={downloadZip} className="text-xs px-2 py-1 rounded-md border">Télécharger ZIP</button>
              <button onClick={startEdit} className="text-xs px-2 py-1 rounded-md border">Éditer</button>
              <button onClick={duplicateCourse} className="text-xs px-2 py-1 rounded-md border">Dupliquer</button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Langage: {course.language}{course.framework? ' • '+course.framework : ''}</p>
          <div className="grid gap-2">
            {(editing && editableCourse ? editableCourse.levels : course.levels).map((lv:any, li:number)=> (
              <div key={li} className="p-3 rounded-md border bg-background">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{lv.level}</div>
                  <div className="text-xs text-muted-foreground">{lv.steps?.length ?? 0} étapes</div>
                </div>
                <div className="mt-2 grid gap-2">
                  {lv.steps && lv.steps.map((s:any, si:number)=> (
                    <div key={si} className="p-2 rounded-md bg-white/5">
                      {editing ? (
                        <div className="grid gap-2">
                          <input value={s.title} onChange={(e)=>{
                            const d = {...editableCourse};
                            d.levels[li].steps[si].title = e.target.value;
                            setEditableCourse(d);
                          }} className="h-9 rounded-md border px-2" />
                          <textarea value={s.summary||''} onChange={(e)=>{
                            const d = {...editableCourse};
                            d.levels[li].steps[si].summary = e.target.value;
                            setEditableCourse(d);
                          }} className="rounded-md border p-2" />
                          <textarea value={s.codeExample||''} onChange={(e)=>{
                            const d = {...editableCourse};
                            d.levels[li].steps[si].codeExample = e.target.value;
                            setEditableCourse(d);
                          }} className="rounded-md border p-2" />
                        </div>
                      ) : (
                        <>
                          <div className="text-sm font-medium">{s.title}</div>
                          {s.objectives && <div className="text-xs text-muted-foreground">Objectifs: {Array.isArray(s.objectives)? s.objectives.join(', ') : String(s.objectives)}</div>}
                          {s.summary && <p className="mt-1 text-sm">{s.summary}</p>}
                          {s.codeExample && <pre className="mt-2 rounded-lg bg-secondary/60 p-3 text-xs overflow-auto"><code>{s.codeExample}</code></pre>}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {editing && (
            <div className="flex items-center gap-2">
              <button onClick={saveEdits} className="h-9 px-3 rounded-md bg-primary text-primary-foreground">Enregistrer les modifications</button>
              <button onClick={cancelEdit} className="h-9 px-3 rounded-md border">Annuler</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
