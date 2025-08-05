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

  // 3. Slug map para redirecciones (añade aquí todos tus estados)
  const slugMap = {
    'Michoacán de Ocampo': 'michoacan',
    'Baja California Sur': 'baja_california_sur',
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

      // Detectar clave de nombre de estado
      const sampleProps = geojson.features[0].properties;
      const nameKey = 'ESTADO' in sampleProps
        ? 'ESTADO'
        : Object.keys(sampleProps).find(k => typeof sampleProps[k] === 'string');
      console.log('Propiedad usada para nombre:', nameKey);

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
              console.log('CLICK en polígono, raw name:', name);
              const slug = slugMap[name] || slugify(name);
              const targetUrl = `estados/${slug}.html`;
              console.log('→ redirigiendo a:', targetUrl);
              window.location.href = targetUrl;
            });
          } else {
            // Popup en página de estado
            const props = feature.properties || {};
            let html = '<table>';
            for (let key in props) {
              html += `<tr><th>${key}</th><td>${props[key]}</td></tr>`;
            }
            lyr.bindPopup(html);
          }
        }
      }).addTo(map);

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
