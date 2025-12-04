import { useEffect, useState } from "react";
import type { ImageProvider } from "@shared/api";

interface GenImage { url?: string; b64?: string; mime?: string }

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState("");
  const [provider, setProvider] = useState<ImageProvider>(()=> (localStorage.getItem('img:provider') as ImageProvider) || 'auto');
  const [size, setSize] = useState("1024x1024");
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<GenImage[]>([]);
  const [error, setError] = useState("");

  useEffect(()=>{ localStorage.setItem('img:provider', provider); }, [provider]);

  const generate = async () => {
    const p = prompt.trim();
    if (!p) return;
    setLoading(true); setError(""); setImages([]);
    try {
      const r = await fetch('/api/image', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: p, provider, size }) });
      const text = await r.text();
      let data: any;
      try { data = JSON.parse(text); } catch { data = { error: text }; }
      if (!r.ok) {
        const detail = data?.detail || data;
        throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
      }
      const imgs: GenImage[] = data?.images || [];
      setImages(imgs);
    } catch (e:any) {
      setError(String(e?.message ?? e));
    } finally { setLoading(false); }
  };

  return (
    <div className="grid gap-3">
      <div className="flex items-end gap-2">
        <div className="flex-1 grid gap-2">
          <label className="text-xs text-muted-foreground">Prompt</label>
          <textarea value={prompt} onChange={(e)=>setPrompt(e.target.value)} placeholder="Décris l'image à générer…" className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div className="grid gap-2">
          <label className="text-xs text-muted-foreground">Fournisseur</label>
          <select value={provider} onChange={(e)=>setProvider(e.target.value as ImageProvider)} className="h-10 px-2 rounded-md border bg-background">
            <option value="auto">Auto</option>
            <option value="openai">OpenAI (DALL·E 3)</option>
            <option value="gemini">Gemini</option>
            <option value="huggingface">Hugging Face (Stable Diffusion)</option>
            <option value="deepai">DeepAI</option>
          </select>
        </div>
        <div className="grid gap-2">
          <label className="text-xs text-muted-foreground">Taille</label>
          <select value={size} onChange={(e)=>setSize(e.target.value)} className="h-10 px-2 rounded-md border bg-background">
            <option value="256x256">256x256</option>
            <option value="512x512">512x512</option>
            <option value="1024x1024">1024x1024</option>
          </select>
        </div>
        <button onClick={generate} disabled={loading} className="h-10 px-4 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60">Générer</button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading && <p className="text-sm text-muted-foreground">Génération…</p>}
      {!!images.length && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((img, i)=>{
            const src = img.url || (img.b64 ? `data:${img.mime || 'image/png'};base64,${img.b64}` : undefined);
            return (
              <div key={i} className="rounded-md overflow-hidden border bg-muted/20">
                {src ? <img src={src} alt={`image-${i+1}`} className="w-full h-auto" /> : <div className="p-6 text-sm text-muted-foreground">(aucune image)</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
