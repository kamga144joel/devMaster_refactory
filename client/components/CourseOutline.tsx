import { useState } from "react";
import type { CourseResponse, CourseStep } from "@shared/api";

import { useToast } from "@/hooks/use-toast";

export default function CourseOutline({ language, framework }: { language: string; framework?: string }) {
  const [topic, setTopic] = useState("bases");
  const [steps, setSteps] = useState(5);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<CourseStep[]>([]);
  const [err, setErr] = useState("");
  const { toast } = useToast();

  const generate = async () => {
    setLoading(true);
    setErr("");
    try {
      const r = await fetch("/api/course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, framework, topic, steps }),
      });
      const text = await r.text();
      let data: CourseResponse & { error?: string };
      try { data = JSON.parse(text); } catch { data = { error: text } as any; }
      if ((data as any).steps) setItems((data as any).steps);
      else setErr((data as any).error || "Erreur de génération du cours");
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  };

  const saveCourse = () => {
    if (!items || !items.length) { toast({ title: 'Erreur', description: 'Aucun cours à sauvegarder', variant: 'destructive' }); return; }
    const title = window.prompt('Titre du cours', `${language} ${framework ? '- '+framework : ''} ${topic}`) || 'Cours';
    try {
      const KEY = 'course:library:v1';
      const raw = localStorage.getItem(KEY);
      const arr = raw ? JSON.parse(raw) : [];
      arr.unshift({ id: Date.now().toString(36), title, language, framework, steps: items });
      localStorage.setItem(KEY, JSON.stringify(arr));
      toast({ title: 'Cours enregistré' });
    } catch (e:any) { console.error(e); toast({ title: 'Erreur', description: 'Impossible d\'enregistrer le cours', variant: 'destructive' }); }
  };

  return (
    <div className="rounded-2xl border bg-card p-6 grid gap-4">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Plan de cours</h2>
          <p className="text-sm text-muted-foreground mt-1">Itinéraire progressif avec objectifs et exemples.</p>
        </div>
        <div className="flex items-center gap-2">
          <input value={topic} onChange={(e)=>setTopic(e.target.value)} className="h-10 w-48 rounded-md border bg-background px-3 text-sm" placeholder="Sujet (ex: fondamentaux)" />
          <select value={steps} onChange={(e)=>setSteps(Number(e.target.value))} className="h-10 w-28 rounded-md border bg-background px-3 text-sm">
            {[3,4,5,6,7].map((n)=>(<option key={n} value={n}>{n} étapes</option>))}
          </select>
          <button onClick={generate} disabled={loading} className="h-10 px-4 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60">{loading?"Génération…":"Générer"}</button>
          <button onClick={saveCourse} className="h-10 px-3 rounded-md border text-sm hover:bg-accent hover:text-accent-foreground">Enregistrer le cours</button>
        </div>
      </div>
      {err && <p className="text-sm text-destructive">{err}</p>}
      <ol className="grid gap-4 list-decimal pl-5">
        {items.map((s, i)=> (
          <li key={i} className="grid gap-1">
            <h3 className="font-semibold">{s.title}</h3>
            <p className="text-sm text-muted-foreground">{s.summary}</p>
            {s.objectives?.length ? (
              <ul className="list-disc pl-5 text-sm text-muted-foreground">
                {s.objectives.map((o, j)=> <li key={j}>{o}</li>)}
              </ul>
            ) : null}
            {s.codeExample && <pre className="mt-1 rounded-lg bg-secondary/60 p-3 text-xs overflow-auto"><code>{s.codeExample}</code></pre>}
          </li>
        ))}
      </ol>
    </div>
  );
}
