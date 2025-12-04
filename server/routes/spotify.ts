import type { RequestHandler } from "express";

const RAPID_HOST = "spotify23.p.rapidapi.com";

export const spotifySearch: RequestHandler = async (req, res) => {
  try {
    const key = process.env.RAPIDAPI_KEY;
    if (!key) return res.status(500).json({ error: "missing_rapidapi_key" });
    const q = String(req.query.q || "").trim();
    const type = String(req.query.type || "track");
    const limit = String(req.query.limit || "10");
    if (!q) return res.status(400).json({ error: "missing_query" });

    const url = new URL("https://" + RAPID_HOST + "/search/");
    url.searchParams.set("q", q);
    url.searchParams.set("type", type);
    url.searchParams.set("limit", limit);

    const r = await fetch(url, {
      headers: { "X-RapidAPI-Key": key, "X-RapidAPI-Host": RAPID_HOST },
    });
    const text = await r.text();
    if (!r.ok) return res.status(r.status).send(text);
    res.type("application/json").send(text);
  } catch (e: any) {
    res.status(500).json({ error: "spotify_search_failed", message: String(e?.message ?? e) });
  }
};

export const spotifyTrack: RequestHandler = async (req, res) => {
  try {
    const key = process.env.RAPIDAPI_KEY;
    if (!key) return res.status(500).json({ error: "missing_rapidapi_key" });
    const id = String(req.query.id || "").trim();
    if (!id) return res.status(400).json({ error: "missing_id" });

    const url = new URL("https://" + RAPID_HOST + "/tracks/");
    url.searchParams.set("ids", id);

    const r = await fetch(url, {
      headers: { "X-RapidAPI-Key": key, "X-RapidAPI-Host": RAPID_HOST },
    });
    const text = await r.text();
    if (!r.ok) return res.status(r.status).send(text);
    res.type("application/json").send(text);
  } catch (e: any) {
    res.status(500).json({ error: "spotify_track_failed", message: String(e?.message ?? e) });
  }
};
