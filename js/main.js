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

  // 3. Mapeo de slugs para redirecciones
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
    // …otros estados…
  };

  // 4. Elegir URL de GeoJSON (polígonos de estado o México)
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
      const nameKey = 'Estado';

      // 5a. Capa de polígonos
      const layerGroup = L.geoJSON(geojson, {
        style: feature => ({
          color: '#2E8B57',
          weight: pageKey === 'index' ? 2 : 3,
          fillOpacity: pageKey === 'index' ? 0.3 : 0.2
        }),
        onEachFeature: (feature, lyr) => {
          lyr.options.interactive = true;
          const name = feature.properties[nameKey];
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

      // 5b. Ajustar vista inicial
      const initialBounds = layerGroup.getBounds();
      if (initialBounds.isValid()) {
        map.fitBounds(initialBounds, { padding: [20,20] });
      }

      // 6. Scrollama para index (sin puntos)
      if (pageKey === 'index') {
        const featureLayers = layerGroup.getLayers();
        const scroller = scrollama();
        scroller.setup({ step: '#story section', offset: 0.7, progress: true })
          .onStepEnter(resp => {
            document.querySelectorAll('#story section')
              .forEach(s => s.classList.remove('is-active'));
            resp.element.classList.add('is-active');

            let targetLayer = resp.index === 0
              ? layerGroup
              : featureLayers[resp.index - 1];
            if (targetLayer) {
              map.fitBounds(targetLayer.getBounds(), { padding: [20,20], maxZoom: 8 });
            }
          });
        window.addEventListener('resize', scroller.resize);
      }

      // 7. Scrollama para Baja California Sur con puntos
      if (pageKey === 'baja_california_sur') {
        // Carga del GeoJSON de puntos
        fetch(`${basePath}data/5_Puntos_BCS.geojson`)
          .then(r => r.json())
          .then(pointsGeojson => {
            // Capa de puntos y colección para búsqueda
            const pointsLayer = L.geoJSON(pointsGeojson,
              {
                pointToLayer: (f, latlng) => L.marker(latlng),
                onEachFeature: (f, lyr) => lyr.bindPopup(f.properties.nombre)
              }
            ).addTo(map);

            const points = pointsGeojson.features;

            // Iniciar Scrollama
            const scroller = scrollama();
            scroller.setup({ step: '#story section', offset: 0.7 })
              .onStepEnter(resp => {
                document.querySelectorAll('#story section')
                  .forEach(s => s.classList.remove('is-active'));
                resp.element.classList.add('is-active');

                const id = resp.element.dataset.index; // BCS_1, BCS_2, etc.
                const feat = points.find(f => f.properties.id === id);
                if (feat) {
                  const b = L.geoJSON(feat).getBounds();
                  map.flyToBounds(b, { padding: [20,20], maxZoom: 14 });
                }
              });
            window.addEventListener('resize', scroller.resize);
          })
          .catch(() => console.error('No se pudo cargar 5_Puntos_BCS.geojson'));
      }

    })
    .catch(err => {
      console.error('Error cargando/parsing GeoJSON:', err);
      if (pageKey === 'index') {
        alert('No se pudo cargar el mapa de estados.');
      }
    });
});

// helper slugify
function slugify(name) {
  if (typeof name !== 'string') return '';
  return name.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_');
}
