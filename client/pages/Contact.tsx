import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function Contact(){
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!message.trim() || (!email.trim() && !phone.trim())) { toast({ title: 'Erreur', description: 'Veuillez saisir un message et un email ou téléphone', variant: 'destructive' }); return; }
    setLoading(true);
    try{
      // Try Netlify Mailjet function first
      try{
        const r = await fetch('/.netlify/functions/send-mailjet', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, phone, message }) });
        const j = await r.json();
        if (r.ok) {
          toast({ title: 'Envoyé via Mailjet', description: 'Nous avons reçu votre message. Merci !' });
          setName(''); setEmail(''); setPhone(''); setMessage('');
          setLoading(false);
          return;
        }
        // if function exists but failed, fallthrough
        console.warn('Mailjet function response', j);
      }catch(err){ console.warn('Mailjet function error', err); }

      // Fallback to local server /api/contact
      try{
        const r2 = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, phone, message }) });
        const j2 = await r2.json();
        if (r2.ok) {
          toast({ title: 'Envoyé', description: 'Nous avons reçu votre message. Merci !' });
          setName(''); setEmail(''); setPhone(''); setMessage('');
          setLoading(false);
          return;
        }
        console.warn('API /api/contact response', j2);
      }catch(err){ console.warn('/api/contact error', err); }

      // Final fallback: open mail client via mailto
      const mailto = `mailto:kamgajoel144@gmail.com?subject=${encodeURIComponent('Contact from DevMaster')}&body=${encodeURIComponent(`Name: ${name}\nEmail: ${email}\nPhone: ${phone}\n\n${message}`)}`;
      window.location.href = mailto;
    }catch(e:any){ toast({ title: 'Erreur', description: String(e?.message||e), variant: 'destructive' }); }
    finally { setLoading(false); }
  };

  return (
    <div className="container mx-auto py-12 max-w-3xl">
      <h1 className="text-3xl font-semibold">Contact</h1>
      <p className="mt-4 text-muted-foreground">Pour toute question, retour, ou demande de partenariat, contactez‑nous via les moyens ci‑dessous ou envoyez un message directement depuis ce formulaire.</p>

      <div className="mt-6 grid gap-4">
        <form onSubmit={submit} className="rounded-lg border p-4 grid gap-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <input placeholder="Votre nom (optionnel)" value={name} onChange={e=>setName(e.target.value)} />
            <input placeholder="Votre email" type="email" value={email} onChange={e=>setEmail(e.target.value)} />
          </div>
          <div>
            <input placeholder="Téléphone (optionnel)" value={phone} onChange={e=>setPhone(e.target.value)} />
          </div>
          <div>
            <textarea placeholder="Votre message..." value={message} onChange={e=>setMessage(e.target.value)} className="min-h-28" />
          </div>
          <div className="flex items-center gap-3">
            <button type="submit" disabled={loading} className="h-10 px-4 rounded-md bg-primary text-primary-foreground">{loading? 'Envoi...' : 'Envoyer'}</button>

            <a href={`https://wa.me/${encodeURIComponent('656973647')}?text=${encodeURIComponent(message || 'Bonjour')}`} target="_blank" rel="noreferrer" className="text-sm text-primary">Open WhatsApp (656 97 36 47)</a>

            <a href={`https://wa.me/${encodeURIComponent('692171363')}?text=${encodeURIComponent(message || 'Bonjour')}`} target="_blank" rel="noreferrer" className="text-sm text-primary">Open WhatsApp (692171363)</a>
          </div>
        </form>

        <div className="rounded-lg border p-4">
          <h2 className="text-lg font-medium">Téléphone</h2>
          <p className="mt-2">Appels / WhatsApp: <strong>656 97 36 47</strong></p>
          <p className="mt-1">Second numéro: <strong>692171363</strong></p>
        </div>

        <div className="rounded-lg border p-4">
          <h2 className="text-lg font-medium">Email</h2>
          <p className="mt-2">Envoyez un message : <a href="mailto:kamgajoel144@gmail.com" className="text-primary">kamgajoel144@gmail.com</a></p>
        </div>

        <div className="rounded-lg border p-4">
          <h2 className="text-lg font-medium">Support</h2>
          <p className="mt-2 text-sm text-muted-foreground">Vous pouvez aussi ouvrir une discussion via la page <a href="/chat" className="text-primary">Chat</a> pour une assistance immédiate ou utilisez la page Admin pour signaler des problèmes.</p>
        </div>
      </div>
    </div>
  );
}
