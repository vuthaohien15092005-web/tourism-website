(function () {
    var searchInput; var areaSelect; var formSelect; var cards;
    
    // Search data - sẽ được load từ page
    var cuisinesData = [];

    function normalize(str) { 
        return (str || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, ''); 
    }

    // Load cuisines data - ưu tiên từ server data (toàn bộ), fallback là page cards
    function loadCuisinesData() {
        // Thử load từ data attribute (toàn bộ cuisines từ server)
        var dataElement = document.getElementById('cuisines-data');
        console.log('🔍 Data element found:', !!dataElement);
        if (dataElement) {
            try {
                var jsonStr = dataElement.getAttribute('data-json');
                console.log('🔍 JSON string length:', jsonStr ? jsonStr.length : 'null');
                console.log('🔍 JSON string preview:', jsonStr ? jsonStr.substring(0, 100) + '...' : 'null');
                if (jsonStr) {
                    var allData = JSON.parse(jsonStr);
                    console.log('🔍 Parsed data:', allData);
                    if (Array.isArray(allData) && allData.length > 0) {
                        cuisinesData = allData.map(function(item) {
                            return {
                                title: item.name,
                                slug: item.slug,
                                icon: 'fa-cutlery' // Default icon for cuisine
                            };
                        });
                        console.log('✅ Loaded ' + cuisinesData.length + ' cuisines for search (from server - ALL data)');
                        console.log('Sample data:', cuisinesData.slice(0, 3));
                        return;
                    }
                }
            } catch(e) {
                console.warn('Failed to parse cuisines data from server:', e);
            }
        }
        
        // Fallback: load từ cards trên trang (chỉ trang hiện tại)
        var allCards = document.querySelectorAll('.cuisine-card');
        cuisinesData = [];
        allCards.forEach(function(card) {
            var title = card.getAttribute('data-title');
            var slug = card.getAttribute('data-slug');
            if (title) {
                cuisinesData.push({
                    title: title,
                    slug: slug || '',
                    icon: 'fa-cutlery'
                });
            }
        });
        console.log('⚠️ Loaded ' + cuisinesData.length + ' cuisines for search (from page cards - current page only)');
    }

    function getCardData(card) {
        return {
            title: card.getAttribute('data-title') || '',
            area: card.getAttribute('data-area') || 'center',
            form: card.getAttribute('data-form') || 'street',
            rating: Number(card.getAttribute('data-rating') || '0')
        };
    }

    function applyFilters() {
        var q = normalize(searchInput ? searchInput.value : '');
        var area = areaSelect ? areaSelect.value : 'all';
        var form = formSelect ? formSelect.value : 'all';

        cards.forEach(function (card) {
            var d = getCardData(card);
            var matchesText = q ? normalize(d.title).includes(q) : true;
            var matchesArea = area === 'all' ? true : d.area === area;
            var matchesForm = form === 'all' ? true : d.form === form;
            var visible = matchesText && matchesArea && matchesForm;
            if (visible) card.classList.remove('is-hidden'); else card.classList.add('is-hidden');
        });
    }

    // Enhanced search with full data support
    function searchInAllData(query) {
        if (!query || query.length < 2) return [];
        
        var normalizedQuery = normalize(query);
        
        return cuisinesData.filter(function(item) {
            return normalize(item.title).includes(normalizedQuery);
        }).sort(function(a, b) {
            var aNorm = normalize(a.title);
            var bNorm = normalize(b.title);
            var aStarts = aNorm.indexOf(normalizedQuery) === 0;
            var bStarts = bNorm.indexOf(normalizedQuery) === 0;
            
            // Ưu tiên starts with
            if (aStarts && !bStarts) return -1;
            if (!aStarts && bStarts) return 1;
            
            // Sau đó sort theo độ dài (ngắn hơn lên trước)
            return a.title.length - b.title.length;
        }).slice(0, 8); // Limit to 8 results
    }

    function handleSearchNavigation(query) {
        if (!query || query.length < 2) {
            applyFilters();
            return;
        }
        
        // Chỉ lọc trên trang hiện tại, không tự động chuyển trang
        applyFilters();
    }

    function init() {
        searchInput = document.getElementById('cui-search');
        areaSelect = document.getElementById('cui-area');
        formSelect = document.getElementById('cui-form');
        cards = Array.prototype.slice.call(document.querySelectorAll('.cuisine-card'));

        // Load cuisines data for search from page cards
        loadCuisinesData();

        if (searchInput) {
            searchInput.addEventListener('input', function() {
                var query = this.value.trim();
                if (query.length >= 2) {
                    handleSearchNavigation(query);
                } else {
                    applyFilters();
                }
            });
        }
        if (areaSelect) areaSelect.addEventListener('change', applyFilters);
        if (formSelect) formSelect.addEventListener('change', applyFilters);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
