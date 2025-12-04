import { useMemo, useState } from "react";

function getLastAssistant(): string {
  try {
    const raw = localStorage.getItem('chat:history');
    const arr = raw ? JSON.parse(raw) as { role: string; content: string }[] : [];
    for (let i = arr.length - 1; i >= 0; i--) if (arr[i].role === 'assistant') return arr[i].content || '';
    return '';
  } catch { return ''; }
}

export default function DocumentExporter() {
  const [title, setTitle] = useState("Document");
  const [content, setContent] = useState(()=> getLastAssistant());
  const empty = useMemo(()=> !content.trim(), [content]);

  const dl = async (url: string, body: any, filename: string) => {
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const blob = await r.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=> URL.revokeObjectURL(a.href), 5000);
  };

  const exportPdf = () => dl('/api/export/pdf', { title, content }, `${slug(title)}.pdf`).catch(console.error);
  const exportDocx = () => dl('/api/export/docx', { title, content }, `${slug(title)}.docx`).catch(console.error);

  return (
    <div className="grid gap-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="grid gap-2">
          <label className="text-xs text-muted-foreground">Titre</label>
          <input value={title} onChange={(e)=>setTitle(e.target.value)} className="h-10 rounded-md border bg-background px-3" />
        </div>
        <div className="grid gap-2">
          <label className="text-xs text-muted-foreground">Source</label>
          <select onChange={(e)=> setContent(e.target.value === 'last' ? getLastAssistant() : content)} className="h-10 rounded-md border bg-background px-2">
            <option value="last">Dernière réponse de l'assistant</option>
            <option value="custom">Texte personnalisé</option>
          </select>
        </div>
      </div>
      <textarea value={content} onChange={(e)=>setContent(e.target.value)} placeholder="Contenu du document…" className="min-h-40 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
      <div className="flex items-center gap-2">
        <button onClick={exportPdf} disabled={empty} className="h-10 px-4 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60">Exporter PDF</button>
        <button onClick={exportDocx} disabled={empty} className="h-10 px-4 rounded-md border hover:bg-accent hover:text-accent-foreground">Exporter DOCX</button>
      </div>
    </div>
  );
}

function slug(s: string){ return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)+/g,''); }
