document.addEventListener('DOMContentLoaded', () => {
  // Observar cuando #map aparezca en viewport
  const mapEl = document.getElementById('map');
  const obs   = new IntersectionObserver((entries, observer) => {
    if (entries[0].isIntersecting) {
      observer.disconnect();
      initMap();
    }
  }, { rootMargin: '200px' });
  obs.observe(mapEl);
});

function initMap() {
  // 1. Inicializar el mapa
  const isStatePage = window.location.pathname.includes('/estados/');
  const basePath    = isStatePage ? '../' : '';
  const map = L.map('map', { zoomControl: false })
    .setView([23.6345, -102.5528], 5);
  
  // 1) Satélite (Esri World Imagery)
  const esriImagery = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    {
      attribution:
        'Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community'
    }
  const esriTransport = L.tileLayer(
  'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
  { pane: 'labels' }
).addTo(map);
  
  // 2) Pane para etiquetas arriba de todo (no bloquea clics)
  map.createPane('labels');
  map.getPane('labels').style.zIndex = 650;
  map.getPane('labels').style.pointerEvents = 'none';
  
  // 3) Etiquetas (nombres de lugares)
  const esriLabels = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
    {
      attribution: 'Labels © Esri',
      pane: 'labels'
    }
  ).addTo(map);


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
      // 5a. Crear y mostrar la capa de polígonos
      const layerGroup = L.geoJSON(geojson, {
        style: f => ({
          color: '#611232',
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
            // Popup en páginas de estado
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

      // 5b. Ajustar vista inicial a todo el layerGroup
      const initialBounds = layerGroup.getBounds();
      if (initialBounds.isValid()) {
        map.fitBounds(initialBounds, { padding: [20,20] });
      }

      // ─── Scrollama para INDEX ───
      if (pageKey === 'index') {
        const featureLayers = layerGroup.getLayers();
        const sc = scrollama();
        sc.setup({
          step: '#story section',
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
        window.addEventListener('resize', () => sc.resize());
      }

      // ─── Scrollama y puntos para BCS ───
      if (pageKey === 'baja_california_sur') {
        // 1) Icono eco.svg
        const ecoIcon = L.icon({
          iconUrl: `${basePath}img/eco.svg`,
          iconSize: [32,32],
          iconAnchor: [16,32]
        });

        // 2) Cargar y mostrar puntos
        fetch(`${basePath}data/5_Puntos_BCS.geojson`)
          .then(r => {
            if (!r.ok) throw new Error(r.statusText);
            return r.json();
          })
          .then(pointsGeojson => {
            const points = pointsGeojson.features;

            // guardamos la capa de puntos, con popup y handler de clic
            const pointsLayer = L.geoJSON(pointsGeojson, {
              pointToLayer: (f, latlng) => L.marker(latlng, { icon: ecoIcon }),
              onEachFeature: (f, lyr) => {
                const raw   = f.properties;
                const label = raw.Name || raw.name || raw.nombre || 'Sin título';
                lyr.bindPopup(label);

                lyr.on('click', () => {
                  if (map.hasLayer(layerGroup)) map.removeLayer(layerGroup);
                  const b    = L.geoJSON(f).getBounds();
                  const optZ = map.getBoundsZoom(b);
                  const tz   = optZ > 4 ? optZ - 4 : optZ;
                  map.flyToBounds(b, { padding: [20,20], maxZoom: tz });
                  map.once('moveend', () => lyr.openPopup());

                  const sec = document.querySelector(
                    `#story section[data-index="${f.properties.id}"]`
                  );
                  if (sec) {
                    document.querySelectorAll('#story section')
                      .forEach(s => s.classList.remove('is-active'));
                    sec.classList.add('is-active');
                    sec.scrollIntoView({ behavior: 'smooth' });
                  }
                });
              }
            }).addTo(map);

            // 3) Scrollama en BCS
            const sc = scrollama();
            sc.setup({
              step: '#story section',
              offset: 0.7,
              progress: true
            })
            .onStepEnter(resp => {
              document.querySelectorAll('#story section')
                .forEach(s => s.classList.remove('is-active'));
              resp.element.classList.add('is-active');

              const idx = resp.element.dataset.index;
              if (idx === '0') {
                if (!map.hasLayer(layerGroup)) map.addLayer(layerGroup);
                map.fitBounds(initialBounds, { padding: [20,20] });
              } else {
                if (map.hasLayer(layerGroup)) map.removeLayer(layerGroup);
                const feat = points.find(f => f.properties.id === idx);
                if (feat) {
                  const bounds = L.geoJSON(feat).getBounds();
                  const optZ   = map.getBoundsZoom(bounds);
                  const tz     = optZ > 4 ? optZ - 4 : optZ;
                  map.flyToBounds(bounds, { padding: [20,20], maxZoom: tz });
                }
              }
            });
            window.addEventListener('resize', () => sc.resize());
          })
          .catch(() => console.error('No se pudo cargar 5_Puntos_BCS.geojson'));
      }

    })
    .catch(err => {
      console.error('Error cargando GeoJSON:', err);
      if (pageKey === 'index') alert('No se pudo cargar el mapa de estados.');
    });
}

// helper slugify
function slugify(name) {
  return typeof name === 'string'
    ? name.toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .replace(/\s+/g, '_')
    : '';
}
