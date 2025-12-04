import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import type { MentorResponse } from "@shared/api";
import { LANGS, FRAMEWORKS, TOP_LANGS, TOP_FRAMEWORKS } from "@/lib/platforms";

export default function Mentor() {
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState<(typeof LANGS)[number]>(()=> (localStorage.getItem('learn:lang') as any) || "Aucun");
  const [framework, setFramework] = useState<(typeof FRAMEWORKS)[number]>(()=> (localStorage.getItem('learn:fw') as any) || "Aucun");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string>("");

  // local conversation state so mentor can act like a chat
  const [messages, setMessages] = useState<{ id: string; role: 'user'|'assistant'; content: string }[]>(() => []);
  const messagesRef = useRef<HTMLDivElement | null>(null);

  useEffect(()=>{
    // auto-scroll when messages change
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  },[messages]);

  useEffect(()=>{
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        // only send if there's content
        if (message.trim() || code.trim()) ask();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  },[message, code]);

  const publicApi = localStorage.getItem('chat:publicApi') || 'none';

  const callPublicApi = async (query: string) => {
    try {
      if (publicApi === 'duckduckgo') {
        const r = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`);
        const d = await r.json();
        return d.AbstractText || 'Aucun résultat.';
      }
      if (publicApi === 'wikipedia') {
        const s = await fetch(`https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=1&format=json&origin=*`);
        const so = await s.json();
        const title = so && so[1] && so[1][0];
        if (!title) return 'Aucun article trouvé sur Wikipedia.';
        const p = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
        const pj = await p.json();
        return pj.extract || 'Aucun résumé disponible.';
      }
      if (publicApi === 'advice') {
        const r = await fetch('https://api.adviceslip.com/advice');
        const d = await r.json();
        return d.slip && d.slip.advice ? d.slip.advice : 'Pas de conseil.';
      }
      if (publicApi === 'bored') {
        const r = await fetch('https://www.boredapi.com/api/activity');
        const d = await r.json();
        return `${d.activity} (type: ${d.type}, participants: ${d.participants})`;
      }
      return null;
    } catch (e) { return null; }
  };

  const analyzeCodeLocally = (msg:string, codeText:string) => {
    // enhanced local analysis: explain structure and common issues based on language
    const parts: string[] = [];
    parts.push(`Résumé: ${msg || 'Analyse de code'}`);
    if (codeText) {
      parts.push('\nAnalyse du code:');
      const maxPreview = codeText.split('\n').slice(0,50).join('\n');
      parts.push('\n--- extrait ---\n' + maxPreview + '\n--- fin extrait ---');

      if (language === 'JavaScript' || language === 'TypeScript') {
        if (/console\.log\(/.test(codeText)) parts.push('- Ce code utilise console.log pour debug.');
        if (/==[^=]/.test(codeText)) parts.push('- Attention aux opérateurs ==, préférez ===.');
        if (/\.then\(|async function|await /.test(codeText)) parts.push('- Ce code utilise des promesses/async-await. Vérifie la gestion des erreurs (try/catch).');
        const logMatch = codeText.match(/console\.log\(\s*([a-zA-Z_$][\w$]*)\s*\)/);
        if (logMatch) {
          const ident = logMatch[1];
          const declRegex = new RegExp(`\\b(?:var|let|const)\\s+${ident}\\b`);
          const paramRegex = new RegExp(`function\\s+\\w*\\s*\\([^)]*\\b${ident}\\b[^)]*\\)`);
          if (!declRegex.test(codeText) && !paramRegex.test(codeText)) {
            parts.push(`- Attention: la variable "${ident}" semble utilisée mais non déclarée/initialisée.`);
            parts.push('\nSuggestion:');
            parts.push(`\n\`\`js\nlet ${ident} = /* valeur */;\nconsole.log(${ident});\n\`\``);
          }
        }
        parts.push('\nExemple de correction / suggestion:');
        parts.push('```js\nasync function safe() {\n  try {\n    const res = await fetch("/api");\n  } catch (e) {\n    console.error(e);\n  }\n}\n```');
      } else if (language.toLowerCase().includes('python')) {
        if (/print\(/.test(codeText)) parts.push('- Utilise print pour vérifier les valeurs.');
        if (/except\s*:\s*/.test(codeText) || /try\s*:/.test(codeText)) parts.push('- Gestion d\'exceptions détectée. Vérifie les types d\'exceptions capturés.');
        parts.push('\nSuggestion: vérifier l\'indentation et l\'usage de if __name__ == "__main__" pour l\'exécution directe.');
      } else if (language.toLowerCase().includes('java')) {
        if (/System\.out\.println\(/.test(codeText)) parts.push('- Utilisation de System.out.println pour debug.');
        parts.push('\nSuggestion: vérifiez la signature des méthodes et l\'usage des types génériques.');
      } else if (language.toLowerCase().includes('c') || language.toLowerCase().includes('cpp')) {
        if (/printf\(/.test(codeText)) parts.push('- Utilisation de printf pour debug.');
        parts.push('\nSuggestion: vérifiez les buffers et la gestion mémoire.');
      }
    }
    parts.push('\nConseil: pose une question précise pour une analyse approfondie.');
    return parts.join('\n');
  };

  useEffect(()=>{ localStorage.setItem('learn:lang', language); window.dispatchEvent(new CustomEvent('prefs:changed',{ detail: { key: 'learn:lang', value: language } })); },[language]);
  useEffect(()=>{ localStorage.setItem('learn:fw', framework); window.dispatchEvent(new CustomEvent('prefs:changed',{ detail: { key: 'learn:fw', value: framework } })); },[framework]);

  const ask = async () => {
    if (!message && !code) return;
    setLoading(true);
    setAnswer("");
    // append user message into local conversation
    const userContent = `${message}${code ? '\n\nCode:\n' + code : ''}`;
    const userId = Math.random().toString(36).slice(2);
    setMessages(prev => [...prev, { id: userId, role: 'user', content: userContent }]);

    try {
      // first try server-side mentor endpoint (if available) for best results
      try {
        const r = await fetch('/api/mentor', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message, code, language, framework }) });
        if (r.ok) {
          const data = await r.json() as { answer?: string };
          if (data?.answer) {
            const assistantId = Math.random().toString(36).slice(2);
            setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: data.answer }]);
            setAnswer(data.answer);
            return;
          }
        }
      } catch (e) {
        // ignore server errors and fallback
      }

      // If a public API is selected, ask it and use its response
      if (publicApi && publicApi !== 'none') {
        const resp = await callPublicApi(message || code || '');
        const assistantId = Math.random().toString(36).slice(2);
        const isEmptyPublic = !resp || /^\s*(Aucun|Pas de|No |Not )/i.test(String(resp));
        if (!isEmptyPublic) {
          setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: resp }]);
          setAnswer(resp);
          return;
        }
        // fallback to local analysis when public API can't help
        const local = analyzeCodeLocally(message, code);
        setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: local }]);
        setAnswer(local);
        return;
      }

      // fallback local analysis
      const local = analyzeCodeLocally(message, code);
      const assistantId = Math.random().toString(36).slice(2);
      setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: local }]);
      setAnswer(local);

    } catch (e) {
      const err = 'Une erreur est survenue lors de l\'analyse.';
      setAnswer(err);
      setMessages(prev => [...prev, { id: Math.random().toString(36).slice(2), role: 'assistant', content: err }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border bg-card p-6 grid gap-4">
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Mentor IA</h2>
          <div className="text-xs text-muted-foreground">Powered by <span className="font-medium">Joël kamga</span> (kaiser)</div>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Pose une question ou colle du code. Le mentor explique simplement et corrige si besoin.
        </p>
      </div>
      <div className="grid gap-2 md:grid-cols-[1fr,180px,180px]">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ta question (ex: Pourquoi ma boucle ne s'arrête pas ?)…"
          className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <div>
          <label className="text-xs text-muted-foreground">Langage</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as any)}
            className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm"
          >
            {LANGS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Framework</label>
          <select
            value={framework}
            onChange={(e) => setFramework(e.target.value as any)}
            className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm"
          >
            {FRAMEWORKS.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
      </div>
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder={`(Optionnel) Colle ici ton code ${language}${framework!=="Aucun" ? ` (${framework})` : ''}…`}
        className="min-h-28 w-full rounded-md border bg-background px-3 py-2 font-mono text-xs outline-none focus:ring-2 focus:ring-ring"
      />
      <div className="flex items-center gap-3">
        <button
          onClick={ask}
          disabled={loading || (!message.trim() && !code.trim())}
          className="h-10 px-5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Analyse…" : "Demander"}
        </button>
        <button
          onClick={() => {
            setMessage("");
            setCode("");
            setAnswer("");
          }}
          className="h-10 px-4 rounded-md border hover:bg-accent hover:text-accent-foreground"
        >
          Réinitialiser
        </button>
        <button onClick={async ()=>{
          try{
            const payload = { namespace: 'mentor', key: `mentor:${Date.now()}`, data: { message, code, language, framework, messages } };
            const r = await fetch('/api/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const j = await r.json();
            if (r.status === 501) toast({ title: 'Sauvegarde cloud indisponible', description: 'Configurez SUPABASE_URL et SUPABASE_KEY via Netlify env vars', variant: 'destructive' });
            else if (!r.ok) toast({ title: 'Erreur sauvegarde', description: String(j?.message || j?.error || 'unknown'), variant: 'destructive' });
            else toast({ title: 'Sauvegardé', description: 'Conversation sauvegardée dans le cloud' });
          }catch(e:any){ toast({ title: 'Erreur', description: String(e?.message||e), variant: 'destructive' }); }
        }} className="h-10 px-4 rounded-md border">Sauver</button>
      </div>
      <div ref={messagesRef} className="grid gap-3 max-h-80 overflow-auto">
        {messages.map(m => (
          <div key={m.id} className={`p-3 rounded-md border ${m.role === 'user' ? 'bg-secondary/60' : 'bg-background'}`}>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{m.role === 'user' ? 'Vous' : 'Mentor'}</p>
            <div className="mt-1 whitespace-pre-wrap text-sm">{m.content}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
