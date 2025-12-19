(function () {
    var searchInput;
    var categorySelect;
    var pillContainer;
    var cards;
    
    // Hero search elements
    var heroSearchInput;
    var heroSearchForm;
    var searchSuggestions;
    var searchClearBtn;
    var popularSuggestions;
    var popularIndex = 0;
    var popularTimerId;
    
    // Search data - sẽ được load từ page
    var attractionsData = [];
    
    // Map categories to icons - icon thống nhất cho tất cả
    var categoryIcons = {
        'tu-nhien': 'fa-map-marker',
        'nhan-van': 'fa-map-marker'
    };
    
    // Map all categories to two groups for suggestion labels
    var categoryLabels = {
        'tu-nhien': 'Điểm tham quan tự nhiên',
        'nhan-van': 'Điểm tham quan nhân văn'
    };
    
    // Load attractions data - ưu tiên từ server data (toàn bộ), fallback là page cards
    function loadAttractionsData() {
        // Thử load từ data attribute (toàn bộ attractions từ server)
        var dataElement = document.getElementById('attractions-data');
        if (dataElement) {
            try {
                var jsonStr = dataElement.getAttribute('data-json');
                if (jsonStr) {
                    var allData = JSON.parse(jsonStr);
                    if (Array.isArray(allData) && allData.length > 0) {
                        attractionsData = allData.map(function(item) {
                            return {
                                title: item.name,
                                category: item.category,
                                slug: item.slug,
                                icon: categoryIcons[item.category] || 'fa-map-marker'
                            };
                        });
                        console.log('✅ Loaded ' + attractionsData.length + ' attractions for search (from server - ALL data)');
                        return;
                    }
                }
            } catch(e) {
                console.warn('Failed to parse attractions data from server:', e);
            }
        }
        
        // Fallback: load từ cards trên trang (chỉ trang hiện tại)
        var allCards = document.querySelectorAll('.attraction-card');
        attractionsData = [];
        allCards.forEach(function(card) {
            var title = card.getAttribute('data-title');
            var category = card.getAttribute('data-category');
            var slug = card.getAttribute('data-slug');
            if (title && category) {
                attractionsData.push({
                    title: title,
                    category: category,
                    slug: slug,
                    icon: categoryIcons[category] || 'fa-map-marker'
                });
            }
        });
        console.log('⚠️ Loaded ' + attractionsData.length + ' attractions for search (from page cards - current page only)');
    }

    function normalize(str) {
        // Lowercase, strip diacritics, remove punctuation/dash variants, collapse spaces
        return (str || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/\p{Diacritic}/gu, "")
            .replace(/[\-–—]/g, " ")
            .replace(/[^a-z0-9\s]/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    function getCardData(card) {
        return {
            title: card.getAttribute('data-title') || '',
            category: card.getAttribute('data-category') || ''
        };
    }

    function applyFilters() {
        // Use hero search input as fallback for text filtering
        var textSource = searchInput && searchInput.value ? searchInput.value : (heroSearchInput ? heroSearchInput.value : '');
        var q = normalize(textSource || '');
        var selected = categorySelect ? categorySelect.value : 'all';
        var activePill = pillContainer ? pillContainer.querySelector('.pill.active') : null;
        var pillCategory = activePill ? activePill.getAttribute('data-category') : 'all';

        // Only apply category when there is no text query; keep them independent
        var category = q ? 'all' : (selected !== 'all' ? selected : pillCategory);

        cards.forEach(function (card) {
            var data = getCardData(card);
            var matchesText = q ? normalize(data.title).includes(q) : true;
            var matchesCat = category === 'all' ? true : data.category === category;
            var visible = matchesText && matchesCat;
            if (visible) {
                card.classList.remove('is-hidden');
            } else {
                card.classList.add('is-hidden');
            }
        });
    }

    function onPillClick(e) {
        var pill = e.target.closest('.pill');
        if (!pill) return;
        pillContainer.querySelectorAll('.pill').forEach(function (p) { p.classList.remove('active'); });
        pill.classList.add('active');
        if (categorySelect) categorySelect.value = 'all';
        applyFilters();
    }

    // Hero search functions
    function renderNoResults() {
        if (!searchSuggestions) return;
        searchSuggestions.innerHTML = '<div class="no-results">Không có dữ liệu</div>';
        searchSuggestions.classList.add('show');
    }

    function showSuggestions(query) {
        if (!searchSuggestions) return;
        
        if (!query || query.length < 2) {
            hideSuggestions();
            return;
        }
        
        var normalizedQuery = normalize(query);
        
        // Filter và sort matches - ưu tiên starts with, sau đó includes
        var matches = attractionsData.filter(function(item) {
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
        }).slice(0, 8); // Tăng limit lên 8 suggestions
        
        if (matches.length === 0) {
            renderNoResults();
            return;
        }
        
        var html = matches.map(function(item) {
            var icon = item.icon || 'fa-map-marker'; // Default icon
            var label = categoryLabels[item.category] || item.category;
            return '<div class="suggestion-item" data-title="' + item.title + '" data-category="' + item.category + '" data-slug="' + (item.slug || '') + '">' +
                   '<i class="fa ' + icon + ' suggestion-icon"></i>' +
                   '<span class="suggestion-text">' + item.title + '</span>' +
                   '<span class="suggestion-category">' + label + '</span>' +
                   '</div>';
        }).join('');
        
        searchSuggestions.innerHTML = html;
        searchSuggestions.classList.add('show');
        
        // Add click handlers to suggestions
        var suggestionItems = searchSuggestions.querySelectorAll('.suggestion-item');
        suggestionItems.forEach(function(item) {
            item.addEventListener('click', function() {
                var title = this.getAttribute('data-title');
                var category = this.getAttribute('data-category');
                var slug = this.getAttribute('data-slug');
                selectSuggestion(title, category, slug);
            });
        });
    }
    
    function hideSuggestions() {
        if (searchSuggestions) {
            searchSuggestions.classList.remove('show');
        }
    }
    
    function selectSuggestion(title, category, slug) {
        if (heroSearchInput) {
            heroSearchInput.value = title;
        }
        hideSuggestions();
        
        // Kiểm tra xem attraction có trên trang hiện tại không
        var cardOnPage = cards && cards.find(function(card) {
            return card.getAttribute('data-title') === title;
        });
        
        // Nếu item KHÔNG có trên trang hiện tại và có slug → navigate to detail page
        if (!cardOnPage && slug) {
            window.location.href = '/attraction/' + slug;
            return;
        }
        
        // Nếu item CÓ trên trang hiện tại → filter và scroll như bình thường
        // Update filters to show this attraction (use text match; keep category = all to avoid code mismatches)
        if (searchInput) searchInput.value = title;
        if (categorySelect) categorySelect.value = 'all';
        
        // Update pills
        if (pillContainer) {
            pillContainer.querySelectorAll('.pill').forEach(function(p) { p.classList.remove('active'); });
            var targetPill = pillContainer.querySelector('[data-category="all"]');
            if (targetPill) targetPill.classList.add('active');
        }
        
        applyFilters();
        
        // Scroll to results
        var resultsSection = document.querySelector('.attraction-page');
        if (resultsSection) {
            resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
    
    function onHeroSearchInput(e) {
        var query = e.target.value;
        showSuggestions(query);
        
        // Show/hide clear button
        if (searchClearBtn) {
            if (query.length > 0) {
                searchClearBtn.classList.add('show');
            } else {
                searchClearBtn.classList.remove('show');
            }
        }
    }
    
    function onHeroSearchSubmit(e) {
        e.preventDefault();
        var query = heroSearchInput ? heroSearchInput.value.trim() : '';
        
        if (query.length < 2) return;
        
        // Find exact match first
        var exactMatch = attractionsData.find(function(item) {
            return normalize(item.title) === normalize(query);
        });
        
        if (exactMatch) {
            selectSuggestion(exactMatch.title, exactMatch.category, exactMatch.slug);
        } else {
            // Apply general search
            if (searchInput) searchInput.value = query;
            applyFilters();
            
            // Scroll to results
            var resultsSection = document.querySelector('.attraction-page');
            if (resultsSection) {
                resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
        
        hideSuggestions();
    }
    
    function onHeroSearchKeyPress(e) {
        if (e.key === 'Enter') {
            onHeroSearchSubmit(e);
        }
    }
    
    function onSearchClear() {
        if (heroSearchInput) heroSearchInput.value = '';
        if (searchClearBtn) searchClearBtn.classList.remove('show');
        hideSuggestions();
    }
    
    function onPopularSuggestionClick(e) {
        e.preventDefault();
        var category = e.target.getAttribute('data-category');
        if (!category) return;
        
        // Update category filter
        if (categorySelect) categorySelect.value = category;
        
        // Update pills
        if (pillContainer) {
            pillContainer.querySelectorAll('.pill').forEach(function(p) { p.classList.remove('active'); });
            var targetPill = pillContainer.querySelector('[data-category="' + category + '"]');
            if (targetPill) targetPill.classList.add('active');
        }
        
        // Clear search
        if (searchInput) searchInput.value = '';
        if (heroSearchInput) heroSearchInput.value = '';
        if (searchClearBtn) searchClearBtn.classList.remove('show');
        
        applyFilters();
        hideSuggestions();
        
        // Scroll to results
        var resultsSection = document.querySelector('.attraction-page');
        if (resultsSection) {
            resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
    
    function onDocumentClick(e) {
        // Hide suggestions when clicking outside
        if (searchSuggestions && !searchSuggestions.contains(e.target) && 
            heroSearchInput && !heroSearchInput.contains(e.target)) {
            hideSuggestions();
        }
    }

    function rotatePopularSuggestion() {
        if (!popularSuggestions || popularSuggestions.length === 0) return;
        popularSuggestions.forEach(function(btn, i) {
            if (i === popularIndex) btn.classList.add('is-active');
            else btn.classList.remove('is-active');
        });
        popularIndex = (popularIndex + 1) % popularSuggestions.length;
    }

    function init() {
        // Original filter elements (searchInput removed from UI, but keep support if added later)
        searchInput = document.getElementById('attraction-search');
        categorySelect = document.getElementById('attraction-category');
        pillContainer = document.querySelector('.attraction-pills');
        cards = Array.prototype.slice.call(document.querySelectorAll('.attraction-card'));

        // Load attractions data for search from page cards
        loadAttractionsData();

        // Hero search elements
        heroSearchInput = document.getElementById('hero-search-input');
        heroSearchForm = document.querySelector('.hero-search-form');
        searchSuggestions = document.getElementById('search-suggestions');
        searchClearBtn = document.querySelector('.search-clear');
        popularSuggestions = document.querySelectorAll('.popular-suggestion');

        // Original event listeners
        if (searchInput) searchInput.addEventListener('input', applyFilters);
        if (categorySelect) {
            categorySelect.addEventListener('change', function () {
                if (pillContainer) pillContainer.querySelectorAll('.pill').forEach(function (p) { p.classList.remove('active'); });
                
                // Reload page with selected category
                var selectedCategory = this.value;
                var url = new URL(window.location.href);
                if (selectedCategory && selectedCategory !== 'all') {
                    url.searchParams.set('category', selectedCategory);
                } else {
                    url.searchParams.delete('category');
                }
                url.searchParams.set('page', '1'); // Reset to page 1
                window.location.href = url.toString();
            });
        }
        // Pills are removed on listing page to avoid duplication; guard listener
        if (pillContainer && pillContainer.offsetParent !== null) {
            pillContainer.addEventListener('click', onPillClick);
        }
        
        // Hero search event listeners
        if (heroSearchInput) {
            heroSearchInput.addEventListener('input', onHeroSearchInput);
            heroSearchInput.addEventListener('keypress', onHeroSearchKeyPress);
            heroSearchInput.addEventListener('focus', function() {
                if (this.value.length >= 2) {
                    showSuggestions(this.value);
                }
            });
        }
        
        if (heroSearchForm) {
            heroSearchForm.addEventListener('submit', onHeroSearchSubmit);
        }
        
        if (searchClearBtn) {
            searchClearBtn.addEventListener('click', onSearchClear);
        }
        
        // Popular suggestions removed in UI
        
        // Global click listener for hiding suggestions
        document.addEventListener('click', onDocumentClick);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
