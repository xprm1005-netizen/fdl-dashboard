const https = require("https");

const BIN_ID     = "69b4f57baa77b81da9e2c4ad";
const MASTER_KEY = "$2a$10$XXKBE3KoEEZGb2KQoLME4uPbKKJoq1tSdfcsSckzH5RiITZqPCgyq";

function get() {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: "api.jsonbin.io",
        path: `/v3/b/${BIN_ID}/latest`,
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

module.exports = async (_req, res) => {
  try {
    const { ok, body } = await get();
    if (!ok) return res.status(502).json({ error: body });
    const parsed = JSON.parse(body);
    const data = parsed?.record ?? null;
    res.status(200).json(data && data.init === true ? null : data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
