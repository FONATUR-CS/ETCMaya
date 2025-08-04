// ¿Estamos en una página de estado?
const isStatePage = window.location.pathname.includes('/estados/');
const basePath    = isStatePage ? '../' : '';

// inicializa Leaflet (igual que antes)
const map = L.map('map', { zoomControl: false })
  .setView([23.6345, -102.5528], 5);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

// helper slugify (igual que antes)
function slugify(name) {
  if (typeof name !== 'string') return '';
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_');
}

// determina pageKey: 'index' o slug del archivo (sin .html)
const pageKey = (() => {
  if (!isStatePage) return 'index';
  return window.location.pathname.split('/').pop().replace('.html','');
})();

// función para cargar un GeoJSON y añadir al mapa
function loadGeoJSON(path, options = {}) {
  fetch(path)
    .then(r => r.json())
    .then(gj => L.geoJSON(gj, options).addTo(map))
    .catch(err => console.error('Error cargando', path, err));
}

if (pageKey === 'index') {
  // --- PÁGINA PRINCIPAL: carga global y clic para navegar ---
  loadGeoJSON(basePath + 'data/Estados_1.geojson', {
    style: { color: '#2E8B57', weight: 2 },
    onEachFeature(f, layer) {
      const name = f.properties && f.properties.ESTADO;
      if (name) {
        layer.on('click', () => {
          const slug = slugify(name);
          window.location.href = `estados/${slug}.html`;
        });
      }
    }
  });

} else {
  // --- PÁGINA DE ESTADO: carga solo su GeoJSON ---
  const geoPath = `${basePath}data/${pageKey}.geojson`;
  loadGeoJSON(geoPath, {
    style: { color: '#2E8B57', weight: 3, fillOpacity: 0.2 }
  });
  // tras cargar, ajusta zoom automáticamente una vez el tileLayer esté listo
  map.whenReady(() => {
    fetch(geoPath)
      .then(r => r.json())
      .then(gj => {
        const layer = L.geoJSON(gj);
        map.fitBounds(layer.getBounds(), { padding: [20, 20] });
      });
  });
}
