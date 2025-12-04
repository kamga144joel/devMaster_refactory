import React, { useEffect, useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import Sandbox from "@/components/Sandbox";
import ExerciseGenerator from "@/components/ExerciseGenerator";
import Quiz from "@/components/Quiz";
import CourseOutline from "@/components/CourseOutline";
import CourseGenerator from "@/components/CourseGenerator";
import TemplateLibrary from "@/components/TemplateLibrary";
import CourseLibrary from "@/components/CourseLibrary";
import { matches } from '@/lib/filter';
import { LANGS, FRAMEWORKS, TOP_LANGS, TOP_FRAMEWORKS } from '@/lib/platforms';

interface Challenge {
  id: number | string;
  title: string;
  prompt: string;
  hint: string;
  solution: string;
  languages?: string[];
  frameworks?: string[];
}


const CHALLENGES: Challenge[] = [
  { id: 1, title: "Variables", prompt: "Crée une variable 'nom' avec ta valeur préférée et affiche-la.", hint: "Utilise const et console.log(...)", solution: "const nom = 'Alex';\nconsole.log(nom);", languages: ['JavaScript','TypeScript','Python','Java','C#','PHP'] },
  { id: 2, title: "Conditions", prompt: "Si x est supérieur à 10, affiche 'grand', sinon 'petit'.", hint: "if (x > 10) { ... } else { ... }", solution: "const x = 12;\nif (x > 10) {\n  console.log('grand');\n} else {\n  console.log('petit');\n}", languages: ['JavaScript','TypeScript','Python','Java','C#','PHP'] },
  { id: 3, title: "Boucles", prompt: "Affiche les nombres de 1 à 5.", hint: "for (let i = 1; i <= 5; i++) {...}", solution: "for (let i = 1; i <= 5; i++) {\n  console.log(i);\n}", languages: ['JavaScript','TypeScript','Python','Java','C#'] },
  { id: 4, title: "Tableaux", prompt: "Crée un tableau de 3 fruits et affiche le deuxième.", hint: "const fruits = ['a','b','c']; fruits[1]", solution: "const fruits = ['pomme','banane','kiwi'];\nconsole.log(fruits[1]);", languages: ['JavaScript','TypeScript','Python','Java'] },
  { id: 5, title: "Fonctions", prompt: "Écris une fonction somme(a, b) qui retourne a + b.", hint: "function somme(a,b){ return ... }", solution: "function somme(a, b) {\n  return a + b;\n}\nconsole.log(somme(2,3));", languages: ['JavaScript','TypeScript','Python','Java','C#'] },
  { id: 6, title: "Objets", prompt: "Crée un objet 'utilisateur' avec nom et age, puis affiche son nom.", hint: "{ nom: '...', age: 0 }", solution: "const utilisateur = { nom: 'Lina', age: 20 };\nconsole.log(utilisateur.nom);", languages: ['JavaScript','TypeScript','Python'] },
  { id: 7, title: "String", prompt: "Concatène deux chaînes et affiche le résultat.", hint: "Utilise + ou template strings", solution: "const a = 'Hello'; const b = 'World'; console.log(a + ' ' + b);", languages: ['JavaScript','TypeScript','Python','Java'] },
  { id: 8, title: "Map/Filter", prompt: "À partir d'un tableau de nombres, crée un nouveau tableau avec les nombres doublés puis filtre ceux > 10.", hint: "array.map(...).filter(...)", solution: "const nums = [3,6,8,2]; const res = nums.map(n => n*2).filter(n=> n>10); console.log(res);", languages: ['JavaScript','TypeScript'] },
  { id: 9, title: "Async/Await", prompt: "Crée une fonction asynchrone qui attend une promesse simulée et affiche la valeur.", hint: "utilise async/await et setTimeout dans une promesse", solution: "function wait(ms){ return new Promise(r=> setTimeout(r, ms)); }\nasync function run(){ await wait(100); console.log('done'); }\nrun();", languages: ['JavaScript','TypeScript','Python'] },
  { id: 10, title: "Recursion", prompt: "Écris une fonction récursive qui calcule la factorielle d'un nombre.", hint: "f(n) = n * f(n-1)", solution: "function fact(n){ if(n<=1) return 1; return n * fact(n-1); }\nconsole.log(fact(5));", languages: ['JavaScript','TypeScript','Python'] },
  { id: 11, title: "DOM (JS)", prompt: "Crée un élément <div>, ajoute du texte, et insère-le dans document.body.", hint: "document.createElement, appendChild", solution: "const d = document.createElement('div'); d.textContent = 'Hello DOM'; document.body.appendChild(d);", languages: ['JavaScript','TypeScript','HTML/CSS'] },
  { id: 12, title: "JSON", prompt: "Convertis un objet JS en JSON et reparse-le.", hint: "JSON.stringify / JSON.parse", solution: "const obj = { a:1, b:2 }; const s = JSON.stringify(obj); console.log(JSON.parse(s));", languages: ['JavaScript','TypeScript','Python','Java'] },
];

function ChallengeCard({ c }: { c: Challenge }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const getKey = () => `challenge:${localStorage.getItem('learn:lang') || 'global'}:${c.id}`;
  const [done, setDone] = useState<boolean>(() => {
    const v = localStorage.getItem(getKey());
    return v === "1";
  });

  useEffect(() => {
    const key = getKey();
    localStorage.setItem(key, done ? "1" : "0");
    window.dispatchEvent(new CustomEvent('challenge:changed', { detail: { key, id: c.id, done } }));
  }, [done, c.id]);

  useEffect(() => {
    const onPrefs = (e: any) => {
      const key = e?.detail?.key || e?.key;
      if (key === 'learn:lang' || key === 'prefs:changed') {
        const v = localStorage.getItem(getKey());
        setDone(v === '1');
      }
    };
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key === getKey()) setDone(e.newValue === '1');
      if (e.key === 'learn:lang') {
        const v = localStorage.getItem(getKey());
        setDone(v === '1');
      }
    };
    window.addEventListener('prefs:changed', onPrefs as EventListener);
    window.addEventListener('storage', onStorage as any);
    window.addEventListener('challenge:changed', onPrefs as EventListener);
    return () => { window.removeEventListener('prefs:changed', onPrefs as EventListener); window.removeEventListener('storage', onStorage as any); window.removeEventListener('challenge:changed', onPrefs as EventListener); };
  }, [c.id]);

  const copy = async () => {
    await navigator.clipboard.writeText(c.solution);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div 
      className={`relative overflow-hidden rounded-xl border bg-card text-card-foreground transition-all duration-300 hover:shadow-md ${
        done ? 'border-primary/30' : 'border-border/50'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Badge de statut */}
      {done && (
        <div className="absolute -right-8 -top-2 z-10">
          <div className="relative h-16 w-32 rotate-45 bg-primary/90 px-2 py-1 text-center text-[10px] font-bold uppercase text-white shadow-md">
            <span className="absolute bottom-1 left-0 right-0">Terminé</span>
          </div>
        </div>
      )}

      <div className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-foreground">{c.title}</h3>
              {c.languages && c.languages.length > 0 && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {c.languages[0]}
                </span>
              )}
            </div>
            
            <p className="mt-2 text-sm text-muted-foreground">{c.prompt}</p>
            
            <div className="mt-3 flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs text-amber-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-lightbulb">
                  <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1.3.5 2.6 1.5 3.5.7.7 1.3 1.5 1.5 2.5"></path>
                  <path d="M9 18h6"></path>
                  <path d="M10 22h4"></path>
                </svg>
                <span>Indice</span>
              </div>
              <div className="text-xs text-muted-foreground/80">{c.hint}</div>
            </div>
          </div>
          
          <label className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
            done ? 'bg-primary/20' : 'bg-muted'
          }`}>
            <input 
              type="checkbox" 
              checked={done} 
              onChange={(e) => setDone(e.target.checked)} 
              className="sr-only" 
            />
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${
              done ? 'translate-x-5 bg-primary' : 'translate-x-1 bg-foreground/50'
            }`} />
          </label>
        </div>

        <div className={`mt-4 flex flex-wrap items-center gap-2 transition-all duration-300 ${
          open ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'
        }`}>
          <button 
            onClick={() => setOpen(false)}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent/50 hover:text-foreground"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x">
              <path d="M18 6 6 18"></path>
              <path d="m6 6 12 12"></path>
            </svg>
            Masquer
          </button>
          
          <button 
            onClick={copy}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent/50 hover:text-foreground"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-copy">
              <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
            </svg>
            {copied ? 'Copié !' : 'Copier'}
          </button>
          
          <button 
            onClick={() => { 
              window.dispatchEvent(new CustomEvent('sandbox:load', { 
                detail: { code: c.solution, lang: 'javascript' } 
              })); 
              toast({ title: 'Bac à sable', description: 'Solution chargée' }); 
            }}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent/50 hover:text-foreground"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-upload">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" x2="12" y1="3" y2="15"></line>
            </svg>
            Charger
          </button>
          
          <button 
            onClick={() => { 
              window.dispatchEvent(new CustomEvent('sandbox:load', { 
                detail: { code: c.solution, lang: 'javascript' } 
              })); 
              window.dispatchEvent(new CustomEvent('sandbox:run')); 
              toast({ title: 'Bac à sable', description: 'Solution chargée et exécutée' }); 
            }}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary/10 px-3 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-play">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            Exécuter
          </button>
        </div>
        
        <div className={`mt-4 overflow-hidden transition-all duration-300 ${
          open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="rounded-lg bg-muted/30 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Solution</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground/70">{c.languages?.[0] || 'JavaScript'}</span>
              </div>
            </div>
            <pre className="overflow-auto rounded bg-muted/50 p-3 text-xs">
              <code className="font-mono">{c.solution}</code>
            </pre>
          </div>
        </div>

        <button 
          onClick={() => setOpen(!open)}
          className={`mt-4 w-full text-center text-sm font-medium text-primary transition-colors hover:text-primary/80 ${
            open ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {isHovered ? (
            <span className="inline-flex items-center gap-1">
              Voir la solution
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down">
                <path d="m6 9 6 6 6-6"></path>
              </svg>
            </span>
          ) : (
            <span className="text-muted-foreground/80 hover:text-foreground">
              Cliquez pour voir la solution
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

export default function Practice() {
  const [language, setLanguage] = useState<(typeof LANGS)[number]>(() => (localStorage.getItem('learn:lang') as any) || "JavaScript");
  const [framework, setFramework] = useState<(typeof FRAMEWORKS)[number]>(() => (localStorage.getItem('learn:fw') as any) || "Aucun");
  const [progress, setProgress] = useState({ done: 0, total: CHALLENGES.length });
  const [activeTab, setActiveTab] = useState('challenges');
  const { toast } = useToast();

  // Sauvegarde les préférences dans le localStorage
  useEffect(() => { 
    localStorage.setItem('learn:lang', language); 
    window.dispatchEvent(new CustomEvent('prefs:changed', { 
      detail: { key: 'learn:lang', value: language } 
    })); 
  }, [language]);

  useEffect(() => { 
    localStorage.setItem('learn:fw', framework); 
    window.dispatchEvent(new CustomEvent('prefs:changed', { 
      detail: { key: 'learn:fw', value: framework } 
    })); 
  }, [framework]);

  const [dynamicExercises, setDynamicExercises] = useState<Challenge[]>([]);
  const [customExercises, setCustomExercises] = useState<Challenge[]>([]);
  const [shuffleSeed, setShuffleSeed] = useState<number | null>(null);
  const DESIRED_COUNT = 9;

  useEffect(()=>{
    try{
      const raw = localStorage.getItem('custom:exercises');
      const arr = raw ? JSON.parse(raw) : [];
      setCustomExercises(Array.isArray(arr) ? arr : []);
    }catch(e){ setCustomExercises([]); }
    const onCustom = () => {
      try{ const raw = localStorage.getItem('custom:exercises'); const arr = raw ? JSON.parse(raw) : []; setCustomExercises(Array.isArray(arr)?arr:[]); }catch(e){}
    };
    window.addEventListener('custom:exercises:changed', onCustom as any);
    return ()=> window.removeEventListener('custom:exercises:changed', onCustom as any);
  },[]);

  const fetchExercisesBulk = async (count:number, lang?:string, fw?:string|null) => {
    const out: Challenge[] = [];
    const topics = ['Variables','Conditions','Boucles','Tableaux','Fonctions','Objets','String','Async','Recursion','DOM','JSON'];
    for (let i=0;i<count;i++){
      const topic = topics[Math.floor(Math.random()*topics.length)];
      try{
        const r = await fetch('/api/exercise', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topic, language: lang || 'JavaScript', framework: fw || undefined }) });
        if (!r.ok) continue;
        const j = await r.json();
        const ex = j?.exercise;
        if (ex && ex.title && ex.prompt) {
          out.push({ id: Date.now() + Math.floor(Math.random()*1000), title: String(ex.title).slice(0,120), prompt: String(ex.prompt).slice(0,1000), hint: String(ex.starter || ''), solution: String(ex.solution || '' ) });
        }
      }catch(e){ continue; }
    }
    return out;
  };

  const recomputeProgress = () => {
    const lang = localStorage.getItem('learn:lang') || 'Aucun';
    const fw = localStorage.getItem('learn:fw') || 'Aucun';
    const visible = [...CHALLENGES.filter(c => matches(c, lang, fw)), ...dynamicExercises.filter(c => matches(c, lang, fw)), ...customExercises.filter(c => matches(c, lang, fw))];
    const done = visible.reduce((acc,c)=> {
      const key = `challenge:${lang}:${c.id}`;
      const legacy = localStorage.getItem(`challenge:${c.id}`);
      const v = localStorage.getItem(key) ?? legacy;
      return acc + (v === '1' ? 1 : 0);
    }, 0);
    setProgress({ done, total: visible.length });
  };

  // ensure we have enough exercises when language/framework change
  useEffect(()=>{
    recomputeProgress();
    (async function ensureExercises(){
      try{
        const lang = localStorage.getItem('learn:lang') || language || 'Aucun';
        const fw = localStorage.getItem('learn:fw') || framework || 'Aucun';
        const visibleStatic = CHALLENGES.filter(c => matches(c, lang, fw));
        const visibleDynamic = dynamicExercises.filter(c => matches(c, lang, fw));
        const current = visibleStatic.length + visibleDynamic.length;
        if (current >= DESIRED_COUNT) return;
        const toFetch = DESIRED_COUNT - current;
        const fetched = await fetchExercisesBulk(toFetch, lang === 'Aucun' ? undefined : lang, fw === 'Aucun' ? undefined : fw);
        if (fetched && fetched.length) {
          setDynamicExercises(prev => {
            const map = new Map(prev.map(p=>[p.title,p]));
            for (const f of fetched) map.set(f.title, f);
            return Array.from(map.values()).slice(0, 200);
          });
          recomputeProgress();
        }
      }catch(e){ }
    })();
  }, [language, framework]);

  useEffect(()=>{ recomputeProgress(); }, [dynamicExercises, shuffleSeed]);

  const exportData = () => {
    const data: Record<string,string|null> = {};
    for (let i=0;i<localStorage.length;i++){
      const k = localStorage.key(i)!;
      if (k.startsWith('challenge:') || k.startsWith('learn:')) data[k] = localStorage.getItem(k);
    }
    const blob = new Blob([JSON.stringify(data,null,2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'progression.json'; a.click(); URL.revokeObjectURL(a.href);
  };

  const importData = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try { const json = JSON.parse(String(reader.result || '{}')) as Record<string,string>; Object.entries(json).forEach(([k,v])=> localStorage.setItem(k, String(v))); recomputeProgress(); } catch {}
    };
    reader.readAsText(file);
  };

  return (
    <div className="relative">
      <section className="container mx-auto py-12">
        <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Pratiquer</h1>
            <p className="mt-2 text-muted-foreground max-w-2xl">Choisis un langage et (optionnel) un framework. Le contenu et les quiz seront adaptés.</p>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex-1 h-2 rounded bg-secondary/60 overflow-hidden max-w-xs">
                <div 
                  className="h-full bg-primary transition-all duration-500" 
                  style={{ width: `${(progress.done/Math.max(1,progress.total))*100}%` }}
                />
              </div>
              <span className="text-sm text-muted-foreground">
                {progress.done}/{progress.total} défis
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto mb-12">
        {/* Filtres et progression */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end mb-8 p-4 bg-card rounded-xl border border-border/50 shadow-sm">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Langage de programmation</label>
              <div className="relative">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as any)}
                  className="w-full p-2.5 pl-3 pr-8 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors appearance-none"
                >
                  {LANGS.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-muted-foreground">
                    <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Framework</label>
              <div className="relative">
                <select
                  value={framework}
                  onChange={(e) => setFramework(e.target.value as any)}
                  className="w-full p-2.5 pl-3 pr-8 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors appearance-none"
                >
                  {FRAMEWORKS.map((fw) => (
                    <option key={fw} value={fw}>
                      {fw}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-muted-foreground">
                    <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
          
          {/* Barre de progression */}
          <div className="w-full sm:w-auto mt-2 sm:mt-0">
            <div className="bg-gradient-to-r from-card to-card/80 p-4 rounded-lg border border-border/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Progression</span>
                <span className="text-sm font-semibold text-primary">
                  {Math.round((progress.done / progress.total) * 100)}%
                </span>
              </div>
              <div className="w-full bg-muted/50 h-2 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500"
                  style={{ width: `${(progress.done / progress.total) * 100}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-1 text-right">
                {progress.done} sur {progress.total} défis complétés
              </div>
            </div>
          </div>
        </div>

        {/* Grille de défis */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(() => {
            const pool = [...dynamicExercises, ...customExercises, ...CHALLENGES].filter(c => matches(c, language, framework));
            const s = shuffleSeed || Date.now();
            const arr = pool.slice();
            for (let i = arr.length - 1; i > 0; i--) {
              const j = Math.floor(((s + i) * 9301 + 49297) % 233280 / 233280 * (i+1));
              [arr[i], arr[j]] = [arr[j], arr[i]];
            }
            const visible = arr.slice(0, DESIRED_COUNT);
            if (visible.length === 0) return (<div className="col-span-full text-center text-sm text-muted-foreground">Aucun exercice disponible pour cette combinaison langage/framework.</div>);
            return visible.map(c => <ChallengeCard key={String(c.id)} c={c} />);
          })()}
        </div>
      </section>

      {/* Barre d'onglets */}
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap gap-2 mb-8 border-b border-border/40">
          <button
            onClick={() => setActiveTab('challenges')}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${
              activeTab === 'challenges'
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
            }`}
          >
            Défis
          </button>
          <button
            onClick={() => setActiveTab('sandbox')}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${
              activeTab === 'sandbox'
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
            }`}
          >
            Bac à sable
          </button>
          <button
            onClick={() => setActiveTab('courses')}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${
              activeTab === 'courses'
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
            }`}
          >
            Cours
          </button>
        </div>
      </div>

      <section className="container mx-auto pb-12 grid gap-8 px-4">
        {/* Section active en fonction de l'onglet sélectionné */}
        {activeTab === 'challenges' && (
          <div className="space-y-8">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {CHALLENGES.filter(c => 
                matches(c, { 
                  languages: [language], 
                  frameworks: framework === 'Aucun' ? undefined : [framework] 
                })
              ).map((c) => (
                <ChallengeCard key={c.id} c={c} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'sandbox' && (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-6">
              <Sandbox />
              <ExerciseGenerator />
            </div>
            <div className="space-y-6">
              <TemplateLibrary />
              <CourseGenerator />
            </div>
          </div>
        )}

        {activeTab === 'courses' && (
          <div className="space-y-8">
            <div className="grid gap-6 md:grid-cols-2">
              <CourseOutline language={language} framework={framework === 'Aucun' ? undefined : framework} />
              <CourseLibrary />
            </div>
            <Quiz language={language} framework={framework === 'Aucun' ? undefined : framework} />
          </div>
        )}
      </section>
    </div>
  );
}
