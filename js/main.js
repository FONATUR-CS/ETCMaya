document.addEventListener('DOMContentLoaded', () => {
  // 1. Inicializar el mapa
  const isStatePage = window.location.pathname.includes('/estados/');
  const basePath    = isStatePage ? '../' : '';
  const map = L.map('map', { zoomControl: false })
    .setView([23.6345, -102.5528], 5);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
  }).addTo(map);

  // 2. Determinar pageKey
  const pageKey = isStatePage
    ? window.location.pathname.split('/').pop().replace('.html','')
    : 'index';

  // 3. Slug map para redirecciones
  const slugMap = {
    'Baja California Sur':             'baja_california_sur',
    'Hidalgo':                         'hidalgo',
    'Michoacán de Ocampo':             'michoacan',
    'Morelos':                         'morelos',
    'Nayarit':                         'nayarit',
    'Oaxaca':                          'oaxaca',
    'Puebla':                          'puebla',
    'Tlaxcala':                        'tlaxcala',
    'Veracruz de Ignacio de la Llave': 'veracruz'
    // …añade aquí los demás estados…
  };

  // 4. URL de GeoJSON
  const geoUrl = pageKey === 'index'
    ? `${basePath}data/Estados_1.geojson`
    : `${basePath}data/${pageKey}.geojson`;

  // 5. Cargar y añadir GeoJSON
  fetch(geoUrl)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(geojson => {
      // Clave exacta en tu GeoJSON
      const nameKey = 'Estado';

      // Añadimos la capa de GeoJSON
      const layer = L.geoJSON(geojson, {
        style: feature => ({
          color: '#2E8B57',
          weight: pageKey === 'index' ? 2 : 3,
          fillOpacity: pageKey === 'index' ? 0.3 : 0.2
        }),
        onEachFeature: (feature, lyr) => {
          lyr.options.interactive = true;
          const name = feature.properties && feature.properties[nameKey];

          if (pageKey === 'index') {
            lyr.on('mouseover', () => lyr.getElement().style.cursor = 'pointer');
            lyr.on('click', () => {
              const slug = slugMap[name] || slugify(name);
              window.location.href = `estados/${slug}.html`;
            });
          } else {
            const props = feature.properties || {};
            let html = '<table>';
            for (let key in props) {
              html += `<tr><th>${key}</th><td>${props[key]}</td></tr>`;
            }
            html += '</table>';
            lyr.bindPopup(html);
          }
        }
      }).addTo(map);

      // ─── Cambio: ajustar vista inicial en página principal ───
      if (pageKey === 'index') {
        const initialBounds = layer.getBounds();
        if (initialBounds.isValid && initialBounds.isValid()) {
          map.fitBounds(initialBounds, { padding: [20,20] });
        }
      }
      // ─────────────────────────────────────────────────────────

      // Si es página de estado, ajustar vista a su bounds
      if (pageKey !== 'index') {
        const bounds = layer.getBounds();
        if (bounds.isValid && bounds.isValid()) {
          map.fitBounds(bounds, { padding: [20,20] });
        }
      }

      // ─────────── Scrollama (solo en index) ───────────
      if (pageKey === 'index') {
        // Extraemos cada subcapa en orden
        const featureLayers = layer.getLayers();

        const scroller = scrollama();
        scroller
          .setup({
            step: '#story section',
            offset: 0.7,
            progress: true
          })
          .onStepEnter(response => {
            // Resaltar sección activa
            document.querySelectorAll('#story section')
              .forEach(s => s.classList.remove('is-active'));
            response.element.classList.add('is-active');

            // Ajustar vista al bounds del layer correspondiente
            const lyr = featureLayers[response.index];
            if (lyr) {
              const b = lyr.getBounds();
              map.fitBounds(b, { padding: [20,20], maxZoom: 8 });
            }
          });

        window.addEventListener('resize', scroller.resize);
      }
      // ────────────────────────────────────────────────────
    })
    .catch(err => {
      console.error('Error cargando/parsing GeoJSON:', err);
      if (pageKey === 'index') {
        alert('No se pudo cargar el mapa de estados. Revisa la consola.');
      }
    });
});

// helper slugify
function slugify(name) {
  if (typeof name !== 'string') return '';
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_');
}
