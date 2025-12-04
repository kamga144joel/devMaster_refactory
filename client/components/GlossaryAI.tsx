import { useEffect, useMemo, useState } from "react";
import type { GlossaryItem } from "@shared/api";
import { useToast } from "@/hooks/use-toast";
import { LANGS, FRAMEWORKS } from "@/lib/platforms";
import { motion, AnimatePresence } from "framer-motion";
import GlossaryAIHeader from "@/components/glossary-ai/GlossaryAIHeader";
import GlossaryAIControls from "@/components/glossary-ai/GlossaryAIControls";
import GlossaryAICard from "@/components/glossary-ai/GlossaryAICard";

export default function GlossaryAI() {
  const { toast } = useToast();
  const [term, setTerm] = useState("");
  const [language, setLanguage] = useState<string>(() => localStorage.getItem("learn:lang") || "Aucun");
  const [framework, setFramework] = useState<string>(() => localStorage.getItem("learn:fw") || "Aucun");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<GlossaryItem[]>([]);
  const [error, setError] = useState("");
  const [autoUpdate, setAutoUpdate] = useState(
    () => (localStorage.getItem("prefs:glossary:autoUpdate") ?? "true") === "true"
  );

  useEffect(() => {
    localStorage.setItem("learn:lang", language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem("learn:fw", framework);
  }, [framework]);

  useEffect(() => {
    localStorage.setItem("prefs:glossary:autoUpdate", autoUpdate ? "true" : "false");
  }, [autoUpdate]);

  // Listen to storage changes
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "learn:lang" && e.newValue && e.newValue !== language) setLanguage(e.newValue);
      if (e.key === "learn:fw" && e.newValue && e.newValue !== framework) setFramework(e.newValue);
      if (e.key === "prefs:glossary:autoUpdate") setAutoUpdate((e.newValue ?? "true") === "true");
    };

    const onPrefs = (ev: any) => {
      const key = ev?.detail?.key;
      if (key === "prefs:glossary:autoUpdate")
        setAutoUpdate((localStorage.getItem("prefs:glossary:autoUpdate") ?? "true") === "true");
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("prefs:changed", onPrefs as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("prefs:changed", onPrefs as EventListener);
    };
  }, [language, framework]);

  const canGenerate = useMemo(() => term.trim().length > 0, [term]);

  const fetchWithTimeout = async (url: string, timeout = 4000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const r = await fetch(url, { signal: controller.signal });
      return r;
    } finally {
      clearTimeout(id);
    }
  };

  const generate = async () => {
    const t = term.trim();
    if (!t) {
      toast({ title: "Erreur", description: "Entrez un terme", variant: "destructive" });
      return;
    }

    setLoading(true);
    setError("");

    try {
      toast({ title: "Génération", description: `Génération pour « ${t} »…` });

      // Try Wikipedia first
      let desc = "";
      try {
        const s = await fetchWithTimeout(
          `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(t)}&limit=1&format=json&origin=*`,
          3000
        );
        if (s && s.ok) {
          const so = await s.json();
          const title = so && so[1] && so[1][0];
          if (title) {
            const p = await fetchWithTimeout(
              `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
              3000
            );
            if (p && p.ok) {
              const pj = await p.json();
              desc = pj.extract || "";
            }
          }
        }
      } catch (e) {
        /* ignore */
      }

      // Fallback to DuckDuckGo
      if (!desc) {
        try {
          const r = await fetchWithTimeout(
            `https://api.duckduckgo.com/?q=${encodeURIComponent(t)}&format=json&no_html=1&skip_disambig=1`,
            3000
          );
          if (r && r.ok) {
            const d = await r.json();
            desc = d.AbstractText || "";
          }
        } catch (e) {
          /* ignore */
        }
      }

      if (!desc) desc = `Définition de ${t}`;

      // Generate code sample
      let codeSample = "";
      const lc = language?.toLowerCase() || "";
      const key = t.toLowerCase().replace(/[^a-z0-9]/gi, "_");

      if (lc.includes("javascript") || lc.includes("typescript")) {
        codeSample = `// Example: ${t}\n// ${language}${framework !== "Aucun" ? " - " + framework : ""}\n` + `function example() {\n  // TODO: illustrate ${t}\n}\n`;
        if (/promise/i.test(t)) {
          codeSample = `// Promise example\nconst p = new Promise((resolve, reject) => {\n  setTimeout(() => resolve('done'), 1000);\n});\np.then(console.log);`;
        }
        if (/hook/i.test(t) && framework === "React") {
          codeSample = `// React hook example\nimport { useState, useEffect } from 'react';\nfunction useExample() {\n  const [v, setV] = useState(null);\n  useEffect(() => {\n    // effect\n  }, []);\n  return [v, setV];\n}`;
        }
      } else if (lc.includes("python")) {
        codeSample = `# Example: ${t}\n# ${language}${framework !== "Aucun" ? " - " + framework : ""}\ndef example():\n    pass`;
      } else if (lc.includes("java")) {
        codeSample = `// Example ${t}\npublic class Example {\n  public static void main(String[] args) {\n    System.out.println("${t}");\n  }\n}`;
      } else {
        codeSample = `// Exemple pour ${t}`;
      }

      const item: GlossaryItem = { key, title: t, desc, code: codeSample };
      setItems((prev) => [item, ...prev.filter((i) => i.key !== item.key)]);
      toast({ title: "Terminé !", description: `Glossaire généré pour « ${t} »` });
    } catch (e: any) {
      setError(String(e?.message ?? e));
      toast({ title: "Erreur", description: String(e?.message || e), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate when language/framework changes
  useEffect(() => {
    if (!autoUpdate) return;
    if (term.trim()) {
      const id = setTimeout(() => {
        generate();
      }, 300);
      return () => clearTimeout(id);
    }
  }, [language, framework, autoUpdate]);

  const handleLoadSandbox = (code: string, lang: string) => {
    window.dispatchEvent(new CustomEvent("sandbox:load", { detail: { code, lang } }));
  };

  return (
    <section id="glossaire-ai" className="container mx-auto py-16">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
        className="space-y-8"
      >
        {/* Header */}
        <GlossaryAIHeader />

        {/* Controls */}
        <GlossaryAIControls
          term={term}
          setTerm={setTerm}
          language={language}
          setLanguage={setLanguage}
          framework={framework}
          setFramework={setFramework}
          autoUpdate={autoUpdate}
          setAutoUpdate={setAutoUpdate}
          loading={loading}
          onGenerate={generate}
          error={error}
        />

        {/* Loading State */}
        {loading && !items.length && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center py-12"
          >
            <div className="flex flex-col items-center gap-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="h-8 w-8 rounded-full border-3 border-primary/30 border-t-primary"
              />
              <p className="text-muted-foreground">Génération en cours…</p>
            </div>
          </motion.div>
        )}

        {/* Items Grid */}
        <AnimatePresence mode="popLayout">
          {items.length > 0 && (
            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.05 },
                },
              }}
            >
              {items.map((item) => (
                <GlossaryAICard
                  key={item.key}
                  item={item}
                  language={language}
                  onLoadSandbox={handleLoadSandbox}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {!loading && items.length === 0 && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-muted-foreground">Entrez un terme pour commencer…</p>
          </motion.div>
        )}
      </motion.div>
    </section>
  );
}
