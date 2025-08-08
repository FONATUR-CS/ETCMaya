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

  // 3. Slug map…
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

  // 4. URL de polígonos
  const geoUrl = pageKey === 'index'
    ? `${basePath}data/Estados_1.geojson`
    : `${basePath}data/${pageKey}.geojson`;

  // 5. Cargar polígonos
  fetch(geoUrl)
    .then(r => {
      if (!r.ok) throw new Error(r.statusText);
      return r.json();
    })
    .then(geojson => {
      // 5a. Capa de polígonos con color original
      const layerGroup = L.geoJSON(geojson, {
        style: feature => ({
          color: '#2E8B57',               // COLOR ORIGINAL
          weight: pageKey === 'index' ? 2 : 3,
          fillOpacity: pageKey === 'index' ? 0.3 : 0.2
        }),
        onEachFeature: (feature, lyr) => {
          lyr.options.interactive = true;
          const name = feature.properties.Estado;
          if (pageKey === 'index') {
            lyr.on('mouseover', () => lyr.getElement().style.cursor = 'pointer');
            lyr.on('click', () => {
              const slug = slugMap[name] || slugify(name);
              window.location.href = `estados/${slug}.html`;
            });
          } else {
            const props = feature.properties || {};
            let html = '<table>';
            for (let k in props) {
              html += `<tr><th>${k}</th><td>${props[k]}</td></tr>`;
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

      // Referencia al contenedor de scroll
      const storyEl = document.getElementById('story');

      // ─────────── Scrollama para INDEX ───────────
      if (pageKey === 'index') {
        const featureLayers = layerGroup.getLayers();
        const sc = scrollama();
        sc.setup({
          step: '#story section',
          container: storyEl,   // pasamos el elemento, no la cadena
          offset: 0.7,
          progress: true
        })
        .onStepEnter(resp => {
          document.querySelectorAll('#story section')
            .forEach(s => s.classList.remove('is-active'));
          resp.element.classList.add('is-active');

          const layer = resp.index === 0
            ? layerGroup
            : featureLayers[resp.index - 1];
          if (layer) {
            map.fitBounds(layer.getBounds(), { padding: [20,20], maxZoom: 8 });
          }
        });
        // Forzar recálculo al iniciar y al hacer scroll o resize
        sc.resize();
        storyEl.addEventListener('scroll', () => sc.resize());
        window.addEventListener('resize', () => sc.resize());
      }

      // ─────────── Scrollama para BCS ───────────
      if (pageKey === 'baja_california_sur') {
        // Icono eco.svg
        const ecoIcon = L.icon({
          iconUrl: `${basePath}img/eco.svg`,
          iconSize: [32,32],
          iconAnchor: [16,32]
        });

        // Carga de puntos
        fetch(`${basePath}data/5_Puntos_BCS.geojson`)
          .then(r => {
            if (!r.ok) throw new Error(r.statusText);
            return r.json();
          })
          .then(pointsGeojson => {
            const points = pointsGeojson.features;

            L.geoJSON(pointsGeojson, {
              pointToLayer: (f, latlng) => L.marker(latlng, { icon: ecoIcon }),
              onEachFeature: (f, lyr) => lyr.bindPopup(f.properties.nombre)
            }).addTo(map);

            const sc = scrollama();
            sc.setup({
              step: '#story section',
              container: storyEl,   // pasamos el elemento
              offset: 0.7,
              progress: true
            })
            .onStepEnter(resp => {
              document.querySelectorAll('#story section')
                .forEach(s => s.classList.remove('is-active'));
              resp.element.classList.add('is-active');

              const idx = resp.element.dataset.index;
              if (idx === '0') {
                map.fitBounds(initialBounds, { padding: [20,20] });
              } else {
                const feat = points.find(f => f.properties.id === idx);
                if (feat) {
                  const b = L.geoJSON(feat).getBounds();
                  const optZ = map.getBoundsZoom(b);
                  const tz = optZ > 4 ? optZ - 4 : optZ;
                  map.flyToBounds(b, { padding: [20,20], maxZoom: tz });
                }
              }
            });
            sc.resize();
            storyEl.addEventListener('scroll', () => sc.resize());
            window.addEventListener('resize', () => sc.resize());
          })
          .catch(() => console.error('No se pudo cargar 5_Puntos_BCS.geojson'));
      }

    })
    .catch(err => {
      console.error('Error cargando GeoJSON:', err);
      if (pageKey === 'index') alert('No se pudo cargar el mapa de estados.');
    });
});

// helper slugify
function slugify(name) {
  if (typeof name !== 'string') return '';
  return name.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_');
}
