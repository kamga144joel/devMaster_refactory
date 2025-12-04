import { motion } from "framer-motion";
import { Settings2, Zap } from "lucide-react";

interface QuizControlsProps {
  topic: string;
  setTopic: (topic: string) => void;
  level: number;
  setLevel: (level: number) => void;
  translate: boolean;
  setTranslate: (translate: boolean) => void;
  autoUpdate: boolean;
  setAutoUpdate: (auto: boolean) => void;
  loading: boolean;
  onGenerate: () => void;
}

export default function QuizControls({
  topic,
  setTopic,
  level,
  setLevel,
  translate,
  setTranslate,
  autoUpdate,
  setAutoUpdate,
  loading,
  onGenerate,
}: QuizControlsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border/50 bg-card/50 p-6 space-y-4"
    >
      {/* Main Controls Row */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-end">
        <div className="flex-1">
          <label className="text-xs font-semibold text-muted-foreground mb-2 block">Sujet (ex: fonctions, boucles)</label>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Entrez un sujet…"
            className="w-full h-11 rounded-lg border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-primary transition-all"
          />
        </div>

        <div className="w-full lg:w-32">
          <label className="text-xs font-semibold text-muted-foreground mb-2 block">Niveau</label>
          <select
            value={level}
            onChange={(e) => setLevel(Number(e.target.value))}
            className="w-full h-11 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary transition-all"
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                Niveau {n}
              </option>
            ))}
          </select>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onGenerate}
          disabled={loading}
          className="h-11 px-6 rounded-lg bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center gap-2 whitespace-nowrap"
        >
          <Zap className="h-4 w-4" />
          {loading ? "Génération…" : "Générer"}
        </motion.button>
      </div>

      {/* Options Row */}
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border/50 hover:bg-accent/50 transition-all cursor-pointer">
          <input
            type="checkbox"
            checked={translate}
            onChange={(e) => {
              setTranslate(e.target.checked);
              localStorage.setItem("quiz:translate", e.target.checked ? "true" : "false");
            }}
            className="h-4 w-4 rounded"
          />
          <span className="text-sm font-medium">Traduire en français</span>
        </label>

        <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border/50 hover:bg-accent/50 transition-all cursor-pointer">
          <input
            type="checkbox"
            checked={autoUpdate}
            onChange={(e) => {
              setAutoUpdate(e.target.checked);
              localStorage.setItem("prefs:quiz:autoUpdate", e.target.checked ? "true" : "false");
              window.dispatchEvent(new CustomEvent("prefs:changed", { detail: { key: "prefs:quiz:autoUpdate" } }));
            }}
            className="h-4 w-4 rounded"
          />
          <span className="text-sm font-medium flex items-center gap-1">
            <Settings2 className="h-3.5 w-3.5" />
            Auto-mise à jour
          </span>
        </label>
      </div>
    </motion.div>
  );
}
