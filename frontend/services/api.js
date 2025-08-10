import { API_BASE } from '../config.js';

async function postJson(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  return res.json();
}

export const api = {
  analyzePolygon: (polygon) => postJson('/api/analyze-polygon', { polygon }),
  alcSummary: (polygon) => postJson('/api/alc-summary', { polygon }),
  floodSummary: (polygon, tables) => postJson('/api/flood-summary', { polygon, tables }),
  renewablesProximity: (polygon, distance_m) => postJson('/api/renewables-proximity', { polygon, distance_m })
};

