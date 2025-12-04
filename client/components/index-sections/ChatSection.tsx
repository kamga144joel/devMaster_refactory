import { Link } from "react-router-dom";
import { ArrowRight, MessageSquare, Music, Image, Search, FileText, Mic, Paperclip, Bot } from "lucide-react";
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

export default function ChatSection() {
  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <motion.div
        className="container mx-auto"
        initial="initial"
        animate="animate"
        variants={containerVariants}
      >
        <motion.div className="text-center max-w-3xl mx-auto mb-12" variants={itemVariants}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 mb-4">
            <MessageSquare className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Chat IA Multi-Outils</span>
          </div>

          <h2 className="text-3xl md:text-5xl font-bold leading-tight mb-4">
            Discutez, Créez, Explorez
          </h2>

          <p className="text-lg text-muted-foreground">
            Notre chat IA ne se contente pas de répondre. Il génère de la musique, crée des images, 
            recherche sur le web et exporte vos conversations. Tout cela dans une interface moderne.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12" variants={itemVariants}>
          <div className="bg-card rounded-lg p-6 border hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Conversation Intelligente</h3>
            <p className="text-muted-foreground mb-4">
              Discutez avec l'IA sur n'importe quel sujet. Historique sauvegardé et conversations organisées.
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Plusieurs providers (OpenAI, Gemini, etc.)</li>
              <li>• Support vocal et fichiers</li>
              <li>• Export des conversations</li>
            </ul>
          </div>

          <div className="bg-card rounded-lg p-6 border hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-4">
              <Music className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Génération Musicale</h3>
            <p className="text-muted-foreground mb-4">
              Créez des musiques originales avec l'IA. Choisissez le style, l'humeur et la durée.
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Multiple genres disponibles</li>
              <li>• Personnalisation avancée</li>
              <li>• Téléchargement instantané</li>
            </ul>
          </div>

          <div className="bg-card rounded-lg p-6 border hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-4">
              <Image className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Création d'Images</h3>
            <p className="text-muted-foreground mb-4">
              Générez des images uniques avec des descriptions textuelles. Art, photos, illustrations.
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Multiple styles artistiques</li>
              <li>• Haute résolution</li>
              <li>• Variations illimitées</li>
            </ul>
          </div>

          <div className="bg-card rounded-lg p-6 border hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mb-4">
              <Search className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Recherche Web</h3>
            <p className="text-muted-foreground mb-4">
              Accédez à des informations en temps réel. Wikipedia, DuckDuckGo, et autres APIs.
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Sources multiples</li>
              <li>• Informations actualisées</li>
              <li>• Résumés intelligents</li>
            </ul>
          </div>

          <div className="bg-card rounded-lg p-6 border hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center mb-4">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Export Documents</h3>
            <p className="text-muted-foreground mb-4">
              Exportez vos conversations en PDF, DOCX ou JSON. Professionnel et organisé.
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Multiple formats</li>
              <li>• Mise en forme propre</li>
              <li>• Partage facile</li>
            </ul>
          </div>

          <div className="bg-card rounded-lg p-6 border hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center mb-4">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">API Publiques</h3>
            <p className="text-muted-foreground mb-4">
              Accès à des APIs externes pour enrichir les conversations. Images, conseils, activités.
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• DuckDuckGo Search</li>
              <li>• Wikipedia API</li>
              <li>• Et bien plus...</li>
            </ul>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div className="text-center" variants={itemVariants}>
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-8 border border-primary/20">
            <h3 className="text-2xl font-bold mb-4">Prêt à explorer ?</h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Rejoignez des milliers de développeurs qui utilisent notre chat IA pour apprendre, 
              créer et collaborer. Commencez votre conversation maintenant.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/chat"
                className="inline-flex h-12 px-8 items-center justify-center rounded-lg bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:shadow-lg hover:scale-105 transition-all duration-300 font-medium group"
              >
                <MessageSquare className="mr-2 h-5 w-5" />
                Lancer le Chat
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/help"
                className="inline-flex h-12 px-8 items-center justify-center rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 transition-all duration-300 font-medium"
              >
                En savoir plus
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Stats Section */}
        <motion.div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8" variants={itemVariants}>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">40+</div>
            <div className="text-sm text-muted-foreground">Langages supportés</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">5</div>
            <div className="text-sm text-muted-foreground">Outils intégrés</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">24/7</div>
            <div className="text-sm text-muted-foreground">Disponibilité</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">∞</div>
            <div className="text-sm text-muted-foreground">Possibilités</div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
