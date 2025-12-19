/**
 * Blog Enhancement Script - SEO Optimized
 * Handles blog interactions, animations, and performance optimizations
 */

(function() {
    'use strict';

    // Performance optimization: Lazy loading for images
    function initLazyLoading() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        imageObserver.unobserve(img);
                    }
                });
            });

            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    }

    // Enhanced blog card animations
    function initBlogAnimations() {
        const blogCards = document.querySelectorAll('.blog-card');
        
        if ('IntersectionObserver' in window) {
            const cardObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.style.animationDelay = '0.1s';
                        entry.target.classList.add('animate-in');
                    }
                });
            }, {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            });

            blogCards.forEach(card => {
                cardObserver.observe(card);
            });
        }
    }

    // Reading progress indicator
    function initReadingProgress() {
        const progressBar = document.createElement('div');
        progressBar.className = 'reading-progress';
        progressBar.innerHTML = '<div class="progress-fill"></div>';
        document.body.appendChild(progressBar);

        window.addEventListener('scroll', () => {
            const article = document.querySelector('.article');
            if (!article) return;

            const articleTop = article.offsetTop;
            const articleHeight = article.offsetHeight;
            const windowHeight = window.innerHeight;
            const scrollTop = window.pageYOffset;
            
            const progress = Math.min(
                Math.max((scrollTop - articleTop + windowHeight) / articleHeight, 0),
                1
            );
            
            document.querySelector('.progress-fill').style.width = `${progress * 100}%`;
        });
    }

    // Enhanced search functionality
    function initBlogSearch() {
        const searchInput = document.querySelector('#blog-search');
        if (!searchInput) return;

        const blogCards = document.querySelectorAll('.blog-card');
        
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            
            blogCards.forEach(card => {
                const title = card.querySelector('.blog-title').textContent.toLowerCase();
                const excerpt = card.querySelector('.blog-excerpt').textContent.toLowerCase();
                const category = card.querySelector('.blog-category').textContent.toLowerCase();
                
                const matches = title.includes(searchTerm) || 
                              excerpt.includes(searchTerm) || 
                              category.includes(searchTerm);
                
                card.style.display = matches ? 'block' : 'none';
            });
        });
    }

    // Social sharing functionality
    function initSocialSharing() {
        const shareButtons = document.querySelectorAll('.share a');
        
        shareButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                
                const platform = button.querySelector('i').className;
                const url = encodeURIComponent(window.location.href);
                const title = encodeURIComponent(document.title);
                
                let shareUrl = '';
                
                if (platform.includes('facebook')) {
                    shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
                } else if (platform.includes('twitter')) {
                    shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
                } else if (platform.includes('envelope')) {
                    shareUrl = `mailto:?subject=${title}&body=${url}`;
                }
                
                if (shareUrl) {
                    window.open(shareUrl, '_blank', 'width=600,height=400');
                }
            });
        });
    }

    // Table of contents navigation
    function initTableOfContents() {
        const toc = document.querySelector('.itinerary');
        if (!toc) return;

        const links = toc.querySelectorAll('a[href^="#"]');
        
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    // Enhanced image optimization
    function optimizeImages() {
        const images = document.querySelectorAll('.blog-image img, .article-cover img');
        
        images.forEach(img => {
            // Add loading="lazy" for better performance
            img.setAttribute('loading', 'lazy');
            
            // Add error handling
            img.addEventListener('error', () => {
                img.src = '/client/img/404.png';
                img.alt = 'Image not found';
            });
        });
    }

    // Initialize all blog enhancements
    function initBlogEnhancements() {
        initLazyLoading();
        initBlogAnimations();
        initReadingProgress();
        initBlogSearch();
        initSocialSharing();
        initTableOfContents();
        optimizeImages();
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initBlogEnhancements);
    } else {
        initBlogEnhancements();
    }

    // Add CSS for reading progress
    const progressCSS = `
        .reading-progress {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 3px;
            background: rgba(18, 97, 166, 0.1);
            z-index: 1000;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, var(--primary-color), #0d4a7a);
            width: 0%;
            transition: width 0.3s ease;
        }
        
        .blog-card.animate-in {
            animation: fadeInUp 0.6s ease forwards;
        }
        
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;

    const style = document.createElement('style');
    style.textContent = progressCSS;
    document.head.appendChild(style);

})();