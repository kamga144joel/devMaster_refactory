import Mentor from "@/components/Mentor";
import { motion } from "framer-motion";
import { Lightbulb } from "lucide-react";

export default function MentorSection() {
  return (
    <section className="container mx-auto py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
      >
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Lightbulb className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight">Besoin d'aide ?</h2>
          </div>
          <p className="text-lg text-muted-foreground mt-2 max-w-2xl">
            Ton mentor IA explique et corrige ton code pas à pas, avec des exemples pratiques et des conseils personnalisés.
          </p>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card/50 p-8">
          <Mentor />
        </div>
      </motion.div>
    </section>
  );
}
