// ¿Estamos en una página de estado?
const isStatePage = window.location.pathname.includes('/estados/');
const basePath    = isStatePage ? '../' : '';

// inicializa Leaflet
const map = L.map('map', { zoomControl: false })
  .setView([23.6345, -102.5528], 5);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

// helper slugify (igual que antes)
function slugify(name) {
  if (typeof name !== 'string') return '';
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_');
}

// determina pageKey: 'index' o slug del archivo (sin .html)
const pageKey = (() => {
  if (!isStatePage) return 'index';
  return window.location.pathname.split('/').pop().replace('.html','');
})();

// función para cargar un GeoJSON y añadir al mapa
function loadGeoJSON(path, options = {}) {
  fetch(path)
    .then(r => r.json())
    .then(gj => L.geoJSON(gj, options).addTo(map))
    .catch(err => console.error('Error cargando', path, err));
}

if (pageKey === 'index') {
  // --- PÁGINA PRINCIPAL: carga global y clic para navegar ---

  // Mapeo explícito de nombre de ESTADO → slug de archivo
  const slugMap = {
    'Aguascalientes':               'aguascalientes',
    'Baja California':              'baja_california',
    'Baja California Sur':          'baja_california_sur',
    'Campeche':                     'campeche',
    'Chiapas':                      'chiapas',
    'Chihuahua':                    'chihuahua',
    'Ciudad de México':             'ciudad_de_mexico',
    'Coahuila de Zaragoza':         'coahuila',
    'Colima':                       'colima',
    'Durango':                      'durango',
    'Guanajuato':                   'guanajuato',
    'Guerrero':                     'guerrero',
    'Hidalgo':                      'hidalgo',
    'Jalisco':                      'jalisco',
    'México':                       'estado_de_mexico',
    'Michoacán de Ocampo':          'michoacan',
    'Morelos':                      'morelos',
    'Nayarit':                      'nayarit',
    'Nuevo León':                   'nuevo_leon',
    'Oaxaca':                       'oaxaca',
    'Puebla':                       'puebla',
    'Querétaro':                    'queretaro',
    'Quintana Roo':                 'quintana_roo',
    'San Luis Potosí':              'san_luis_potosi',
    'Sinaloa':                      'sinaloa',
    'Sonora':                       'sonora',
    'Tabasco':                      'tabasco',
    'Tamaulipas':                   'tamaulipas',
    'Tlaxcala':                     'tlaxcala',
    'Veracruz de Ignacio de la Llave': 'veracruz',
    'Yucatán':                      'yucatan',
    'Zacatecas':                    'zacatecas'
  };

  loadGeoJSON(basePath + 'data/Estados_1.geojson', {
    style: { color: '#2E8B57', weight: 2 },
    onEachFeature(feature, layer) {
      const name = feature.properties && feature.properties.ESTADO;
      if (typeof name === 'string') {
        // cambiar cursor al pasar por encima
        layer.on('mouseover', () => {
          const el = layer.getElement();
          if (el) el.style.cursor = 'pointer';
        });
        // al hacer clic, navega a la página del estado
        layer.on('click', () => {
          // primero busca en slugMap, si no existe usa slugify genérico
          const slug = slugMap[name] || slugify(name);
          window.location.href = `estados/${slug}.html`;
        });
      }
    }
  });

} else {
  // --- PÁGINA DE ESTADO: carga solo su GeoJSON ---
  const geoPath = `${basePath}data/${pageKey}.geojson`;
  loadGeoJSON(geoPath, {
    style: { color: '#2E8B57', weight: 3, fillOpacity: 0.2 }
  });
  // tras cargar, ajusta zoom automáticamente una vez el tileLayer esté listo
  map.whenReady(() => {
    fetch(geoPath)
      .then(r => r.json())
      .then(gj => {
        const layer = L.geoJSON(gj);
        map.fitBounds(layer.getBounds(), { padding: [20, 20] });
      });
  });
}
