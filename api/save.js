const SB = "https://jbebrpphywpfbqcsjgq.supabase.co";
const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiZWJyYnBwaHl3cGZicWNzamdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0NDkwNDksImV4cCI6MjA4OTAyNTA0OX0.lvSOQVvtLZcLieCyiShka0XzzARjzRy4J4yu4xHyRhs";

module.exports = async (req, res) => {
  try {
    const data = req.body;
    await fetch(`${SB}/rest/v1/app_data`, {
      method: "POST",
      headers: {
        apikey: KEY,
        Authorization: `Bearer ${KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify({ id: "fdl-meta", data }),
    });
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
