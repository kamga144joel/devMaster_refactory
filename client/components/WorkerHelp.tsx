import React from 'react';

export default function WorkerHelp({ open, onClose }: { open: boolean; onClose: ()=>void }){
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative max-w-2xl w-full bg-white dark:bg-zinc-800 rounded-lg p-6 shadow-lg">
        <h3 className="text-lg font-semibold">Workers Monaco — modes CDN vs Embedded</h3>
        <p className="mt-2 text-sm text-muted-foreground">Explications :</p>
        <ul className="mt-2 text-sm list-disc pl-5 space-y-2 text-muted-foreground">
          <li><strong>CDN</strong> : les workers sont chargés depuis un CDN (rapide, réduit la taille du bundle). Recommandé pour la plupart des déploiements.</li>
          <li><strong>Embedded</strong> : les fichiers workers sont copiés dans votre build et servis depuis votre site. Utile si vous avez des contraintes de réseau ou souhaitez tout héberger en interne. Nécessite packaging des assets (déjà configuré dans le build).</li>
          <li><strong>Impact</strong> : le mode embedded augmente la taille du bundle et peut ralentir le chargement initial. Le mode CDN fait des requêtes externes.</li>
          <li><strong>Diagnostics TS</strong> : le service TypeScript s’exécute dans le worker et fournit autocomplétion, diagnostics et erreurs en temps réel.</li>
        </ul>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="h-9 px-3 rounded-md border">Fermer</button>
        </div>
      </div>
    </div>
  );
}
