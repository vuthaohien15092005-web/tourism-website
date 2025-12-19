/**
 * Pagination Component JavaScript
 * Handles pagination interactions and AJAX loading
 */

class PaginationComponent {
    constructor(options = {}) {
        this.container = options.container || '.pagination-container';
        this.pagination = options.pagination || '.pagination';
        this.loadingClass = 'loading';
        this.ajaxEnabled = options.ajax || false;
        this.onPageChange = options.onPageChange || null;
        this.baseUrl = options.baseUrl || window.location.pathname;
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupAjax();
    }

    bindEvents() {
        const pagination = document.querySelector(this.pagination);
        if (!pagination) return;

        // Bind click events to pagination links
        pagination.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (!link) return;

            e.preventDefault();
            const page = this.extractPageFromUrl(link.href);
            
            if (page && page !== this.getCurrentPage()) {
                this.handlePageChange(page, link);
            }
        });

        // Bind keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.target.closest(this.pagination)) {
                this.handleKeyboardNavigation(e);
            }
        });
    }

    setupAjax() {
        if (!this.ajaxEnabled) return;

        // Override default link behavior for AJAX
        const links = document.querySelectorAll(`${this.pagination} a`);
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.loadPageAjax(link.href);
            });
        });
    }

    extractPageFromUrl(url) {
        const urlObj = new URL(url);
        const page = urlObj.searchParams.get('page');
        return page ? parseInt(page) : 1;
    }

    getCurrentPage() {
        const activePage = document.querySelector(`${this.pagination} .pagination-page.active`);
        if (activePage) {
            return parseInt(activePage.textContent.trim());
        }
        return 1;
    }

    handlePageChange(page, link) {
        if (this.ajaxEnabled) {
            this.loadPageAjax(link.href);
        } else {
            this.navigateToPage(link.href);
        }

        // Trigger custom callback
        if (this.onPageChange) {
            this.onPageChange(page, link);
        }
    }

    navigateToPage(url) {
        window.location.href = url;
    }

    async loadPageAjax(url) {
        const pagination = document.querySelector(this.pagination);
        if (!pagination) return;

        // Add loading state
        pagination.classList.add(this.loadingClass);

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const html = await response.text();
            this.updateContent(html);
            this.updateUrl(url);

        } catch (error) {
            console.error('Pagination AJAX error:', error);
            // Fallback to normal navigation
            this.navigateToPage(url);
        } finally {
            // Remove loading state
            pagination.classList.remove(this.loadingClass);
        }
    }

    updateContent(html) {
        // Parse the response HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Update pagination
        const newPagination = doc.querySelector(this.pagination);
        if (newPagination) {
            const currentPagination = document.querySelector(this.pagination);
            if (currentPagination) {
                currentPagination.outerHTML = newPagination.outerHTML;
            }
        }

        // Update content area (customize selector as needed)
        const contentSelectors = [
            '.attractions-grid',
            '.content-area',
            '.main-content',
            '.results-container'
        ];

        for (const selector of contentSelectors) {
            const newContent = doc.querySelector(selector);
            const currentContent = document.querySelector(selector);
            
            if (newContent && currentContent) {
                currentContent.innerHTML = newContent.innerHTML;
                break;
            }
        }

        // Re-initialize if needed
        this.init();
    }

    updateUrl(url) {
        // Update browser URL without page reload
        if (window.history && window.history.pushState) {
            window.history.pushState(null, '', url);
        }
    }

    handleKeyboardNavigation(e) {
        const currentPage = this.getCurrentPage();
        let newPage = null;

        switch (e.key) {
            case 'ArrowLeft':
                newPage = currentPage - 1;
                break;
            case 'ArrowRight':
                newPage = currentPage + 1;
                break;
            case 'Home':
                newPage = 1;
                break;
            case 'End':
                const totalPages = this.getTotalPages();
                newPage = totalPages;
                break;
        }

        if (newPage && newPage !== currentPage) {
            const link = document.querySelector(`${this.pagination} a[href*="page=${newPage}"]`);
            if (link) {
                e.preventDefault();
                this.handlePageChange(newPage, link);
            }
        }
    }

    getTotalPages() {
        const pages = document.querySelectorAll(`${this.pagination} .pagination-page`);
        let maxPage = 1;
        pages.forEach(page => {
            const pageNum = parseInt(page.textContent.trim());
            if (pageNum > maxPage) {
                maxPage = pageNum;
            }
        });
        return maxPage;
    }

    // Public methods for external control
    goToPage(page) {
        const link = document.querySelector(`${this.pagination} a[href*="page=${page}"]`);
        if (link) {
            this.handlePageChange(page, link);
        }
    }

    nextPage() {
        const nextLink = document.querySelector(`${this.pagination} .next`);
        if (nextLink) {
            const page = this.extractPageFromUrl(nextLink.href);
            this.handlePageChange(page, nextLink);
        }
    }

    prevPage() {
        const prevLink = document.querySelector(`${this.pagination} .prev`);
        if (prevLink) {
            const page = this.extractPageFromUrl(prevLink.href);
            this.handlePageChange(page, prevLink);
        }
    }

    // Utility method to build query string
    static buildQueryString(params) {
        const queryParams = new URLSearchParams();
        
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
                queryParams.append(key, params[key]);
            }
        });

        const queryString = queryParams.toString();
        return queryString ? `&${queryString}` : '';
    }
}

// Auto-initialize pagination components
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all pagination components on the page
    const paginationContainers = document.querySelectorAll('.pagination-container');
    
    paginationContainers.forEach(container => {
        // Check if AJAX is enabled via data attribute
        const ajaxEnabled = container.dataset.ajax === 'true';
        
        new PaginationComponent({
            container: container,
            ajax: ajaxEnabled,
            onPageChange: function(page, link) {
                // Custom callback for page changes
                console.log(`Navigated to page ${page}`);
                
                // Scroll to top of results
                const resultsContainer = document.querySelector('.attractions-grid, .content-area, .main-content');
                if (resultsContainer) {
                    resultsContainer.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PaginationComponent;
}
