// Leaflet is loaded globally via CDN in index.html

let mapInstance = null;
let drawnItems = null;
let resultsLayer = null;
let polygonDrawer = null;
let onDrawCallbacks = [];

function initMap(targetId = 'map') {
  if (mapInstance) return mapInstance;
  mapInstance = L.map(targetId).setView([54.5, -3.4359], 6);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors' }).addTo(mapInstance);

  drawnItems = new L.FeatureGroup();
  resultsLayer = new L.FeatureGroup();
  mapInstance.addLayer(drawnItems);
  mapInstance.addLayer(resultsLayer);

  polygonDrawer = new L.Draw.Polygon(mapInstance, { allowIntersection: false, showArea: true });

  mapInstance.on(L.Draw.Event.CREATED, function (e) {
    // Only one polygon at a time
    drawnItems.clearLayers();
    resultsLayer.clearLayers();
    drawnItems.addLayer(e.layer);
    onDrawCallbacks.forEach(cb => { try { cb(e.layer); } catch (_) {} });
  });

  return mapInstance;
}

function enableDraw() {
  if (!polygonDrawer) return;
  polygonDrawer.enable();
}

function clearAll() {
  if (drawnItems) drawnItems.clearLayers();
  if (resultsLayer) resultsLayer.clearLayers();
}

function onPolygonDrawn(callback) {
  if (typeof callback === 'function') onDrawCallbacks.push(callback);
}

function getCurrentPolygonGeoJSON() {
  if (!drawnItems) return null;
  const layers = [];
  drawnItems.eachLayer(l => layers.push(l));
  if (layers.length === 0) return null;
  return layers[0].toGeoJSON();
}

function addResultFeature(featureGeoJSON, style, onEachFeature) {
  if (!resultsLayer) return;
  L.geoJSON(featureGeoJSON, {
    style,
    onEachFeature
  }).addTo(resultsLayer);
}

function clearResults() {
  if (resultsLayer) resultsLayer.clearLayers();
}

export const mapApi = {
  initMap,
  enableDraw,
  clearAll,
  onPolygonDrawn,
  getCurrentPolygonGeoJSON,
  addResultFeature,
  clearResults
};

