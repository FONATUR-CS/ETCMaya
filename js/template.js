// js/template.js

// 1. Obtén el “slug” del estado de la URL, p.ej. “veracruz”
const slug = location.pathname.split('/').pop().replace('.html','');
console.log('Estado detectado:', slug);


// 2. Configura los datos por estado
const chapters = {
  veracruz: {
    name: "Veracruz",
    coords: [19.1738, -96.1342],
    zoom: 8,
    sections: [
      {
        title: "Bienvenidos a Veracruz",
        text: "Aquí empieza la aventura de Turismo Comunitario en Veracruz…",
        img: "../img/veracruz.jpg"
      },
      {
        title: "Experiencias Náuticas",
        text: "Descubre las comunidades pesqueras y sus tradiciones…",
        img: "../img/veracruz_nautica.jpg"
      }
      // …añade más secciones según tu narrativa
    ]
  },
  // Agrega objetos similares para cada estado (baja_california_sur, hidalgo, etc.)
};

// 3. Crea la narrativa en el DOM
const cfg = chapters[slug];
document.getElementById('state-name').textContent = cfg.name;
const narrative = document.getElementById('narrative');
cfg.sections.forEach((sec, i) => {
  const s = document.createElement('section');
  s.setAttribute('data-index', i);
  s.innerHTML = `
    <h2>${sec.title}</h2>
    <p>${sec.text}</p>
    <img src="${sec.img}" alt="${sec.title}" loading="lazy">
  `;
  narrative.appendChild(s);
  // Al cargar cada imagen, le añadimos la clase 'loaded' para el fade-in
  const img = s.querySelector('img');
  img.addEventListener('load', () => img.classList.add('loaded'));
});

// 4. Inicializa el mapa centrado en el estado
initMap({
  container: 'map',
  geojson: '../data/Estados_1.geojson',
  defaultView: cfg.coords,
  defaultZoom: cfg.zoom,
  onEachFeature: () => {}
});

// 5. Configura Scrollama para las transiciones suaves
const scroller = scrollama();
scroller
  .setup({ step: '#narrative section', offset: 0.6, progress: true })
  .onStepEnter(e => {
    map.flyTo(cfg.coords, cfg.zoom, { duration: 1.5 });
  });
window.addEventListener('resize', scroller.resize);
