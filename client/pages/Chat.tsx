import React, { useEffect, useState, useRef } from "react";
import type { ChatMessage, ChatResponse, ChatProvider } from "@shared/api";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MusicPanel from "@/components/MusicPanel";
import ImageGenerator from "@/components/ImageGenerator";
import SearchPanel from "@/components/SearchPanel";
import DocumentExporter from "@/components/DocumentExporter";
import { MoreVertical, Copy, Download, RefreshCw, ThumbsUp, ThumbsDown, Pencil, Trash2, Mic, Paperclip, Send, Smile } from 'lucide-react';


interface Item extends ChatMessage { id: string }

function uid(){ return Math.random().toString(36).slice(2); }

export default function Chat() {
  const [messages, setMessages] = useState<Item[]>(()=>{
    const raw = localStorage.getItem('chat:history');
    try { return raw ? JSON.parse(raw) : [] } catch { return [] }
  });
  const [conversations, setConversations] = useState(() => {
    const raw = localStorage.getItem('chat:conversations');
    try { return raw ? JSON.parse(raw) : []; } catch { return []; }
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const [tab, setTab] = useState<string>(()=> localStorage.getItem('chat:tab') || 'chat');
  const [provider, setProvider] = useState<ChatProvider>(()=> (localStorage.getItem('chat:provider') as ChatProvider) || 'auto');
  const [model, setModel] = useState<string>(()=> localStorage.getItem('chat:model') || "");
  const [systemPrompt, setSystemPrompt] = useState<string>(()=> localStorage.getItem('chat:system') || "");
  const [recording, setRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [useEmojis, setUseEmojis] = useState<boolean>(()=> localStorage.getItem('chat:emojis') !== 'false');
  const [selectedPublicApi, setSelectedPublicApi] = useState<string>(()=> localStorage.getItem('chat:publicApi') || 'none');
  
  const { toast } = useToast();
  const showToast = (title?: string, description?: string, variant: 'default'|'destructive' = 'default') => {
    toast({ title, description, variant });
  };

  useEffect(()=>{ localStorage.setItem('chat:history', JSON.stringify(messages)); },[messages]);
  useEffect(()=>{ localStorage.setItem('chat:conversations', JSON.stringify(conversations)); },[conversations]);
  useEffect(()=>{ endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const loadHLJS = async () => {
    if ((window as any).__hljs_loaded) return (window as any).hljs;
    const isDark = document.documentElement.classList.contains('dark');
    const themeName = isDark ? 'github-dark' : 'github';
    try {
      try { await import(/* @vite-ignore */ `highlight.js/styles/${themeName}.css`); } catch(e) { /* ignore */ }
      const mod = await import('highlight.js');
      const hljs = mod?.default || mod;
      (window as any).hljs = hljs;
      (window as any).__hljs_loaded = true;
      return hljs;
    } catch (errLocal) {
      console.warn('Local highlight.js not found, falling back to CDN', errLocal);
      const cssHref = `https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/${themeName}.min.css`;
      let link = document.querySelector('link[data-hljs]') as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('data-hljs','1');
        link.rel = 'stylesheet';
        document.head.appendChild(link);
      }
      link.href = cssHref;
      if ((window as any).hljs) { (window as any).__hljs_loaded = true; return (window as any).hljs; }
      return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/highlight.min.js';
        s.async = true;
        s.onload = () => { (window as any).__hljs_loaded = true; resolve((window as any).hljs); };
        s.onerror = reject;
        document.head.appendChild(s);
      });
    }
  };

  useEffect(()=>{
    let mounted = true;
    (async ()=>{
      try{
        const hljs = await loadHLJS();
        if (!mounted) return;
        document.querySelectorAll('pre code').forEach((b:any) => { try { hljs.highlightElement(b); } catch(e){} });
      }catch(e){ /* ignore */ }
    })();
    const onPrefs = (e:any) => {
      const key = e?.detail?.key || e?.key;
      if (key === 'prefs:theme') {
        loadHLJS().catch(()=>{});
      }
    };
    window.addEventListener('prefs:changed', onPrefs as EventListener);
    window.addEventListener('storage', onPrefs as any);
    return ()=>{ mounted = false; window.removeEventListener('prefs:changed', onPrefs as EventListener); window.removeEventListener('storage', onPrefs as any); };
  },[messages, tab]);

  useEffect(()=>{ localStorage.setItem('chat:provider', provider); },[provider]);
  useEffect(()=>{ localStorage.setItem('chat:model', model); },[model]);
  useEffect(()=>{ localStorage.setItem('chat:tab', tab); },[tab]);
  useEffect(()=>{ localStorage.setItem('chat:system', systemPrompt); },[systemPrompt]);
  useEffect(()=>{ localStorage.setItem('chat:emojis', useEmojis ? 'true' : 'false'); },[useEmojis]);
  useEffect(()=>{ localStorage.setItem('chat:publicApi', selectedPublicApi); },[selectedPublicApi]);

  const restoreConversation = (id: string) => {
    const c = conversations.find(x=>x.id === id);
    if (!c) return;
    setMessages(c.messages);
  };
  const removeConversation = (id: string) => {
    if (!confirm('Supprimer cette conversation de l\'historique ?')) return;
    setConversations(prev => prev.filter(x=>x.id !== id));
  };

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>("");

  const onEdit = (id: string) => {
    const it = messages.find(m=>m.id === id);
    if (!it) return;
    if (it.role !== 'user') { showToast('Action refusée', "Vous ne pouvez modifier que vos messages.", 'destructive'); return; }
    setEditingId(id);
    setEditingText(typeof it.content === 'string' ? it.content : JSON.stringify(it.content, null, 2));
  };
  const onCancelEdit = () => { setEditingId(null); setEditingText(''); };
  const onSaveEdit = async (id: string) => {
    const originalMessages = messages;
    const editedIndex = originalMessages.findIndex(m => m.id === id);
    if (editedIndex === -1) return;

    const updatedMessages = originalMessages.slice(0, editedIndex + 1).map(m => m.id === id ? { ...m, content: editingText } : m);
    setMessages(updatedMessages);
    
    setEditingId(null);
    const text = editingText;
    setEditingText('');
    await sendMessage(text, updatedMessages);
  };

  const onDelete = (id: string) => {
    if (!confirm('Supprimer ce message et ses réponses ?')) return;
    const index = messages.findIndex(m => m.id === id);
    if (index > -1) {
      setMessages(prev => prev.slice(0, index));
    }
  };

  const copyToClipboard = async (text: string) => {
    try { await navigator.clipboard.writeText(text); showToast('Copié', 'Copié dans le presse-papiers'); } catch (e) { showToast('Erreur', 'Impossible de copier', 'destructive'); }
  };

  const downloadMessage = (m: Item) => {
    const content = typeof m.content === 'string' ? m.content : JSON.stringify(m.content, null, 2);
    const codeMatch = content.match(/```(\w+)?\n([\s\S]*?)```/);
    let filename = 'assistant.txt';
    let blobContent = content;
    if (codeMatch) {
      const lang = (codeMatch[1] || 'txt').replace(/[^a-z0-9]/gi,'');
      const ext = lang === 'javascript' ? 'js' : lang;
      filename = `snippet.${ext}`;
      blobContent = codeMatch[2];
    }
    const blob = new Blob([blobContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const onRegenerate = (assistantMessageId: string) => {
    const idx = messages.findIndex(m => m.id === assistantMessageId);
    if (idx === -1) return;
    const prevUserMessageIndex = messages.slice(0, idx).reverse().findIndex(m => m.role === 'user');
    if (prevUserMessageIndex === -1) {
      showToast('Impossible', 'Aucun message utilisateur trouvé à régénérer', 'destructive');
      return;
    }
    const userMessage = messages[idx - 1 - prevUserMessageIndex];
    const conversationUntilThen = messages.slice(0, idx -1 - prevUserMessageIndex);
    setMessages(conversationUntilThen);
    sendMessage(typeof userMessage.content === 'string' ? userMessage.content : JSON.stringify(userMessage.content), conversationUntilThen);
  };

  const sendFeedback = (messageId: string, positive: boolean) => {
    showToast('Feedback reçu', positive ? 'Merci pour votre feedback 👍' : 'Merci pour votre feedback 👎');
  };

  const toggleRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { showToast('Non supporté', 'Reconnaissance vocale non supportée dans ce navigateur', 'destructive'); return; }
    if (recording) {
      recognitionRef.current?.stop();
      setRecording(false);
      return;
    }
    const recog = new SpeechRecognition();
    recog.lang = 'fr-FR';
    recog.interimResults = true;
    recog.onresult = (ev: any) => {
      let final = '';
      for (let i = ev.resultIndex; i < ev.results.length; ++i) {
        if (ev.results[i].isFinal) final += ev.results[i][0].transcript;
      }
      setInput(prev => prev + final);
    };
    recog.onend = () => { setRecording(false); };
    recognitionRef.current = recog;
    recog.start();
    setRecording(true);
  };

  const triggerFileInput = () => { fileInputRef.current?.click(); };
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataURL = String(reader.result);
      const msg: Item = { id: uid(), role: 'user', content: { file: { name: f.name, type: f.type, size: f.size, dataURL } } } as any;
      setMessages(prev => [...prev, msg]);
    };
    reader.readAsDataURL(f);
    e.currentTarget.value = '';
  };

  const exportHistory = () => {
    const payload = { messages, conversations, ts: Date.now() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); 
    a.href = url; 
    a.download = `devmaster-chat-export-${new Date().toISOString().split('T')[0]}.json`; 
    document.body.appendChild(a); 
    a.click(); 
    a.remove(); 
    URL.revokeObjectURL(url);
  };

  const importHistory = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return; const reader = new FileReader(); reader.onload = () => {
      try { const data = JSON.parse(String(reader.result)); if (data.messages) setMessages(data.messages); if (data.conversations) setConversations(data.conversations); showToast('Import', 'Historique importé'); } catch { showToast('Erreur', 'Fichier invalide', 'destructive'); }
    }; reader.readAsText(f); e.currentTarget.value = '';
  };

  const emojiMap: Record<string,string> = { smile: '😊', grin: '😁', thumbs_up: '👍', tada: '🎉', rocket: '🚀', warning: '⚠️', check: '✅', sad: '😢', thinking: '🤔' };
  const emojify = (s: string) => {
    if (!useEmojis) return s;
    return s.replace(/:([a-z0-9_+-]+):/gi, (_m, code) => emojiMap[code] || _m);
  };

  const renderInline = (text: string) => {
    const esc = (s: string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const nodes: React.ReactNode[] = [];
    let rest = text;
    const pattern = /(`[^`]+`)|\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\(([^)]+)\)/;
    while (rest.length) {
      const m = pattern.exec(rest);
      if (!m) { nodes.push(<span key={nodes.length} dangerouslySetInnerHTML={{__html: emojify(esc(rest))}} />); break; }
      const idx = m.index;
      if (idx > 0) nodes.push(<span key={nodes.length} dangerouslySetInnerHTML={{__html: emojify(esc(rest.slice(0, idx)))}} />);
      if (m[1]) nodes.push(<code key={nodes.length} className="rounded bg-black/5 dark:bg-white/10 px-1">{m[1].slice(1,-1)}</code>);
      else if (m[2]) nodes.push(<strong key={nodes.length}>{emojify(m[2])}</strong>);
      else if (m[3]) nodes.push(<em key={nodes.length}>{emojify(m[3])}</em>);
      else if (m[4] && m[5]) nodes.push(<a key={nodes.length} href={m[5]} target="_blank" rel="noreferrer" className="text-primary underline">{emojify(m[4])}</a>);
      rest = rest.slice(idx + m[0].length);
    }
    return nodes;
  };

  const renderMarkdown = (body: string | any) => {
    if (!body) return null;
    if (typeof body !== 'string') {
      if (body && typeof body === 'object') {
        if ((body as any).file) {
          const f = (body as any).file;
          return (
            <div className="p-2 border rounded-md bg-background">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Fichier: {f.name}</div>
                  <div className="text-xs text-muted-foreground">{f.type} • {Math.round((f.size||0)/1024)} KB</div>
                </div>
                <Button onClick={()=>{ const a = document.createElement('a'); a.href = f.dataURL; a.download = f.name; document.body.appendChild(a); a.click(); a.remove(); }} variant="ghost" size="sm">Télécharger</Button>
              </div>
            </div>
          );
        }
        if ((body as any).images) {
          const imgs = (body as any).images as string[];
          return <div className="grid grid-cols-2 gap-2">{imgs.map((src,idx)=>(<img key={idx} src={src} className="rounded-md" alt={`img-${idx}`} />))}</div>;
        }
        return <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(body, null, 2)}</pre>;
      }
      return String(body);
    }
    const lines = body.split(/\r?\n/);
    const elements: React.ReactNode[] = [];
    let buffer: string[] = [];
    const flushParagraph = () => {
      if (buffer.length === 0) return;
      elements.push(<p key={elements.length} className="whitespace-pre-wrap">{renderInline(buffer.join('\n'))}</p>);
      buffer = [];
    };
    for (let i=0;i<lines.length;i++){
      const l = lines[i];
      if (l.startsWith('```')) {
        flushParagraph();
        const lang = l.slice(3).trim().split(/\s+/)[0] || '';
        const endIdx = lines.findIndex((ln, idx)=>(idx>i && ln.startsWith('```')));
        let code = endIdx !== -1 ? lines.slice(i+1, endIdx).join('\n') : lines.slice(i+1).join('\n');
        i = endIdx !== -1 ? endIdx : lines.length;
        elements.push(
          <div key={elements.length} className="relative my-2">
            <Button onClick={()=>copyToClipboard(code)} variant="ghost" size="sm" className="absolute right-2 top-2 h-7 w-7 p-0"><Copy size={16}/></Button>
            <pre className="rounded-md bg-black/5 dark:bg-white/10 p-4 pt-10 overflow-auto text-sm"><code className={lang? `language-${lang}`: undefined}>{code}</code></pre>
          </div>
        );
      } else if (/^\s*[-*+]\s+/.test(l)) {
        flushParagraph();
        const listItems = [] as string[];
        let j = i;
        while (j < lines.length && /^\s*[-*+]\s+/.test(lines[j])) {
          listItems.push(lines[j].replace(/^\s*[-*+]\s+/, ''));
          j++;
        }
        elements.push(<ul key={elements.length} className="list-disc pl-6 my-2">{listItems.map((it,idx)=>(<li key={idx}>{renderInline(it)}</li>))}</ul>);
        i = j-1;
      } else if (/^#{1,6}\s+/.test(l)) {
        flushParagraph();
        const level = l.match(/^#{1,6}/)![0].length;
        const content = l.replace(/^#{1,6}\s+/, '');
        const Tag:any = `h${Math.min(6, level+1)}`;
        elements.push(<Tag key={elements.length} className="font-semibold my-3">{renderInline(content)}</Tag>);
      } else {
        buffer.push(l);
      }
    }
    flushParagraph();
    return <div className="prose prose-sm dark:prose-invert max-w-none">{elements}</div>;
  };

  const handlePublicApiRequest = async (api: string, query: string): Promise<string> => {
    if (!query) return '(aucune requête)';
    try {
        if (api === 'duckduckgo') {
            const r = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`);
            const d = await r.json();
            return d.AbstractText || (d.RelatedTopics?.[0]?.Text) || 'Aucun résultat.';
        }
        if (api === 'wikipedia') {
            const r = await fetch(`https://fr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`);
            const d = await r.json();
            return d.extract || 'Aucun résultat trouvé.';
        }
        if (api === 'advice') {
            const r = await fetch('https://api.adviceslip.com/advice');
            const d = await r.json();
            return d.slip?.advice || 'Aucun conseil disponible.';
        }
        if (api === 'bored') {
            const r = await fetch('https://www.boredapi.com/api/activity/');
            const d = await r.json();
            return d.activity ? `Activité: ${d.activity}` : 'Aucune activité disponible.';
        }
        if (api === 'dog') {
            const r = await fetch('https://dog.ceo/api/breeds/image/random');
            const d = await r.json();
            return d.message ? `Image de chien: ${d.message}` : 'Aucune image disponible.';
        }
        if (api === 'picsum') {
            const r = await fetch(`https://picsum.photos/seed/${encodeURIComponent(query)}/400/300.jpg`);
            return `Image générée: ${r.url}`;
        }
    } catch (e) { return 'Erreur API.'; }
    return 'API non supportée.';
  };

  const sendMessage = async (content: string, history: Item[] = messages) => {
    const trimmed = content.trim();
    if (!trimmed) return;
    const userMsg: Item = { id: uid(), role: 'user' as const, content: trimmed };
    const msgsForServer = [...history.map(({id, ...m})=>m), { role: 'user', content: trimmed }];
    if (systemPrompt && systemPrompt.trim()) msgsForServer.unshift({ role: 'system', content: systemPrompt.trim() });

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    try {
      if (selectedPublicApi && selectedPublicApi !== 'none') {
        const reply = await handlePublicApiRequest(selectedPublicApi, trimmed);
        setMessages(prev => [...prev, { id: uid(), role: 'assistant' as const, content: reply }]);
        setLoading(false);
        return;
      }

      const body: any = { messages: msgsForServer, provider, model: model.trim() || undefined };
      const r = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data: ChatResponse = await r.json();
      const reply = emojify((data as any).reply || (data as any).error || "(pas de réponse)");
      setMessages(prev => [...prev, { id: uid(), role: 'assistant' as const, content: reply }]);

    } catch (e) {
      console.error('chat send error', e);
      toast({ title: 'Erreur', description: 'Erreur lors de l\'envoi', variant: 'destructive' });
      setMessages(prev => [...prev.slice(0, -1), { ...userMsg, content: `Erreur: ${e.message}. Veuillez réessayer.` } ]);
    } finally { setLoading(false); }
  };

  const send = () => {
    sendMessage(input);
    setInput('');
  };

  const clear = () => {
    if (messages.length > 0 && confirm('Enregistrer cette conversation avant de créer une nouvelle ?')) {
      const title = prompt('Titre pour cette conversation (optionnel)') || `Conversation ${new Date().toLocaleString('fr-FR')}`;
      setConversations(prev => [{ id: uid(), title, ts: Date.now(), messages }, ...prev].slice(0,50));
    }
    setMessages([]);
  };
  
  useEffect(()=>{
    const pending = localStorage.getItem('chat:pending');
    if (!pending) return;
    try{
      const obj = JSON.parse(pending);
      if (obj && obj.message) {
        localStorage.removeItem('chat:pending');
        sendMessage(String(obj.message || ''));
      }
    }catch(e){ /* ignore malformed */ }
  },[]);

  return (
    <div className="container mx-auto p-4 flex flex-col h-screen bg-background">
      <header className="flex items-center justify-between py-2 border-b">
        <h1 className="text-xl font-semibold">Chat général</h1>
        <div className="flex items-center gap-2">
            <details className="relative">
                <summary className="px-3 py-1.5 text-sm rounded-md border cursor-pointer">Conversations</summary>
                <div className="absolute right-0 mt-2 w-80 bg-background border rounded-lg shadow-lg z-10">
                    {conversations && conversations.length > 0 ? (
                        <div className="p-2 max-h-96 overflow-y-auto">
                        {conversations.map(c => (
                            <div key={c.id} className="flex items-center justify-between gap-2 p-2 rounded-md hover:bg-muted">
                                <div className="text-sm truncate">
                                    <div className="font-medium">{c.title}</div>
                                    <div className="text-xs text-muted-foreground">{new Date(c.ts).toLocaleString('fr-FR')}</div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button size="sm" variant="ghost" onClick={()=>restoreConversation(c.id)}>Restaurer</Button>
                                    <Button size="sm" variant="ghost" className="text-destructive" onClick={()=>removeConversation(c.id)}>
                                        <Trash2 size={14}/>
                                    </Button>
                                </div>
                            </div>
                        ))}
                        </div>
                    ) : (
                        <p className="p-4 text-sm text-muted-foreground">Aucune conversation enregistrée.</p>
                    )}
                </div>
            </details>
          <Button onClick={clear} variant="outline">Nouveau</Button>
        </div>
      </header>

      <Tabs value={tab} onValueChange={setTab} className="flex-1 mt-4 flex flex-col">
        <TabsList className="shrink-0">
            <TabsTrigger value="chat">Conversation</TabsTrigger>
            <TabsTrigger value="music">Musique</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="search">Recherche</TabsTrigger>
            <TabsTrigger value="docs">Docs</TabsTrigger>
        </TabsList>
        <TabsContent value="chat" className="flex-1 py-4 overflow-y-auto">
            <div className="space-y-4 max-w-4xl mx-auto">
                {messages.length === 0 && (
                <div className="text-center p-8 text-muted-foreground">
                    <h2 className="text-2xl font-semibold mb-2">DevMaster Chat</h2>
                    <p>Posez n'importe quelle question (actualités, idées, rédaction, recherche, programmation…).</p>
                    <p className="text-sm mt-2">Utilisez les onglets pour accéder à la musique, aux images, à la recherche et plus encore.</p>
                </div>
                )}
                {messages.map((m)=> (
                <div key={m.id} className={`flex gap-3 ${m.role==='user'? 'justify-end': ''}`}>
                    {m.role === 'assistant' && <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">A</div>}
                    <div className={`rounded-lg p-3 max-w-xl ${m.role==='user'? 'bg-primary text-primary-foreground': 'bg-muted'}`}>
                        {editingId === m.id ? (
                            <div className="w-full">
                            <Textarea value={editingText} onChange={(e)=>setEditingText(e.target.value)} className="w-full bg-background text-foreground" autoFocus/>
                            <div className="flex gap-2 mt-2 justify-end">
                                <Button onClick={()=>onSaveEdit(m.id)} size="sm">Réenvoyer</Button>
                                <Button onClick={()=>onCancelEdit()} size="sm" variant="ghost">Annuler</Button>
                            </div>
                            </div>
                        ) : (
                            renderMarkdown(m.content)
                        )}
                    </div>
                    <div className="self-center">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreVertical size={16} />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                {m.role === 'user' ? (<>
                                    <DropdownMenuItem onClick={()=>onEdit(m.id)}><Pencil size={14} className="mr-2"/> Modifier</DropdownMenuItem>
                                    <DropdownMenuItem onClick={()=>onDelete(m.id)} className="text-destructive"><Trash2 size={14} className="mr-2"/> Supprimer</DropdownMenuItem>
                                </>) : (<>
                                    <DropdownMenuItem onClick={()=>copyToClipboard(typeof m.content === 'string' ? m.content : JSON.stringify(m.content))}><Copy size={14} className="mr-2"/> Copier</DropdownMenuItem>
                                    <DropdownMenuItem onClick={()=>downloadMessage(m)}><Download size={14} className="mr-2"/> Télécharger</DropdownMenuItem>
                                    <DropdownMenuItem onClick={()=>onRegenerate(m.id)}><RefreshCw size={14} className="mr-2"/> Régénérer</DropdownMenuItem>
                                    <DropdownMenuItem onClick={()=>sendFeedback(m.id, true)}><ThumbsUp size={14} className="mr-2"/> Positif</DropdownMenuItem>
                                    <DropdownMenuItem onClick={()=>sendFeedback(m.id, false)}><ThumbsDown size={14} className="mr-2"/> Négatif</DropdownMenuItem>
                                </>)}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    {m.role === 'user' && <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center shrink-0">V</div>}
                </div>
                ))}
                {loading && <div className="flex gap-3"><div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">A</div><div className="rounded-lg p-3 bg-muted"><div className="flex items-center gap-2"><div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div><span>L'assistant écrit...</span></div></div></div>}
                <div ref={endRef} />
            </div>
        </TabsContent>
        <TabsContent value="music" className="flex-1 py-4 overflow-y-auto">
            <MusicPanel />
        </TabsContent>
        <TabsContent value="images" className="flex-1 py-4 overflow-y-auto">
            <div className="rounded-lg border bg-card p-4">
                <h2 className="text-lg font-semibold tracking-tight">Génération d'images</h2>
                <ImageGenerator />
            </div>
        </TabsContent>
        <TabsContent value="search" className="flex-1 py-4 overflow-y-auto">
            <div className="rounded-lg border bg-card p-4">
                <h2 className="text-lg font-semibold tracking-tight">Recherche sur Internet</h2>
                <SearchPanel />
            </div>
        </TabsContent>
        <TabsContent value="docs" className="flex-1 py-4 overflow-y-auto">
            <div className="rounded-lg border bg-card p-4">
                <h2 className="text-lg font-semibold tracking-tight">Exporter en PDF / DOCX</h2>
                <DocumentExporter />
            </div>
        </TabsContent>
      </Tabs>
      
      <footer className="py-2 border-t">
        <div className="max-w-4xl mx-auto">
            <details className="mb-2">
                <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">Paramètres</summary>
                <div className="grid grid-cols-2 gap-4 p-4 mt-2 border rounded-lg bg-muted/50">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Fournisseur</label>
                        <select value={provider} onChange={(e)=>setProvider(e.target.value as ChatProvider)} className="w-full h-9 px-2 rounded-md border bg-background">
                            <option value="auto">Auto</option>
                            <option value="openai">OpenAI</option>
                            <option value="gemini">Gemini</option>
                            <option value="huggingface">Hugging Face</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Modèle (optionnel)</label>
                        <input value={model} onChange={(e)=>setModel(e.target.value)} placeholder={provider === 'gemini' ? 'gemini-1.5-flash' : provider === 'openai' ? 'gpt-4o-mini' : '...'} className="w-full h-9 px-2 rounded-md border bg-background" />
                    </div>
                    <div className="col-span-2 space-y-2">
                        <label className="text-sm font-medium">Instruction système</label>
                        <Textarea value={systemPrompt} onChange={(e)=>setSystemPrompt(e.target.value)} placeholder="Ex: Tu es un assistant expert en développement web..." className="bg-background"/>
                    </div>
                    <div className="col-span-2 space-y-2">
                        <label className="text-sm font-medium">API Publique</label>
                        <select value={selectedPublicApi} onChange={(e)=>setSelectedPublicApi(e.target.value)} className="w-full h-9 px-2 rounded-md border bg-background">
                            <option value="none">Aucune</option>
                            <option value="duckduckgo">DuckDuckGo (recherche)</option>
                            <option value="wikipedia">Wikipedia (résumé)</option>
                            <option value="advice">Advice Slip (conseil)</option>
                            <option value="bored">Bored API (activité)</option>
                            <option value="dog">Dog CEO (images)</option>
                            <option value="picsum">Picsum (images)</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="use-emojis" checked={useEmojis} onChange={(e)=>setUseEmojis(e.target.checked)} />
                        <label htmlFor="use-emojis" className="text-sm font-medium">Utiliser les émojis</label>
                    </div>
                </div>
            </details>
            <div className="relative">
                <Textarea value={input} onKeyDown={(e)=>{ if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} onChange={(e)=>setInput(e.target.value)} placeholder="Écrire un message…" className="w-full pr-24 min-h-[48px] resize-none" />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                    <input ref={fileInputRef} type="file" onChange={handleFileChange} className="hidden" />
                    <Button onClick={triggerFileInput} variant="ghost" size="icon"><Paperclip size={20} /></Button>
                    <Button onClick={send} disabled={loading || !input.trim()} size="icon"><Send size={20} /></Button>
                </div>
            </div>
             <div className="text-xs text-muted-foreground mt-2 flex justify-between">
                <div>
                    <button onClick={toggleRecording} className={`px-2 py-1 rounded ${recording ? 'bg-red-500/20' : ''}`}>
                        {recording? '● Stop':'🎤 Voix'}
                    </button>
                </div>
                <div>
                    <input type="file" accept="application/json" onChange={importHistory} className="hidden" id="import-history" />
                    <label htmlFor="import-history" className="cursor-pointer hover:underline">Importer</label>
                    <span className="mx-2">/</span>
                    <button onClick={exportHistory} className="hover:underline">Exporter</button>
                </div>
            </div>
        </div>
      </footer>
    </div>
  );
}
