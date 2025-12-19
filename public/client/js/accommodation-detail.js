/* ===========================================
   ACCOMMODATION DETAIL PAGE JAVASCRIPT
   Clean, Modern, Feature-rich
   =========================================== */

(function() {
    'use strict';

    /* ===========================================
       MAP INITIALIZATION
       =========================================== */
    function initMap() {
        if (typeof maplibregl === 'undefined') {
            console.warn('MapLibre GL is not loaded');
            return;
        }
        
        var el = document.getElementById('accMap');
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
        
        // Disable scroll zoom to avoid accidental zooming
        map.scrollZoom.disable();
        map.boxZoom.disable();
        map.dragRotate.disable();
        map.keyboard.disable();
        map.doubleClickZoom.enable();
        map.dragPan.enable();

        // Create custom marker
        function createMarkerElement() { 
            var m = document.createElement('div'); 
            m.className = 'map-marker active'; 
            return m; 
        }
        
        var marker = new maplibregl.Marker({ 
            element: createMarkerElement() 
        }).setLngLat([lng, lat]).addTo(map);

        // Create popup with accommodation info
        var data = {
            name: el.getAttribute('data-name') || '',
            address: el.getAttribute('data-address') || '',
            image: el.getAttribute('data-image') || ''
        };
        
        var html = '<div class="map-popup">'
            + '<div class="thumb" style="background-image:url(' + (data.image || '') + ')"></div>'
            + '<div class="info">'
            + '<h4>' + (data.name || '') + '</h4>'
            + '<p>' + (data.address || '') + '</p>'
            + '</div>'
            + '</div>';
            
        var popup = new maplibregl.Popup({ 
            closeButton: true, 
            offset: 18, 
            maxWidth: '320px' 
        }).setHTML(html);
        
        marker.setPopup(popup);
        popup.addTo(map);

        // Add navigation controls
        map.addControl(new maplibregl.NavigationControl({ 
            showCompass: false 
        }), 'bottom-right');
        
        map.addControl(new maplibregl.ScaleControl({ 
            unit: 'metric' 
        }), 'bottom-left');
    }

    /* ===========================================
       GALLERY MODAL / LIGHTBOX
       =========================================== */
    function initGalleryModal() {
        var modal = document.getElementById('galleryModal');
        if (!modal) return;
        
        var imgEl = modal.querySelector('.modal-image img');
        var counterEl = modal.querySelector('.image-counter');
        var items = Array.prototype.slice.call(
            document.querySelectorAll('#gallery .gallery-item img')
        );
        var current = 0;

        function open(index) {
            if (!items.length) return;
            current = Math.max(0, Math.min(index, items.length - 1));
            imgEl.src = items[current].getAttribute('src');
            imgEl.alt = items[current].getAttribute('alt') || 'Gallery image';
            counterEl.textContent = (current + 1) + ' / ' + items.length;
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function close() {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }

        function next(delta) {
            var newIndex = (current + delta + items.length) % items.length;
            open(newIndex);
        }

        // Click on gallery item to open lightbox
        document.addEventListener('click', function(e) {
            var item = e.target.closest('#gallery .gallery-item');
            if (item) {
                var idx = parseInt(item.getAttribute('data-index') || '0', 10);
                open(idx);
                return;
            }
            
            // Close modal
            if (e.target.closest('#galleryModal .modal-close') || 
                e.target.classList.contains('modal-overlay')) {
                close();
            }
            
            // Navigation
            if (e.target.closest('#galleryModal .nav-next')) next(1);
            if (e.target.closest('#galleryModal .nav-prev')) next(-1);
        });

        // Keyboard navigation
        window.addEventListener('keydown', function(e) {
            if (!modal.classList.contains('active')) return;
            
            if (e.key === 'Escape') close();
            if (e.key === 'ArrowRight') next(1);
            if (e.key === 'ArrowLeft') next(-1);
        });

        // Touch swipe support for mobile
        var touchStartX = 0;
        var touchEndX = 0;
        
        modal.addEventListener('touchstart', function(e) {
            touchStartX = e.changedTouches[0].screenX;
        }, false);
        
        modal.addEventListener('touchend', function(e) {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, false);
        
        function handleSwipe() {
            var swipeThreshold = 50;
            if (touchEndX < touchStartX - swipeThreshold) {
                next(1); // Swipe left - next image
            }
            if (touchEndX > touchStartX + swipeThreshold) {
                next(-1); // Swipe right - previous image
            }
        }
    }

    /* ===========================================
       REVIEWS SLIDER
       =========================================== */
    function initReviewsSlider() {
        // Don't initialize slider if using external widget (Shapo, Google Reviews, etc.)
        var widgetWrapper = document.querySelector('.widget-wrapper');
        if (widgetWrapper) {
            console.log('External review widget detected, skipping slider initialization');
            return;
        }
        
        var viewport = document.querySelector('.reviews-pro__viewport');
        var track = document.querySelector('.reviews-pro__track');
        var prevBtn = document.querySelector('.reviews-pro__nav.prev');
        var nextBtn = document.querySelector('.reviews-pro__nav.next');
        var dotsContainer = document.querySelector('.reviews-pro__dots');
        
        if (!viewport || !track || !prevBtn || !nextBtn || !dotsContainer) return;

        var index = 0;

        function getCardWidth() {
            var card = track.querySelector('.reviews-pro__card');
            return card ? (card.offsetWidth + 16) : 0; // 16 = gap
        }

        function getPerView() {
            var w = viewport.clientWidth;
            var cw = getCardWidth();
            return cw ? Math.max(1, Math.floor(w / cw)) : 1;
        }

        function getTotalSlides() {
            var totalCards = track.children.length;
            var perView = getPerView();
            return Math.max(1, Math.ceil(totalCards / perView));
        }

        function update() {
            var step = getCardWidth();
            var perView = getPerView();
            var offset = index * step * perView;
            var maxOffset = Math.max(0, track.scrollWidth - viewport.clientWidth);
            
            if (offset > maxOffset) offset = maxOffset;
            
            track.style.transform = 'translateX(' + (-offset) + 'px)';
            updateDots();
        }

        function goTo(i) {
            var total = getTotalSlides();
            index = Math.max(0, Math.min(i, total - 1));
            update();
        }

        function slide(dir) {
            goTo(index + dir);
        }

        function buildDots() {
            dotsContainer.innerHTML = '';
            var total = getTotalSlides();
            
            for (var i = 0; i < total; i++) {
                var dot = document.createElement('button');
                dot.className = 'reviews-pro__dot';
                dot.setAttribute('type', 'button');
                dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
                
                (function(idx) {
                    dot.addEventListener('click', function() {
                        goTo(idx);
                    });
                })(i);
                
                dotsContainer.appendChild(dot);
            }
            updateDots();
        }

        function updateDots() {
            var dots = dotsContainer.querySelectorAll('.reviews-pro__dot');
            dots.forEach(function(el, i) {
                el.classList.toggle('active', i === index);
            });
        }

        // Event listeners
        prevBtn.addEventListener('click', function() { slide(-1); });
        nextBtn.addEventListener('click', function() { slide(1); });
        
        // Rebuild on window resize
        var resizeTimer;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function() {
                buildDots();
                update();
            }, 250);
        });

        // Auto-play (optional)
        var autoplayInterval;
        var autoplayDelay = 5000; // 5 seconds

        function startAutoplay() {
            stopAutoplay();
            autoplayInterval = setInterval(function() {
                if (index >= getTotalSlides() - 1) {
                    goTo(0);
                } else {
                    slide(1);
                }
            }, autoplayDelay);
        }

        function stopAutoplay() {
            if (autoplayInterval) {
                clearInterval(autoplayInterval);
                autoplayInterval = null;
            }
        }

        // Start autoplay on load
        // startAutoplay();

        // Stop autoplay on user interaction
        prevBtn.addEventListener('click', stopAutoplay);
        nextBtn.addEventListener('click', stopAutoplay);
        dotsContainer.addEventListener('click', stopAutoplay);

        // Initialize
        buildDots();
        update();
    }

    /* ===========================================
       SMOOTH SCROLL TO SECTIONS
       =========================================== */
    function initSmoothScroll() {
        document.addEventListener('click', function(e) {
            var link = e.target.closest('a[href^="#"]');
            if (!link) return;
            
            var hash = link.getAttribute('href');
            if (!hash || hash.length <= 1) return;
            
            var targetId = hash.substring(1);
            var target = document.getElementById(targetId);
            
            if (target) {
                e.preventDefault();
                var offset = 80; // Account for fixed header
                var targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    }

    /* ===========================================
       ACCESSIBILITY IMPROVEMENTS
       =========================================== */
    function initAccessibility() {
        // Add keyboard support for gallery items
        var galleryItems = document.querySelectorAll('#gallery .gallery-item');
        galleryItems.forEach(function(item) {
            item.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    item.click();
                }
            });
        });
    }

    /* ===========================================
       LAZY LOADING OPTIMIZATION
       =========================================== */
    function initLazyLoading() {
        if ('IntersectionObserver' in window) {
            var lazyImages = document.querySelectorAll('img[loading="lazy"]');
            
            var imageObserver = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                    if (entry.isIntersecting) {
                        var img = entry.target;
                        // Image will load naturally due to loading="lazy"
                        imageObserver.unobserve(img);
                    }
                });
            });
            
            lazyImages.forEach(function(img) {
                imageObserver.observe(img);
            });
        }
    }

    /* ===========================================
       INITIALIZE ALL FUNCTIONS
       =========================================== */
    function init() {
        initMap();
        initGalleryModal();
        initReviewsSlider();
        initSmoothScroll();
        initAccessibility();
        initLazyLoading();
        
        console.log('Accommodation detail page initialized successfully');
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
