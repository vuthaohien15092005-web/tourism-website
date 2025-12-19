// ===========================================
// HANOI MAP SYSTEM - ADVANCED VERSION
// ===========================================

// Global variables
let hanoiMap = null;
let draw = null;
let is3DMode = false;
let isDrawMode = false;

// Dynamic attractions data loaded from OpenStreetMap
let attractionsData = [];
let attractionsLoaded = false;

// Initialize map when DOM is loaded with lazy loading
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('hanoi-map')) {
        // Lazy load map after a short delay for better performance
        setTimeout(() => {
            initializeHanoiMap();
            setupInteractionToggle();
            loadAttractionsFromOSM();
        }, 100);
    }
});

// ===========================================
// OPENSTREETMAP DATA LOADING
// ===========================================
async function loadAttractionsFromOSM() {
    try {
        // Check if data is already cached
        const cachedData = localStorage.getItem('hanoi-attractions-cache');
        const cacheTime = localStorage.getItem('hanoi-attractions-cache-time');
        const now = Date.now();
        
        // Use cached data if it's less than 24 hours old
        if (cachedData && cacheTime && (now - parseInt(cacheTime)) < 24 * 60 * 60 * 1000) {
            try {
                attractionsData = JSON.parse(cachedData);
                attractionsLoaded = true;
                // Skip rendering markers for cleaner UI & performance
                loadAllAttractions();
                console.log('Loaded attractions from cache');
                return;
            } catch (e) {
                console.warn('Cache corrupted, reloading data');
                localStorage.removeItem('hanoi-attractions-cache');
                localStorage.removeItem('hanoi-attractions-cache-time');
            }
        }
        
        // Show loading indicator
        showLoadingIndicator();
        
        // Overpass API query for Hanoi attractions - Start with wider bounding box
        const overpassQuery = `
            [out:json][timeout:25];
            (
              node["tourism"](20.9,105.7,21.2,106.0);
              node["historic"](20.9,105.7,21.2,106.0);
              node["leisure"](20.9,105.7,21.2,106.0);
              node["amenity"="place_of_worship"](20.9,105.7,21.2,106.0);
            );
            out center meta;
        `;
        
        console.log('Sending Overpass query:', overpassQuery);
        
        const response = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `data=${encodeURIComponent(overpassQuery)}`
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error Response:', errorText);
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        
        const data = await response.json();
        console.log('OSM API Response:', data);
        console.log('Elements count:', data.elements ? data.elements.length : 0);
        
        attractionsData = processOSMData(data.elements);
        attractionsLoaded = true;
        
        // Cache the data
        localStorage.setItem('hanoi-attractions-cache', JSON.stringify(attractionsData));
        localStorage.setItem('hanoi-attractions-cache-time', now.toString());
        
        // Add update UI (markers disabled for performance)
        loadAllAttractions();
        
        hideLoadingIndicator();
        console.log(`Loaded ${attractionsData.length} attractions from OpenStreetMap`);
        
    } catch (error) {
        console.error('Error loading attractions from OSM:', error);
        hideLoadingIndicator();
        
        // Fallback to manual data if API fails
        loadFallbackData();
    }
}

function processOSMData(elements) {
    const processedData = [];
    
    console.log('Processing OSM elements:', elements);
    
    elements.forEach(element => {
        console.log('Processing element:', element);
        if (!element.tags || !element.tags.name) {
            console.log('Skipping element - no tags or name:', element);
            return;
        }
        
        // Get coordinates
        let coordinates;
        if (element.type === 'node') {
            coordinates = [element.lon, element.lat];
        } else if (element.type === 'way' && element.center) {
            coordinates = [element.center.lon, element.center.lat];
        } else {
            return; // Skip if no valid coordinates
        }
        
        // Determine type and icon
        const { type, icon } = categorizeAttraction(element.tags);
        
        // Create description
        const description = createDescription(element.tags);
        
        processedData.push({
            name: element.tags.name,
            coordinates: coordinates,
            description: description,
            type: type,
            icon: icon,
            osmId: element.id,
            osmType: element.type,
            tags: element.tags
        });
    });
    
    // Sort by name for better organization
    return processedData.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
}

function categorizeAttraction(tags) {
    // Tourism attractions
    if (tags.tourism) {
        switch (tags.tourism) {
            case 'museum':
                return { type: 'museum', icon: 'museum-icon' };
            case 'attraction':
                return { type: 'monument', icon: 'monument-icon' };
            case 'viewpoint':
                return { type: 'viewpoint', icon: 'viewpoint-icon' };
            case 'artwork':
                return { type: 'artwork', icon: 'artwork-icon' };
            case 'gallery':
                return { type: 'museum', icon: 'museum-icon' };
            case 'zoo':
            case 'aquarium':
                return { type: 'entertainment', icon: 'entertainment-icon' };
            default:
                return { type: 'monument', icon: 'monument-icon' };
        }
    }
    
    // Historic sites
    if (tags.historic) {
        switch (tags.historic) {
            case 'monument':
            case 'memorial':
            case 'tomb':
                return { type: 'monument', icon: 'monument-icon' };
            case 'castle':
            case 'palace':
            case 'fort':
            case 'tower':
                return { type: 'monument', icon: 'monument-icon' };
            case 'ruins':
            case 'archaeological_site':
                return { type: 'monument', icon: 'monument-icon' };
            default:
                return { type: 'monument', icon: 'monument-icon' };
        }
    }
    
    // Religious sites
    if (tags.amenity === 'place_of_worship') {
        if (tags.religion === 'buddhist' || tags.religion === 'taoist') {
            return { type: 'temple', icon: 'temple-icon' };
        }
        return { type: 'temple', icon: 'temple-icon' };
    }
    
    // Leisure areas
    if (tags.leisure) {
        switch (tags.leisure) {
            case 'park':
            case 'garden':
                return { type: 'park', icon: 'park-icon' };
            case 'nature_reserve':
                return { type: 'nature', icon: 'nature-icon' };
            default:
                return { type: 'leisure', icon: 'leisure-icon' };
        }
    }
    
    // Natural features
    if (tags.natural) {
        switch (tags.natural) {
            case 'water':
            case 'beach':
                return { type: 'lake', icon: 'lake-icon' };
            case 'peak':
            case 'cliff':
                return { type: 'nature', icon: 'nature-icon' };
            default:
                return { type: 'nature', icon: 'nature-icon' };
        }
    }
    
    // Default fallback
    return { type: 'monument', icon: 'monument-icon' };
}

function createDescription(tags) {
    const parts = [];
    
    if (tags.description) {
        parts.push(tags.description);
    } else if (tags.description_vi) {
        parts.push(tags.description_vi);
    }
    
    if (tags.historic) {
        parts.push(`Di tích lịch sử: ${tags.historic}`);
    }
    
    if (tags.tourism) {
        parts.push(`Loại hình du lịch: ${tags.tourism}`);
    }
    
    if (tags.religion) {
        parts.push(`Tôn giáo: ${tags.religion}`);
    }
    
    if (tags.opening_hours) {
        parts.push(`Giờ mở cửa: ${tags.opening_hours}`);
    }
    
    if (tags.website) {
        parts.push(`Website: ${tags.website}`);
    }
    
    return parts.length > 0 ? parts.join('. ') : 'Điểm tham quan tại Hà Nội';
}

function loadFallbackData() {
    // Fallback data in case OSM API fails
    attractionsData = [
        {
            name: 'Hồ Gươm',
            coordinates: [105.852, 21.028],
            description: 'Điểm du lịch nổi tiếng trung tâm Hà Nội, nơi gắn liền với truyền thuyết vua Lê Lợi trả gươm thần.',
            type: 'lake',
            icon: 'lake-icon'
        },
        {
            name: 'Văn Miếu - Quốc Tử Giám',
            coordinates: [105.835, 21.028],
            description: 'Di tích lịch sử văn hóa giáo dục, trường đại học đầu tiên của Việt Nam.',
            type: 'monument',
            icon: 'monument-icon'
        },
        {
            name: 'Chùa Một Cột',
            coordinates: [105.833, 21.035],
            description: 'Biểu tượng kiến trúc độc đáo của Hà Nội, được xây dựng từ thời Lý.',
            type: 'temple',
            icon: 'temple-icon'
        }
    ];
    
    attractionsLoaded = true;
    // Skip rendering markers for cleaner UI & performance
    loadAllAttractions();
    console.log('Loaded fallback attractions data');
}

function showLoadingIndicator() {
    const resultsContainer = document.getElementById('search-results');
    if (resultsContainer) {
        resultsContainer.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <div style="display: inline-block; width: 20px; height: 20px; border: 3px solid #f3f3f3; border-top: 3px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <p style="margin-top: 10px; color: #666;">Đang tải dữ liệu từ OpenStreetMap...</p>
            </div>
        `;
    }
}

function hideLoadingIndicator() {
    // Loading indicator will be replaced when data loads
}

// ===========================================
// MAP INITIALIZATION
// ===========================================
function initializeHanoiMap() {
    // Initialize Hanoi Map with Street style like Tripomatic
    hanoiMap = new maplibregl.Map({
        container: 'hanoi-map',
        style: {
            "version": 8,
            "name": "Hanoi Street Style",
            "sources": {
                "osm": {
                    "type": "raster",
                    "tiles": [
                        "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                    ],
                    "tileSize": 256,
                    "attribution": "© OpenStreetMap contributors"
                }
            },
            "layers": [
                {
                    "id": "osm",
                    "type": "raster",
                    "source": "osm",
                    "paint": {
                        "raster-opacity": 0.9
                    }
                }
            ]
        },
        center: [105.844, 21.034], // Trung tâm Hà Nội (khu vực Hồ Gươm)
        zoom: 14, // Zoom cao hơn để thấy chi tiết
        pitch: 0, // Start with flat view
        bearing: 0,
        antialias: true,
        maxZoom: 18, // Cho phép zoom sâu hơn
        minZoom: 10 // Giới hạn zoom xa
    });

    // Disable interactions by default so page scroll is not blocked
    try {
        hanoiMap.dragPan.disable();
        hanoiMap.scrollZoom.disable();
        hanoiMap.touchZoomRotate.disable();
        hanoiMap.doubleClickZoom.disable();
        hanoiMap.keyboard.disable();
    } catch(e) { console.warn('Disable interactions failed', e); }

    // Add navigation controls (moved to bottom-right to avoid overlapping custom controls)
    hanoiMap.addControl(new maplibregl.NavigationControl({
        showCompass: true,
        showZoom: true
    }), 'bottom-right');
    
    // Add fullscreen control (also bottom-right)
    hanoiMap.addControl(new maplibregl.FullscreenControl(), 'bottom-right');

    // Omit draw controls for clean map

    // Enable 3D buildings when style loads
    hanoiMap.on('style.load', () => {
        enable3DBuildings();
    });

    // Map load event
    hanoiMap.on('load', () => {
        console.log('Hanoi map loaded successfully');
        // Skip auto-adding markers to keep map clean and performant
    });
}

// ===========================================
// 3D BUILDINGS & EXTRUSION
// ===========================================
function enable3DBuildings() {
    // Note: 3D buildings require vector data which is not available with OSM raster tiles
    // This function is kept for future vector style implementation
    console.log('3D buildings not available with OSM raster tiles');
}

// ===========================================
// INTERACTION TOGGLE (prevent page scroll lock)
// ===========================================
function setupInteractionToggle() {
    const btn = document.getElementById('map-interact-toggle');
    if (!btn) return;

    const setEnabled = (enabled) => {
        try {
            if (enabled) {
                hanoiMap.dragPan.enable();
                hanoiMap.scrollZoom.enable();
                hanoiMap.touchZoomRotate.enable();
                hanoiMap.doubleClickZoom.enable();
                hanoiMap.keyboard.enable();
                btn.setAttribute('aria-pressed', 'true');
                btn.innerHTML = '<i class="fa fa-hand-paper-o"></i> Khóa kéo map';
                btn.title = 'Khóa kéo bản đồ';
            } else {
                hanoiMap.dragPan.disable();
                hanoiMap.scrollZoom.disable();
                hanoiMap.touchZoomRotate.disable();
                hanoiMap.doubleClickZoom.disable();
                hanoiMap.keyboard.disable();
                btn.setAttribute('aria-pressed', 'false');
                btn.innerHTML = '<i class="fa fa-hand-rock-o"></i> Kéo bản đồ';
                btn.title = 'Bật kéo bản đồ';
            }
        } catch(e) {}
    };

    // default disabled
    setEnabled(false);

    btn.addEventListener('click', function(){
        const pressed = btn.getAttribute('aria-pressed') === 'true';
        setEnabled(!pressed);
    });
}

function performSearch() {
    if (!attractionsLoaded) {
        showLoadingIndicator();
        return;
    }
    
    const searchInput = document.getElementById('search-input');
    const query = searchInput.value.toLowerCase().trim();
    
    if (query === '') {
        loadAllAttractions();
        return;
    }
    
    const results = attractionsData.filter(attraction => 
        attraction.name.toLowerCase().includes(query) ||
        attraction.description.toLowerCase().includes(query) ||
        (attraction.tags && Object.values(attraction.tags).some(tag => 
            tag && tag.toString().toLowerCase().includes(query)
        ))
    );
    
    displaySearchResults(results);
}

function filterMarkers(filter) {
    if (!attractionsLoaded) {
        showLoadingIndicator();
        return;
    }
    
    // Hide all markers first
    document.querySelectorAll('.custom-marker').forEach(marker => {
        marker.style.display = 'none';
    });
    
    if (filter === 'all') {
        // Show all markers
        document.querySelectorAll('.custom-marker').forEach(marker => {
            marker.style.display = 'flex';
        });
        loadAllAttractions();
    } else {
        // Show only filtered markers
        document.querySelectorAll(`.custom-marker.${filter}-icon`).forEach(marker => {
            marker.style.display = 'flex';
        });
        
        const filteredResults = attractionsData.filter(attraction => 
            attraction.type === filter
        );
        displaySearchResults(filteredResults);
    }
}

function loadAllAttractions() {
    if (!attractionsLoaded) {
        showLoadingIndicator();
        return;
    }
    displaySearchResults(attractionsData);
}

// Function to refresh data from OSM (clear cache and reload)
function refreshAttractionsData() {
    localStorage.removeItem('hanoi-attractions-cache');
    localStorage.removeItem('hanoi-attractions-cache-time');
    attractionsLoaded = false;
    attractionsData = [];
    loadAttractionsFromOSM();
}

function displaySearchResults(results) {
    const resultsContainer = document.getElementById('search-results');
    
    if (results.length === 0) {
        resultsContainer.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Không tìm thấy kết quả nào.</p>';
        return;
    }
    
    resultsContainer.innerHTML = results.map(attraction => `
        <div class="result-item" data-coordinates="${attraction.coordinates.join(',')}">
            <h5>${attraction.name}</h5>
            <p>${attraction.description}</p>
            <span class="result-type">${getTypeLabel(attraction.type)}</span>
        </div>
    `).join('');
    
    // Add click handlers to result items
    resultsContainer.querySelectorAll('.result-item').forEach(item => {
        item.addEventListener('click', function() {
            const coords = this.getAttribute('data-coordinates').split(',').map(Number);
            hanoiMap.easeTo({
                center: coords,
                zoom: 16,
                duration: 1000
            });
            
            // Close sidebar on mobile
            if (window.innerWidth <= 768) {
                document.getElementById('map-sidebar').classList.remove('open');
                document.getElementById('sidebar-toggle-btn').classList.remove('hidden');
            }
        });
    });
}

// ===========================================
// MAP CONTROLS
// ===========================================
function setupMapControls() {
    // Toggle 3D mode
    document.getElementById('toggle-3d').addEventListener('click', function() {
        toggle3DMode();
    });

    // Reset view
    document.getElementById('reset-view').addEventListener('click', function() {
        resetMapView();
    });

    // Toggle draw mode
    document.getElementById('toggle-draw').addEventListener('click', function() {
        toggleDrawMode();
    });

    // Area navigation
    setupAreaNavigation();
}

function setupAreaNavigation() {
    const areaButtons = document.querySelectorAll('.area-btn');
    
    areaButtons.forEach(button => {
        button.addEventListener('click', function() {
            const area = this.getAttribute('data-area');
            navigateToArea(area);
            
            // Update active state
            areaButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

function navigateToArea(area) {
    const areaCoordinates = {
        'center': { center: [105.844, 21.034], zoom: 15 },
        'old-quarter': { center: [105.844, 21.034], zoom: 16 },
        'west-lake': { center: [105.820, 21.055], zoom: 15 },
        'ba-dinh': { center: [105.833, 21.037], zoom: 16 }
    };

    const coords = areaCoordinates[area];
    if (coords) {
        hanoiMap.easeTo({
            center: coords.center,
            zoom: coords.zoom,
            duration: 1500
        });
    }
}

function toggle3DMode() {
    is3DMode = !is3DMode;
    const button = document.getElementById('toggle-3d');
    
    if (is3DMode) {
        // Enable 3D view
        hanoiMap.easeTo({
            pitch: 45,
            bearing: -17.6,
            duration: 1000
        });
        button.classList.add('active');
        button.innerHTML = '<i class="fa fa-cube"></i>';
    } else {
        // Disable 3D view
        hanoiMap.easeTo({
            pitch: 0,
            bearing: 0,
            duration: 1000
        });
        button.classList.remove('active');
        button.innerHTML = '<i class="fa fa-cube"></i>';
    }
}

function resetMapView() {
    hanoiMap.easeTo({
        center: [105.844, 21.034],
        zoom: 14,
        pitch: 0,
        bearing: 0,
        duration: 1000
    });
    is3DMode = false;
    document.getElementById('toggle-3d').classList.remove('active');
}

function toggleDrawMode() {
    isDrawMode = !isDrawMode;
    const button = document.getElementById('toggle-draw');
    
    if (isDrawMode) {
        draw.changeMode('draw_polygon');
        button.classList.add('active');
    } else {
        draw.changeMode('simple_select');
        button.classList.remove('active');
    }
}

// ===========================================
// CUSTOM MARKERS & POPUPS
// ===========================================
function addCustomMarkers() {
    attractionsData.forEach(attraction => {
        createCustomMarker(attraction);
    });
}

function createCustomMarker(attraction) {
    // Create marker element
    const el = document.createElement('div');
    el.className = `custom-marker ${attraction.icon}`;
    el.style.cssText = `
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: linear-gradient(45deg, #e74c3c, #c0392b);
        border: 3px solid white;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        color: white;
    `;

    // Add icon based on type
    const iconMap = {
        'temple': '🏛️',
        'monument': '🏛️',
        'lake': '🏞️',
        'museum': '🏛️',
        'viewpoint': '👁️',
        'artwork': '🎨',
        'entertainment': '🎪',
        'park': '🌳',
        'nature': '🌿',
        'leisure': '⚽'
    };
    el.innerHTML = iconMap[attraction.type] || '📍';

    // Add hover effects
    el.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.2)';
        this.style.boxShadow = '0 6px 20px rgba(0,0,0,0.4)';
    });

    el.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1)';
        this.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
    });

    // Create marker
    const marker = new maplibregl.Marker({
        element: el
    })
    .setLngLat(attraction.coordinates)
    .addTo(hanoiMap);

    // Create popup
    const popup = new maplibregl.Popup({
        offset: 25,
        closeButton: true,
        closeOnClick: false,
        className: 'custom-popup'
    }).setHTML(`
        <div class="popup-content">
            <h3 class="popup-title">${attraction.name}</h3>
            <p class="popup-description">${attraction.description}</p>
            <div class="popup-type">
                <span class="type-badge ${attraction.type}">${getTypeLabel(attraction.type)}</span>
            </div>
            ${attraction.tags && attraction.tags.website ? `
                <div class="popup-actions">
                    <a href="${attraction.tags.website}" target="_blank" class="popup-link">
                        <i class="fa fa-external-link"></i> Website
                    </a>
                </div>
            ` : ''}
            ${attraction.osmId ? `
                <div class="popup-osm-info">
                    <small>OSM ID: ${attraction.osmId}</small>
                </div>
            ` : ''}
        </div>
    `);

    marker.setPopup(popup);
}

function getTypeLabel(type) {
    const labels = {
        'temple': 'Đền, chùa',
        'monument': 'Di tích lịch sử',
        'lake': 'Hồ, công viên',
        'museum': 'Bảo tàng',
        'viewpoint': 'Điểm ngắm cảnh',
        'artwork': 'Tác phẩm nghệ thuật',
        'entertainment': 'Giải trí',
        'park': 'Công viên',
        'nature': 'Thiên nhiên',
        'leisure': 'Giải trí, thể thao'
    };
    return labels[type] || 'Điểm tham quan';
}

// ===========================================
// RESPONSIVE HANDLING
// ===========================================
function handleSidebarOpen() {
    if (window.innerWidth >= 1200) {
        // Large screens - CSS will handle the positioning and width
        // Trigger map resize after a short delay to allow CSS transition
        setTimeout(() => {
            forceMapResize();
        }, 300);
    }
}

function handleSidebarClose() {
    // CSS will handle the reset automatically
    // Trigger map resize after a short delay to allow CSS transition
    setTimeout(() => {
        forceMapResize();
    }, 300);
}

// Handle window resize
function handleWindowResize() {
    // CSS will handle the responsive behavior automatically
    // Trigger map resize on window resize
    setTimeout(() => {
        forceMapResize();
    }, 100);
}

// Add resize listener
window.addEventListener('resize', handleWindowResize);

// Force map resize function
function forceMapResize() {
    if (hanoiMap) {
        // Force immediate resize
        hanoiMap.resize();
        
        // Also trigger a second resize after a short delay to ensure it works
        setTimeout(() => {
            if (hanoiMap) {
                hanoiMap.resize();
            }
        }, 50);
    }
}

// ===========================================
// DEBUG FUNCTIONS
// ===========================================
// Function to test Overpass API directly (call from browser console)
window.testOverpassAPI = async function() {
    const testQuery = `
        [out:json][timeout:25];
        (
          node["tourism"](21.0,105.8,21.1,105.9);
          node["historic"](21.0,105.8,21.1,105.9);
        );
        out center meta;
    `;
    
    try {
        console.log('Testing Overpass API with query:', testQuery);
        const response = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `data=${encodeURIComponent(testQuery)}`
        });
        
        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Test API Response:', data);
        return data;
    } catch (error) {
        console.error('Test API Error:', error);
        return null;
    }
};

// Function to test with different Overpass servers
window.testOverpassServers = async function() {
    const servers = [
        'https://overpass-api.de/api/interpreter',
        'https://lz4.overpass-api.de/api/interpreter',
        'https://z.overpass-api.de/api/interpreter'
    ];
    
    const testQuery = `
        [out:json][timeout:10];
        node["tourism"](21.0,105.8,21.1,105.9);
        out center meta;
    `;
    
    for (const server of servers) {
        try {
            console.log(`Testing server: ${server}`);
            const response = await fetch(server, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `data=${encodeURIComponent(testQuery)}`
            });
            
            const data = await response.json();
            console.log(`${server} - Status: ${response.status}, Elements: ${data.elements ? data.elements.length : 0}`);
        } catch (error) {
            console.error(`${server} - Error:`, error);
        }
    }
};

// Function to test simple query
window.testSimpleQuery = async function() {
    const simpleQuery = `
        [out:json][timeout:25];
        node["name"~"Hồ Gươm"](20.9,105.7,21.2,106.0);
        out center meta;
    `;
    
    try {
        console.log('Testing simple query:', simpleQuery);
        const response = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `data=${encodeURIComponent(simpleQuery)}`
        });
        
        const data = await response.json();
        console.log('Simple query result:', data);
        return data;
    } catch (error) {
        console.error('Simple query error:', error);
        return null;
    }
};

// ===========================================
// LEGACY SUPPORT - Keep existing functionality
// ===========================================
function addHanoiAttractions() {
    // This function maintains compatibility with existing code
    // while providing the new enhanced map system
    console.log('Hanoi attractions loaded with enhanced map system');
}
