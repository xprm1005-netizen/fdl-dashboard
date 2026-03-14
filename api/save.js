const https = require("https");

const SB_HOST = "jbebrpphywpfbqcsjgq.supabase.co";
const SB_KEY  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiZWJyYnBwaHl3cGZicWNzamdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0NDkwNDksImV4cCI6MjA4OTAyNTA0OX0.lvSOQVvtLZcLieCyiShka0XzzARjzRy4J4yu4xHyRhs";

function post(payload) {
  return new Promise((resolve, reject) => {
    const buf = Buffer.from(payload);
    const req = https.request(
      {
        hostname: SB_HOST,
        path: "/rest/v1/app_data",
        method: "POST",
        headers: {
          apikey: SB_KEY,
          Authorization: `Bearer ${SB_KEY}`,
          "Content-Type": "application/json",
          "Content-Length": buf.length,
          Prefer: "resolution=merge-duplicates,return=minimal",
        },
      },
      (res) => { let b = ""; res.on("data", c => b += c); res.on("end", () => resolve({ ok: res.statusCode < 400, body: b })); }
    );
    req.on("error", reject);
    req.write(buf);
    req.end();
  });
}

function readBody(req) {
  return new Promise((resolve) => {
    let b = "";
    req.on("data", c => b += c);
    req.on("end", () => { try { resolve(JSON.parse(b)); } catch { resolve(null); } });
  });
}

module.exports = async (req, res) => {
  try {
    const data = req.body ?? await readBody(req);
    const payload = JSON.stringify({ id: "fdl-meta", data });
    const { ok, body } = await post(payload);
    if (!ok) return res.status(502).json({ error: body });
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
