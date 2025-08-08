document.addEventListener('DOMContentLoaded', () => {
  // … (todo igual hasta BCS) …

      // ─── Scrollama para BCS ───
      if (pageKey === 'baja_california_sur') {
        const ecoIcon = L.icon({
          iconUrl: `${basePath}img/eco.svg`,
          iconSize: [32,32],
          iconAnchor: [16,32]
        });

        fetch(`${basePath}data/5_Puntos_BCS.geojson`)
          .then(r => {
            if (!r.ok) throw new Error(r.statusText);
            return r.json();
          })
          .then(pointsGeojson => {
            const points = pointsGeojson.features;

            // 1) Añadimos la capa de puntos y la guardamos
            const pointsLayer = L.geoJSON(pointsGeojson, {
              pointToLayer: (f, latlng) => L.marker(latlng, { icon: ecoIcon }),
              onEachFeature: (f, lyr) => lyr.bindPopup(f.properties.nombre)
            }).addTo(map);

            // 2) Scrollama
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
                // Mostrar polígonos y vista general
                if (!map.hasLayer(layerGroup)) map.addLayer(layerGroup);
                map.fitBounds(initialBounds, { padding: [20,20] });
              } else {
                // Ocultar polígonos
                if (map.hasLayer(layerGroup)) map.removeLayer(layerGroup);

                // Zoom al punto
                const feat = points.find(f => f.properties.id === idx);
                if (feat) {
                  const b = L.geoJSON(feat).getBounds();
                  const optZ = map.getBoundsZoom(b);
                  const tz = optZ > 4 ? optZ - 4 : optZ;
                  map.flyToBounds(b, { padding: [20,20], maxZoom: tz });
                }
              }
            });

            window.addEventListener('resize', () => sc.resize());
          })
          .catch(() => console.error('No se pudo cargar 5_Puntos_BCS.geojson'));
      }

  // … resto del código sin cambios …
});
