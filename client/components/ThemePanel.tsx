import { useEffect, useMemo, useState } from "react";

import { hexToHslTriple } from '@/lib/color';

export default function ThemePanel() {
  const [dark, setDark] = useState<boolean>(()=> document.documentElement.classList.contains('dark'));
  const [hex, setHex] = useState<string>(()=> localStorage.getItem('brand:hex') || '#6d28d9');

  useEffect(()=>{
    const saved = localStorage.getItem('brand:hsl');
    if (saved) {
      document.documentElement.style.setProperty('--brand', saved);
    } else {
      document.documentElement.style.setProperty('--brand', hexToHslTriple(hex));
    }
  },[]);

  useEffect(()=>{
    if (dark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('theme:dark', dark ? '1' : '0');
  },[dark]);

  useEffect(()=>{
    const hsl = hexToHslTriple(hex);
    document.documentElement.style.setProperty('--brand', hsl);
    localStorage.setItem('brand:hex', hex);
    localStorage.setItem('brand:hsl', hsl);
  },[hex]);

  const preview = useMemo(()=> ({ backgroundColor: hex }), [hex]);

  return (
    <div className="flex items-center gap-3">
      <label className="inline-flex items-center gap-2 text-sm">
        <input type="checkbox" checked={dark} onChange={(e)=>setDark(e.target.checked)} />
        Sombre
      </label>
      <div className="inline-flex items-center gap-2 text-sm">
        <span>Couleur</span>
        <input type="color" value={hex} onChange={(e)=>setHex(e.target.value)} className="h-8 w-10 p-0 border rounded" />
        <span className="h-5 w-5 rounded" style={preview} />
      </div>
    </div>
  );
}
