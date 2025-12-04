import { useState } from "react";

interface GeniusHit {
  id: string | number;
  title: string;
  artist?: string;
}

export default function GeniusSearch() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [hits, setHits] = useState<GeniusHit[]>([]);
  const [lyricsHtml, setLyricsHtml] = useState<string>("");
  const [error, setError] = useState<string>("");

  const search = async () => {
    const query = q.trim();
    if (!query) return;
    setLoading(true); setError(""); setLyricsHtml("");
    try {
      const r = await fetch(`/api/genius/search?q=${encodeURIComponent(query)}&per_page=10&page=1`);
      const t = await r.clone().text();
      let data: any; try { data = JSON.parse(t); } catch { data = {}; }
      const rawHits: any[] = data?.hits || data?.response?.hits || data?.sections?.[0]?.hits || [];
      const mapped: GeniusHit[] = rawHits.map((h: any)=>{
        const res = h?.result || h;
        return {
          id: res?.id ?? String(Math.random()),
          title: res?.full_title || res?.title || res?.name || "(sans titre)",
          artist: res?.primary_artist?.name || res?.artist_names || undefined,
        };
      });
      setHits(mapped);
    } catch (e:any) {
      setError(String(e?.message ?? e));
    } finally { setLoading(false); }
  };

  const getLyrics = async (id: string|number) => {
    setLoading(true); setError(""); setLyricsHtml("");
    try {
      const r = await fetch(`/api/genius/lyrics?id=${encodeURIComponent(String(id))}`);
      const t = await r.clone().text();
      let data: any; try { data = JSON.parse(t); } catch { data = {}; }
      const html: string = data?.lyrics?.lyrics?.body?.html || data?.lyrics?.body?.html || "";
      setLyricsHtml(html || "(pas de paroles trouvées)");
    } catch (e:any) {
      setError(String(e?.message ?? e));
    } finally { setLoading(false); }
  };

  return (
    <div className="grid gap-3">
      <div className="flex items-end gap-2">
        <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Rechercher une chanson ou un artiste…" className="h-10 flex-1 px-3 rounded-md border bg-background" />
        <button onClick={search} disabled={loading} className="h-10 px-4 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60">Rechercher</button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <ul className="grid gap-2">
        {hits.map(h=> (
          <li key={String(h.id)} className="flex items-center justify-between rounded-md border p-2">
            <div className="text-sm">
              <p className="font-medium">{h.title}</p>
              {h.artist && <p className="text-muted-foreground">{h.artist}</p>}
            </div>
            <button onClick={()=>getLyrics(h.id)} className="h-8 px-3 rounded-md border text-xs hover:bg-accent hover:text-accent-foreground">Paroles</button>
          </li>
        ))}
      </ul>
      {lyricsHtml && (
        <div className="rounded-md border p-3 prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: lyricsHtml }} />
      )}
      {loading && <p className="text-sm text-muted-foreground">Chargement…</p>}
    </div>
  );
}
