import { useState } from "react";
import type { ExerciseItem, ExerciseResponse } from "@shared/api";

import { LANGS, FRAMEWORKS, TOP_LANGS, TOP_FRAMEWORKS } from "@/lib/platforms";

import { useToast } from "@/hooks/use-toast";

export default function ExerciseGenerator() {
  const [topic, setTopic] = useState("variables");
  const [language, setLanguage] = useState<(typeof LANGS)[number]>("JavaScript");
  const [framework, setFramework] = useState<(typeof FRAMEWORKS)[number]>("Aucun");
  const [loading, setLoading] = useState(false);
  const [translate, setTranslate] = useState(()=> (localStorage.getItem('exercise:translate') ?? 'true') === 'true');
  const [ex, setEx] = useState<ExerciseItem | null>(null);
  const [err, setErr] = useState<string>("");
  const { toast } = useToast();

  const setTranslatePref = (v:boolean)=>{ setTranslate(v); localStorage.setItem('exercise:translate', v ? 'true' : 'false'); };

  const saveTemplate = () => {
    if (!ex) { toast({ title: 'Erreur', description: 'Aucun exercice à enregistrer', variant: 'destructive' }); return; }
    const title = window.prompt('Titre du template', ex.title || topic || 'Template');
    if (!title) return;
    try {
      const KEY = 'exercise:templates:v1';
      const raw = localStorage.getItem(KEY);
      const arr = raw ? JSON.parse(raw) : [];
      arr.unshift({ id: Date.now().toString(36), title, language, framework: framework === 'Aucun' ? undefined : framework, topic, prompt: ex.prompt, starter: ex.starter, solution: ex.solution });
      localStorage.setItem(KEY, JSON.stringify(arr));
      toast({ title: 'Template enregistré' });
    } catch (e:any) { console.error(e); toast({ title: 'Erreur', description: 'Impossible d\'enregistrer le template', variant: 'destructive' }); }
  };

  const generate = async () => {
    setLoading(true);
    setEx(null);
    try {
      const r = await fetch("/api/exercise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, language, framework: framework === "Aucun" ? undefined : framework, translate }),
      });
      const text = await r.text();
      let data: ExerciseResponse & { error?: string; details?: string; status?: number };
      try { data = JSON.parse(text); } catch { data = { error: text } as any; }
      if ((data as any).exercise) {
        setEx((data as any).exercise);
        setErr("");
      } else {
        setErr(`Erreur API (${(data as any).status ?? r.status}): ${((data as any).details ?? (data as any).error ?? "").toString().slice(0,180)}`);
      }
    } catch (e: any) {
      setErr(`Erreur réseau: ${String(e?.message ?? e).slice(0,180)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border bg-card p-6 grid gap-4">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Générateur d'exercice</h2>
          <p className="text-sm text-muted-foreground mt-1">Choisis un sujet et obtiens un exercice court avec solution.</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="h-10 w-56 rounded-md border bg-background px-3 text-sm"
            placeholder="Sujet (ex: tableaux)"
          />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as any)}
            className="h-10 w-40 rounded-md border bg-background px-3 text-sm"
          >
            {LANGS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
          <select
            value={framework}
            onChange={(e) => setFramework(e.target.value as any)}
            className="h-10 w-44 rounded-md border bg-background px-3 text-sm"
          >
            {FRAMEWORKS.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={translate} onChange={(e)=>setTranslatePref(e.target.checked)} />
            Traduire en français
          </label>
          <button onClick={generate} disabled={loading} className="h-10 px-4 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
            {loading ? (translate? "Génération… (traduction)" : "Génération…") : (translate?"Générer (traduire)":"Générer")}
          </button>
        </div>
      </div>

      {err && <p className="text-sm text-destructive">{err}</p>}

      {ex && (
        <div className="grid gap-3">
          <h3 className="text-base font-semibold">{ex.title}</h3>
          <p className="text-sm text-muted-foreground">{ex.prompt}</p>
          <div className="grid gap-2 md:grid-cols-2">
            <div>
              <p className="text-xs font-medium">Starter</p>
              <pre className="mt-1 rounded-lg bg-secondary/60 p-3 text-xs overflow-auto"><code>{ex.starter}</code></pre>
            </div>
            <div>
              <p className="text-xs font-medium">Solution</p>
              <pre className="mt-1 rounded-lg bg-secondary/60 p-3 text-xs overflow-auto"><code>{ex.solution}</code></pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
