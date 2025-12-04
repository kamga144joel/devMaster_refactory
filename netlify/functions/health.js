exports.handler = async function () {
  try {
    const envChecks = {
      MJ_APIKEY_PUBLIC: !!process.env.MJ_APIKEY_PUBLIC,
      MJ_APIKEY_PRIVATE: !!process.env.MJ_APIKEY_PRIVATE,
      MJ_FROM_EMAIL: !!process.env.MJ_FROM_EMAIL,
      CONTACT_RECIPIENT: !!process.env.CONTACT_RECIPIENT,
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_KEY: !!process.env.SUPABASE_KEY,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NETLIFY_AUTH_TOKEN: !!process.env.NETLIFY_AUTH_TOKEN
    };

    const missing = Object.keys(envChecks).filter((k) => !envChecks[k]);

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, time: new Date().toISOString(), env: { missing, all: envChecks } })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: String(e) }) };
  }
};
