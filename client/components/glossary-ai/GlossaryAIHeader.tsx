import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export default function GlossaryAIHeader() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight">Glossaire IA</h2>
      </div>
      <p className="text-lg text-muted-foreground max-w-2xl">
        Générez des définitions et exemples de code adaptés à votre langage et framework préféré.
      </p>
    </motion.div>
  );
}
