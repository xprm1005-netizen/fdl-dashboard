const SB_URL = "https://jbebrpphywpfbqcsjgq.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiZWJyYnBwaHl3cGZicWNzamdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0NDkwNDksImV4cCI6MjA4OTAyNTA0OX0.lvSOQVvtLZcLieCyiShka0XzzARjzRy4J4yu4xHyRhs";

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);

  try {
    const r = await fetch(`${SB_URL}/rest/v1/app_data?id=eq.fdl-meta`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    const rows = await r.json();
    const data = Array.isArray(rows) && rows.length > 0 ? (rows[0].data ?? null) : null;
    return res.status(200).json(data);
  } catch (e) {
    clearTimeout(timer);
    return res.status(500).json({ error: e.message });
  }
};
