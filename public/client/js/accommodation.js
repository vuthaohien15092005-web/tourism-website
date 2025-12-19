(function () {
    var searchInput; var typeSelect; var priceSelect; var areaSelect; var pillContainer; var cards;

    function normalize(str) { return (str || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, ''); }

    function parsePriceBucket(val) {
        // buckets: all, lt1m, 1to2m, 2to3m, gt3m (VND/night)
        return val || 'all';
    }

    function matchesPrice(bucket, price) {
        if (!bucket || bucket === 'all') return true;
        if (bucket === 'lt1m') return price < 1000000;
        if (bucket === '1to2m') return price >= 1000000 && price < 2000000;
        if (bucket === '2to3m') return price >= 2000000 && price < 3000000;
        if (bucket === 'gt3m') return price >= 3000000;
        return true;
    }

    function getCardData(card) {
        return {
            title: card.getAttribute('data-title') || '',
            type: card.getAttribute('data-type') || 'hotel',
            area: card.getAttribute('data-area') || 'center',
            price: Number(card.getAttribute('data-price') || '0'),
            amenities: (card.getAttribute('data-amenities') || '').split(',')
        };
    }

    // Client-side filtering removed - now using server-side filtering

    // Pills functionality not implemented for accommodations

    function init() {
        searchInput = document.getElementById('acc-search');
        priceSelect = document.getElementById('acc-price');
        areaSelect = document.getElementById('acc-area');

        if (searchInput) {
            searchInput.addEventListener('input', function() {
                // Debounce search to avoid too many requests
                clearTimeout(this.searchTimeout);
                this.searchTimeout = setTimeout(function() {
                    var searchValue = searchInput.value.trim();
                    var url = new URL(window.location.href);
                    if (searchValue) {
                        url.searchParams.set('search', searchValue);
                    } else {
                        url.searchParams.delete('search');
                    }
                    url.searchParams.set('page', '1'); // Reset to page 1
                    window.location.href = url.toString();
                }, 500); // 500ms delay
            });
        }
        // Type filter not implemented for accommodations
        if (priceSelect) {
            priceSelect.addEventListener('change', function() {
                // Reload page with selected price filter
                var selectedPrice = this.value;
                var url = new URL(window.location.href);
                if (selectedPrice && selectedPrice !== 'all') {
                    url.searchParams.set('price', selectedPrice);
                } else {
                    url.searchParams.delete('price');
                }
                url.searchParams.set('page', '1'); // Reset to page 1
                window.location.href = url.toString();
            });
        }
        if (areaSelect) {
            areaSelect.addEventListener('change', function() {
                // Reload page with selected area filter
                var selectedArea = this.value;
                var url = new URL(window.location.href);
                if (selectedArea && selectedArea !== 'all') {
                    url.searchParams.set('area', selectedArea);
                } else {
                    url.searchParams.delete('area');
                }
                url.searchParams.set('page', '1'); // Reset to page 1
                window.location.href = url.toString();
            });
        }
        // Pills functionality not implemented for accommodations
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
