// Netlify Function — proxies Clockify so the API key is never shipped to the browser.
// Reads the key from the CLOCKIFY_API_KEY environment variable (set in the Netlify dashboard).
// Returns time-vs-budget data for a single project as clean JSON, with CORS headers
// so the (private, local) plan page can call it at its absolute URL.

const BASE = "https://api.clockify.me/api/v1";
const REPORTS = "https://reports.api.clockify.me/v1";
const PROJECT_NAME = "Hamstra 2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Content-Type": "application/json",
  "Cache-Control": "no-store"
};

// ISO-8601 duration (e.g. PT130H30M15S, P2DT4H) -> decimal hours
function parseDuration(d) {
  if (!d) return 0;
  const m = d.match(/P(?:([\d.]+)D)?(?:T(?:([\d.]+)H)?(?:([\d.]+)M)?(?:([\d.]+)S)?)?/);
  if (!m) return 0;
  const days = parseFloat(m[1] || 0), h = parseFloat(m[2] || 0),
        min = parseFloat(m[3] || 0), s = parseFloat(m[4] || 0);
  return days * 24 + h + min / 60 + s / 3600;
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: CORS, body: "" };

  const KEY = process.env.CLOCKIFY_API_KEY;
  if (!KEY) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: "CLOCKIFY_API_KEY not set" }) };
  }
  const h = { "X-Api-Key": KEY };

  try {
    const ws = await (await fetch(`${BASE}/workspaces`, { headers: h })).json();
    if (!ws.length) throw new Error("No workspace found");
    const wsId = ws[0].id;

    // Find the project by name (page through if needed)
    let project = null, page = 1;
    while (true) {
      const projects = await (await fetch(
        `${BASE}/workspaces/${wsId}/projects?page=${page}&page-size=50`, { headers: h }
      )).json();
      if (!projects || !projects.length) break;
      project = projects.find(p => p.name.toLowerCase().trim() === PROJECT_NAME.toLowerCase());
      if (project || projects.length < 50) break;
      page++;
    }
    if (!project) throw new Error(`Project "${PROJECT_NAME}" not found`);

    const budgetedHours = parseDuration(project.timeEstimate && project.timeEstimate.estimate);
    const trackedHours = parseDuration(project.duration);

    // Best-effort active date range from the detailed report API
    let firstDate = null, lastDate = null, durationDays = null;
    try {
      const start = new Date(); start.setFullYear(start.getFullYear() - 1);
      const r = await fetch(`${REPORTS}/workspaces/${wsId}/reports/detailed`, {
        method: "POST",
        headers: { ...h, "Content-Type": "application/json" },
        body: JSON.stringify({
          dateRangeStart: start.toISOString(),
          dateRangeEnd: new Date().toISOString(),
          detailedFilter: { page: 1, pageSize: 1000 },
          exportType: "JSON",
          projects: { ids: [project.id] }
        })
      });
      if (r.ok) {
        const data = await r.json();
        const entries = (data.timeentries || [])
          .filter(e => e.timeInterval && e.timeInterval.start)
          .sort((a, b) => new Date(a.timeInterval.start) - new Date(b.timeInterval.start));
        if (entries.length) {
          firstDate = entries[0].timeInterval.start;
          lastDate = entries[entries.length - 1].timeInterval.start;
          durationDays = Math.floor((new Date(lastDate) - new Date(firstDate)) / 86400000);
        }
      }
    } catch (_) { /* dates are a bonus */ }

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ name: project.name, budgetedHours, trackedHours, firstDate, lastDate, durationDays })
    };
  } catch (e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message }) };
  }
};
