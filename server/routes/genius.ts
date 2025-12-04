import type { RequestHandler } from "express";

const RAPID_HOST = "genius-song-lyrics1.p.rapidapi.com";

export const geniusSearch: RequestHandler = async (req, res) => {
  try {
    const key = process.env.RAPIDAPI_KEY;
    if (!key) return res.status(500).json({ error: "missing_rapidapi_key" });
    const q = String(req.query.q || "").trim();
    const page = String(req.query.page || "1");
    const per_page = String(req.query.per_page || "10");
    if (!q) return res.status(400).json({ error: "missing_query" });

    const url = new URL("https://" + RAPID_HOST + "/search");
    url.searchParams.set("q", q);
    url.searchParams.set("per_page", per_page);
    url.searchParams.set("page", page);

    const r = await fetch(url, {
      headers: { "X-RapidAPI-Key": key, "X-RapidAPI-Host": RAPID_HOST },
    });
    const text = await r.text();
    if (!r.ok) return res.status(r.status).send(text);
    res.type("application/json").send(text);
  } catch (e: any) {
    res.status(500).json({ error: "genius_search_failed", message: String(e?.message ?? e) });
  }
};

export const geniusLyrics: RequestHandler = async (req, res) => {
  try {
    const key = process.env.RAPIDAPI_KEY;
    if (!key) return res.status(500).json({ error: "missing_rapidapi_key" });
    const id = String(req.query.id || "").trim();
    if (!id) return res.status(400).json({ error: "missing_id" });

    const url = new URL("https://" + RAPID_HOST + "/song/lyrics");
    url.searchParams.set("id", id);

    const r = await fetch(url, {
      headers: { "X-RapidAPI-Key": key, "X-RapidAPI-Host": RAPID_HOST },
    });
    const text = await r.text();
    if (!r.ok) return res.status(r.status).send(text);
    res.type("application/json").send(text);
  } catch (e: any) {
    res.status(500).json({ error: "genius_lyrics_failed", message: String(e?.message ?? e) });
  }
};
