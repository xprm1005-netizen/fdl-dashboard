const SB_URL = "https://jbebrpphywpfbqcsjgq.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiZWJyYnBwaHl3cGZicWNzamdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0NDkwNDksImV4cCI6MjA4OTAyNTA0OX0.lvSOQVvtLZcLieCyiShka0XzzARjzRy4J4yu4xHyRhs";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const r = await fetch(`${SB_URL}/rest/v1/app_data?id=eq.fdl-meta`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
    });
    const rows = await r.json();
    if (!Array.isArray(rows) || rows.length === 0) return res.status(200).json(null);
    return res.status(200).json(rows[0].data ?? null);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
