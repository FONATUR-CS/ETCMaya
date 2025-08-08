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

  // 3. Slug map ...
  const slugMap = { /* … */ };

  // 4. URL de polígonos
  const geoUrl = pageKey === 'index'
    ? `${basePath}data/Estados_1.geojson`
    : `${basePath}data/${pageKey}.geojson`;

  // 5. Fetch polígonos
  fetch(geoUrl)
    .then(r => r.ok ? r.json() : Promise.reject(r.status))
    .then(geojson => {
      const nameKey = 'Estado';
      const layerGroup = L.geoJSON(geojson, { /* estilo y onEachFeature */ })
        .addTo(map);

      // Ajuste inicial
      const initialBounds = layerGroup.getBounds();
      if (initialBounds.isValid()) {
        map.fitBounds(initialBounds, { padding: [20,20] });
      }

      // Referencia al container
      const storyEl = document.getElementById('story');

      // ─── Scrollama para INDEX ───
      if (pageKey === 'index') {
        const featureLayers = layerGroup.getLayers();
        const sc = scrollama();
        sc.setup({
          step: '#story section',
          container: '#story',   // escucha dentro de #story
          offset: 0.7,
          progress: true
        });
        sc.onStepEnter(resp => {
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
        // recalcular en load, resize y scroll de story
        sc.resize();
        window.addEventListener('resize', () => sc.resize());
        storyEl.addEventListener('scroll', () => sc.resize());
      }

      // ─── Scrollama para BCS ───
      if (pageKey === 'baja_california_sur') {
        // icono eco.svg en /img/eco.svg
        const ecoIcon = L.icon({
          iconUrl: `${basePath}img/eco.svg`,
          iconSize: [32,32],
          iconAnchor: [16,32]
        });
        fetch(`${basePath}data/5_Puntos_BCS.geojson`)
          .then(r => r.ok ? r.json() : Promise.reject())
          .then(pointsGeojson => {
            const points = pointsGeojson.features;
            L.geoJSON(pointsGeojson, {
              pointToLayer: (f, latlng) => L.marker(latlng, { icon: ecoIcon }),
              onEachFeature: (f, lyr) => lyr.bindPopup(f.properties.nombre)
            }).addTo(map);

            const sc = scrollama();
            sc.setup({
              step: '#story section',
              container: '#story',
              offset: 0.7,
              progress: true
            });
            sc.onStepEnter(resp => {
              document.querySelectorAll('#story section')
                .forEach(s => s.classList.remove('is-active'));
              resp.element.classList.add('is-active');

              const idx = resp.element.dataset.index;
              if (idx === '0') {
                map.fitBounds(initialBounds, { padding: [20,20] });
              } else {
                const feat = points.find(f => f.properties.id === idx);
                if (feat) {
                  const bounds = L.geoJSON(feat).getBounds();
                  const optZoom = map.getBoundsZoom(bounds);
                  const targetZoom = optZoom > 4 ? optZoom - 4 : optZoom;
                  map.flyToBounds(bounds, { padding: [20,20], maxZoom: targetZoom });
                }
              }
            });
            // recalcular
            sc.resize();
            window.addEventListener('resize', () => sc.resize());
            storyEl.addEventListener('scroll', () => sc.resize());
          })
          .catch(() => console.error('No se pudo cargar 5_Puntos_BCS.geojson'));
      }

    })
    .catch(err => {
      console.error('Error cargando GeoJSON:', err);
      if (pageKey === 'index') alert('No se pudo cargar el mapa de Estados.');
    });
});

// helper slugify…
function slugify(name) {
  if (typeof name !== 'string') return '';
  return name.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_');
}
