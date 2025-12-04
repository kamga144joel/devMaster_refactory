import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-12 px-4">
      {/* Animated background blobs */}
      <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl animate-pulse" />
      <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />

      <motion.div
        className="text-center space-y-6 relative z-10 max-w-lg"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Large 404 Text */}
        <motion.div variants={itemVariants} className="relative">
          <h1 className="text-7xl md:text-8xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60 tracking-tighter">
            404
          </h1>
          <p className="text-sm uppercase tracking-widest text-muted-foreground mt-2">Page non trouvée</p>
        </motion.div>

        {/* Message */}
        <motion.div variants={itemVariants} className="space-y-4">
          <h2 className="text-2xl md:text-3xl font-semibold">Oups, cette page n'existe pas !</h2>
          <p className="text-muted-foreground max-w-sm mx-auto leading-relaxed">
            Il semble que tu cherches une page qui n'existe pas. Ne t'inquiète pas, tu peux retourner à l'accueil ou explorer nos ressources.
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-3 justify-center pt-4"
        >
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:shadow-lg hover:scale-105 transition-all duration-300 font-medium group"
          >
            <Home className="h-5 w-5" />
            Retourner à l'accueil
            <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
          </Link>

          <a
            href="https://www.google.com/search?q=devmaster"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-primary/30 hover:bg-primary/5 hover:border-primary/50 transition-all duration-300 font-medium"
          >
            <Search className="h-5 w-5" />
            Chercher de l'aide
          </a>
        </motion.div>

        {/* Quick Links */}
        <motion.div variants={itemVariants} className="pt-6 border-t border-border/50">
          <p className="text-sm text-muted-foreground mb-4">Pages populaires :</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              { label: "Pratiquer", href: "/practice" },
              { label: "Chat", href: "/chat" },
              { label: "Aide", href: "/help" },
              { label: "Contact", href: "/contact" },
            ].map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-sm px-3 py-1.5 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
