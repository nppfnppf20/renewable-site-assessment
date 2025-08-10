import { HIDDEN_LAYERS } from '../config.js';

export function renderSections(container, results) {
  let floodHTML = '';
  let otherHTML = '';
  if (results && results.results) {
    Object.keys(results.results).forEach((layerName, index) => {
      if (HIDDEN_LAYERS.has(layerName)) return;
      const layerData = results.results[layerName];
      if (layerData.count > 0) {
        const itemHTML = `<div class="designation-item"><strong>${layerName}:</strong> ${layerData.count} features</div>`;
        const lname = (layerName || '').toLowerCase();
        if (lname.includes('flood')) floodHTML += itemHTML; else otherHTML += itemHTML;
      } else if (layerData.error) {
        const errHTML = `<div class="designation-item"><strong>${layerName}:</strong> Error - ${layerData.error}</div>`;
        const lname = (layerName || '').toLowerCase();
        if (lname.includes('flood')) floodHTML += errHTML; else otherHTML += errHTML;
      }
    });
  }
  container.innerHTML = `
    <div class="designation-item"><strong>Total: ${results?.totalFeatures ?? 0} Features Found</strong></div>
    <div class="section">
      <h4>Agricultural land</h4>
      <div class="section-content" id="alcSectionInline"></div>
    </div>
    <div class="section">
      <h4>Flood risk</h4>
      <div class="section-content">
        <div id="floodSummaryInline" class="designation-item">Calculating flood percentage...</div>
        ${floodHTML}
      </div>
    </div>
    <div class="section">
      <h4>Cumulative impact (renewables)</h4>
      <div class="section-content" id="renewablesSectionInline"></div>
    </div>
    <div class="section">
      <h4>Other designations</h4>
      <div class="section-content">${otherHTML}</div>
    </div>
  `;
}

export function renderALC(alc) {
  const el = document.getElementById('alcSectionInline');
  if (!el) return;
  let html = '';
  html += `<div class="designation-item"><strong>Total site area:</strong> ${Number(alc.total_area_ha ?? 0).toFixed(2)} ha</div>`;
  if (Array.isArray(alc.by_grade) && alc.by_grade.length > 0) {
    alc.by_grade.forEach(item => {
      html += `<div class="designation-item"><strong>${item.grade}:</strong> ${Number(item.area_ha).toFixed(2)} ha (${Number(item.percent).toFixed(1)}%)</div>`;
    });
  } else {
    html += '<div class="designation-item">No ALC grades found within the site.</div>';
  }
  el.innerHTML = html;
}

export function renderFlood(flood) {
  const el = document.getElementById('floodSummaryInline');
  if (!el) return;
  const pct = Number(flood?.percent ?? 0).toFixed(1);
  el.textContent = `Percentage of site at flood risk: ${pct}%`;
}

export function renderRenewables(data) {
  const el = document.getElementById('renewablesSectionInline');
  if (!el) return;
  let html = '';
  html += `<div class="designation-item">Within 5 km: ${Number(data?.within_distance ?? 0)}</div>`;
  if (data?.nearest) {
    html += `<div class="designation-item">Nearest: ${data.nearest.name || 'Unknown'} — ${Number(data.nearest.distance_km).toFixed(2)} km away</div>`;
  }
  el.innerHTML = html;
}

