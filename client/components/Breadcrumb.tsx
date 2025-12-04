import { useLocation, Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { motion } from "framer-motion";

const ROUTE_LABELS: Record<string, string> = {
  "/": "Accueil",
  "/practice": "Pratiquer",
  "/chat": "Chat",
  "/admin": "Admin",
  "/help": "Aide",
  "/settings": "Paramètres",
  "/contact": "Contact",
};

export default function Breadcrumb() {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  // Don't show breadcrumb on home page
  if (pathnames.length === 0) return null;

  const breadcrumbs = [
    { label: "Accueil", path: "/" },
    ...pathnames.map((pathname, index) => {
      const routePath = "/" + pathnames.slice(0, index + 1).join("/");
      const label = ROUTE_LABELS[routePath] || pathname;
      return { label, path: routePath };
    }),
  ];

  return (
    <motion.nav
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className="hidden sm:flex items-center gap-2 px-4 py-3 mb-4 rounded-lg border border-border/50 bg-card/50 text-sm"
      aria-label="Breadcrumb"
    >
      {breadcrumbs.map((crumb, index) => (
        <motion.div
          key={crumb.path}
          className="flex items-center gap-2"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          {index === 0 ? (
            <Link
              to={crumb.path}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Home className="h-4 w-4" />
              <span>{crumb.label}</span>
            </Link>
          ) : (
            <>
              <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
              {index === breadcrumbs.length - 1 ? (
                <span className="text-foreground font-medium">{crumb.label}</span>
              ) : (
                <Link
                  to={crumb.path}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {crumb.label}
                </Link>
              )}
            </>
          )}
        </motion.div>
      ))}
    </motion.nav>
  );
}
