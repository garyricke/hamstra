// Netlify Function — Hamstra 2 hours for the plan page's Time vs Budget card.
// Reads Time (time.orbisdesign.com), which replaced Clockify on 29 Sep 2026.
// TIME_API_KEY is a read-only key scoped to the Hamstra 2 project, set in the
// Netlify dashboard; it never reaches the browser.
const TIME = "https://time.orbisdesign.com";
const PROJECT = "hamstra-2";
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Content-Type": "application/json",
  "Cache-Control": "no-store"
};

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: CORS, body: "" };
  const KEY = process.env.TIME_API_KEY;
  if (!KEY) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: "TIME_API_KEY not set" }) };
  }
  try {
    const r = await fetch(`${TIME}/api/report/burndown?project=${PROJECT}&log=0`, {
      headers: { Authorization: `Bearer ${KEY}` }
    });
    if (!r.ok) throw new Error(`Time returned ${r.status}`);
    const p = (await r.json()).projects[0];
    const first = p.firstDay, last = p.lastDay;
    const durationDays = first && last ? Math.round((new Date(last) - new Date(first)) / 86400000) : null;
    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({
        name: p.project,
        trackedHours: p.used.hours,
        entries: p.used.entries,
        basis: p.hoursBasis,          // "slice": overlapping hours split across projects, never double-counted
        firstDate: first,
        lastDate: last,
        durationDays,
        source: "Time"
      })
    };
  } catch (e) {
    return { statusCode: 502, headers: CORS, body: JSON.stringify({ error: e.message }) };
  }
};
