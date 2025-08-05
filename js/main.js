document.addEventListener('DOMContentLoaded', () => {
  // Inicializar el mapa
  const isStatePage = window.location.pathname.includes('/estados/');
  const basePath    = isStatePage ? '../' : '';
  const map = L.map('map', { zoomControl: false })
    .setView([23.6345, -102.5528], 5);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
  }).addTo(map);
  import scrollama from 'scrollama';  // o asume que ya lo has cargado via <script>

const scroller = scrollama();
scroller
  .setup({
    step: '#story section[data-step]',
    offset: 0.6,            // cuando el 60% del step entra en viewport
    progress: true
  })
  .onStepEnter(({ element, index }) => {
    // resalta la sección activa
    document.querySelectorAll('#story section')
      .forEach(s => s.classList.remove('is-active'));
    element.classList.add('is-active');

    // centra o vuela el mapa a una coordenada predefinida
    const coords = [
      [23.6345, -102.5528],   // index 0 → vista general
      [19.7026, -101.1926],   // index 1 → Hidalgo, por ejemplo
      // … añade coords por index
    ];
    map.flyTo(coords[index], 7, { duration: 1.2 });
  })
  .onStepExit(({ element, index, direction }) => {
    // opcional: quita clase o aplica otra animación
  });

window.addEventListener('resize', scroller.resize);

  // Determinar pageKey
  const pageKey = isStatePage
    ? window.location.pathname.split('/').pop().replace('.html','')
    : 'index';

  // Mapeo de slugs para redirecciones
  const slugMap = {
    'Baja California Sur':              'baja_california_sur',
    'Hidalgo':                          'hidalgo',
    'Michoacán de Ocampo':              'michoacan',
    'Morelos':                          'morelos',
    'Nayarit':                          'nayarit',
    'Oaxaca':                           'oaxaca',
    'Puebla':                           'puebla',
    'Tlaxcala':                         'tlaxcala',
    'Veracruz de Ignacio de la Llave':  'veracruz'
    // …añade aquí los demás estados…
  };

  // Elegir URL de GeoJSON
  const geoUrl = pageKey === 'index'
    ? `${basePath}data/Estados_1.geojson`
    : `${basePath}data/${pageKey}.geojson`;

  // Cargar y añadir GeoJSON
  fetch(geoUrl)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(geojson => {
      // Clave exacta en tu GeoJSON
      const nameKey = 'Estado';

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
            // En páginas de estado, mostrar popup con propiedades
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

      // Si es página de estado, ajustar vista
      if (pageKey !== 'index') {
        const bounds = layer.getBounds();
        if (bounds.isValid && bounds.isValid()) {
          map.fitBounds(bounds, { padding: [20,20] });
        }
      }
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
