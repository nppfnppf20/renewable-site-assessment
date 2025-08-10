import { RENEWABLES_DISTANCE_M } from './config.js';
import { api } from './services/api.js';
import { setFacts } from './core/state.js';
import { renderSections, renderALC, renderFlood, renderRenewables } from './ui/planningPanel.js';
import { mapApi } from './map/map.js';

// Wire existing global Leaflet map setup by reusing the DOM ids
export function initApp() {
  const analyzeBtn = document.getElementById('analyzeBtn');
  const designationsList = document.getElementById('designationsList');
  mapApi.initMap('map');

  let latestLayer = null;
  mapApi.onPolygonDrawn((layer) => { latestLayer = layer; });

  async function runAnalysis(currentPolygon) {
    if (!currentPolygon) return;
    const searchPolygon = currentPolygon.toGeoJSON();

    const analyze = await api.analyzePolygon(searchPolygon);
    setFacts({ layers: analyze });
    renderSections(designationsList, analyze);

    try {
      const alc = await api.alcSummary(searchPolygon);
      setFacts({ alc });
      renderALC(alc);
    } catch (e) {}

    try {
      const flood = await api.floodSummary(searchPolygon, ["Flood risk areas"]);
      setFacts({ flood });
      renderFlood(flood);
    } catch (e) {}

    try {
      const renewables = await api.renewablesProximity(searchPolygon, RENEWABLES_DISTANCE_M);
      setFacts({ renewables });
      renderRenewables(renewables);
    } catch (e) {}
  }

  // Hook into existing analyze button
  if (analyzeBtn) {
    analyzeBtn.addEventListener('click', async () => {
      if (!latestLayer) return;
      await runAnalysis(latestLayer);
    });
  }
}

// Auto-init if loaded after DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

