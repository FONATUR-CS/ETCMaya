// Determinar si cargamos desde carpeta estados/ o desde raíz
const isStatePage = window.location.pathname.includes('/estados/');
const basePath = isStatePage ? '../' : '';

// Inicializar Leaflet
const map = L.map('map', { zoomControl: false })
  .setView([23.6345, -102.5528], 5);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

// Helper: generar slug a partir de nombre de estado
function slugify(name) {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_');
}

// Obtener la clave de la página: 'index' o el slug del estado
const pageKey = (() => {
  if (!isStatePage) return 'index';
  const file = window.location.pathname.split('/').pop();      // e.g. "michoacan.html"
  return file.replace('.html', '');                            // "michoacan"
})();

// Cargar GeoJSON
fetch(basePath + 'data/Estados_1.geojson')
  .then(res => res.json())
  .then(geojson => {
    if (pageKey === 'index') {
      // Índice: dibujar todos y hacer clic para navegar
      L.geoJSON(geojson, {
        style: { color: '#2E8B57', weight: 2 },
        onEachFeature: function(feature, layer) {
          layer.on('click', () => {
            const slug = slugify(feature.properties.ESTADO);
            window.location.href = `estados/${slug}.html`;
          });
        }
      }).addTo(map);
    } else {
      // Página de estado: filtrar sólo ese estado
      const targetName = (() => {
        // Reconstruir nombre original a partir del slug
        // Buscamos en geojson una feature cuyo slug coincida
        for (const f of geojson.features) {
          if (slugify(f.properties.ESTADO) === pageKey) {
            return f.properties.ESTADO;
          }
        }
        return null;
      })();

      if (!targetName) {
        console.error('Estado no encontrado en GeoJSON:', pageKey);
        return;
      }

      const layer = L.geoJSON(geojson, {
        filter: f => f.properties.ESTADO === targetName,
        style: { color: '#2E8B57', weight: 3, fillOpacity: 0.2 }
      }).addTo(map);

      // Zoom al bounds de la capa
      map.fitBounds(layer.getBounds(), { padding: [20, 20] });
    }
  })
  .catch(err => console.error('Error cargando GeoJSON:', err));

// Inicializar Scrollama (sólo para páginas con #story)
if (document.querySelector('#story section')) {
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
