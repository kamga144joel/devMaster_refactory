export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({ error: 'method_not_allowed' }) };
  try {
    const body = JSON.parse(event.body || '{}');
    const { name, email, phone, message } = body;
    if (!message || (!email && !phone)) return { statusCode: 400, body: JSON.stringify({ error: 'email_or_phone_and_message_required' }) };

    const MJ_APIKEY_PUBLIC = process.env.MJ_APIKEY_PUBLIC;
    const MJ_APIKEY_PRIVATE = process.env.MJ_APIKEY_PRIVATE;
    const MJ_FROM_EMAIL = process.env.MJ_FROM_EMAIL || process.env.CONTACT_RECIPIENT;
    const CONTACT_RECIPIENT = process.env.CONTACT_RECIPIENT;

    if (!MJ_APIKEY_PUBLIC || !MJ_APIKEY_PRIVATE) {
      return { statusCode: 500, body: JSON.stringify({ error: 'missing_mailjet_keys' }) };
    }
    if (!CONTACT_RECIPIENT && !MJ_FROM_EMAIL) {
      return { statusCode: 500, body: JSON.stringify({ error: 'missing_recipient' }) };
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
    const res = await fetch('https://api.mailjet.com/v3.1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`
      },
      body: JSON.stringify(payload)
    });

    const text = await res.text().catch(()=>"");
    let parsed = null;
    try { parsed = JSON.parse(text); } catch {}
    if (!res.ok) {
      const detail = parsed && typeof parsed === 'object' ? JSON.stringify(parsed) : String(text || res.statusText || `status:${res.status}`);
      return { statusCode: 502, body: JSON.stringify({ error: 'mailjet_error', status: res.status, detail }) };
    }

    const successDetail = parsed && typeof parsed === 'object' ? parsed : String(text || 'ok');
    return { statusCode: 200, body: JSON.stringify({ ok: true, detail: successDetail }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: 'exception', message: String(e?.message || e) }) };
  }
};
