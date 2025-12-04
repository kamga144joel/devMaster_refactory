import { useState, useEffect, type FormEvent } from "react";
import { useToast } from "@/hooks/use-toast";

export default function EmailGate({
  open,
  onSuccess,
}: {
  open: boolean;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  // Ne plus retourner null si pas ouvert
  // Ajout d'un état pour suivre si le composant est monté
  const [mounted, setMounted] = useState(false);

  // Dev mode: allow skipping email gate with Ctrl+Shift+E
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.shiftKey && e.key === "E") {
      localStorage.setItem("devmaster:email_verified", "1");
      onSuccess();
    }
  };

  useEffect(() => {
    setMounted(true);
    
    if (typeof window !== "undefined") {
      window.addEventListener("keydown", handleKeyDown);
    }
    
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("keydown", handleKeyDown);
      }
    };
  }, []);

  // Auto-verify after 30 seconds if email was already submitted (fallback for sync issues)
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      const verified = localStorage.getItem("devmaster:email_verified");
      if (verified === "1") {
        onSuccess();
      }
    }, 30000);
    return () => clearTimeout(timer);
  }, [open, onSuccess]);

  const isGmail = (e: string) => /@gmail\.com\s*$/i.test(e.trim());

  const submit = async (ev?: FormEvent) => {
    if (ev) ev.preventDefault();
    const n = name.trim();
    const v = email.trim();
    if (!n) {
      toast({
        title: "Nom requis",
        description: "Veuillez entrer votre nom",
        variant: "destructive",
      });
      return;
    }
    if (!v) {
      toast({
        title: "Email requis",
        description: "Veuillez entrer votre adresse Gmail",
        variant: "destructive",
      });
      return;
    }
    if (!isGmail(v)) {
      toast({
        title: "Gmail requis",
        description: "Veuillez entrer une adresse se terminant par @gmail.com",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      // prefer direct Netlify function path first (avoids aggregate express api), then local server route
      const endpoints = [
        "/.netlify/functions/send-welcome-mail",
        "/api/send-welcome-mail",
      ];
      let res: Response | null = null;
      let lastNonOk: Response | null = null;
      for (const url of endpoints) {
        try {
          const r = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: v, name: n }),
          });
          // prefer a successful response
          if (r.ok) {
            res = r;
            break;
          }
          // if not found, try next endpoint
          if (r.status === 404) continue;
          // record last non-ok response (502, 500, etc.) and try next endpoint
          lastNonOk = r;
        } catch (e) {
          // network error, try next
          lastNonOk = null;
        }
      }
      if (!res) {
        if (lastNonOk) res = lastNonOk;
        else throw new Error("Network error while contacting email service");
      }
      let text = "";
      try {
        // prefer reading the response body once
        text = await res.text();
      } catch (readErr) {
        // reading may fail if body was already used (some proxies/middleware). Try clone as a fallback, otherwise fall back to statusText
        try {
          text = await res.clone().text();
        } catch {
          text = String(res.statusText || readErr);
        }
      }
      let body: any = null;
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }
      if (!res.ok) {
        console.error("Welcome mail error", {
          status: res.status,
          statusText: res.statusText,
          body,
        });
        let detail = "";
        if (res.status === 404)
          detail =
            "Fonction d'envoi introuvable (/.netlify/functions/send-welcome-mail).";
        else if (body && typeof body === "object") {
          // Try to extract detailed error message from body.detail if it's a JSON string
          if (body.detail && typeof body.detail === "string") {
            try {
              const parsedDetail = JSON.parse(body.detail);
              if (parsedDetail && typeof parsedDetail === "object") {
                // Prefer ErrorMessage from Mailjet API response
                if (parsedDetail.ErrorMessage) {
                  detail = parsedDetail.ErrorMessage;
                } else {
                  // Fall back to stringifying the parsed object
                  detail = JSON.stringify(parsedDetail, null, 2);
                }
              } else {
                detail = String(parsedDetail);
              }
            } catch {
              // If detail is not JSON, use it as-is
              detail = String(body.detail);
            }
          } else if (body.message) {
            detail = String(body.message);
          } else if (body.error) {
            detail = String(body.error);
          } else {
            try {
              // Prefer a pretty JSON representation for object responses
              detail = JSON.stringify(body, null, 2);
            } catch (err) {
              try {
                // Fallback: attempt to safely stringify with a replacer for circular refs
                const seen = new WeakSet();
                detail = JSON.stringify(body, (k, v) => {
                  if (v && typeof v === "object") {
                    if (seen.has(v)) return "[Circular]";
                    seen.add(v);
                  }
                  return v;
                });
              } catch {
                // Last resort: convert to string safely
                try {
                  detail = String(body);
                } catch {
                  detail = Object.prototype.toString.call(body);
                }
              }
            }
          }
        } else detail = String(body || res.statusText || "Erreur inconnue");
        if (
          detail.includes("missing_mailjet_keys") ||
          detail.includes("missing_mailjet")
        ) {
          detail =
            "Configuration Mailjet manquante sur le serveur. Veuillez définir MJ_APIKEY_PUBLIC et MJ_APIKEY_PRIVATE sur Netlify.";
        }
        toast({
          title: "Erreur envoi",
          description:
            detail.length > 160 ? detail.slice(0, 160) + "..." : detail,
          variant: "destructive",
        });
        return;
      }
      // success
      localStorage.setItem("devmaster:name", n);
      localStorage.setItem("devmaster:email", v);
      localStorage.setItem("devmaster:email_verified", "1");
      toast({
        title: "Bienvenue envoyé",
        description:
          "Un email de bienvenue a été envoyé à votre adresse Gmail.",
      });
      onSuccess();
    } catch (e: any) {
      console.error("Welcome mail exception", e);
      toast({
        title: "Erreur",
        description: String(e?.message || e),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Ne plus retourner null si pas monté ou pas ouvert
  if (!mounted || !open) return null;
  
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background text-foreground rounded-lg shadow-lg max-w-lg w-full border p-6">
        <h2 className="text-2xl font-semibold">Bienvenue — Accès limité</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Pour accéder au site, veuillez saisir votre nom et votre adresse
          Gmail. Un email de bienvenue vous sera envoyé immédiatement.
        </p>
        <form onSubmit={submit} className="mt-4 grid gap-3">
          <input
            className="w-full rounded-md border px-3 py-2"
            placeholder="Votre nom"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            aria-label="Votre nom"
          />
          <input
            className="w-full rounded-md border px-3 py-2"
            placeholder="votrenom@gmail.com"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-label="Adresse Gmail"
          />
          <div className="flex items-center gap-3">
            <button
              disabled={loading}
              className="h-10 px-4 rounded-md bg-primary text-primary-foreground"
            >
              {loading ? "Envoi..." : "Recevoir l'email de bienvenue"}
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail("");
              }}
              className="text-sm text-muted-foreground"
            >
              Effacer
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Nous n'utiliserons votre adresse que pour vous envoyer cet email de
            bienvenue.
          </p>
        </form>
      </div>
    </div>
  );
}
