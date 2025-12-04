import { Link } from "react-router-dom";

export default function Footer() {
  return (
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
  );
}
