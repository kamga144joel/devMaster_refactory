import React, { useRef, useState, useEffect, Suspense } from "react";
const Editor = React.lazy(() => import('@monaco-editor/react'));
import { useToast } from "@/hooks/use-toast";
import WorkerHelp from "@/components/WorkerHelp";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Save, RotateCcw, Maximize, Minimize, Code, Monitor, Zap, History, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

import { SANDBOX_LANGS } from "@/lib/platforms";

// Composant de chargement personnalisé
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-64 bg-muted/20 rounded-lg">
    <div className="animate-pulse flex flex-col items-center gap-2">
      <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      <p className="text-sm text-muted-foreground">Chargement de l'éditeur...</p>
    </div>
  </div>
);

export default function Sandbox() {
  const [language, setLanguage] = useState<string>(()=> localStorage.getItem('sandbox:lang') || String(SANDBOX_LANGS[0] || 'javascript'));
  const [framework, setFramework] = useState<string>(()=> localStorage.getItem('sandbox:fw') || '');
  const jsWorkerRef = useRef<Worker | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // create a JS worker for isolated JS execution (used for JS/TS)
  const getJSWorker = () => {
    if (jsWorkerRef.current) return jsWorkerRef.current;
    const workerSrc = `self.onmessage = async function(e) { try { const id = e.data.id; const code = e.data.code; const logs = []; const originalLog = console.log; const originalError = console.error; console.log = function(...a){ logs.push(a.map(String).join(' ')); }; console.error = function(...a){ logs.push('[error] '+a.map(String).join(' ')); }; try { const fn = new Function(code); const res = fn(); self.postMessage({ type: 'result', id, ok: true, logs }); } catch(err) { self.postMessage({ type: 'result', id, ok: false, error: String(err), logs }); } finally { console.log = originalLog; console.error = originalError; } } catch(e){ self.postMessage({ type: 'error', error: String(e) }); } };`;
    const blob = new Blob([workerSrc], { type: 'application/javascript' });
    const w = new Worker(URL.createObjectURL(blob));
    jsWorkerRef.current = w;
    return w;
  };

  const runInWorker = (codeStr: string, timeout = 5000) => {
    return new Promise<{ ok: boolean; logs?: string[]; error?: string }>((resolve)=>{
      try{
        const w = getJSWorker();
        const id = Math.random().toString(36).slice(2);
        const onmsg = (ev: MessageEvent) => {
          const d = ev.data;
          if (d && d.id === id && d.type === 'result') {
            w.removeEventListener('message', onmsg as any);
            resolve({ ok: d.ok, logs: d.logs, error: d.error });
          }
        };
        w.addEventListener('message', onmsg as any);
        w.postMessage({ id, code: codeStr });
        // timeout
        setTimeout(()=>{
          w.removeEventListener('message', onmsg as any);
          resolve({ ok: false, error: 'Timeout' });
        }, timeout);
      }catch(e){ resolve({ ok:false, error: String(e) }); }
    });
  };
  const [code, setCode] = useState(() => {
    const saved = localStorage.getItem('sandbox:code');
    return saved || (localStorage.getItem('sandbox:lang') === 'python' 
      ? "# Bienvenue dans le bac à sable Python\nprint('Bonjour 👋')\n\n# Essayez d'écrire du code ci-dessous" 
      : "// Bienvenue dans le bac à sable JavaScript\nconsole.log('Bonjour 👋');\n\n// Essayez d'écrire du code ci-dessous");
  });
  
  const [output, setOutput] = useState<string>("");
  const [runningFlag, setRunningFlag] = useState(false);
  const running = useRef(false);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('editor');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('prefs:editor:theme') as 'light' | 'dark') || 'dark';
  });
  const [stats, setStats] = useState<{ logs: number; timeMs: number } | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [history, setHistory] = useState<{ ts: number; code: string }[]>([]);
  const [workerMode, setWorkerMode] = useState<'cdn'|'embedded'>(()=> (localStorage.getItem('sandbox:workerMode') as 'cdn'|'embedded') || 'cdn');
  const [showHelp, setShowHelp] = useState(false);

  const FRAMEWORK_PRESETS: Record<string,string> = {
    'Aucun': '// Empty preset\n',
    'React (CRA)': "import React from 'react';\nimport ReactDOM from 'react-dom';\nfunction App(){ return <div>Hello React</div>; }\nReactDOM.render(<App/>, document.getElementById('root'));",
    'Next.js (page)': "export default function Page(){ return <div>Hello Next</div>; }",
    'Vue (component)': "<template>\n  <div>Hello Vue</div>\n</template>\n<script>export default { name: 'MyComp' }</script>",
    'HTML/CSS starter': "<!doctype html>\n<html><head><meta charset=\"utf-8\"><title>Demo</title></head><body><h1>Hello</h1></body></html>",
  };
  const [preset, setPreset] = useState<string>('Aucun');
  const applyPreset = (p?: string) => {
    const key = p || preset;
    const content = FRAMEWORK_PRESETS[key] ?? FRAMEWORK_PRESETS['Aucun'];
    setCode(content);
    toast({ title: 'Preset chargé', description: key });
  };
  // load saved history & prefs on mount
  useEffect(()=>{
    try{
      const raw = localStorage.getItem('sandbox:history');
      const arr = raw ? JSON.parse(raw) : [];
      setHistory(arr.slice(0,50));
      if (arr && arr.length) setLastSavedAt(arr[0].ts || null);
      const lang = localStorage.getItem('sandbox:lang');
      if (lang) setLanguage(lang);
      const fw = localStorage.getItem('sandbox:fw');
      if (fw) setFramework(fw);
    }catch(e){ }
  },[]);

  // autosave debounce (respects preference)
  useEffect(()=>{
    const enabled = (localStorage.getItem('prefs:editor:autoSave') ?? 'true') === 'true';
    if (!enabled) return;
    const id = setTimeout(()=>{
      try{
        const ts = Date.now();
        localStorage.setItem('sandbox:code', code);
        localStorage.setItem('sandbox:lang', language);
        localStorage.setItem('sandbox:fw', framework || '');
        // push to history (unshift)
        const raw = localStorage.getItem('sandbox:history');
        const arr = raw ? JSON.parse(raw) : [];
        arr.unshift({ ts, code, lang: language });
        // keep max 100
        while(arr.length>100) arr.pop();
        localStorage.setItem('sandbox:history', JSON.stringify(arr));
        setHistory(arr.slice(0,50));
        setLastSavedAt(ts);
        toast({ title: 'Auto‑sauvegardé', description: new Date(ts).toLocaleString() });
      }catch(e){ }
    }, 2000);
    return ()=> clearTimeout(id);
  },[code, language, framework]);

  // apply editor theme preference
  useEffect(()=>{
    const theme = localStorage.getItem('prefs:editor:theme') || 'dark';
    try{ if (theme === 'dark') monacoSetTheme('vs-dark'); else monacoSetTheme('vs-light'); }catch(e){}
  },[]);

  const restoreHistory = (idx:number)=>{
    const it = history[idx];
    if (!it) return; if (!confirm('Restaurer cette version ?')) return;
    setCode(it.code);
    toast({ title: 'Version restaurée' });
  };

  const monacoSetTheme = (t: string)=>{
    try{
      // @ts-ignore
      if ((window as any).monaco && (window as any).monaco.editor) (window as any).monaco.editor.setTheme(t);
    }catch(e){}
  };

  // helpers to load runtimes
  const loadPyodide = async () => {
    if ((window as any).__pyodide) return (window as any).__pyodide;
    // load pyodide
    try {
      // @ts-ignore
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js';
      document.head.appendChild(script);
      await new Promise((res, rej) => { script.onload = res; script.onerror = rej; });
      // @ts-ignore
      const pyodide = await (window as any).loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.23.4/full/' });
      (window as any).__pyodide = pyodide;
      return pyodide;
    } catch (e) { throw e; }
  };

  const loadTsCompiler = async () => {
    if ((window as any).__tsCompiler) return (window as any).__tsCompiler;
    try {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/typescript@5.3.3/lib/typescriptServices.js';
      document.head.appendChild(script);
      await new Promise((res, rej) => { script.onload = res; script.onerror = rej; });
      // @ts-ignore
      const ts = (window as any).ts;
      (window as any).__tsCompiler = ts;
      return ts;
    } catch (e) { throw e; }
  };

  // load fengari (Lua) runtime from CDN (best-effort)
  const loadFengari = async () => {
    if ((window as any).__fengari) return (window as any).__fengari;
    try {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/fengari-web/dist/fengari-web.js';
      document.head.appendChild(script);
      await new Promise((res, rej) => { script.onload = res; script.onerror = rej; });
      const fengari = (window as any).fengari || (window as any).fengari_web || (window as any).fengariWeb;
      (window as any).__fengari = fengari;
      return fengari;
    } catch (e) { throw e; }
  };

  // prototype: attempt to load a php-wasm runtime from several CDNs (best-effort)
  const loadPhpWasm = async () => {
    if ((window as any).__phpWasm) return (window as any).__phpWasm;
    const candidates = [
      'https://cdn.jsdelivr.net/gh/fiatjaf/php-wasm@latest/dist/php-wasm.js',
      'https://unpkg.com/php-wasm/dist/php-wasm.js',
      'https://php.wasm.org/dist/php.js'
    ];
    for (const src of candidates) {
      try {
        const script = document.createElement('script');
        script.src = src;
        document.head.appendChild(script);
        await new Promise((res, rej) => { script.onload = res; script.onerror = rej; });
        if ((window as any).PHP) { (window as any).__phpWasm = (window as any).PHP; return (window as any).__phpWasm; }
        if ((window as any).php) { (window as any).__phpWasm = (window as any).php; return (window as any).__phpWasm; }
      } catch (e) { /* try next candidate */ }
    }
    throw new Error('php-wasm runtime not found on known CDNs');
  };

  const run = async () => {
    if (running.current) return;
    running.current = true;
    setRunningFlag(true);
    const start = Date.now();
    try {
      // helper to execute JS code and capture console
      const execJS = (src:string) => {
        const logs: string[] = [];
        const originalLog = console.log;
        const originalError = console.error;
        console.log = (...args: any[]) => { logs.push(args.map(String).join(' ')); originalLog(...args); };
        console.error = (...args: any[]) => { logs.push('[error] ' + args.map(String).join(' ')); originalError(...args); };
        try {
          // eslint-disable-next-line no-new-func
          const fn = new Function(src);
          fn();
          return { ok: true, logs };
        } catch (err:any) {
          return { ok: false, err, logs };
        } finally {
          console.log = originalLog; console.error = originalError;
        }
      };

      if (language === 'html') {
        // render HTML/CSS/JS preview in iframe
        try{
          const doc = code;
          if (iframeRef.current) {
            iframeRef.current.srcdoc = doc;
            setOutput('(aperçu rendu)');
            setStats({ logs: 0, timeMs: Date.now()-start });
            toast({ title: 'Aperçu HTML', description: 'Rendu dans l\'iframe' });
          } else {
            setOutput('(iframe non disponible)');
          }
        }catch(e:any){ setOutput('Erreur preview HTML: '+String(e?.message||e)); toast({ title: 'Erreur', description: 'Aperçu échoué', variant: 'destructive' }); }
      } else if (language === 'javascript' || language === 'typescript') {
        // use worker for isolation
        try{
          let jsCode = code;
          if (language === 'typescript') {
            const ts = await loadTsCompiler();
            const out = ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
            jsCode = out.outputText;
          } else {
            // attempt to transpile if syntax fails
          }
          const res = await runInWorker(jsCode, 5000);
          if (res.ok) {
            const timeMs = Date.now() - start;
            setOutput((res.logs || []).join('\n') || '(aucune sortie)');
            setStats({ logs: (res.logs||[]).length, timeMs });
            toast({ title: 'Exécution isolée', description: `${(res.logs||[]).length} lignes, ${timeMs}ms` });
          } else {
            setOutput('Erreur: '+(res.error || 'exécution échouée'));
            setStats({ logs: (res.logs||[]).length || 0, timeMs: Date.now()-start });
            toast({ title: 'Erreur d’exécution', description: String(res.error || 'Timeout'), variant: 'destructive' });
          }
        }catch(e:any){ setOutput('Erreur worker: '+String(e?.message||e)); toast({ title: 'Erreur', description: 'Erreur worker', variant: 'destructive' }); }
      } else if (language === 'python') {
        try {
          const pyodide = await loadPyodide();
          // capture stdout
          let out = '';
          pyodide.runPython(`import sys\nclass Capture:\n  def __init__(self):\n    self.data = ''\n  def write(self, s):\n    self.data += str(s)\n  def flush(self):\n    pass\ncap = Capture()\nsys.stdout = cap\nsys.stderr = cap\n`);
          const result = await pyodide.runPythonAsync(code);
          out = (pyodide.runPython('cap.data') || '') + (result !== undefined ? '\n' + String(result) : '');
          const timeMs = Date.now() - start;
          setOutput(String(out || '(aucune sortie)'));
          setStats({ logs: out.split('\n').length, timeMs });
          toast({ title: 'Python exécuté', description: `${timeMs}ms` });
        } catch (e:any) { setOutput('Erreur Python: ' + String(e?.message || e)); toast({ title: 'Erreur Python', description: String(e?.message||e), variant: 'destructive' }); }
      } else if (language === 'lua') {
        try {
          const fengari = await loadFengari();
          const logs: string[] = [];
          const originalLog = console.log;
          console.log = (...args: any[]) => { logs.push(args.map(String).join(' ')); originalLog(...args); };
          try {
            if (fengari && typeof fengari.load === 'function') {
              const fn = fengari.load(code);
              if (typeof fn === 'function') fn();
            } else if ((window as any).fengari && typeof (window as any).fengari.run === 'function') {
              await (window as any).fengari.run(code);
            } else {
              throw new Error('API Fengari introuvable');
            }
            const timeMs = Date.now() - start;
            setOutput((logs || []).join('\n') || '(aucune sortie)');
            setStats({ logs: (logs||[]).length, timeMs });
            toast({ title: 'Lua exécuté', description: `${(logs||[]).length} lignes, ${timeMs}ms` });
          } catch (e:any) {
            setOutput('Erreur Lua: ' + String(e?.message || e));
            toast({ title: 'Erreur Lua', description: String(e?.message||e), variant: 'destructive' });
          } finally {
            console.log = originalLog;
          }
        } catch (e:any) { setOutput('Erreur chargement Lua: ' + String(e?.message || e)); toast({ title: 'Erreur', description: 'Chargement Fengari échoué', variant: 'destructive' }); }
      } else if (language === 'php') {
        try {
          const php = await loadPhpWasm();
          const logs: string[] = [];
          const originalLog = console.log;
          console.log = (...args: any[]) => { logs.push(args.map(String).join(' ')); originalLog(...args); };
          try {
            let out: any = undefined;
            if (php && typeof php.run === 'function') {
              out = await php.run(code);
            } else if (php && typeof php.execute === 'function') {
              out = await php.execute(code);
            } else if ((window as any).PHP && typeof (window as any).PHP.run === 'function') {
              out = await (window as any).PHP.run(code);
            } else {
              // unknown API - attempt to call a common entrypoint
              if ((window as any).PHP && typeof (window as any).PHP.instantiate === 'function') {
                // some runtimes require instantiation; try a basic call
                out = '(php-wasm chargé)';
              } else {
                throw new Error('API php-wasm introuvable');
              }
            }
            const timeMs = Date.now() - start;
            setOutput(String(out ?? (logs.join('\n') || '(aucune sortie)')));
            setStats({ logs: (logs||[]).length, timeMs });
            toast({ title: 'PHP (prototype)', description: `${timeMs}ms` });
          } catch (e:any) {
            setOutput('Erreur PHP: ' + String(e?.message || e));
            toast({ title: 'Erreur PHP', description: String(e?.message||e), variant: 'destructive' });
          } finally {
            console.log = originalLog;
          }
        } catch (e:any) { setOutput('Impossible de charger php-wasm: ' + String(e?.message || e)); toast({ title: 'Erreur', description: 'Chargement php-wasm échoué', variant: 'destructive' }); }
      } else {
        // unsupported language: provide download guidance
        setOutput(`Exécution non supportée pour ${language} dans le bac à sable client. Vous pouvez télécharger le fichier et exécuter localement.`);
        toast({ title: 'Non supporté', description: `Exécution non supportée pour ${language}` });
      }
    } finally {
      running.current = false;
      setRunningFlag(false);
    }
  };

  // allow external components to load code into the sandbox or trigger run
  useEffect(() => {
    const onLoad = (e: any) => {
      const d = e?.detail || {};
      if (d.lang) { setLanguage(d.lang); localStorage.setItem('sandbox:lang', d.lang); }
      if (d.code) setCode(d.code);
      toast({ title: 'Bac à sable', description: 'Code charg��' });
    };
    const onRun = () => { run(); };
    window.addEventListener('sandbox:load', onLoad as any);
    window.addEventListener('sandbox:run', onRun as any);
    return () => { window.removeEventListener('sandbox:load', onLoad as any); window.removeEventListener('sandbox:run', onRun as any); };
  }, [code, language]);

  // allow sharing the current code via URL and stopping the worker
  const stopExecution = () => {
    try {
      if (jsWorkerRef.current) { jsWorkerRef.current.terminate(); jsWorkerRef.current = null; }
    } catch (e) {}
    running.current = false; setRunningFlag(false);
    toast({ title: 'Arrêté', description: 'Worker arrêté' });
  };

  const shareSandboxLink = async () => {
    try {
      const payload = btoa(unescape(encodeURIComponent(JSON.stringify({ lang: language, code }))));
      const url = `${window.location.origin}${window.location.pathname}?sandbox=${payload}`;
      await navigator.clipboard.writeText(url);
      toast({ title: 'Lien copié', description: 'Lien du bac à sable copié dans le presse‑papier' });
    } catch (e) { toast({ title: 'Erreur', description: 'Impossible de copier le lien', variant: 'destructive' }); }
  };

  // read sandbox code from URL if present
  useEffect(()=>{
    try{
      const params = new URLSearchParams(window.location.search);
      const s = params.get('sandbox');
      if (s) {
        const json = decodeURIComponent(escape(atob(s)));
        const obj = JSON.parse(json);
        if (obj.lang) { setLanguage(obj.lang); localStorage.setItem('sandbox:lang', obj.lang); }
        if (obj.code) setCode(obj.code);
        toast({ title: 'Bac à sable', description: 'Code chargé depuis l’URL' });
      }
    }catch(e){}
  },[]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') run();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [code]);

  const copyOutput = async () => {
    try {
      await navigator.clipboard.writeText(output || '');
      toast({ title: 'Sortie copiée' });
    } catch {
      toast({ title: 'Impossible de copier' });
    }
  };

  const downloadCode = () => {
    const extMap:any = { javascript: 'js', typescript: 'ts', python: 'py', bash: 'sh', html: 'html', java: 'java', c: 'c' };
    const ext = extMap[language] || 'txt';
    const blob = new Blob([code], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `sandbox.${ext}`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const clear = () => {
    if (!confirm('Effacer le code ?')) return;
    setCode('');
    setOutput('');
    setStats(null);
    toast({ title: 'Effacé' });
  };

  return (
    <div className="rounded-2xl border bg-card p-6 grid gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Bac à sable ({language})</h2>
          <p className="text-sm text-muted-foreground mt-1">Écris du code et exécute-le. Utilise Ctrl/Cmd+Entrée pour exécuter (si supporté). La sortie apparaît ci‑dessous.</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Langage</label>
          <select value={language} onChange={(e)=>{ setLanguage(e.target.value); localStorage.setItem('sandbox:lang', e.target.value); }} className="h-9 rounded-md border bg-background px-2 text-xs">
            {['javascript','typescript','python','bash','html','lua','php','java','c'].map(l=> (<option key={l} value={l}>{l}</option>))}
          </select>
          <label className="text-xs text-muted-foreground">Workers</label>
          <select value={workerMode} onChange={(e)=>{ const v = e.target.value as any; setWorkerMode(v); localStorage.setItem('sandbox:workerMode', v); window.location.reload(); }} className="h-9 rounded-md border bg-background px-2 text-xs">
            <option value="cdn">CDN (fast)</option>
            <option value="embedded">Embedded (bundled)</option>
          </select>
          <label className="text-xs text-muted-foreground">Preset</label>
          <select value={preset} onChange={(e)=>setPreset(e.target.value)} className="h-9 rounded-md border bg-background px-2 text-xs">
            {Object.keys(FRAMEWORK_PRESETS).map(k=> <option key={k} value={k}>{k}</option>)}
          </select>
          <button onClick={()=>applyPreset()} className="h-9 px-2 rounded-md border text-xs">Charger preset</button>
          <button onClick={()=>setShowHelp(true)} className="h-9 px-2 rounded-md border text-xs">Aide</button>
        </div>
      </div>
      <Suspense fallback={<div className="rounded-md border bg-background p-4">Chargement de l'éditeur…</div>}>
        <Editor
          height="320px"
          defaultLanguage={language === 'bash' ? 'shell' : language === 'html' ? 'html' : language}
          language={language === 'bash' ? 'shell' : language === 'html' ? 'html' : language}
          theme="vs-dark"
          value={code}
          onChange={(v) => setCode(v || '')}
          onMount={async (editor, monaco) => {
            try{
              // configure Monaco web workers based on user preference
              try{
                if (!(window as any).MonacoEnvironment) {
                  // workerMode preference (cdn|embedded)
                  const useCDN = (localStorage.getItem('sandbox:workerMode') || 'cdn') === 'cdn';
                  // Use the non-ESM (min) build on CDN — importScripts cannot load ESM modules
                  const baseCdn = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs/';
                  // Use local ESM build when embedded mode is selected (we copy 'esm' into public)
                  const baseLocal = '/monaco-editor/esm/vs/';

                  // helper to test cdn availability
                  const testCdn = async (path:string) => {
                    try {
                      const r = await fetch(baseCdn + path, { method: 'GET', cache: 'no-cache' });
                      return r && r.ok;
                    } catch (e) {
                      return false;
                    }
                  };

                  // ensure we pick a working baseUrl; try CDN then fallback to embedded local
                  let baseUrl = useCDN ? baseCdn : baseLocal;
                  let resolvedMode: 'cdn'|'esm'|'min-local' = useCDN ? 'cdn' : 'esm';
                  try {
                    if (useCDN) {
                      const ok = await testCdn('editor/editor.worker.js');
                      if (!ok) {
                        // switch to embedded automatically
                        console.warn('CDN worker not reachable, switching to embedded mode');
                        localStorage.setItem('sandbox:workerMode', 'embedded');
                        baseUrl = baseLocal;
                        resolvedMode = 'esm';
                        toast({ title: 'Workers', description: 'CDN indisponible, basculement vers mode embedded.' });
                      }
                    }
                    // verify local ESM path exists when embedded
                    if (!useCDN) {
                      // check an example file
                      try {
                        const r = await fetch(window.location.origin + baseLocal + 'editor/editor.worker.js', { method: 'HEAD' });
                        if (!r.ok) {
                          // try min local
                          const r2 = await fetch(window.location.origin + '/monaco-editor/min/vs/editor/editor.worker.js', { method: 'HEAD' }).catch(()=>({ ok: false } as any));
                          if (r2 && r2.ok) { resolvedMode = 'min-local'; baseUrl = '/monaco-editor/min/vs/'; }
                        }
                      } catch (e) { /* ignore */ }
                    }
                  } catch(e) { console.warn('worker mode detection failed', e); }

                  // Create a blob URL for CDN min build; for local ESM use direct absolute URL (monaco will load as module)
                  const getWorkerBlobUrl = (path:string) => {
                    try {
                      const fullUrl = baseUrl.startsWith('http') ? `${baseUrl}${path}` : `${window.location.origin}${baseUrl}${path}`;
                      if (baseUrl.includes('/min/')) {
                        const script = `importScripts('${fullUrl}');`;
                        return URL.createObjectURL(new Blob([script], { type: 'application/javascript' }));
                      }
                      // for ESM local or CDN ESM, return absolute URL so Monaco can create module worker
                      return fullUrl;
                    } catch (err) {
                      console.warn('Failed to create worker blob', err);
                      return baseUrl.startsWith('http') ? `${baseUrl}${path}` : `${window.location.origin}${baseUrl}${path}`;
                    }
                  };

                  // Now set a synchronous getWorker that returns Worker instances with correct type
                  (window as any).MonacoEnvironment = {
                    getWorker: function(moduleId: string, label: string) {
                      const path = (label === 'typescript' || label === 'javascript') ? 'language/typescript/ts.worker.js' : 'editor/editor.worker.js';
                      try {
                        if (resolvedMode === 'cdn') {
                          const blobUrl = getWorkerBlobUrl(path);
                          return new Worker(blobUrl); // importScripts inside blob
                        }
                        if (resolvedMode === 'min-local') {
                          const fullMin = `${window.location.origin}/monaco-editor/min/vs/${path}`;
                          const script = `importScripts('${fullMin}');`;
                          const b = URL.createObjectURL(new Blob([script], { type: 'application/javascript' }));
                          return new Worker(b);
                        }
                        // esm local
                        const fullUrl = `${window.location.origin}${baseLocal}${path}`;
                        return new Worker(fullUrl, { type: 'module' });
                      } catch (e) {
                        console.warn('Monaco getWorker failed', e);
                        // fallback to try simple worker URL
                        const fallbackSync = baseUrl.startsWith('http') ? `${baseUrl}${path}` : `${window.location.origin}${baseUrl}${path}`;
                        return new Worker(fallbackSync);
                      }
                    }
                  };
                  if (!useCDN) {
                    setTimeout(()=> toast({ title: 'Mode embedded sélectionné', description: 'Assurez-vous d’avoir empaqueté les workers dans votre build pour l’option embedded.' }), 500);
                  }
                }
              }catch(e){ console.warn('monaco worker setup failed', e); }

              monaco.editor.setTheme('vs-dark');

              // Configure TypeScript compiler options & diagnostics
              try{
                if ((monaco.languages as any).typescript) {
                  const tsDefaults = (monaco.languages as any).typescript.typescriptDefaults as any;
                  tsDefaults.setCompilerOptions({
                    target: (monaco.languages as any).typescript.ScriptTarget.ES2022,
                    module: (monaco.languages as any).typescript.ModuleKind.ESNext,
                    jsx: (monaco.languages as any).typescript.JsxEmit.React,
                    allowJs: true,
                    checkJs: false,
                    esModuleInterop: true,
                    allowSyntheticDefaultImports: true,
                    noEmit: true,
                    lib: ["es2022","dom"]
                  });
                  tsDefaults.setDiagnosticsOptions({ noSemanticValidation: false, noSyntaxValidation: false });
                }
              }catch(e){ console.warn('ts defaults', e); }

              if (!(window as any).__monaco_snippets_registered) {
                const baseSnippets:any[] = [];
                const add = (label:string, insertText:string, doc:string)=> baseSnippets.push({ label, kind: monaco.languages.CompletionItemKind.Snippet, insertText, insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, documentation: doc });
                const patterns = [
                  ['console.log','console.log(${1:obj});','Log to console'],
                  ['for','for (let ${1:i}=0; ${1} < ${2:len}; ${1}++) {\\n\\t$0\\n}','for loop'],
                  ['forOf','for (const ${1:item} of ${2:iterable}) {\\n\\t$0\\n}','for...of loop'],
                  ['map','const ${1:res} = ${2:array}.map((${3:x}) => {\\n\\treturn $0\\n});','Array.map'],
                  ['filter','const ${1:res} = ${2:array}.filter((${3:x}) => {\\n\\treturn $0\\n});','Array.filter'],
                  ['reduce','const ${1:res} = ${2:array}.reduce((${3:acc}, ${4:cur}) => {\\n\\treturn $0\\n}, ${5:0});','Array.reduce'],
                  ['asyncFunc','async function ${1:name}(${2:params}) {\\n\\t$0\\n}','Async function'],
                  ['awaitFetch','const res = await fetch(${1:url});\\nconst data = await res.json();','Fetch + await parse'],
                  ['tryCatch','try {\\n\\t$0\\n} catch (e) {\\n\\tconsole.error(e);\\n}','Try/catch'],
                  ['promise','new Promise((resolve, reject) => {\\n\\t$0\\n});','Promise constructor'],
                ];
                // seed
                for (const p of patterns) add(p[0], p[1], p[2]);
                // generate variants to reach ~120 snippets
                const genTemplates = [
                  ['fn','function ${1:name}(${2:args}){\\n\\t$0\\n}'],
                  ['arrow','const ${1:name} = (${2:args}) => {\\n\\t$0\\n};'],
                  ['log','console.log(${1:val});'],
                  ['json','const data = JSON.parse(${1:str});'],
                  ['set','localStorage.setItem(${1:key}, JSON.stringify(${2:val}));']
                ];
                let idx = 0;
                while (baseSnippets.length < 120) {
                  const t = genTemplates[idx % genTemplates.length];
                  add(t[0] + (Math.floor(idx / genTemplates.length)+1), t[1].replace('${1:name}', 'name'+idx).replace('${1:val}', 'val'+idx), 'Generated snippet');
                  idx++;
                }

                monaco.languages.registerCompletionItemProvider('javascript', {
                  provideCompletionItems: function(model, position) {
                    const word = model.getWordUntilPosition(position);
                    const range = { startLineNumber: position.lineNumber, endLineNumber: position.lineNumber, startColumn: word.startColumn, endColumn: word.endColumn };
                    const suggestions = baseSnippets.map(s => ({ ...s, range }));
                    return { suggestions };
                  }
                });
                monaco.languages.registerCompletionItemProvider('typescript', {
                  provideCompletionItems: function(model, position) {
                    const word = model.getWordUntilPosition(position);
                    const range = { startLineNumber: position.lineNumber, endLineNumber: position.lineNumber, startColumn: word.startColumn, endColumn: word.endColumn };
                    const suggestions = baseSnippets.map(s => ({ ...s, range }));
                    return { suggestions };
                  }
                });
                (window as any).__monaco_snippets_registered = true;
              }
            }catch(e){ console.error('monaco init', e); }
          }}
          options={{ minimap: { enabled: false }, fontSize: 13, automaticLayout: true }}
        />
      </Suspense>
      <div className="flex items-center gap-3">
        <button onClick={run} disabled={runningFlag} className="h-10 px-5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90">{runningFlag ? 'Exécution…' : 'Exécuter'}</button>
        <button onClick={stopExecution} className="h-10 px-4 rounded-md border">Stop</button>
        <button onClick={clear} className="h-10 px-4 rounded-md border hover:bg-accent hover:text-accent-foreground">Effacer</button>
        <button onClick={copyOutput} className="h-10 px-4 rounded-md border">Copier sortie</button>
        <button onClick={downloadCode} className="h-10 px-4 rounded-md border">Télécharger</button>
        <button onClick={shareSandboxLink} className="h-10 px-4 rounded-md border">Partager</button>
        <button onClick={async ()=>{
          try{
            const resp = await fetch('/api/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ namespace: 'sandbox', key: `sandbox:${Date.now()}`, data: { lang: language, code } }) });
            const j = await resp.json();
            if (resp.status === 501) {
              toast({ title: 'Sauvegarde cloud indisponible', description: 'Configurez SUPABASE_URL et SUPABASE_KEY via Netlify env vars', variant: 'destructive' });
            } else if (!resp.ok) {
              toast({ title: 'Erreur sauvegarde', description: String(j?.message || j?.error || 'unknown'), variant: 'destructive' });
            } else {
              toast({ title: 'Sauvegardé', description: 'Bac à sable sauvegardé dans le cloud' });
            }
          }catch(e:any){ toast({ title: 'Erreur', description: String(e?.message||e), variant: 'destructive' }); }
        }} className="h-10 px-4 rounded-md border">Sauvegarder</button>
      </div>
      {language === 'html' && (
        <div className="mt-2 border rounded-md overflow-hidden">
          <iframe ref={iframeRef} title="Aperçu HTML" className="w-full h-48" sandbox="allow-scripts allow-same-origin" srcDoc={code}></iframe>
        </div>
      )}
      <div className="flex items-center justify-between">
        <pre className="mt-2 rounded-lg bg-secondary/60 p-3 text-xs min-h-16 whitespace-pre-wrap flex-1">{output || "(sortie)"}</pre>
        <div className="ml-3 text-xs text-muted-foreground">
          {stats ? (
            <div>
              <div>Logs: {stats.logs}</div>
              <div>Durée: {stats.timeMs}ms</div>
            </div>
          ) : <div className="text-xs">Aucune exécution</div>}
        </div>
      </div>
    </div>
  );
}
