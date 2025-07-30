// 1. Inicializar Leaflet
const map = L.map('map', { zoomControl: false })
  .setView([23.6345, -102.5528], 5);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

// 2. Cargar GeoJSON de estados clicables
fetch('data/Estados_1.geojson')
  .then(r=>r.json())
  .then(geojson=>{
    L.geoJSON(geojson, {
      style:{ color:'#2E8B57', weight:2 },
      onEachFeature:(f,layer)=>{
        layer.on('click',()=>{
          const slug = f.properties.ESTADO
            .toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
            .replace(/\s+/g,'_');
          window.location.href = `estados/${slug}.html`;
        });
      }
    }).addTo(map);
  });

// 3. Capítulos según página
const chaptersByPage = {
  'index': [
    { center:[23.6345,-102.5528], zoom:5 },
    { center:[23.6345,-102.5528], zoom:6 },
    { center:[23.6345,-102.5528], zoom:7 }
  ],
  'baja_california_sur': [
    { center:[24.2155,-110.3044], zoom:6 },
    { center:[24.2155,-110.3044], zoom:8 }
  ],
  'hidalgo': [
    { center:[20.0911,-98.7626], zoom:6 },
    { center:[20.0911,-98.7626], zoom:8 }
  ],
  'michoacan': [
    { center:[19.5660,-101.7068], zoom:6 },
    { center:[19.5660,-101.7068], zoom:8 }
  ],
  'morelos': [
    { center:[18.6814,-99.1013], zoom:6 },
    { center:[18.6814,-99.1013], zoom:8 }
  ],
  'nayarit': [
    { center:[21.7514,-104.8455], zoom:6 },
    { center:[21.7514,-104.8455], zoom:8 }
  ],
  'oaxaca': [
    { center:[17.0732,-96.7266], zoom:6 },
    { center:[17.0732,-96.7266], zoom:8 }
  ],
  'puebla': [
    { center:[19.0413,-98.2062], zoom:6 },
    { center:[19.0413,-98.2062], zoom:8 }
  ],
  'tlaxcala': [
    { center:[19.3139,-98.2404], zoom:6 },
    { center:[19.3139,-98.2404], zoom:8 }
  ],
  'veracruz': [
    { center:[19.1738,-96.1342], zoom:6 },
    { center:[19.1738,-96.1342], zoom:8 }
  ]
};

const page = window.location.pathname.split('/').pop().replace('.html','') || 'index';
const chapters = chaptersByPage[page] || chaptersByPage['index'];

// 4. Scrollama
const scroller = scrollama();
scroller
  .setup({ step:'#story section', offset:0.6 })
  .onStepEnter(resp=>{
    document.querySelectorAll('#story section')
      .forEach(s=>s.classList.remove('is-active'));
    resp.element.classList.add('is-active');
    const idx = +resp.element.dataset.index;
    if(chapters[idx]) map.flyTo(chapters[idx].center, chapters[idx].zoom, { duration:1.2 });
  });
window.addEventListener('resize', scroller.resize);
