(function(){
    function onShare(){
        try {
            var titleEl = document.querySelector('.attraction-detail.hero .title');
            var data = {
                title: document.title,
                text: titleEl ? titleEl.textContent : 'Chia sẻ điểm tham quan',
                url: window.location.href
            };
            if (navigator.share) {
                navigator.share(data).catch(function(){});
            } else if (navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href);
                alert('Đã sao chép liên kết');
            }
        } catch(e) {}
    }

    function setupStickyNav(){
        var nav = document.getElementById('stickyNav');
        if (!nav) return;
        var lastY = window.scrollY;
        function onScroll(){
            var y = window.scrollY;
            if (y > 10) nav.classList.add('visible'); else nav.classList.remove('visible');
            lastY = y;
        }
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    function setupHeroScrollEffect(){
        var hero = document.getElementById('hero');
        if (!hero) return;
        function onScroll(){
            var y = window.scrollY;
            if (y > 40) hero.classList.add('scrolled'); else hero.classList.remove('scrolled');
        }
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    function setupSmoothScroll(){
        var links = document.querySelectorAll('.sticky-nav .nav-link[href^="#"]');
        var nav = document.getElementById('stickyNav');
        function scrollToId(id){
            var el = document.getElementById(id);
            if (!el) return;
            var rect = el.getBoundingClientRect();
            var top = rect.top + window.scrollY - (nav ? nav.offsetHeight + 10 : 70);
            window.scrollTo({ top: top, behavior: 'smooth' });
        }
        links.forEach(function(a){
            a.addEventListener('click', function(e){
                var hash = a.getAttribute('href');
                if (!hash || hash.charAt(0) !== '#') return;
                e.preventDefault();
                var id = hash.slice(1);
                scrollToId(id);
                // close mobile menu if open
                var navEl = document.getElementById('stickyNav');
                if (navEl && navEl.classList.contains('open')) navEl.classList.remove('open');
            });
        });
    }

    function setupScrollSpy(){
        var sections = ['overview','experiences','gallery','reviews','practical']
            .map(function(id){ return document.getElementById(id); })
            .filter(Boolean);
        if (!sections.length) return;
        var linkMap = {};
        document.querySelectorAll('.sticky-nav .nav-link').forEach(function(a){
            var sec = a.getAttribute('data-section');
            if (sec) linkMap[sec] = a;
        });
        var active = null;
        var obs = new IntersectionObserver(function(entries){
            entries.forEach(function(entry){
                if (entry.isIntersecting) {
                    var id = entry.target.id;
                    if (active === id) return;
                    active = id;
                    Object.keys(linkMap).forEach(function(key){
                        linkMap[key].classList.toggle('active', key === id);
                    });
                }
            });
        }, { rootMargin: '-40% 0px -55% 0px', threshold: [0, 0.3, 0.6, 1] });
        sections.forEach(function(sec){ obs.observe(sec); });
    }

    function setupExpandableCards(){
        document.addEventListener('click', function(e){
            var btn = e.target.closest('.experience-card .expand-btn');
            var card = btn ? btn.closest('.experience-card') : e.target.closest('.experience-card[data-expandable]');
            if (!card) return;
            if (btn || e.target.closest('.card-header')) {
                card.classList.toggle('expanded');
                var iconBtn = card.querySelector('.expand-btn');
                if (iconBtn) iconBtn.classList.toggle('rotated', card.classList.contains('expanded'));
            }
        });
    }

    function setupGalleryModal(){
        var modal = document.getElementById('galleryModal');
        if (!modal) return;
        var imgEl = modal.querySelector('.modal-image img');
        var counterEl = modal.querySelector('.image-counter');
        var items = Array.prototype.slice.call(document.querySelectorAll('#gallery .gallery-item img'));
        var current = 0;
        function open(index){
            if (!items.length) return;
            current = Math.max(0, Math.min(index, items.length - 1));
            imgEl.src = items[current].getAttribute('src');
            counterEl.textContent = (current + 1) + ' / ' + items.length;
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
        function close(){
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
        function next(delta){ open((current + delta + items.length) % items.length); }
        document.addEventListener('click', function(e){
            var item = e.target.closest('#gallery .gallery-item');
            if (item){
                var idx = parseInt(item.getAttribute('data-index') || '0', 10) || 0;
                open(idx);
                return;
            }
            if (e.target.closest('#galleryModal .modal-close') || e.target.classList.contains('modal-overlay')) close();
            if (e.target.closest('#galleryModal .nav-next')) next(1);
            if (e.target.closest('#galleryModal .nav-prev')) next(-1);
        });
        window.addEventListener('keydown', function(e){ if (e.key === 'Escape') close(); });
    }

    function setupReviewModal(){
        var modal = document.getElementById('reviewModal');
        var openBtn = document.getElementById('writeReviewBtn');
        if (!modal || !openBtn) return;
        function open(){ modal.classList.add('active'); document.body.style.overflow = 'hidden'; }
        function close(){ modal.classList.remove('active'); document.body.style.overflow = ''; }
        openBtn.addEventListener('click', open);
        modal.addEventListener('click', function(e){
            if (e.target.closest('.modal-close') || e.target.classList.contains('modal-overlay')) close();
        });
        var cancel = modal.querySelector('#cancelReview');
        if (cancel) cancel.addEventListener('click', function(){ close(); });
        var form = modal.querySelector('.review-form');
        if (form) form.addEventListener('submit', function(e){
            e.preventDefault();
            var submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn){ submitBtn.disabled = true; submitBtn.textContent = 'Đang gửi...'; }
            setTimeout(function(){
                if (submitBtn){ submitBtn.disabled = false; submitBtn.textContent = 'Gửi đánh giá'; }
                alert('Cảm ơn bạn! Đánh giá đã được gửi.');
                form.reset();
                close();
            }, 800);
        });
    }

    // Mobile menu handled by script.js - safeBindNavbarToggle()

    function initMapOverview(){
        if (typeof maplibregl === 'undefined') return;
        var el = document.getElementById('glanceMap');
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
                layers: [
                    { id: 'base', type: 'raster', source: 'light' }
                ]
            },
            center: [lng, lat],
            zoom: zoom,
            attributionControl: true
        });

        // Disable scroll zoom to avoid accidental zooming while scrolling the page
        map.scrollZoom.disable();
        map.boxZoom.disable();
        map.dragRotate.disable();
        map.keyboard.disable();
        map.doubleClickZoom.enable();
        map.dragPan.enable();

        // Marker factory for consistent UI
        function createMarkerElement(active){
            var m = document.createElement('div');
            m.className = active ? 'map-marker active' : 'map-marker';
            return m;
        }
        var mainMarker = new maplibregl.Marker({ element: createMarkerElement(true) }).setLngLat([lng, lat]).addTo(map);

        // Single attraction popup from data attributes
        var data = {
            name: el.getAttribute('data-name') || '',
            address: el.getAttribute('data-address') || '',
            image: el.getAttribute('data-image') || '',
            url: el.getAttribute('data-url') || ''
        };
        var html = '<div class="map-popup">'
            + '<div class="thumb" style="background-image:url(' + (data.image || '') + ')"></div>'
            + '<div class="info">'
            + '<h4>' + (data.name || '') + '</h4>'
            + '<p>' + (data.address || '') + '</p>'
            + '</div>'
            + '</div>';
        var popup = new maplibregl.Popup({ closeButton: true, offset: 18, maxWidth: '320px' }).setHTML(html);
        mainMarker.setPopup(popup);
        // Open popup initially
        popup.addTo(map);

        // Optional route polyline if provided
        try {
            var route = JSON.parse(el.getAttribute('data-route') || '[]');
            if (Array.isArray(route) && route.length >= 2) {
                map.addSource('route', {
                    type: 'geojson',
                    data: {
                        type: 'Feature',
                        geometry: { type: 'LineString', coordinates: route.map(function(p){ return [p.lng, p.lat]; }) }
                    }
                });
                map.addLayer({
                    id: 'route-line',
                    type: 'line',
                    source: 'route',
                    paint: {
                        'line-color': '#7c3aed',
                        'line-width': 4,
                        'line-opacity': 0.9,
                        'line-dasharray': [2, 2]
                    }
                });
            }
        } catch(_) {}

        // Controls
        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
        map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');

        // Click-to-fly from any element with data-map-lat/lng
        document.addEventListener('click', function(e){
            var container = e.target.closest('[data-map-lat][data-map-lng]');
            if (!container) return;
            var tLat = parseFloat(container.getAttribute('data-map-lat'));
            var tLng = parseFloat(container.getAttribute('data-map-lng'));
            if (isFinite(tLat) && isFinite(tLng)) {
                map.flyTo({ center: [tLng, tLat], zoom: Math.max(14, map.getZoom()), speed: 0.8, curve: 1.4, essential: true });
                mainMarker.setLngLat([tLng, tLat]);
            }
        });

        // No toolbar in detail page
    }

    function init(){
        var shareBtn = document.querySelector('.btn-share');
        if (shareBtn) shareBtn.addEventListener('click', onShare);
        setupStickyNav();
        setupHeroScrollEffect();
        setupSmoothScroll();
        setupScrollSpy();
        setupExpandableCards();
        setupGalleryModal();
        setupReviewModal();
        // setupMobileMenu(); // handled by script.js
        initMapOverview();

        // Reviews slider with dots
        (function(){
            var viewport = document.querySelector('.reviews-pro__viewport');
            var track = document.querySelector('.reviews-pro__track');
            var prev = document.querySelector('.reviews-pro__nav.prev');
            var next = document.querySelector('.reviews-pro__nav.next');
            var dotsContainer = document.querySelector('.reviews-pro__dots');
            if (!viewport || !track || !prev || !next || !dotsContainer) return;

            function getCardWidth(){
                var card = track.querySelector('.reviews-pro__card');
                return card ? (card.offsetWidth + 10) : 0; // 10 = gap
            }
            function getPerView(){
                var w = viewport.clientWidth;
                var cw = getCardWidth();
                return cw ? Math.max(1, Math.floor(w / cw)) : 1;
            }

            var index = 0;
            function getTotalSlides(){
                var totalCards = track.children.length;
                var perView = getPerView();
                return Math.max(1, Math.ceil(totalCards / perView));
            }
            function update(){
                var step = getCardWidth();
                var perView = getPerView();
                var offset = index * step * perView;
                var maxOffset = Math.max(0, track.scrollWidth - viewport.clientWidth);
                if (offset > maxOffset) offset = maxOffset;
                track.style.transform = 'translateX(' + (-offset) + 'px)';
                updateDots();
            }
            function goTo(i){
                var total = getTotalSlides();
                index = Math.max(0, Math.min(i, total - 1));
                update();
            }
            function slide(dir){ goTo(index + dir); }

            function buildDots(){
                dotsContainer.innerHTML = '';
                var total = getTotalSlides();
                for (var i = 0; i < total; i++){
                    var d = document.createElement('button');
                    d.className = 'reviews-pro__dot';
                    d.setAttribute('type', 'button');
                    (function(idx){ d.addEventListener('click', function(){ goTo(idx); }); })(i);
                    dotsContainer.appendChild(d);
                }
                updateDots();
            }
            function updateDots(){
                var ds = dotsContainer.querySelectorAll('.reviews-pro__dot');
                ds.forEach ? ds.forEach(function(el, i){ el.classList.toggle('active', i === index); }) : Array.prototype.forEach.call(ds, function(el, i){ el.classList.toggle('active', i === index); });
            }

            prev.addEventListener('click', function(){ slide(-1); });
            next.addEventListener('click', function(){ slide(1); });
            window.addEventListener('resize', function(){ buildDots(); update(); });

            buildDots();
            update();
        })();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else { init(); }
})();


