import type { RequestHandler } from 'express';

export const handleContact: RequestHandler = async (req, res) => {
  const { name, email, phone, message } = req.body || {};
  if (!message || (!email && !phone)) return res.status(400).json({ error: 'email_or_phone_and_message_required' });

  // If a webhook is configured, forward to it
  const webhook = process.env.CONTACT_WEBHOOK;
  if (webhook) {
    try {
      const r = await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, message, ts: Date.now() })
      });
      if (!r.ok) {
        const txt = await r.text();
        return res.status(502).json({ error: 'webhook_failed', detail: txt });
      }
      return res.json({ ok: true });
    } catch (e:any) {
      return res.status(500).json({ error: 'webhook_error', message: String(e?.message || e) });
    }
  }

  // No webhook configured - attempt to use configured mailto recipient (for serverside this is a fallback)
  const contactRecipient = process.env.CONTACT_RECIPIENT;
  if (contactRecipient) {
    // We can't actually send email without SMTP; inform caller that recipient is available
    return res.status(202).json({ ok: true, info: 'recipient_configured_but_no_smtp', recipient: contactRecipient });
  }

  // Nothing available server-side
  return res.status(501).json({ error: 'missing_contact_provider', message: 'No server-side contact provider configured. Set CONTACT_WEBHOOK or CONTACT_RECIPIENT in env.' });
};
