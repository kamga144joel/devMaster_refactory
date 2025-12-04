import { useEffect, useRef, useState, forwardRef } from "react";
import { Button } from "./ui/button";
import { Download } from "lucide-react";

export default forwardRef<HTMLButtonElement, { as?: "button" | "icon" }>(function InstallPWA({ as = "button" }, ref) {
  const deferred = useRef<any>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [installed, setInstalled] = useState<boolean>(() =>
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || (navigator as any).standalone === true,
  );

  useEffect(() => {
    const onBefore = (e: any) => {
      e.preventDefault();
      deferred.current = e;
      setCanInstall(true);
    };
    const onInstalled = () => {
      setInstalled(true);
      setCanInstall(false);
      deferred.current = null;
    };
    window.addEventListener('beforeinstallprompt', onBefore);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBefore);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

  const install = async () => {
    if (!deferred.current) return;
    deferred.current.prompt();
    await deferred.current.userChoice;
    deferred.current = null;
    setCanInstall(false);
  };

  if (installed) return null;

  if (canInstall) {
    if (as === "icon") {
      return (
        <Button ref={ref} onClick={install} variant="ghost" size="icon">
          <Download />
          <span className="sr-only">Installer l'application</span>
        </Button>
      );
    }
    return (
      <Button ref={ref} onClick={install} variant="outline" size="sm">
        Installer
      </Button>
    );
  }

  if (isIOS) {
    return (
      <span className="text-xs text-muted-foreground">iOS: Partager ▸ Ajouter à l’écran d’accueil</span>
    );
  }

  return null;
});
