document.addEventListener('DOMContentLoaded', () => {
  console.log('🔥 main.js cargado y corriendo —', new Date().toISOString());

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
  console.log('pageKey:', pageKey);

  // 3. Slug map para redirecciones (ajusta si faltan estados)
  const slugMap = {
    'Baja California Sur':             'baja_california_sur',
    'Hidalgo':                         'hidalgo',
    'Michoacán de Ocampo':             'michoacan',
    'Morelos':                         'morelos',
    'Nayarit':                         'nayarit',
    'Oaxaca':                          'oaxaca',
    'Puebla':                          'puebla',
    'Tlaxcala':                        'tlaxcala',
    'Veracruz de Ignacio de la Llave':'veracruz'
    // …otros mapeos…
  };

  // 4. URL de GeoJSON
  const geoUrl = pageKey === 'index'
    ? `${basePath}data/Estados_1.geojson`
    : `${basePath}data/${pageKey}.geojson`;
  console.log('Fetch GeoJSON desde:', geoUrl);

  // 5. Cargar y añadir GeoJSON
  fetch(geoUrl)
    .then(res => {
      console.log('Fetch status:', res.status);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(geojson => {
      console.log('GeoJSON recibido, features:', geojson.features.length);

      // ─── PARTE 1: Forzar la clave exacta de tu GeoJSON ───
      const nameKey = 'Estado';
      console.log('⚙️ Usando nameKey =', nameKey);
      // ──────────────────────────────────────────────────────

      const layer = L.geoJSON(geojson, {
        style: feature => ({
          color: '#2E8B57',
          weight: pageKey === 'index' ? 2 : 3,
          fillOpacity: pageKey === 'index' ? 0.3 : 0.2
        }),
        onEachFeature: (feature, lyr) => {
          lyr.options.interactive = true;
          const name = feature.properties && feature.properties[nameKey];
          console.log('Feature name:', name);

          if (pageKey === 'index') {
            // página principal: clic para navegar
            lyr.on('mouseover', () => lyr.getElement().style.cursor = 'pointer');
            lyr.on('click', () => {
              console.log('CLICK en polígono:', name);
              const slug = slugMap[name] || slugify(name);
              const targetUrl = `estados/${slug}.html`;
              console.log('→ redirigiendo a:', targetUrl);
              window.location.href = targetUrl;
            });
          } else {
            // página de estado: mostrar popup con la tabla de propiedades
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

      // Ajustar vista en página de estado
      if (pageKey !== 'index') {
        const bounds = layer.getBounds();
        console.log('Bounds:', bounds);
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
