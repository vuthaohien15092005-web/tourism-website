(function(){
  function openMapModal(opts){
    var modal = document.getElementById('cuiMapModal');
    if (!modal){
      modal = document.createElement('div');
      modal.id = 'cuiMapModal';
      modal.className = 'cui-map-modal';
      modal.innerHTML = '<div class="cui-map-overlay"></div>'+
        '<div class="cui-map-content">'+
          '<div class="cui-map-header"><strong>'+ (opts.name||'Địa điểm') +'</strong><div style="color:#555">'+ (opts.address||'') +'</div></div>'+
          '<button class="cui-map-close" aria-label="Đóng">×</button>'+
          '<div id="cuiMapContainer" class="cui-map-container"></div>'+
        '</div>';
      document.body.appendChild(modal);
    }
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    if (typeof maplibregl !== 'undefined'){
      // wait for modal to layout
      setTimeout(function(){
        var container = document.getElementById('cuiMapContainer');
        container.innerHTML = '';
        var map = new maplibregl.Map({
          container: container,
          style: {
            version: 8,
            name: 'Minimal Light',
            sources: { light: { type: 'raster', tiles: ['https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png'], tileSize: 256, attribution: '© OpenStreetMap, © CARTO' }},
            layers: [{ id: 'base', type: 'raster', source: 'light' }]
          },
          center: [ (opts.lng && parseFloat(opts.lng)) || 105.83416, (opts.lat && parseFloat(opts.lat)) || 21.02776 ],
          zoom: opts.zoom || 14,
          attributionControl: true
        });
        map.scrollZoom.disable();
        map.boxZoom.disable();
        map.dragRotate.disable();
        map.keyboard.disable();
        map.doubleClickZoom.enable();
        map.dragPan.enable();

        var el = document.createElement('div'); el.className = 'map-marker active';
        var marker = new maplibregl.Marker({ element: el })
          .setLngLat([ (opts.lng && parseFloat(opts.lng)) || 105.83416, (opts.lat && parseFloat(opts.lat)) || 21.02776 ])
          .addTo(map);

        var html = '<div class="map-popup">'+
            '<div class="info">'+
              '<h4>'+ (opts.name||'') +'</h4>'+
              '<p>'+ (opts.address||'') +'</p>'+
            '</div>'+
          '</div>';
        var popup = new maplibregl.Popup({ closeButton: true, offset: 18, maxWidth: '320px' }).setHTML(html);
        marker.setPopup(popup);
        popup.addTo(map);
        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
        map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');

        // Ensure map paints after modal animation
        var resizeOnce = function(){ try { map.resize(); } catch(_){} };
        requestAnimationFrame(function(){ requestAnimationFrame(resizeOnce); });
        var content = modal.querySelector('.cui-map-content');
        if (content) content.addEventListener('transitionend', resizeOnce, { once: true });
        map.on('load', resizeOnce);
      }, 120);
    }

    function close(){ modal.classList.remove('active'); document.body.style.overflow = ''; }
    modal.querySelector('.cui-map-close').onclick = close;
    modal.querySelector('.cui-map-overlay').onclick = close;
  }

  function init(){
    document.addEventListener('click', function(e){
      var link = e.target.closest('.btn-map[data-map-url]');
      if (!link) return;
      e.preventDefault();
      openMapModal({ 
        name: link.getAttribute('data-name') || '', 
        address: link.getAttribute('data-address') || '',
        lat: link.getAttribute('data-lat') || '',
        lng: link.getAttribute('data-lng') || ''
      });
    });
  }

  function initMapOverview(){
    if (typeof maplibregl === 'undefined') return;
    var el = document.getElementById('cuisineMap');
    if (!el) return;
    var lat = parseFloat(el.getAttribute('data-lat') || '21.028511');
    var lng = parseFloat(el.getAttribute('data-lng') || '105.804817');
    var zoom = parseFloat(el.getAttribute('data-zoom') || '14');
    var map = new maplibregl.Map({
      container: el,
      style: {
        version: 8,
        name: 'Minimal Light',
        sources: {
          light: {
            type: 'raster',
            tiles: ['https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap, © CARTO'
          }
        },
        layers: [{ id: 'base', type: 'raster', source: 'light' }]
      },
      center: [lng, lat],
      zoom: zoom,
      attributionControl: true
    });
    map.scrollZoom.disable();
    map.boxZoom.disable();
    map.dragRotate.disable();
    map.keyboard.disable();
    map.doubleClickZoom.enable();
    map.dragPan.enable();

    var el = document.createElement('div'); el.className = 'map-marker active';
    var marker = new maplibregl.Marker({ element: el })
      .setLngLat([lng, lat])
      .addTo(map);

    var html = '<div class="map-popup">'+
        '<div class="info">'+
          '<h4>'+ (el.getAttribute('data-name')||'') +'</h4>'+
          '<p>'+ (el.getAttribute('data-address')||'') +'</p>'+
        '</div>'+
      '</div>';
    var popup = new maplibregl.Popup({ closeButton: true, closeOnClick: false })
      .setHTML(html);
    marker.setPopup(popup);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  
  // Initialize map overview
  document.addEventListener('DOMContentLoaded', function(){
    initMapOverview();
  });
})();


