const SB = "https://jbebrpphywpfbqcsjgq.supabase.co";
const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiZWJyYnBwaHl3cGZicWNzamdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0NDkwNDksImV4cCI6MjA4OTAyNTA0OX0.lvSOQVvtLZcLieCyiShka0XzzARjzRy4J4yu4xHyRhs";

module.exports = async (req, res) => {
  try {
    const r = await fetch(`${SB}/rest/v1/app_data?id=eq.fdl-meta`, {
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
    });
    const rows = await r.json();
    res.status(200).json(Array.isArray(rows) && rows[0] ? (rows[0].data ?? null) : null);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
