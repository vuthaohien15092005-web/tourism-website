/**
 * ===========================================
 * ATTRACTION DYNAMIC DATA MANAGEMENT
 * ===========================================
 * This file handles dynamic data for attraction pages
 * Designed for easy backend integration
 * ===========================================
 */

class AttractionDataManager {
    constructor() {
        this.defaultData = this.getDefaultData();
        this.currentData = null;
    }

    /**
     * Get default attraction data structure
     * This serves as fallback when no data is provided
     */
    getDefaultData() {
        return {
            // Basic Information
            title: '',
            seoDescription: '',
            description: '',
            
            // Location & Contact
            address: '',
            lat: 21.028511,
            lng: 105.804817,
            mapZoom: 14,
            phone: '',
            website: '',
            
            // Media
            heroImage: '/client/img/header-bg.jfif',
            images: [],
            
            // Operating Information
            openHours: [],
            
            // Pricing
            tickets: [],
            
            // Section 1: Introduction & Basic Info
            highlights: [],
            amenities: [],
            
            // Section 2: Experiences & Guidelines
            experiences: [],
            rules: [],
            tips: [],
            
            // Reviews & Ratings
            reviews: [],
            
            // Additional Data
            mapEmbedUrl: '',
            category: '',
            tags: [],
            bestTimeToVisit: '',
            averageVisitDuration: ''
        };
    }

    /**
     * Initialize with provided data or use defaults
     * @param {Object} data - Attraction data from backend
     */
    initialize(data = null) {
        this.currentData = data ? this.mergeWithDefaults(data) : this.defaultData;
        return this.currentData;
    }

    /**
     * Merge provided data with defaults
     * @param {Object} data - Data from backend
     * @returns {Object} Merged data
     */
    mergeWithDefaults(data) {
        return {
            ...this.defaultData,
            ...data,
            // Deep merge for arrays and objects
            images: data.images || this.defaultData.images,
            openHours: data.openHours || this.defaultData.openHours,
            tickets: data.tickets || this.defaultData.tickets,
            highlights: data.highlights || this.defaultData.highlights,
            amenities: data.amenities || this.defaultData.amenities,
            experiences: data.experiences || this.defaultData.experiences,
            rules: data.rules || this.defaultData.rules,
            tips: data.tips || this.defaultData.tips,
            reviews: data.reviews || this.defaultData.reviews
        };
    }

    /**
     * Get current attraction data
     * @returns {Object} Current attraction data
     */
    getData() {
        return this.currentData || this.defaultData;
    }

    /**
     * Update specific field
     * @param {string} field - Field name
     * @param {any} value - New value
     */
    updateField(field, value) {
        if (this.currentData) {
            this.currentData[field] = value;
        }
    }

    /**
     * Get data for specific section
     * @param {string} section - Section name ('intro', 'experiences')
     * @returns {Object} Section-specific data
     */
    getSectionData(section) {
        const data = this.getData();
        
        switch (section) {
            case 'intro':
                return {
                    title: data.title,
                    description: data.description,
                    address: data.address,
                    openHours: data.openHours,
                    tickets: data.tickets,
                    highlights: data.highlights,
                    amenities: data.amenities
                };
            case 'experiences':
                return {
                    experiences: data.experiences,
                    rules: data.rules,
                    tips: data.tips
                };
            default:
                return data;
        }
    }
}

// Global instance
window.AttractionData = new AttractionDataManager();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AttractionDataManager;
}
