(function(){
    function initMapOverview(){
        if (typeof maplibregl === 'undefined') return;
        var el = document.getElementById('entMap');
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
                layers: [ { id: 'base', type: 'raster', source: 'light' } ]
            },
            center: [lng, lat],
            zoom: zoom,
            attributionControl: true
        });

        // Align interactions with attractions map
        map.scrollZoom.disable();
        map.boxZoom.disable();
        map.dragRotate.disable();
        map.keyboard.disable();
        map.doubleClickZoom.enable();
        map.dragPan.enable();

        function createMarkerElement(active){
            var m = document.createElement('div');
            m.className = active ? 'map-marker active' : 'map-marker';
            return m;
        }
        var mainMarker = new maplibregl.Marker({ element: createMarkerElement(true) }).setLngLat([lng, lat]).addTo(map);

        // Popup content from data-attributes
        var data = {
            name: el.getAttribute('data-name') || '',
            address: el.getAttribute('data-address') || '',
            image: el.getAttribute('data-image') || ''
        };
        var html = '<div class="map-popup">'
            + (data.image ? '<div class="thumb" style="background-image:url('+ data.image +')"></div>' : '')
            + '<div class="info">'
            + '<h4>' + (data.name || '') + '</h4>'
            + '<p>' + (data.address || '') + '</p>'
            + '</div>'
            + '</div>';
        var popup = new maplibregl.Popup({ closeButton: true, offset: 18, maxWidth: '320px' }).setHTML(html);
        mainMarker.setPopup(popup);
        popup.addTo(map);

        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
        map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');
    }

    function init(){
        initMapOverview();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else { init(); }
})();


