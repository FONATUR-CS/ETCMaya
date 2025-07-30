// Inicializar mapa
const map = L.map('map', { zoomControl:false })
  .setView([23.6345, -102.5528], 5);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

// Cargar GeoJSON de estados
fetch('data/Estados_1.geojson')
  .then(res => res.json())
  .then(geojson => {
    L.geoJSON(geojson, {
      style: { color:'#2E8B57', weight:2 },
      onEachFeature: function(feature, layer) {
        layer.on('click', () => {
          const slug = feature.properties.ESTADO
            .toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
            .replace(/\s+/g,'_');
          window.location.href = `estados/${slug}.html`;
        });
      }
    }).addTo(map);
  });

// Scroll-trigger (ejemplo mínimo)
const scroller = scrollama();
scroller
  .setup({ step:'#story section', offset:0.7 })
  .onStepEnter(resp => {
    document.querySelectorAll('#story section')
      .forEach(s => s.classList.remove('is-active'));
    resp.element.classList.add('is-active');
  });
window.addEventListener('resize', scroller.resize);
