// js/script.js

function initMap({ container, geojson, defaultView, defaultZoom, onEachFeature }) {
  window.map = L.map(container).setView(defaultView, defaultZoom);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18
  }).addTo(map);
  fetch(geojson)
    .then(r => r.json())
    .then(data => L.geoJSON(data, { onEachFeature }).addTo(map));
}
