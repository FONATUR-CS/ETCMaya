// 1. Inicializar Leaflet
const map = L.map('map', { zoomControl: false })
  .setView([23.6345, -102.5528], 5);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

// 2. Cargar GeoJSON y hacer clicable cada estado
fetch('data/Estados_1.geojson')
  .then(res => res.json())
  .then(geojson => {
    L.geoJSON(geojson, {
      style: { color: '#2E8B57', weight: 2 },
      onEachFeature: (f, layer) => {
        layer.on('click', () => {
          // convierte nombre a ruta: "Baja California Sur" → "baja_california_sur.html"
          const slug = f.properties.ESTADO
            .toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
            .replace(/\s+/g,'_');
          window.location.href = `${slug}.html`;
        });
      }
    }).addTo(map);
  });

// 3. Definir capítulos de flyTo para el scroll
const chapters = [
  { center: [23.6345, -102.5528], zoom: 5 },  // índice 0
  { center: [23.6345, -102.5528], zoom: 6 },  // índice 1
  { center: [23.6345, -102.5528], zoom: 7 }   // índice 2
];

// 4. Scrollama para enlazar sección → mapa
const scroller = scrollama();
scroller
  .setup({ step: '#story section', offset: 0.6 })
  .onStepEnter(resp => {
    // resaltar sección activa
    document.querySelectorAll('#story section')
      .forEach(s => s.classList.remove('is-active'));
    resp.element.classList.add('is-active');
    // flyTo correspondiente
    const idx = +resp.element.dataset.index;
    if (chapters[idx]) {
      map.flyTo(chapters[idx].center, chapters[idx].zoom, { duration: 1.2 });
    }
  });

// 5. Ajustar al redimensionar
window.addEventListener('resize', scroller.resize);
