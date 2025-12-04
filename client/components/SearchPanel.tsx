import { useState } from "react";

interface ResultItem { title: string; url: string; description?: string }

export default function SearchPanel() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [error, setError] = useState("");

  const search = async () => {
    const query = q.trim();
    if (!query) return;
    setLoading(true); setError("");
    try {
      const r = await fetch(`/api/search?q=${encodeURIComponent(query)}&pageSize=10`);
      const txt = await r.clone().text();
      let data: any; try { data = JSON.parse(txt); } catch { data = {}; }
      const items: any[] = data?.value || data?.items || data?.results || [];
      const mapped: ResultItem[] = items.map((it: any)=> ({
        title: it.title || it.name || it.heading || it.url || "(sans titre)",
        url: it.url || it.link || it.id || "#",
        description: it.description || it.snippet || it.body || it.text || undefined,
      }));
      setResults(mapped);
    } catch (e:any) {
      setError(String(e?.message ?? e));
    } finally { setLoading(false); }
  };

  return (
    <div className="grid gap-3">
      <div className="flex items-end gap-2">
        <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Rechercher sur le web…" className="h-10 flex-1 px-3 rounded-md border bg-background" />
        <button onClick={search} disabled={loading} className="h-10 px-4 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60">Chercher</button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <ul className="grid gap-2">
        {results.map((r,i)=> (
          <li key={i} className="rounded-md border p-3">
            <a href={r.url} target="_blank" rel="noreferrer" className="font-medium hover:underline">{r.title}</a>
            {r.description && <p className="text-sm text-muted-foreground mt-1">{r.description}</p>}
          </li>
        ))}
      </ul>
      {loading && <p className="text-sm text-muted-foreground">Chargement…</p>}
    </div>
  );
}
