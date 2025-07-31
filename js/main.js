// Determina si estamos en una página de estado (en carpeta /estados/)
const isStatePage = window.location.pathname.includes('/estados/');
const basePath = isStatePage ? '../' : '';

// Inicializa Leaflet
const map = L.map('map', { zoomControl: false })
  .setView([23.6345, -102.5528], 5);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

// Función auxiliar segura para crear slugs
function slugify(name) {
  if (typeof name !== 'string') return '';
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_');
}

// Identifica la clave de página: 'index' o el slug (sin extensión)
const pageKey = (() => {
  if (!isStatePage) return 'index';
  const file = window.location.pathname.split('/').pop(); // e.g. "michoacan.html"
  return file.replace('.html', '');                      // "michoacan"
})();

// Carga el GeoJSON
fetch(basePath + 'data/Estados_1.geojson')
  .then(res => res.json())
  .then(geojson => {
    if (pageKey === 'index') {
      // Página principal: dibuja todos los estados y clic para navegar
      L.geoJSON(geojson, {
        style: { color: '#2E8B57', weight: 2 },
        onEachFeature(feature, layer) {
          const name = feature.properties && feature.properties.ESTADO;
          if (typeof name === 'string') {
            layer.on('click', () => {
              const slug = slugify(name);
              window.location.href = `estados/${slug}.html`;
            });
          }
        }
      }).addTo(map);

    } else {
      // Página de estado: filtrar solo el polígono cuyo slug empieza con pageKey
      const stateLayer = L.geoJSON(geojson, {
        filter(feature) {
          const name = feature.properties && feature.properties.ESTADO;
          if (typeof name !== 'string') return false;
          const s = slugify(name);
          return s.startsWith(pageKey);
        },
        style: { color: '#2E8B57', weight: 3, fillOpacity: 0.2 }
      }).addTo(map);

      // Zoom al bounds de la capa si existe
      if (stateLayer && stateLayer.getBounds) {
        const bounds = stateLayer.getBounds();
        if (bounds.isValid && bounds.isValid()) {
          map.fitBounds(bounds, { padding: [20, 20] });
        } else {
          console.error('Bounds inválido para el estado:', pageKey);
        }
      } else {
        console.error('No se pudo crear la capa del estado:', pageKey);
      }
    }
  })
  .catch(err => console.error('Error cargando GeoJSON:', err));

// Configura Scrollama si hay secciones
if (document.querySelectorAll('#story section').length) {
  const scroller = scrollama();
  scroller
    .setup({ step: '#story section', offset: 0.7 })
    .onStepEnter(resp => {
      document.querySelectorAll('#story section')
        .forEach(s => s.classList.remove('is-active'));
      resp.element.classList.add('is-active');
    });
  window.addEventListener('resize', scroller.resize);
}
