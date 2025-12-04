import { Link, NavLink as RouterNavLink } from "react-router-dom";
import { ReactNode, useEffect, useState } from "react";
import ThemePanel from "@/components/ThemePanel";
import InstallPWA from "@/components/InstallPWA";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "./ui/button";
import { Menu, Palette, Settings as SettingsIcon, ChevronDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function NavLink({ to, children }: { to: string; children: ReactNode }) {
    return (
      <RouterNavLink
        to={to}
        className={({ isActive }) =>
          `relative group px-5 py-2.5 text-sm font-semibold transition-all duration-300 rounded-lg ${
            isActive
              ? "bg-primary/10 text-primary shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
          }`
        }
      >
        {({ isActive }) => (
          <>
            <span className="flex items-center space-x-2">{children}</span>
            {isActive && (
              <span className="absolute -bottom-px left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
            )}
          </>
        )}
      </RouterNavLink>
    );
  }

export default function Header({ online, showSettings, setShowSettings }: { online: boolean, showSettings: boolean, setShowSettings: (show: boolean) => void }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'border-b border-border/40 bg-background/95 backdrop-blur-lg shadow-sm' 
          : 'bg-background/90 backdrop-blur-md'
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img
              src="/logo.svg"
              alt="DevMaster"
              className="h-12 w-12 rounded-md shadow-sm sm:hidden"
            />
            <img
              src="/logo-horizontal.svg"
              alt="DevMaster logo"
              className="hidden sm:inline-block h-12"
              style={{ height: 48 }}
            />
          </Link>
          <div className="hidden sm:flex items-center gap-2">
            <div
              className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border ${online ? "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400" : "border-yellow-500/30 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"}`}
            >
              <span className={`w-2 h-2 rounded-full ${online ? "bg-green-500" : "bg-yellow-500"}`}></span>
              {online ? "En ligne" : "Hors‑ligne"}
            </div>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                    <InstallPWA as="icon" />
                    </TooltipTrigger>
                    <TooltipContent>
                    <p>Installer l'application</p>
                    </TooltipContent>
                </Tooltip>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Palette />
                            <span className="sr-only">Changer le thème</span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto">
                        <ThemePanel />
                    </PopoverContent>
                </Popover>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)}>
                            <SettingsIcon />
                            <span className="sr-only">Paramètres</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Paramètres</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <nav className="flex items-center gap-1">
              <NavLink to="/">Accueil</NavLink>
              <NavLink to="/practice">Pratiquer</NavLink>
              <NavLink to="/chat">Chat</NavLink>
              <NavLink to="/mentor">Mentor IA</NavLink>
              <NavLink to="/glossary-ai">Glossaire IA</NavLink>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="px-3 py-2 text-sm font-semibold rounded-lg hover:bg-accent/50">
                    Ressources <ChevronDown className="h-4 w-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48" align="end">
                  <DropdownMenuItem asChild>
                    <Link to="/admin" className="flex items-center gap-2">
                      ⚙️ Admin
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/#glossaire" className="flex items-center gap-2">
                      📚 Glossaire
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/contact" className="flex items-center gap-2">
                      📧 Contact
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/help" className="flex items-center gap-2">
                      ❓ Aide
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>
          </div>
          <div className="sm:hidden flex items-center gap-2">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-3/4 flex flex-col">
                <div className="flex flex-col gap-4 py-4">
                  <Link to="/" className="flex items-center space-x-2 px-4">
                    <img
                      src="/logo.svg"
                      alt="DevMaster"
                      className="h-9 w-9 rounded-md shadow-sm"
                    />
                    <span className="text-xl font-bold tracking-tight">
                      DevMaster
                    </span>
                  </Link>
                  <nav className="flex flex-col gap-1 mt-6 px-4">
                    <NavLink to="/">Accueil</NavLink>
                    <NavLink to="/practice">Pratiquer</NavLink>
                    <NavLink to="/chat">Chat</NavLink>
                    <NavLink to="/mentor">Mentor IA</NavLink>
                    <NavLink to="/glossary-ai">Glossaire IA</NavLink>
                    <div className="pt-2 mt-2 border-t border-border">
                      <NavLink to="/admin">⚙️ Admin</NavLink>
                      <NavLink to="/#glossaire">📚 Glossaire</NavLink>
                      <NavLink to="/contact">📧 Contact</NavLink>
                      <NavLink to="/help">❓ Aide</NavLink>
                    </div>
                  </nav>
                </div>
                <div className="mt-auto flex flex-col gap-4 p-4 border-t">
                  <ThemePanel />
                  <InstallPWA />
                  <Button variant="outline" onClick={() => setShowSettings(true)}>
                    <SettingsIcon className="mr-2 h-4 w-4" />
                    Paramètres
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
