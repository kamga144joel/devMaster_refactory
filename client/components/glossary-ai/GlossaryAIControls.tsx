import { motion } from "framer-motion";
import { Search, Settings2, Zap } from "lucide-react";
import { LANGS, FRAMEWORKS } from "@/lib/platforms";

interface GlossaryAIControlsProps {
  term: string;
  setTerm: (term: string) => void;
  language: string;
  setLanguage: (lang: string) => void;
  framework: string;
  setFramework: (fw: string) => void;
  autoUpdate: boolean;
  setAutoUpdate: (auto: boolean) => void;
  loading: boolean;
  onGenerate: () => void;
  error?: string;
}

export default function GlossaryAIControls({
  term,
  setTerm,
  language,
  setLanguage,
  framework,
  setFramework,
  autoUpdate,
  setAutoUpdate,
  loading,
  onGenerate,
  error,
}: GlossaryAIControlsProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && term.trim()) {
      onGenerate();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 rounded-xl border border-border/50 bg-card/50 p-6"
    >
      {/* Main Input Row */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-end">
        {/* Terme Input */}
        <div className="flex-1">
          <label className="text-xs font-semibold text-muted-foreground mb-2 block">Terme à définir</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ex: Promises, Hooks, Middleware..."
              className="w-full h-11 pl-10 pr-4 rounded-lg border bg-background outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>
        </div>

        {/* Language Select */}
        <div className="w-full lg:w-44">
          <label className="text-xs font-semibold text-muted-foreground mb-2 block">Langage</label>
          <select
            value={language}
            onChange={(e) => {
              setLanguage(e.target.value);
              localStorage.setItem("learn:lang", e.target.value);
              window.dispatchEvent(new CustomEvent("prefs:changed", { detail: { key: "learn:lang", value: e.target.value } }));
            }}
            className="w-full h-11 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary transition-all"
          >
            {LANGS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>

        {/* Framework Select */}
        <div className="w-full lg:w-48">
          <label className="text-xs font-semibold text-muted-foreground mb-2 block">Framework</label>
          <select
            value={framework}
            onChange={(e) => {
              setFramework(e.target.value);
              localStorage.setItem("learn:fw", e.target.value);
              window.dispatchEvent(new CustomEvent("prefs:changed", { detail: { key: "learn:fw", value: e.target.value } }));
            }}
            className="w-full h-11 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary transition-all"
          >
            {FRAMEWORKS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        {/* Generate Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onGenerate}
          disabled={term.trim().length === 0 || loading}
          className="h-11 px-6 rounded-lg bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center gap-2 whitespace-nowrap"
        >
          <Zap className="h-4 w-4" />
          {loading ? "Génération..." : "Générer"}
        </motion.button>
      </div>

      {/* Options Row */}
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border/50 hover:bg-accent/50 transition-all cursor-pointer">
          <input
            type="checkbox"
            checked={autoUpdate}
            onChange={(e) => {
              setAutoUpdate(e.target.checked);
              localStorage.setItem("prefs:glossary:autoUpdate", e.target.checked ? "true" : "false");
            }}
            className="h-4 w-4 rounded"
          />
          <span className="text-sm font-medium flex items-center gap-1">
            <Settings2 className="h-3.5 w-3.5" />
            Auto-mise à jour
          </span>
        </label>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive font-medium"
        >
          ⚠️ {error}
        </motion.div>
      )}
    </motion.div>
  );
}
