import { GlossaryItem } from "@shared/api";
import { motion } from "framer-motion";
import { Copy, Play, Download, Cloud, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GlossaryAICardProps {
  item: GlossaryItem;
  language: string;
  onLoadSandbox: (code: string, lang: string) => void;
}

export default function GlossaryAICard({ item, language, onLoadSandbox }: GlossaryAICardProps) {
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(item.code || "");
      toast({ title: "Copié !", description: "Exemple copié" });
    } catch {
      toast({ title: "Erreur", description: "Impossible de copier", variant: "destructive" });
    }
  };

  const handleLoad = () => {
    const lang = language === "Aucun" ? "javascript" : language.toLowerCase();
    onLoadSandbox(item.code || "", lang);
    toast({ title: "Bac à sable", description: "Exemple chargé" });
  };

  const handleLoadAndRun = () => {
    const lang = language === "Aucun" ? "javascript" : language.toLowerCase();
    onLoadSandbox(item.code || "", lang);
    window.dispatchEvent(new CustomEvent("sandbox:run"));
    toast({ title: "Bac à sable", description: "Exemple chargé et exécuté" });
  };

  const handleSave = async () => {
    try {
      const r = await fetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ namespace: "glossary", key: `glossary:${item.key}`, data: item }),
      });
      const j = await r.json();
      if (r.status === 501) {
        toast({
          title: "Sauvegarde cloud indisponible",
          description: "Configurez SUPABASE_URL et SUPABASE_KEY",
          variant: "destructive",
        });
      } else if (!r.ok) {
        toast({
          title: "Erreur sauvegarde",
          description: String(j?.message || j?.error || "Erreur inconnue"),
          variant: "destructive",
        });
      } else {
        toast({ title: "Sauvegardé !", description: "Exemple sauvegardé dans le cloud" });
      }
    } catch (e: any) {
      toast({ title: "Erreur", description: String(e?.message || e), variant: "destructive" });
    }
  };

  const handleChat = () => {
    try {
      const payload = {
        message: `${item.title}\n\n${item.desc}\n\n${item.code || ""}`,
      };
      localStorage.setItem("chat:pending", JSON.stringify(payload));
      window.location.href = "/chat";
    } catch (e) {
      toast({ title: "Erreur", description: "Impossible d'ouvrir le chat", variant: "destructive" });
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -2 }}
      className="rounded-xl border border-border/50 bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-300 overflow-hidden group"
    >
      <div className="p-6 space-y-4">
        {/* Title & Description */}
        <div>
          <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">{item.title}</h3>
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{item.desc}</p>
        </div>

        {/* Code Block */}
        {item.code && (
          <div className="rounded-lg bg-secondary/50 p-3 font-mono text-xs overflow-x-auto border border-border/50">
            <pre className="text-foreground/80 leading-relaxed">
              <code>{item.code}</code>
            </pre>
          </div>
        )}

        {/* Actions Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-border/30">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCopy}
            className="h-8 px-2 rounded-lg border border-border/50 flex items-center justify-center gap-1 hover:bg-accent text-xs font-medium transition-all"
            title="Copier"
          >
            <Copy className="h-3.5 w-3.5" />
            Copier
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLoad}
            className="h-8 px-2 rounded-lg border border-border/50 flex items-center justify-center gap-1 hover:bg-accent text-xs font-medium transition-all"
            title="Charger dans le bac à sable"
          >
            <Download className="h-3.5 w-3.5" />
            Charger
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLoadAndRun}
            className="h-8 px-2 rounded-lg border border-border/50 flex items-center justify-center gap-1 hover:bg-accent text-xs font-medium transition-all"
            title="Charger et exécuter"
          >
            <Play className="h-3.5 w-3.5" />
            Exécuter
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSave}
            className="h-8 px-2 rounded-lg border border-border/50 flex items-center justify-center gap-1 hover:bg-accent text-xs font-medium transition-all"
            title="Sauvegarder"
          >
            <Cloud className="h-3.5 w-3.5" />
            Sauver
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleChat}
            className="h-8 px-2 rounded-lg border border-border/50 flex items-center justify-center gap-1 hover:bg-primary/10 hover:border-primary/50 text-xs font-medium transition-all col-span-2 sm:col-span-1"
            title="Discuter"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Chat
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
