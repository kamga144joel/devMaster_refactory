import type { RequestHandler } from 'express';

export const handleSendMailjet: RequestHandler = async (req, res) => {
  try {
    const { name, email, phone, message } = req.body || {};
    if (!message || (!email && !phone)) return res.status(400).json({ error: 'email_or_phone_and_message_required' });

    const MJ_APIKEY_PUBLIC = process.env.MJ_APIKEY_PUBLIC;
    const MJ_APIKEY_PRIVATE = process.env.MJ_APIKEY_PRIVATE;
    const MJ_FROM_EMAIL = process.env.MJ_FROM_EMAIL || process.env.CONTACT_RECIPIENT;
    const CONTACT_RECIPIENT = process.env.CONTACT_RECIPIENT;

    if (!MJ_APIKEY_PUBLIC || !MJ_APIKEY_PRIVATE) {
      return res.status(500).json({ error: 'missing_mailjet_keys' });
    }
    if (!CONTACT_RECIPIENT && !MJ_FROM_EMAIL) {
      return res.status(500).json({ error: 'missing_recipient' });
    }

    const toEmail = CONTACT_RECIPIENT || MJ_FROM_EMAIL;

    const payload = {
      Messages: [
        {
          From: { Email: MJ_FROM_EMAIL || toEmail, Name: 'DevMaster' },
          To: [{ Email: toEmail, Name: 'DevMaster' }],
          Subject: `DevMaster contact from ${name || (email || phone)}`,
          TextPart: `Message from ${name || 'anonymous'}\nEmail: ${email || 'n/a'}\nPhone: ${phone || 'n/a'}\n\n---\n${message}`,
          HTMLPart: `<h3>New contact message</h3><p><strong>Name:</strong> ${name || 'anonymous'}</p><p><strong>Email:</strong> ${email || 'n/a'}</p><p><strong>Phone:</strong> ${phone || 'n/a'}</p><hr/><p>${(message || '').replace(/\n/g, '<br/>')}</p>`,
          CustomID: 'DevMasterContact'
        }
      ]
    };

    const auth = Buffer.from(`${MJ_APIKEY_PUBLIC}:${MJ_APIKEY_PRIVATE}`).toString('base64');
    const resp = await fetch('https://api.mailjet.com/v3.1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`
      },
      body: JSON.stringify(payload)
    });

    const text = await resp.text();
    if (!resp.ok) return res.status(502).json({ error: 'mailjet_error', detail: text });

    return res.json({ ok: true, detail: text });
  } catch (e:any) {
    return res.status(500).json({ error: 'exception', message: String(e?.message || e) });
  }
};
