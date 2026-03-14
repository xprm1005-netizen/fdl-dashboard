const https = require("https");

const SB_HOST = "jbebrpphywpfbqcsjgq.supabase.co";
const SB_KEY  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiZWJyYnBwaHl3cGZicWNzamdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0NDkwNDksImV4cCI6MjA4OTAyNTA0OX0.lvSOQVvtLZcLieCyiShka0XzzARjzRy4J4yu4xHyRhs";

function sbGet(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: SB_HOST,
      path,
      method: "GET",
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
    };
    https.request(options, (res) => {
      let body = "";
      res.on("data", (c) => (body += c));
      res.on("end", () => resolve({ status: res.statusCode, body }));
    }).on("error", reject).end();
  });
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  try {
    const { status, body } = await sbGet("/rest/v1/app_data?id=eq.fdl-meta");
    if (status !== 200) return res.status(502).json({ error: `Supabase ${status}: ${body}` });
    const rows = JSON.parse(body);
    if (!Array.isArray(rows) || rows.length === 0) return res.status(200).json(null);
    return res.status(200).json(rows[0].data ?? null);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
