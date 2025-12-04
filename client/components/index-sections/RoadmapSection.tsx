import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Code2, Zap, Rocket } from "lucide-react";

const STEPS = [
  {
    num: 1,
    title: "Bases",
    desc: "Variables, types, conditions",
    icon: BookOpen,
    color: "from-blue-500/10 to-blue-500/5",
    borderColor: "border-blue-500/30",
  },
  {
    num: 2,
    title: "Logique",
    desc: "Boucles, fonctions, tableaux",
    icon: Zap,
    color: "from-purple-500/10 to-purple-500/5",
    borderColor: "border-purple-500/30",
  },
  {
    num: 3,
    title: "Web",
    desc: "DOM, événements, fetch",
    icon: Code2,
    color: "from-cyan-500/10 to-cyan-500/5",
    borderColor: "border-cyan-500/30",
  },
  {
    num: 4,
    title: "Projets",
    desc: "Construis de petites apps",
    icon: Rocket,
    color: "from-green-500/10 to-green-500/5",
    borderColor: "border-green-500/30",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export default function RoadmapSection() {
  return (
    <section className="container mx-auto pb-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
      >
        <div className="mb-12">
          <h2 className="text-3xl font-bold tracking-tight mb-3">Feuille de route suggérée</h2>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Progresse à ton rythme à travers ces étapes essentielles de l'apprentissage.
          </p>
        </div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.num}
                variants={itemVariants}
                className={`relative rounded-xl border ${step.borderColor} bg-gradient-to-br ${step.color} p-6 group hover:shadow-lg hover:scale-105 transition-all duration-300`}
              >
                {/* Step number badge */}
                <div className="absolute -top-3 -left-3 h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-lg">
                  {step.num}
                </div>

                {/* Icon */}
                <div className="mb-4">
                  <div className="h-12 w-12 rounded-lg bg-background/50 flex items-center justify-center group-hover:bg-background transition-colors">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{step.desc}</p>

                {/* Progress indicator */}
                {idx < STEPS.length - 1 && (
                  <div className="hidden lg:flex absolute -right-2.5 top-1/2 -translate-y-1/2 z-10">
                    <ArrowRight className="h-5 w-5 text-primary/50" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 10 }}
          transition={{ delay: 0.3 }}
          viewport={{ once: true }}
          className="mt-10 flex justify-center"
        >
          <Link
            to="/practice"
            className="inline-flex h-12 px-8 items-center justify-center rounded-lg bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:shadow-lg hover:scale-105 transition-all duration-300 font-medium group"
          >
            Commencer la feuille de route
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
