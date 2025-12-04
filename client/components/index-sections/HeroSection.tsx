import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Code, Zap, Bot, Globe } from "lucide-react";
import { motion } from "framer-motion";

const containerVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { staggerChildren: 0.2, delayChildren: 0.1 },
  },
};

const itemVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-violet-600/15 via-indigo-600/10 to-sky-500/10" />
      <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />

      <motion.div
        className="container mx-auto py-16 md:py-28"
        initial="initial"
        animate="animate"
        variants={containerVariants}
      >
        <motion.div className="max-w-3xl" variants={itemVariants}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 mb-4">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Prêt à maîtriser le code?</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold leading-tight tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground">
            Maîtrisez le code avec l'IA.
          </h1>

          <p className="mt-6 text-lg text-muted-foreground max-w-2xl leading-relaxed">
            DevMaster combine IA et pratique pour vous aider à maîtriser 40+ langages. Éditeur de code professionnel, quiz dynamiques, mentor IA et chat multi-outils.
          </p>

          <motion.div className="mt-8 flex flex-col sm:flex-row gap-4" variants={itemVariants}>
            <Link
              to="/practice"
              className="inline-flex h-12 px-8 items-center justify-center rounded-lg bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:shadow-lg hover:scale-105 transition-all duration-300 font-medium group"
            >
              Commencer maintenant
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/chat"
              className="inline-flex h-12 px-8 items-center justify-center rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 transition-all duration-300 font-medium"
            >
              Essayer le Chat IA
            </Link>
          </motion.div>

          {/* Features Grid */}
          <motion.div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" variants={itemVariants}>
            <div className="text-center p-6 rounded-lg bg-card border hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-primary/10 flex items-center justify-center">
                <Code className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Éditeur de Code</h3>
              <p className="text-sm text-muted-foreground">Bac à sable avec 40+ langages et auto-complétion</p>
            </div>
            <div className="text-center p-6 rounded-lg bg-card border hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Mentor IA</h3>
              <p className="text-sm text-muted-foreground">Assistance personnalisée</p>
            </div>
            <div className="text-center p-6 rounded-lg bg-card border hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-primary/10 flex items-center justify-center">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Quiz Dynamiques</h3>
              <p className="text-sm text-muted-foreground">Générés par IA selon votre niveau</p>
            </div>
            <div className="text-center p-6 rounded-lg bg-card border hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-primary/10 flex items-center justify-center">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Chat Multi-Outils</h3>
              <p className="text-sm text-muted-foreground">Musique, images, recherche</p>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
