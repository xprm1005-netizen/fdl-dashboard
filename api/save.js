const https = require("https");

const BIN_ID     = "69b4f57baa77b81da9e2c4ad";
const MASTER_KEY = "$2a$10$XXKBE3KoEEZGb2KQoLME4uPbKKJoq1tSdfcsSckzH5RiITZqPCgyq";

function put(payload) {
  return new Promise((resolve, reject) => {
    const buf = Buffer.from(payload);
    const req = https.request(
      {
        hostname: "api.jsonbin.io",
        path: `/v3/b/${BIN_ID}`,
        method: "PUT",
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
    req.on("end", () => {
      try { resolve(JSON.parse(b)); } catch { resolve(null); }
    });
  });
}

module.exports = async (req, res) => {
  try {
    const data = req.body ?? await readBody(req);
    const { ok, body } = await put(JSON.stringify(data));
    if (!ok) return res.status(502).json({ error: body });
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
