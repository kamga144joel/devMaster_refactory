import { ChatProvider } from "@shared/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, Settings2, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

interface ChatControlsProps {
  provider: ChatProvider;
  setProvider: (provider: ChatProvider) => void;
  model: string;
  setModel: (model: string) => void;
  systemPrompt: string;
  setSystemPrompt: (prompt: string) => void;
  useEmojis: boolean;
  setUseEmojis: (use: boolean) => void;
  selectedPublicApi: string;
  setSelectedPublicApi: (api: string) => void;
  onClear: () => void;
  loading: boolean;
}

const PROVIDERS: { value: ChatProvider; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "openai", label: "OpenAI" },
  { value: "gemini", label: "Gemini" },
  { value: "huggingface", label: "Hugging Face" },
  { value: "deepai", label: "DeepAI" },
];

const PUBLIC_APIS = [
  { value: "none", label: "Aucune" },
  { value: "duckduckgo", label: "DuckDuckGo (Recherche)" },
  { value: "wikipedia", label: "Wikipedia (Résumé)" },
  { value: "advice", label: "Conseil Aléatoire" },
  { value: "bored", label: "Activité Aléatoire" },
  { value: "dog", label: "Images de Chiens" },
  { value: "picsum", label: "Photos Aléatoires" },
];

export default function ChatControls({
  provider,
  setProvider,
  model,
  setModel,
  systemPrompt,
  setSystemPrompt,
  useEmojis,
  setUseEmojis,
  selectedPublicApi,
  setSelectedPublicApi,
  onClear,
  loading,
}: ChatControlsProps) {
  const modelPlaceholder =
    provider === "gemini"
      ? "gemini-1.5-flash"
      : provider === "openai"
        ? "gpt-4o-mini"
        : provider === "huggingface"
          ? "tiiuae/falcon-7b-instruct"
          : "Modèle (optionnel)";

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 bg-gradient-to-b from-card/50 to-transparent p-4 rounded-lg border border-border/50"
    >
      {/* Top Row: Provider & Model Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-2 block">Fournisseur IA</label>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value as ChatProvider)}
            className="w-full h-10 px-3 rounded-lg border bg-background text-sm outline-none focus:ring-2 focus:ring-primary transition-all"
          >
            {PROVIDERS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-2 block">Modèle</label>
          <input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder={modelPlaceholder}
            className="w-full h-10 px-3 rounded-lg border bg-background text-sm outline-none focus:ring-2 focus:ring-primary transition-all"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-2 block">API Publique</label>
          <select
            value={selectedPublicApi}
            onChange={(e) => setSelectedPublicApi(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border bg-background text-sm outline-none focus:ring-2 focus:ring-primary transition-all"
          >
            {PUBLIC_APIS.map((api) => (
              <option key={api.value} value={api.value}>
                {api.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Second Row: System Prompt & Options */}
      <div className="grid grid-cols-1 gap-3">
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-2 block">Instruction Système</label>
          <input
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="Ex: Tu es un expert en JavaScript..."
            className="w-full h-10 px-3 rounded-lg border bg-background text-sm outline-none focus:ring-2 focus:ring-primary transition-all"
          />
        </div>
      </div>

      {/* Third Row: Toggles & Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border/50 hover:bg-accent/50 transition-all cursor-pointer">
          <input
            type="checkbox"
            checked={useEmojis}
            onChange={(e) => setUseEmojis(e.target.checked)}
            className="h-4 w-4 rounded"
          />
          <span className="text-sm font-medium">Émojis</span>
        </label>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Settings2 className="h-4 w-4" />
              Plus
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onClear} className="text-destructive focus:text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Nouvelle Conversation
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}
