const https = require("https");

const MASTER_KEY = "$2a$10$XXKBE3KoEEZGb2KQoLME4uPbKKJoq1tSdfcsSckzH5RiITZqPCgyq";

function getBin(binId) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: "api.jsonbin.io",
        path: `/v3/b/${binId}/latest`,
        method: "GET",
        headers: { "X-Master-Key": MASTER_KEY },
      },
      (res) => {
        let b = "";
        res.on("data", (c) => (b += c));
        res.on("end", () => resolve({ ok: res.statusCode < 400, body: b }));
      }
    );
    req.on("error", reject);
    req.end();
  });
}

module.exports = async (req, res) => {
  const binId = req.query?.binId;
  if (!binId) return res.status(400).json({ error: "binId required" });
  try {
    const { ok, body } = await getBin(binId);
    if (!ok) return res.status(502).json({ error: body });
    const json = JSON.parse(body);
    res.status(200).json({ data: json?.record?._data ?? null });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
