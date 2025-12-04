import { motion } from "framer-motion";
import { Brain, TrendingUp } from "lucide-react";

export default function QuizHeader() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Brain className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          Quiz
          <TrendingUp className="h-6 w-6 text-primary" />
        </h2>
      </div>
      <p className="text-lg text-muted-foreground max-w-2xl">
        Testez vos connaissances avec des questions progressives adaptées à votre niveau.
      </p>
    </motion.div>
  );
}
