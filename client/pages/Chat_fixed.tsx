import React, { useEffect, useState, useRef } from "react";
import type { ChatMessage, ChatResponse, ChatProvider } from "@shared/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import MusicPanel from "@/components/MusicPanel";
import ImageGenerator from "@/components/ImageGenerator";
import SearchPanel from "@/components/SearchPanel";
import DocumentExporter from "@/components/DocumentExporter";

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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [recording, setRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [useEmojis, setUseEmojis] = useState<boolean>(()=> localStorage.getItem('chat:emojis') !== 'false');
  const [selectedPublicApi, setSelectedPublicApi] = useState<string>(()=> localStorage.getItem('chat:publicApi') || 'none');
  // Notice banner about partial chat implementation (dismissible)
  const [showChatNotice, setShowChatNotice] = useState<boolean>(()=> localStorage.getItem('chat:notice:dismissed') !== '1');

  const { toast } = useToast();
  const showToast = (title?: string, description?: string, variant: 'default'|'destructive' = 'default') => {
    toast({ title, description, variant });
  };

  useEffect(()=>{ localStorage.setItem('chat:history', JSON.stringify(messages)); },[messages]);
  useEffect(()=>{ localStorage.setItem('chat:conversations', JSON.stringify(conversations)); },[conversations]);
  useEffect(()=>{ endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  // Load highlight.js: prefer local package (bundled) then fallback to CDN. Also load CSS theme via local import when possible.
  const loadHLJS = async () => {
    if ((window as any).__hljs_loaded) return (window as any).hljs;
    const isDark = (localStorage.getItem('prefs:editor:theme') || 'dark') === 'dark';
    const themeName = isDark ? 'github-dark' : 'github';

    // Try dynamic local import first (bundled with Vite)
    try {
      // import CSS via Vite so it is included in the bundle
      try { await import(/* @vite-ignore */ `highlight.js/styles/${themeName}.css`); } catch(e) { /* ignore css import errors */ }
      const mod = await import('highlight.js');
      const hljs = mod?.default || mod;
      (window as any).hljs = hljs;
      (window as any).__hljs_loaded = true;
      return hljs;
    } catch (errLocal) {
      // fallback to CDN
      try {
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
        return await new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/highlight.min.js';
          s.async = true;
          s.onload = () => { (window as any).__hljs_loaded = true; resolve((window as any).hljs); };
          s.onerror = reject;
          document.head.appendChild(s);
        });
      } catch (errCDN) {
        throw errCDN;
      }
    }
  };

  useEffect(()=>{
    let mounted = true;
    (async ()=>{
      try{
        const hljs = await loadHLJS();
        if (!mounted) return;
        // highlight all code blocks
        const blocks = document.querySelectorAll('pre code');
        blocks.forEach((b:any) => { try { hljs.highlightElement(b); } catch(e){} });
      }catch(e){ /* ignore */ }
    })();
    const onPrefs = (e:any) => {
      const key = e?.detail?.key || e?.key;
      if (key === 'prefs:editor:theme') {
        // reload css by calling loadHLJS
        loadHLJS().catch(()=>{});
      }
    };
    window.addEventListener('prefs:changed', onPrefs as EventListener);
    window.addEventListener('storage', onPrefs as any);
    return ()=>{ mounted = false; window.removeEventListener('prefs:changed', onPrefs as EventListener); window.removeEventListener('storage', onPrefs as any); };
  },[messages]);

  useEffect(()=>{
    let mounted = true;
    (async ()=>{
      try{
        const hljs = await loadHLJS();
        if (!mounted) return;
        // highlight all code blocks
        const blocks = document.querySelectorAll('pre code');
        blocks.forEach((b:any) => { try { hljs.highlightElement(b); } catch(e){} });
      }catch(e){ /* ignore */ }
    })();
    return ()=>{ mounted = false; };
  },[messages]);
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

  // editing state for individual messages
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>("");

  const onEdit = (id: string) => {
    const it = messages.find(m=>m.id === id);
    if (!it) return;
    if (it.role !== 'user') { showToast('Action refusÃ©e', "Vous ne pouvez modifier que vos messages.", 'destructive'); return; }
    setEditingId(id);
    setEditingText(typeof it.content === 'string' ? it.content : JSON.stringify(it.content, null, 2));
  };
  const onCancelEdit = () => { setEditingId(null); setEditingText(''); };
  const onSaveEdit = async (id: string) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, content: editingText } : m));
    setEditingId(null);
    const text = editingText;
    setEditingText('');
    // resend edited message
    await sendMessage(text);
  };

  const onDelete = (id: string) => {
    const it = messages.find(m=>m.id === id);
    if (!it) return;
    if (it.role !== 'user') { showToast('Action refusÃ©e', "Vous ne pouvez supprimer que vos messages.", 'destructive'); return; }
    if (!confirm('Supprimer ce message ?')) return;
    setMessages(prev => prev.filter(m => m.id !== id));
  };

  const copyToClipboard = async (text: string) => {
    try { await navigator.clipboard.writeText(text); showToast('CopiÃ©', 'CopiÃ© dans le presse-papiers'); } catch (e) { showToast('Erreur', 'Impossible de copier', 'destructive'); }
  };

  const downloadMessage = (m: Item) => {
    const content = typeof m.content === 'string' ? m.content : JSON.stringify(m.content, null, 2);
    // try to detect first code fence language
    const codeMatch = content.match(/```(\w+)?\n([\s\S]*?)```/);
    let filename = 'assistant.txt';
    let blobContent = content;
    if (codeMatch) {
      const lang = (codeMatch[1] || 'txt').replace(/[^a-z0-9]/gi,'');
      const ext = lang === 'javascript' || lang === 'js' ? 'js' : lang;
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
    // find the assistant message index
    const idx = messages.findIndex(m => m.id === assistantMessageId);
    if (idx === -1) return;
    // find previous user message before this assistant message
    for (let i = idx - 1; i >= 0; i--) {
      if (messages[i].role === 'user') { sendMessage(typeof messages[i].content === 'string' ? messages[i].content : JSON.stringify(messages[i].content)); return; }
    }
    showToast('Impossible', 'Aucun message utilisateur trouvÃ© Ã  rÃ©gÃ©nÃ©rer', 'destructive');
  };

  const sendFeedback = (messageId: string, positive: boolean) => {
    // lightweight client-side feedback indicator
    showToast('Feedback reÃ§u', positive ? 'Merci pour votre feedback ðŸ‘' : 'Merci pour votre feedback ðŸ‘Ž');
    };

  const insertEmoji = (emoji: string) => { setInput(prev => prev + emoji); setShowEmojiPicker(false); };

  const toggleRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { showToast('Non supportÃ©', 'Reconnaissance vocale non supportÃ©e dans ce navigateur', 'destructive'); return; }
    if (recording) {
      recognitionRef.current?.stop();
      setRecording(false);
      return;
    }
    const recog = new SpeechRecognition();
    recog.lang = 'fr-FR';
    recog.interimResults = true;
    recog.onresult = (ev: any) => {
      let interim = '';
      let final = '';
      for (let i = ev.resultIndex; i < ev.results.length; ++i) {
        const r = ev.results[i];
        if (r.isFinal) final += r[0].transcript;
        else interim += r[0].transcript;
      }
      setInput(prev => (final ? prev + final : prev));
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
    const a = document.createElement('a'); a.href = url; a.download = 'chat-export.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };

  const importHistory = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return; const reader = new FileReader(); reader.onload = () => {
      try { const data = JSON.parse(String(reader.result)); if (data.messages) setMessages(data.messages); if (data.conversations) setConversations(data.conversations); showToast('Import', 'Historique importÃ©'); } catch { showToast('Erreur', 'Fichier invalide', 'destructive'); }
    }; reader.readAsText(f); e.currentTarget.value = '';
  };

  // lightweight markdown renderer: handles code blocks, inline code, bold, italics, links, and lists
  // simple emoji map for colon-style shortcodes
  const emojiMap: Record<string,string> = {
    smile: 'ðŸ˜Š',
    grin: 'ðŸ˜',
    thumbs_up: 'ðŸ‘',
    tada: 'ðŸŽ‰',
    rocket: 'ðŸš€',
    warning: 'âš ï¸',
    check: 'âœ…',
    sad: 'ðŸ˜¢',
    thinking: 'ðŸ¤”',
  };
  const emojify = (s: string) => {
    if (!useEmojis) return s;
    // replace :shortcode: with emoji
    return s.replace(/:([a-z0-9_+-]+):/gi, (_m, code) => emojiMap[code] || _m);
  };

  const renderInline = (text: string) => {
    // escape HTML
    const esc = (s: string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const nodes: React.ReactNode[] = [];
    let rest = text;
    const pattern = /(`[^`]+`)|\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\(([^)]+)\)/;
    while (rest.length) {
      const m = pattern.exec(rest);
      if (!m) { nodes.push(<span key={nodes.length} dangerouslySetInnerHTML={{__html: emojify(esc(rest))}} />); break; }
      const idx = m.index;
      if (idx > 0) nodes.push(<span key={nodes.length} dangerouslySetInnerHTML={{__html: emojify(esc(rest.slice(0, idx)))}} />);
      if (m[1]) nodes.push(<code key={nodes.length} className="rounded bg-black/5 px-1">{m[1].slice(1,-1)}</code>);
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
      // handle common structured bodies (files, images)
      if (body && typeof body === 'object') {
        if ((body as any).file) {
          const f = (body as any).file;
          return (
            <div className="p-2 border rounded-md bg-background">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Fichier: {f.name}</div>
                  <div className="text-xs text-muted-foreground">{f.type} â€¢ {Math.round((f.size||0)/1024)} KB</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={()=>{ const a = document.createElement('a'); a.href = f.dataURL; a.download = f.name; document.body.appendChild(a); a.click(); a.remove(); }} className="text-xs px-2 py-1 rounded-md border">TÃ©lÃ©charger</button>
                  <button onClick={()=>{ setInput(prev => prev + ` [Fichier: ${f.name}] `); }} className="text-xs px-2 py-1 rounded-md border">InsÃ©rer dans le message</button>
                </div>
              </div>
            </div>
          );
        }
        if ((body as any).images) {
          const imgs = (body as any).images as string[];
          return <div className="grid grid-cols-2 gap-2">{imgs.map((src,idx)=>(<img key={idx} src={src} className="rounded-md" alt={`img-${idx}`} />))}</div>;
        }
        // fallback: show JSON
        return <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(body, null, 2)}</pre>;
      }
      return String(body);
    }
    // split into lines and handle lists and headings
    const lines = body.split(/\r?\n/);
    const elements: React.ReactNode[] = [];
    let buffer: string[] = [];
    const flushParagraph = () => {
      if (buffer.length === 0) return;
      const txt = buffer.join('\n');
      elements.push(<p key={elements.length} className="whitespace-pre-wrap">{renderInline(txt)}</p>);
      buffer = [];
    };
    for (let i=0;i<lines.length;i++){
      const l = lines[i];
      if (l.startsWith('```')) {
        // code block with optional language: ```js
        const lang = l.slice(3).trim().split(/\s+/)[0] || '';
        const endIdx = lines.findIndex((ln, idx)=>(idx>i && ln.startsWith('```')));
        let code:string = '';
        if (endIdx !== -1) {
          code = lines.slice(i+1, endIdx).join('\n');
          i = endIdx;
        } else {
          code = lines.slice(i+1).join('\n');
          i = lines.length;
        }
        flushParagraph();
        const onCopy = async () => { try { await navigator.clipboard.writeText(code); showToast('CopiÃ©', 'Code copiÃ©'); } catch(e){ showToast('Erreur', 'Impossible de copier', 'destructive'); } };
        elements.push(
          <div key={elements.length} className="relative">
            <button onClick={onCopy} className="absolute right-2 top-2 text-xs px-2 py-1 rounded-md border bg-background">Copier</button>
            <pre className="rounded-md bg-black/5 p-3 overflow-auto text-sm"><code className={lang? `language-${lang}`: undefined}>{code}</code></pre>
          </div>
        );
        continue;
      }
      if (/^\s*[-*+]\s+/.test(l)) {
        // list item
        const listItems = [] as string[];
        let j = i;
        while (j < lines.length && /^\s*[-*+]\s+/.test(lines[j])) {
          listItems.push(lines[j].replace(/^\s*[-*+]\s+/, ''));
          j++;
        }
        flushParagraph();
        elements.push(<ul key={elements.length} className="list-disc pl-6">{listItems.map((it,idx)=>(<li key={idx}>{renderInline(it)}</li>))}</ul>);
        i = j-1;
        continue;
      }
      if (/^#{1,6}\s+/.test(l)) {
        flushParagraph();
        const level = l.match(/^#{1,6}/)![0].length;
        const content = l.replace(/^#{1,6}\s+/, '');
        const Tag:any = `h${Math.min(6, level)}`;
        elements.push(<Tag key={elements.length} className="font-semibold">{renderInline(content)}</Tag>);
        continue;
      }
      if (l.trim() === '') { flushParagraph(); continue; }
      buffer.push(l);
    }
    flushParagraph();
    return <div>{elements}</div>;
  };

  // send a single user message and append assistant reply
  const handlePublicApiRequest = async (api: string, query: string) => {
    if (!query) return '(no query)';
    try {
      if (api === 'duckduckgo') {
        const r = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`);
        const d = await r.json();
        const txt = d.AbstractText || (d.RelatedTopics && d.RelatedTopics[0] && (d.RelatedTopics[0].Text || d.RelatedTopics[0].Result)) || 'Aucun rÃ©sultat.';
        return txt;
      }
      if (api === 'wikipedia') {
        // try opensearch to get a page title
        const s = await fetch(`https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=1&format=json&origin=*`);
        const so = await s.json();
        const title = so && so[1] && so[1][0];
        if (!title) return 'Aucun article trouvÃ© sur Wikipedia.';
        const p = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
        const pj = await p.json();
        return pj.extract || 'Aucun rÃ©sumÃ© disponible.';
      }
      if (api === 'advice') {
        if (/\b(search|find|conseil|aide)\b/i.test(query)) {
          const s = await fetch(`https://api.adviceslip.com/advice/search/${encodeURIComponent(query)}`);
          const sj = await s.json();
          if (sj.slips && sj.slips.length) return sj.slips.map((sl:any)=>sl.advice).join('\n\n');
          return 'Aucun conseil trouvÃ©.';
        }
        const r = await fetch('https://api.adviceslip.com/advice');
        const d = await r.json();
        return d.slip && d.slip.advice ? d.slip.advice : 'Pas de conseil.';
      }
      if (api === 'bored') {
        const r = await fetch('https://www.boredapi.com/api/activity');
        const d = await r.json();
        return `${d.activity} (type: ${d.type}, participants: ${d.participants})`;
      }
      if (api === 'dog') {
        const r = await fetch('https://dog.ceo/api/breeds/image/random');
        const d = await r.json();
        if (d && d.status === 'success') return '__IMAGES__' + JSON.stringify({ images: [d.message] });
        return 'Pas d\'image.';
      }
      if (api === 'picsum') {
        const r = await fetch('https://picsum.photos/800');
        // picsum redirects to an image
        return '__IMAGES__' + JSON.stringify({ images: [r.url] });
      }
      return 'API non supportÃ©e.';
    } catch (e) { return 'Erreur lors de la requÃªte publique.'; }
  };

  const sendMessage = async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;
    const userMsg = { id: uid(), role: 'user' as const, content: trimmed };
    // build messages for server using the current local state plus the new user message
    const msgsForServer = [...messages.map(({id, ...m})=>m), { role: 'user', content: trimmed }];
    if (systemPrompt && systemPrompt.trim()) msgsForServer.unshift({ role: 'system', content: systemPrompt.trim() });

    // optimistically append user message to UI
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    try {
      // If a public API is selected, handle it client-side and return
      if (selectedPublicApi && selectedPublicApi !== 'none') {
        const reply = await handlePublicApiRequest(selectedPublicApi, trimmed);
        setMessages(prev => [...prev, { id: uid(), role: 'assistant' as const, content: reply }]);
        setLoading(false);
        return;
      }

      // Try client-side OpenAI if key is present â€” attempt streaming for progressive assistant output
      const openaiKey = localStorage.getItem('keys:openai');
      if (provider === 'openai' && openaiKey) {
        try {
          const modelToUse = model && model.trim() ? model.trim() : 'gpt-4o-mini';
          // create placeholder assistant message to stream into
          const assistantId = uid();
          setMessages(prev => [...prev, { id: assistantId, role: 'assistant' as const, content: '' }]);

          const resp = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + openaiKey },
            body: JSON.stringify({ model: modelToUse, messages: msgsForServer, stream: true })
          });

          if (!resp.ok) {
            const errText = await resp.text();
            throw new Error(errText || 'OpenAI error');
          }

          const reader = resp.body?.getReader();
          if (!reader) throw new Error('No stream available');
          const dec = new TextDecoder();
          let done = false;
          let acc = '';
          while (!done) {
            const { value, done: d } = await reader.read();
            done = !!d;
            if (value) {
              acc += dec.decode(value, { stream: true });
              const chunks = acc.split(/\n/);
              acc = chunks.pop() || '';
              for (const raw of chunks) {
                const line = raw.trim();
                if (!line) continue;
                // lines may be like: data: {json} or data: [DONE]
                const m = line.match(/^data:\s*(.*)$/);
                if (!m) continue;
                const payload = m[1];
                if (payload === '[DONE]') { done = true; break; }
                try {
                  const json = JSON.parse(payload);
                  const delta = json.choices?.[0]?.delta?.content;
                  if (delta) {
                    setMessages(prev => prev.map(mm => mm.id === assistantId ? { ...mm, content: (mm.content || '') + delta } : mm));
                  }
                } catch (e) { /* ignore non-json */ }
              }
            }
          }

          // apply emoji processing only outside code fences
          setMessages(prev => prev.map(m => {
            if (m.id !== assistantId) return m;
            const content = m.content || '';
            if (!useEmojis) return m;
            const parts = content.split(/(```[\s\S]*?```)/g);
            const out = parts.map(p => p.startsWith('```') ? p : emojify(p)).join('');
            return { ...m, content: out };
          }));

          return;
        } catch (e) {
          console.warn('openai client streaming error', e);
          // fallback to normal request below
        }
      }

      // Try Hugging Face inference if key provided
      const hfKey = localStorage.getItem('keys:hf');
      if (provider === 'huggingface' && hfKey) {
        try {
          // join messages into a prompt
          const prompt = msgsForServer.map(m=> (m.role==='user'? 'User: ':'') + m.content).join('\n');
          const modelToUse = model && model.trim() ? model.trim() : 'gpt2';
          const resp = await fetch(`https://api-inference.huggingface.co/models/${encodeURIComponent(modelToUse)}`, {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + hfKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({ inputs: prompt })
          });
          const data = await resp.json();
          let reply = (Array.isArray(data) && data[0]?.generated_text) ? data[0].generated_text : (data?.error || '(pas de rÃ©ponse)');

          setMessages(prev => [...prev, { id: uid(), role: 'assistant' as const, content: reply }]);
          return;
        } catch (e) { console.warn('hf client error', e); }
      }

      // Fallback to server-side API route
      const body: any = { messages: msgsForServer };
      if (provider) body.provider = provider;
      if (model.trim()) body.model = model.trim();
      const r = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const text = await r.text();
      let data: ChatResponse & { error?: string };
      try { data = JSON.parse(text); } catch { data = { reply: '', error: text } as any; }
      let reply = (data as any).reply || (data as any).error || "(pas de rÃ©ponse)";
      if (useEmojis) reply = emojify(reply);
      setMessages(prev => [...prev, { id: uid(), role: 'assistant' as const, content: reply }]);
    } catch (e) {
      console.error('chat send error', e);
      toast({ title: 'Erreur', description: 'Erreur lors de l\'envoi', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const send = async () => {
    await sendMessage(input);
    setInput('');
  };

  useEffect(()=>{
    const pending = localStorage.getItem('chat:pending');
    if (!pending) return;
    try{
      const obj = JSON.parse(pending);
      if (obj && obj.message) {
        // remove pending marker and send the message to the chat
        localStorage.removeItem('chat:pending');
        setTab('chat');
        (async ()=>{ await sendMessage(String(obj.message || '')); })();
      }
    }catch(e){ /* ignore malformed */ }
  },[]);

  const clear = () => {
    if (messages && messages.length) {
      const keep = confirm('Enregistrer cette conversation avant de crÃ©er une nouvelle ?');
      if (keep) {
        const title = prompt('Titre pour cette conversation (optionnel)') || undefined;
        const conv = { id: uid(), title: title || `Conversation ${new Date().toLocaleString()}`, ts: Date.now(), messages };
        setConversations(prev => [conv, ...prev].slice(0,50));
      }
    }
    setMessages([]);
  };

  return (
    <div className="container mx-auto py-8 grid gap-4 max-w-3xl">
        {showChatNotice && (
          <div className="rounded-md p-3 bg-yellow-50 border border-yellow-200 text-yellow-900 flex items-start justify-between">
            <div className="text-sm">
              <strong>Important :</strong> Environ 45% des fonctionnalitÃ©s du chat sont encore en cours d'implÃ©mentation. Les onglets <em>Musique</em> et <em>Images</em> sont disponibles, mais certaines fonctions peuvent Ãªtre instables.
            </div>
            <div>
              <button onClick={() => { setShowChatNotice(false); localStorage.setItem('chat:notice:dismissed','1'); }} className="ml-4 text-sm text-yellow-800 hover:underline">Fermer</button>
            </div>
          </div>
        )}
      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Chat gÃ©nÃ©ral</h1>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-xs">
              <label className="sr-only" htmlFor="provider">ModÃ¨le</label>
              <select id="provider" value={provider} onChange={(e)=>setProvider(e.target.value as ChatProvider)} className="h-8 px-2 rounded-md border bg-background">
                <option value="auto">Auto</option>
                <option value="openai">OpenAI</option>
                <option value="gemini">Gemini</option>
                <option value="huggingface">Hugging Face</option>
                <option value="deepai">DeepAI</option>
              </select>
              <input value={model} onChange={(e)=>setModel(e.target.value)} placeholder={provider === 'gemini' ? 'gemini-1.5-flash' : provider === 'openai' ? 'gpt-4o-mini' : provider === 'huggingface' ? 'tiiuae/falcon-7b-instruct' : 'modÃ¨le (optionnel)'} className="h-8 w-40 px-2 rounded-md border bg-background" />
            </div>
            <div className="ml-2 flex items-center gap-2 text-xs">
              <label className="text-xs text-muted-foreground">System</label>
              <input value={systemPrompt} onChange={(e)=>setSystemPrompt(e.target.value)} placeholder="Instruction systÃ¨me (ex: tu es un assistant utile)" className="h-8 w-72 px-2 rounded-md border bg-background" />
            </div>
            <div className="ml-2 flex items-center gap-2 text-xs">
              <label className="text-xs text-muted-foreground">Ã‰mojis</label>
              <input type="checkbox" checked={useEmojis} onChange={(e)=>setUseEmojis(e.target.checked)} className="h-4 w-4" />
            </div>
            <div className="ml-2 flex items-center gap-2 text-xs">
              <label className="text-xs text-muted-foreground">API Publique</label>
              <select value={selectedPublicApi} onChange={(e)=>setSelectedPublicApi(e.target.value)} className="h-8 px-2 rounded-md border bg-background">
                <option value="none">Aucune</option>
                <option value="duckduckgo">DuckDuckGo (recherche)</option>
                <option value="wikipedia">Wikipedia (rÃ©sumÃ©)</option>
                <option value="advice">Advice Slip (conseil)</option>
                <option value="bored">Bored API (activitÃ©)</option>
                <option value="dog">Dog CEO (images)</option>
                <option value="picsum">Picsum (images)</option>
              </select>
            </div>
            <TabsList>
              <TabsTrigger value="chat">Conversation</TabsTrigger>
              <TabsTrigger value="music">Musique</TabsTrigger>
              <TabsTrigger value="images">Images</TabsTrigger>
              <TabsTrigger value="search">Recherche</TabsTrigger>
              <TabsTrigger value="docs">Docs</TabsTrigger>
            </TabsList>
            <button onClick={clear} className="h-9 px-3 rounded-md border text-sm hover:bg-accent hover:text-accent-foreground">Nouveau</button>
          </div>
        </div>

        <TabsContent value="chat">
          <div className="rounded-2xl border bg-card p-4 grid gap-4 min-h-[50vh]">
            {messages.length === 0 && (
              <p className="text-sm text-muted-foreground">Posez n'importe quelle question (actu, idÃ©es, rÃ©daction, rechercheâ€¦).</p>
            )}

            {conversations && conversations.length > 0 && (
              <details className="mb-3">
                <summary className="cursor-pointer text-sm font-medium">Historique des conversations ({conversations.length})</summary>
                <div className="mt-2 grid gap-2">
                  {conversations.map(c => (
                    <div key={c.id} className="flex items-center justify-between gap-2 p-2 rounded-md border bg-background">
                      <div className="text-sm">{c.title} <div className="text-xs text-muted-foreground">{new Date(c.ts).toLocaleString()}</div></div>
                      <div className="flex items-center gap-2">
                        <button onClick={()=>restoreConversation(c.id)} className="text-xs px-2 py-1 rounded-md border">Restaurer</button>
                        <button onClick={()=>removeConversation(c.id)} className="text-xs px-2 py-1 rounded-md border text-destructive">Supprimer</button>
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            )}

            {messages.map((m)=> {
              const isAssistant = m.role === 'assistant';
              let body: any = m.content;
              if (isAssistant && typeof m.content === 'string') {
                if (m.content.startsWith('__IMAGES__')) {
                  try { body = JSON.parse(m.content.slice(10)); } catch { body = { images: [] }; }
                } else if (m.content.startsWith('__FILE__')) {
                  try { body = JSON.parse(m.content.slice(8)); } catch { body = null; }
                }
              }

              return (
                <div key={m.id} className={`rounded-md p-3 border ${m.role==='user'? 'bg-secondary/60': 'bg-background'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">{m.role === 'user' ? 'Vous' : 'Assistant'}</p>
                      <div className="prose prose-sm dark:prose-invert max-w-none">{renderMarkdown(body)}</div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {m.role === 'user' ? (
                        <div className="flex items-center gap-2">
                          <button onClick={()=>onEdit(m.id)} className="text-xs px-2 py-1 rounded-md border">Modifier</button>
                          <button onClick={()=>onDelete(m.id)} className="text-xs px-2 py-1 rounded-md border text-destructive">Supprimer</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button aria-label="Copier le message" onClick={()=>copyToClipboard(typeof m.content === 'string' ? m.content : JSON.stringify(m.content))} className="text-xs px-2 py-1 rounded-md border">Copier</button>
                          <button aria-label="TÃ©lÃ©charger le message" onClick={()=>downloadMessage(m)} className="text-xs px-2 py-1 rounded-md border">TÃ©lÃ©charger</button>
                          <button aria-label="RÃ©gÃ©nÃ©rer la rÃ©ponse" onClick={()=>onRegenerate(m.id)} className="text-xs px-2 py-1 rounded-md border">RÃ©gÃ©nÃ©rer</button>
                          <button aria-label="Feedback positif" onClick={()=>sendFeedback(m.id, true)} className="text-xs px-2 py-1 rounded-md border">ðŸ‘</button>
                          <button aria-label="Feedback nÃ©gatif" onClick={()=>sendFeedback(m.id, false)} className="text-xs px-2 py-1 rounded-md border">ðŸ‘Ž</button>
                        </div>
                      )}

                      {editingId === m.id && (
                        <div className="mt-2 w-56">
                          <textarea value={editingText} onChange={(e)=>setEditingText(e.target.value)} className="w-full h-24 p-2 rounded-md border bg-background text-sm" />
                          <div className="flex gap-2 mt-2">
                            <button onClick={()=>onSaveEdit(m.id)} className="h-8 px-3 rounded-md bg-primary text-primary-foreground">RÃ©envoyer</button>
                            <button onClick={()=>onCancelEdit()} className="h-8 px-3 rounded-md border">Annuler</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}

            {loading && <p className="text-sm text-muted-foreground">Assistant Ã©critâ€¦</p>}
            <div ref={endRef} />
          </div>

          <div className="rounded-2xl border bg-card p-3 flex items-end gap-2">
            <div className="relative">
              <button aria-label="Emoji picker" onClick={()=>setShowEmojiPicker(s=>!s)} className="h-10 w-10 rounded-md border">ðŸ˜Š</button>
              {showEmojiPicker && (
                <div role="dialog" aria-label="Emoji picker" className="absolute bottom-12 left-0 p-2 bg-background border rounded-md grid grid-cols-6 gap-2">
                  {Object.values(emojiMap).map((e, i)=>(<button aria-label={`emoji-${i}`} key={i} onClick={()=>insertEmoji(e)} className="p-1">{e}</button>))}
                </div>
              )}
            </div>
            <button aria-label="Toggle microphone" onClick={toggleRecording} className={`h-10 w-10 rounded-md border ${recording? 'bg-destructive/60':''}`}>{recording? 'â—':'ðŸŽ¤'}</button>
            <input ref={fileInputRef} aria-label="Fichier" type="file" onChange={handleFileChange} className="hidden" />
            <button aria-label="Attacher un fichier" onClick={triggerFileInput} className="h-10 w-10 rounded-md border">ðŸ“Ž</button>
            <textarea aria-label="Message" value={input} onKeyDown={(e)=>{ if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} onChange={(e)=>setInput(e.target.value)} placeholder="Ã‰crire un messageâ€¦" className="flex-1 min-h-14 rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
            <button onClick={() => { if (!input.trim()) return; window.open('https://www.google.com/search?q='+encodeURIComponent(input.trim()), '_blank'); }} className="h-10 px-3 rounded-md border">Recherche web</button>
            <button onClick={send} disabled={loading} className="h-10 px-4 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60">Envoyer</button>
            <div className="ml-2 flex items-center gap-2">
              <button onClick={exportHistory} className="text-xs px-2 py-1 rounded-md border">Exporter</button>
              <input type="file" accept="application/json" onChange={importHistory} className="text-xs hidden" id="import-history" />
              <label htmlFor="import-history" className="text-xs px-2 py-1 rounded-md border cursor-pointer">Importer</label>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="music">
          <MusicPanel />
        </TabsContent>

        <TabsContent value="images">
          <div className="rounded-2xl border bg-card p-4 grid gap-4">
            <h2 className="text-lg font-semibold tracking-tight">GÃ©nÃ©ration d'images</h2>
            <ImageGenerator />
          </div>
        </TabsContent>

        <TabsContent value="search">
          <div className="rounded-2xl border bg-card p-4 grid gap-4">
            <h2 className="text-lg font-semibold tracking-tight">Recherche sur Internet</h2>
            <SearchPanel />
          </div>
        </TabsContent>

        <TabsContent value="docs">
          <div className="rounded-2xl border bg-card p-4 grid gap-4">
            <h2 className="text-lg font-semibold tracking-tight">Exporter en PDF / DOCX</h2>
            <DocumentExporter />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
