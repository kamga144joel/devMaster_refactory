import { useState } from "react";

interface TrackItem {
  id: string;
  title: string;
  artist?: string;
  album?: string;
}

export default function SpotifySearch() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<TrackItem[]>([]);
  const [error, setError] = useState<string>("");

  const search = async () => {
    const query = q.trim();
    if (!query) return;
    setLoading(true); setError("");
    try {
      const r = await fetch(`/api/spotify/search?q=${encodeURIComponent(query)}&type=track&limit=10`);
      const txt = await r.clone().text();
      let data: any; try { data = JSON.parse(txt); } catch { data = {}; }
      const raw: any[] = data?.tracks?.items || data?.tracks?.results || [];
      const mapped: TrackItem[] = raw.map((it:any)=>{
        // RapidAPI spotify23 often returns items with shape { data: { id, name, artists.items[0].profile.name, albumOfTrack.name } }
        const d = it?.data || it;
        const artist = d?.artists?.items?.[0]?.profile?.name || d?.artists?.items?.[0]?.name || d?.artists?.[0]?.name;
        return {
          id: d?.id || d?.uri || String(Math.random()),
          title: d?.name || d?.trackName || "(sans titre)",
          artist,
          album: d?.albumOfTrack?.name || d?.album?.name,
        };
      });
      setItems(mapped);
    } catch (e:any) {
      setError(String(e?.message ?? e));
    } finally { setLoading(false); }
  };

  return (
    <div className="grid gap-3">
      <div className="flex items-end gap-2">
        <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Rechercher une piste (ex: track:Hello artist:Adele)…" className="h-10 flex-1 px-3 rounded-md border bg-background" />
        <button onClick={search} disabled={loading} className="h-10 px-4 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60">Rechercher</button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <ul className="grid gap-2">
        {items.map(it=> (
          <li key={it.id} className="rounded-md border p-2">
            <p className="text-sm font-medium">{it.title}</p>
            <p className="text-xs text-muted-foreground">{[it.artist, it.album].filter(Boolean).join(" • ")}</p>
          </li>
        ))}
      </ul>
      {loading && <p className="text-sm text-muted-foreground">Chargement…</p>}
    </div>
  );
}
