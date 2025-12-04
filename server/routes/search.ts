import type { RequestHandler } from "express";

const RAPID_HOST = "contextualwebsearch-websearch-v1.p.rapidapi.com";

export const webSearch: RequestHandler = async (req, res) => {
  try {
    const key = process.env.RAPIDAPI_KEY;
    if (!key) return res.status(500).json({ error: "missing_rapidapi_key" });
    const q = String(req.query.q || "").trim();
    const pageNumber = String(req.query.page || "1");
    const pageSize = String(req.query.pageSize || "10");
    if (!q) return res.status(400).json({ error: "missing_query" });

    const url = new URL(`https://${RAPID_HOST}/api/Search/WebSearchAPI`);
    url.searchParams.set("q", q);
    url.searchParams.set("pageNumber", pageNumber);
    url.searchParams.set("pageSize", pageSize);
    url.searchParams.set("autoCorrect", "true");

    const r = await fetch(url, { headers: { "X-RapidAPI-Key": key, "X-RapidAPI-Host": RAPID_HOST } });
    const text = await r.text();
    if (!r.ok) return res.status(r.status).send(text);
    res.type("application/json").send(text);
  } catch (e: any) {
    res.status(500).json({ error: "web_search_failed", message: String(e?.message ?? e) });
  }
};
