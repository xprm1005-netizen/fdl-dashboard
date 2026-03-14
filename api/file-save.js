const https = require("https");

const MASTER_KEY = "$2a$10$XXKBE3KoEEZGb2KQoLME4uPbKKJoq1tSdfcsSckzH5RiITZqPCgyq";

function createBin(payload) {
  return new Promise((resolve, reject) => {
    const buf = Buffer.from(payload);
    const req = https.request(
      {
        hostname: "api.jsonbin.io",
        path: "/v3/b",
        method: "POST",
        headers: {
          "X-Master-Key": MASTER_KEY,
          "Content-Type": "application/json",
          "Content-Length": buf.length,
        },
      },
      (res) => {
        let b = "";
        res.on("data", (c) => (b += c));
        res.on("end", () => resolve({ ok: res.statusCode < 400, body: b }));
      }
    );
    req.on("error", reject);
    req.write(buf);
    req.end();
  });
}

function readBody(req) {
  return new Promise((resolve) => {
    let b = "";
    req.on("data", (c) => (b += c));
    req.on("end", () => { try { resolve(JSON.parse(b)); } catch { resolve(null); } });
  });
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const body = req.body ?? await readBody(req);
    if (!body?._data) return res.status(400).json({ error: "No data provided" });
    const { ok, body: rb } = await createBin(JSON.stringify({ _data: body._data }));
    if (!ok) return res.status(502).json({ error: rb });
    const json = JSON.parse(rb);
    res.status(200).json({ binId: json.metadata.id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
