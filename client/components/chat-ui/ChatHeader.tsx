import { motion } from "framer-motion";
import { MessageCircle, Zap } from "lucide-react";

export default function ChatHeader() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3 mb-6"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <MessageCircle className="h-5 w-5 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          Chat General
          <Zap className="h-6 w-6 text-primary" />
        </h1>
      </div>
      <p className="text-lg text-muted-foreground max-w-2xl">
        Posez vos questions, explorez des idées, pratiquez la rédaction, et recherchez des réponses. Supporté par de puissants modèles IA.
      </p>
    </motion.div>
  );
}
