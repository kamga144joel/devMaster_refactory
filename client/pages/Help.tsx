import React from 'react';

export default function HelpPage(){
  return (
    <div className="container mx-auto py-12 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Centre d'Aide DevMaster</h1>
        <p className="mt-4 text-lg text-muted-foreground">Bienvenue sur DevMaster — votre plateforme complète d'apprentissage du développement logiciel.</p>
      </div>

      <div className="grid gap-8">
        {/* Présentation */}
        <section className="bg-card rounded-lg p-6 border">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <span className="text-2xl">🚀</span> Qu'est-ce que DevMaster ?
          </h2>
          <p className="text-muted-foreground mb-4">DevMaster est une plateforme d'apprentissage moderne qui combine IA et pratique pour vous aider à maîtriser le développement.</p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-xl">🤖</span>
                <div>
                  <strong>Mentor IA Avancé</strong>
                  <p className="text-sm text-muted-foreground">Assistance personnalisée pour déboguer, expliquer et améliorer votre code</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl">📚</span>
                <div>
                  <strong>Glossaire Intelligent</strong>
                  <p className="text-sm text-muted-foreground">Définitions et exemples générés par IA selon votre contexte</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl">💻</span>
                <div>
                  <strong>Bac à Sable Multi-Langages</strong>
                  <p className="text-sm text-muted-foreground">40+ langages avec auto-complétion et terminal intégré</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-xl">🎯</span>
                <div>
                  <strong>Quiz & Exercices Dynamiques</strong>
                  <p className="text-sm text-muted-foreground">Génération automatique selon votre niveau et langage</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl">💬</span>
                <div>
                  <strong>Chat IA Multi-Fonctions</strong>
                  <p className="text-sm text-muted-foreground">Conversation, musique, images, recherche et export</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl">☁️</span>
                <div>
                  <strong>Sauvegarde Cloud</strong>
                  <p className="text-sm text-muted-foreground">Historique synchronisé via Supabase/Neon</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Guide Démarrage */}
        <section className="bg-card rounded-lg p-6 border">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <span className="text-2xl">🎮</span> Guide de Démarrage Rapide
          </h2>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-primary/5 border border-primary/20">
              <div className="text-3xl mb-2">1️⃣</div>
              <h3 className="font-semibold mb-2">Explorez</h3>
              <p className="text-sm text-muted-foreground">Commencez par le quiz de la page d'accueil pour évaluer votre niveau</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-primary/5 border border-primary/20">
              <div className="text-3xl mb-2">2️⃣</div>
              <h3 className="font-semibold mb-2">Pratiquez</h3>
              <p className="text-sm text-muted-foreground">Utilisez le bac à sable pour coder dans votre langage préféré</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-primary/5 border border-primary/20">
              <div className="text-3xl mb-2">3️⃣</div>
              <h3 className="font-semibold mb-2">Apprenez</h3>
              <p className="text-sm text-muted-foreground">Suivez les exercices générés par IA dans la page Pratiquer</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-primary/5 border border-primary/20">
              <div className="text-3xl mb-2">4️⃣</div>
              <h3 className="font-semibold mb-2">Progresssez</h3>
              <p className="text-sm text-muted-foreground">Suivez votre progression et débloquez de nouveaux défis</p>
            </div>
          </div>
        </section>

        {/* Fonctionnalités Détaillées */}
        <section className="bg-card rounded-lg p-6 border">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <span className="text-2xl">⚡</span> Fonctionnalités Avancées
          </h2>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <h3 className="font-semibold mb-2">🤖 Mentor IA Intégré</h3>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• Analyse de code avec suggestions d'amélioration</li>
                <li>• Débogage interactif avec explications</li>
                <li>• Génération d'exemples personnalisés</li>
                <li>• Support multi-langages et frameworks</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <h3 className="font-semibold mb-2">💻 Bac à Sable Professionnel</h3>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• 40+ langages (JavaScript, Python, Java, C++, Rust, Go, etc.)</li>
                <li>• Auto-complétion intelligente avec snippets</li>
                <li>• Terminal intégré avec suggestions</li>
                <li>• Preview HTML en temps réel</li>
                <li>• Chat IA pour assistance directe</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <h3 className="font-semibold mb-2">🎯 Quiz & Exercices Dynamiques</h3>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• Génération IA selon niveau et langage</li>
                <li>• Feedback instantané et corrections</li>
                <li>• Suivi de progression détaillé</li>
                <li>• Système de points et achievements</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <h3 className="font-semibold mb-2">💬 Chat IA Multi-Outils</h3>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• Conversation avec historique sauvegardé</li>
                <li>• Génération d'images et musique</li>
                <li>• Recherche web intégrée</li>
                <li>• Export PDF/DOCX des conversations</li>
                <li>• Support vocal et fichiers</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Langages Supportés */}
        <section className="bg-card rounded-lg p-6 border">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <span className="text-2xl">🌐</span> Langages Supportés
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <h3 className="font-semibold mb-2 text-primary">Frontend</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• JavaScript / TypeScript</li>
                <li>• HTML / CSS / SCSS</li>
                <li>• React (JSX/TSX)</li>
                <li>• Vue / Svelte</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-primary">Backend</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Python / Java / C#</li>
                <li>• C / C++ / Rust</li>
                <li>• Go / Ruby / PHP</li>
                <li>• Kotlin / Swift / Dart</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-primary">DevOps & Data</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Bash / PowerShell</li>
                <li>• Docker / YAML</li>
                <li>• SQL / NoSQL</li>
                <li>• JSON / Markdown</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Conseils par Niveau */}
        <section className="bg-card rounded-lg p-6 border">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <span className="text-2xl">📈</span> Conseils par Niveau
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
              <h3 className="font-semibold mb-2 text-green-800 dark:text-green-200">🌱 Débutant</h3>
              <ul className="text-sm space-y-1">
                <li>• Commencez par les quiz d'évaluation</li>
                <li>• Utilisez l'auto-complétion pour apprendre</li>
                <li>• Demandez à l'IA d'expliquer chaque concept</li>
                <li>• Pratiquez avec les exercices de base</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
              <h3 className="font-semibold mb-2 text-blue-800 dark:text-blue-200">🚀 Intermédiaire</h3>
              <ul className="text-sm space-y-1">
                <li>• Explorez les patterns avancés</li>
                <li>• Utilisez le terminal pour les workflows</li>
                <li>• Générez des exercices personnalisés</li>
                <li>• Contribuez au glossaire</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
              <h3 className="font-semibold mb-2 text-purple-800 dark:text-purple-200">👨‍💻 Expert</h3>
              <ul className="text-sm space-y-1">
                <li>• Créez des parcours d'apprentissage</li>
                <li>• Utilisez les APIs externes</li>
                <li>• Partagez vos connaissances</li>
                <li>• Explorez les langages exotiques</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Raccourcis */}
        <section className="bg-card rounded-lg p-6 border">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <span className="text-2xl">⌨️</span> Raccourcis et Astuces
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Bac à Sable</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <kbd>Ctrl</kbd> + <kbd>Space</kbd> : Auto-complétion</li>
                <li>• <kbd>Ctrl</kbd> + <kbd>Enter</kbd> : Exécuter le code</li>
                <li>• <kbd>F11</kbd> : Plein écran</li>
                <li>• <kbd>Ctrl</kbd> + <kbd>S</kbd> : Sauvegarder</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Navigation</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <kbd>/</kbd> : Recherche rapide</li>
                <li>• <kbd>Ctrl</kbd> + <kbd>K</kbd> : Changer de thème</li>
                <li>• <kbd>Ctrl</kbd> + <kbd>/</kbd> : Afficher l'aide</li>
                <li>• <kbd>Esc</kbd> : Fermer les modales</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Support Technique */}
        <section className="bg-card rounded-lg p-6 border">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <span className="text-2xl">🛠️</span> Support & Dépannage
          </h2>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <h3 className="font-semibold mb-2">Vérification Système</h3>
              <p className="text-sm text-muted-foreground mb-3">Vérifiez que tout fonctionne correctement :</p>
              <VerificationChecks />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Problèmes Communs</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>Code ne s'exécute pas</strong> : Vérifiez la syntaxe</li>
                  <li>• <strong>IA ne répond pas</strong> : Vérifiez la connexion</li>
                  <li>• <strong>Auto-complétion inactive</strong> : Activez dans les paramètres</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Contact & Support</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Chat intégré pour aide immédiate</li>
                  <li>• Page de contact pour feedback</li>
                  <li>• Documentation technique en ligne</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function VerificationChecks(){
  const [status, setStatus] = React.useState<Record<string,string>>({});
  React.useEffect(()=>{
    (async ()=>{
      const next: Record<string,string> = {};
      try{ const l = await fetch('/logo.svg'); next.logo = l.ok ? 'ok' : 'missing'; }catch(e){ next.logo = 'error'; }
      try{ const f = await fetch('/favicon.svg'); next.favicon = f.ok ? 'ok' : 'missing'; }catch(e){ next.favicon = 'error'; }
      try{ const sw = ('serviceWorker' in navigator) && !!navigator.serviceWorker.controller; next.serviceWorker = sw ? 'registered' : 'not-registered'; }catch(e){ next.serviceWorker = 'unknown'; }
      try{ const s = localStorage.getItem('learn:lang'); next.prefLang = s ? s : 'unset'; }catch(e){ next.prefLang = 'error'; }
      try{
        const r = await fetch('/api/save', { method: 'OPTIONS' });
        next.apiSave = r.ok ? 'ok' : 'no-response';
      }catch(e){ next.apiSave = 'error'; }
      setStatus(next);
    })();
  },[]);

  return (
    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
      {Object.entries(status).map(([k,v])=> (
        <div key={k} className={`p-2 rounded border ${v==='ok' || v==='registered' ? 'bg-green-50 border-green-200 text-green-800' : v==='unset' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          <strong className="capitalize">{k.replace(/([A-Z])/g,' $1')}</strong>: {String(v)}
        </div>
      ))}
      {Object.keys(status).length===0 && <div className="text-sm text-muted-foreground">Vérification en cours…</div>}
    </div>
  );
}
