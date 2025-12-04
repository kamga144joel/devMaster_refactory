import { ReactNode, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import SettingsPanel from "@/components/SettingsPanel";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
import EmailGate from "@/components/EmailGate";
import Header from "@/components/Header";
import Breadcrumb from "@/components/Breadcrumb";



const pageVariants = {
  initial: {
    opacity: 0,
    y: 20
  },
  in: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  },
  out: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.2,
      ease: "easeIn"
    }
  }
};

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [online, setOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [showSettings, setShowSettings] = useState(false);
  
  const [emailVerified, setEmailVerified] = useState<boolean>(
    () => !!localStorage.getItem("devmaster:email_verified")
  );
  
  

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    
    // Restaurer le thème
    const savedDark = localStorage.getItem("theme:dark");
    if (savedDark === "1") {
      document.documentElement.classList.add("dark");
    } else if (savedDark === "0") {
      document.documentElement.classList.remove("dark");
    }
    
    // Vérifier les préférences système pour le thème
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };
    
    // Si l'utilisateur n'a pas de préférence enregistrée, suivre les préférences système
    if (savedDark === null) {
      if (prefersDark.matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      prefersDark.addEventListener('change', handleSystemThemeChange);
    }
    
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
      prefersDark.removeEventListener('change', handleSystemThemeChange);
    };
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  // Synchronisation de l'état de vérification avec le localStorage
  useEffect(() => {
    const checkEmailVerification = () => {
      const isVerified = localStorage.getItem("devmaster:email_verified") === "1";
      setEmailVerified(isVerified);
    };
    
    // Vérifier immédiatement
    checkEmailVerification();
    
    // Écouter les changements de localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "devmaster:email_verified") {
        checkEmailVerification();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header online={online} showSettings={showSettings} setShowSettings={setShowSettings} />
      <main className="flex-1 page-container">
        <div className="container mx-auto">
          <Breadcrumb />
        </div>
        <TooltipProvider>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              style={{
                // Désactiver l'interaction si l'email n'est pas vérifié
                pointerEvents: emailVerified ? 'auto' : 'none',
                opacity: emailVerified ? 1 : 0.7,
                transition: 'opacity 0.3s ease',
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div className="flex-1">
                {children}
              </div>
            </motion.div>
          </AnimatePresence>
          <Toaster />
          <Sonner position="top-center" richColors />
        </TooltipProvider>
        
        {/* EmailGate en mode modal */}
        {!emailVerified && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <EmailGate 
              open={!emailVerified}
              onSuccess={() => setEmailVerified(true)}
            />
          </div>
        )}
      </main>
      <footer className="border-t">
        <div className="container mx-auto py-8 text-sm text-muted-foreground">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <h4 className="font-semibold">About DevMaster</h4>
              <p className="mt-2 text-sm">
                Plateforme d'apprentissage, d'entraînement et d'assistance IA
                pour développeurs de tous niveaux. Exemples interactifs, mentor
                IA, bac à sable et parcours pédagogiques.
              </p>
              <div className="mt-3 text-xs">
                Powered by <span className="font-medium">Joël kamga</span>{" "}
                (kaiser)
              </div>
            </div>

            <div>
              <h4 className="font-semibold">Explore</h4>
              <ul className="mt-2 space-y-2">
                <li>
                  <a href="/" className="hover:text-foreground">
                    Accueil
                  </a>
                </li>
                <li>
                  <a href="/practice" className="hover:text-foreground">
                    Pratiquer
                  </a>
                </li>
                <li>
                  <a href="#glossaire" className="hover:text-foreground">
                    Glossaire
                  </a>
                </li>
                <li>
                  <a href="/chat" className="hover:text-foreground">
                    Chat
                  </a>
                </li>
                <li>
                  <a href="/help" className="hover:text-foreground">
                    Guide & Aide
                  </a>
                </li>
                <li>
                  <a href="/contact" className="hover:text-foreground">
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold">Resources</h4>
              <ul className="mt-2 space-y-2">
                <li>
                  <a
                    href="https://developer.mozilla.org/"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-foreground"
                  >
                    MDN Web Docs
                  </a>
                </li>
                <li>
                  <a
                    href="https://javascript.info/"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-foreground"
                  >
                    JavaScript Info
                  </a>
                </li>
                <li>
                  <a
                    href="https://roadmap.sh"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-foreground"
                  >
                    Roadmaps
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.freepublicapis.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-foreground"
                  >
                    Public APIs
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold">Integrations & Tools</h4>
              <ul className="mt-2 space-y-2">
                <li>
                  <button
                    onClick={() =>
                      window.dispatchEvent(
                        new CustomEvent("open:mcp", {
                          detail: { name: "Neon" },
                        }),
                      )
                    }
                    className="hover:text-foreground"
                  >
                    Connect Neon
                  </button>
                </li>
                <li>
                  <button
                    onClick={() =>
                      window.dispatchEvent(
                        new CustomEvent("open:mcp", {
                          detail: { name: "Supabase" },
                        }),
                      )
                    }
                    className="hover:text-foreground"
                  >
                    Connect Supabase
                  </button>
                </li>
                <li>
                  <button
                    onClick={() =>
                      window.dispatchEvent(
                        new CustomEvent("open:mcp", {
                          detail: { name: "Sentry" },
                        }),
                      )
                    }
                    className="hover:text-foreground"
                  >
                    Connect Sentry
                  </button>
                </li>
                <li>
                  <button
                    onClick={() =>
                      window.dispatchEvent(
                        new CustomEvent("open:mcp", {
                          detail: { name: "Netlify" },
                        }),
                      )
                    }
                    className="hover:text-foreground"
                  >
                    Connect Netlify
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-6 border-t pt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} DevMaster — All rights reserved.
            </div>
            <div className="flex items-center gap-4 text-xs">
              <a href="/privacy" className="hover:text-foreground">
                Privacy
              </a>
              <a href="/terms" className="hover:text-foreground">
                Terms
              </a>
              <a href="/settings" className="hover:text-foreground">
                Settings
              </a>
            </div>
          </div>
        </div>
      </footer>
      <SettingsPanel
        open={showSettings}
        onClose={() => setShowSettings(false)}
        onSuccess={() => setEmailVerified(true)}
      />
      <Toaster />
    </div>
  );
}
