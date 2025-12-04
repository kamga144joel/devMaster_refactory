import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Copy, Search, Code2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Concept {
  key: string;
  title: string;
  desc: string;
  code: string;
}

const GLOSSARY: Concept[] = [
  {
    key: "variables",
    title: "Variables",
    desc: "Un nom qui stocke une valeur. On l'utilise pour réutiliser des données.",
    code: "const message = 'Bonjour';\nconsole.log(message);",
  },
  {
    key: "conditions",
    title: "Conditions",
    desc: "Exécuter du code seulement si une condition est vraie.",
    code: "const age = 18;\nif (age >= 18) {\n  console.log('Majeur');\n} else {\n  console.log('Mineur');\n}",
  },
  {
    key: "boucles",
    title: "Boucles",
    desc: "Répéter une action plusieurs fois.",
    code: "for (let i = 1; i <= 3; i++) {\n  console.log(i);\n}",
  },
  {
    key: "fonctions",
    title: "Fonctions",
    desc: "Un bloc de code réutilisable qui effectue une tâche.",
    code: "function carre(x) {\n  return x * x;\n}\nconsole.log(carre(4)); // 16",
  },
  {
    key: "tableaux",
    title: "Tableaux",
    desc: "Une liste ordonnée de valeurs.",
    code: "const fruits = ['pomme', 'banane'];\nconsole.log(fruits.length);",
  },
  {
    key: "objets",
    title: "Objets",
    desc: "Un ensemble de paires clé/valeur pour structurer des données.",
    code: "const user = { nom: 'Lina', age: 20 };\nconsole.log(user.nom);",
  },
];

function useFilteredGlossary(query: string) {
  return useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return GLOSSARY.slice(0, 6);
    return GLOSSARY.filter(
      (c) => c.title.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q)
    );
  }, [query]);
}

export default function GlossarySection() {
  const [query, setQuery] = useState("");
  const filtered = useFilteredGlossary(query);
  const { toast } = useToast();

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copié !", description: "Code copié dans le presse-papiers" });
    } catch {
      toast({ title: "Erreur", description: "Impossible de copier", variant: "destructive" });
    }
  };

  return (
    <section id="glossaire" className="container mx-auto py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
      >
        <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="flex-1">
            <h2 className="text-4xl font-bold tracking-tight mb-3">Glossaire interactif</h2>
            <p className="text-lg text-muted-foreground">
              Tape un mot-clé et découvre une explication détaillée avec des exemples pratiques.
            </p>
          </div>

          <div className="w-full md:w-80">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Variables, fonctions, boucles..."
                className="w-full h-12 rounded-lg border bg-background pl-10 pr-4 outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-muted-foreground mb-2">Aucun concept ne correspond à ta recherche.</p>
            <p className="text-sm text-muted-foreground">Essaie d'autres mots-clés.</p>
          </motion.div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="initial"
            animate="animate"
            variants={{
              animate: { transition: { staggerChildren: 0.05 } },
            }}
          >
            {filtered.map((c) => (
              <motion.div
                key={c.key}
                variants={{
                  initial: { opacity: 0, y: 20 },
                  animate: { opacity: 1, y: 0 },
                }}
                className="group rounded-xl border border-border/50 bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-300 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                      <Code2 className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">{c.title}</h3>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{c.desc}</p>

                  <div className="rounded-lg bg-secondary/50 p-3 mb-4 font-mono text-xs overflow-x-auto">
                    <pre className="text-foreground/80 leading-relaxed whitespace-pre-wrap break-words">
                      <code>{c.code}</code>
                    </pre>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => copy(c.code)}
                    className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 text-sm font-medium transition-all"
                  >
                    <Copy className="h-4 w-4" />
                    Copier l'exemple
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </section>
  );
}
