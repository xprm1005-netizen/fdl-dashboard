const https = require("https");

const SB_HOST = "jbebrpphywpfbqcsjgq.supabase.co";
const SB_KEY  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiZWJyYnBwaHl3cGZicWNzamdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0NDkwNDksImV4cCI6MjA4OTAyNTA0OX0.lvSOQVvtLZcLieCyiShka0XzzARjzRy4J4yu4xHyRhs";

function get(path) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      { hostname: SB_HOST, path, method: "GET", headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } },
      (res) => { let b = ""; res.on("data", c => b += c); res.on("end", () => resolve({ ok: res.statusCode < 400, body: b })); }
    );
    req.on("error", reject);
    req.end();
  });
}

module.exports = async (_req, res) => {
  try {
    const { ok, body } = await get("/rest/v1/app_data?id=eq.fdl-meta");
    if (!ok) return res.status(502).json({ error: body });
    const rows = JSON.parse(body);
    res.status(200).json(Array.isArray(rows) && rows[0] ? (rows[0].data ?? null) : null);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
