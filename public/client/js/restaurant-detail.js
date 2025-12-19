// Restaurant Detail Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize page
    initializeRestaurantDetail();
    
    // Add smooth scrolling for anchor links
    addSmoothScrolling();
    
    // Initialize image gallery
    initializeImageGallery();
    
    // Add click animations
    addClickAnimations();
});

function initializeRestaurantDetail() {
    console.log('Restaurant detail page initialized');
    
    // Add loading animation to images
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        img.addEventListener('load', function() {
            this.style.opacity = '1';
        });
        
        // Set initial opacity for smooth loading
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.3s ease';
    });
}

function addSmoothScrolling() {
    // Smooth scroll for anchor links
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
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

function initializeImageGallery() {
    const galleryItems = document.querySelectorAll('.gallery-item img');
    
    galleryItems.forEach((img, index) => {
        img.addEventListener('click', function() {
            openImageModal(this.src, index, galleryItems);
        });
    });
}

function openImageModal(imageSrc, currentIndex, allImages) {
    // Create modal if it doesn't exist
    let modal = document.getElementById('imageModal');
    if (!modal) {
        modal = createImageModal();
        document.body.appendChild(modal);
    }
    
    // Update modal content
    const modalImg = modal.querySelector('.modal-image img');
    const modalCounter = modal.querySelector('.image-counter');
    const prevBtn = modal.querySelector('.nav-prev');
    const nextBtn = modal.querySelector('.nav-next');
    
    modalImg.src = imageSrc;
    modalCounter.textContent = `${currentIndex + 1} / ${allImages.length}`;
    
    // Show/hide navigation buttons
    prevBtn.style.display = allImages.length > 1 ? 'block' : 'none';
    nextBtn.style.display = allImages.length > 1 ? 'block' : 'none';
    
    // Add navigation functionality
    let currentImageIndex = currentIndex;
    
    function showImage(index) {
        if (index >= 0 && index < allImages.length) {
            currentImageIndex = index;
            modalImg.src = allImages[index].src;
            modalCounter.textContent = `${index + 1} / ${allImages.length}`;
        }
    }
    
    prevBtn.onclick = () => {
        const newIndex = (currentImageIndex - 1 + allImages.length) % allImages.length;
        showImage(newIndex);
    };
    
    nextBtn.onclick = () => {
        const newIndex = (currentImageIndex + 1) % allImages.length;
        showImage(newIndex);
    };
    
    // Show modal
    modal.classList.add('active');
    
    // Keyboard navigation
    const handleKeydown = (e) => {
        if (e.key === 'Escape') {
            closeImageModal();
        } else if (e.key === 'ArrowLeft') {
            prevBtn.click();
        } else if (e.key === 'ArrowRight') {
            nextBtn.click();
        }
    };
    
    document.addEventListener('keydown', handleKeydown);
    modal._keydownHandler = handleKeydown;
}

function createImageModal() {
    const modal = document.createElement('div');
    modal.id = 'imageModal';
    modal.className = 'image-modal';
    modal.innerHTML = `
        <div class="modal-overlay" onclick="closeImageModal()"></div>
        <div class="modal-content">
            <button class="modal-close" onclick="closeImageModal()">
                <i class="fa fa-times"></i>
            </button>
            <div class="modal-nav">
                <button class="nav-prev">
                    <i class="fa fa-chevron-left"></i>
                </button>
                <button class="nav-next">
                    <i class="fa fa-chevron-right"></i>
                </button>
            </div>
            <div class="modal-image">
                <img src="" alt="Restaurant image" />
            </div>
            <div class="modal-info">
                <span class="image-counter">1 / 1</span>
            </div>
        </div>
    `;
    
    // Add modal styles
    const style = document.createElement('style');
    style.textContent = `
        .image-modal {
            position: fixed;
            inset: 0;
            z-index: 2000;
            display: none;
            align-items: center;
            justify-content: center;
            padding: 16px;
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        .image-modal.active {
            display: flex;
            opacity: 1;
        }
        .image-modal .modal-overlay {
            position: absolute;
            inset: 0;
            background: rgba(0,0,0,0.8);
            backdrop-filter: blur(4px);
        }
        .image-modal .modal-content {
            position: relative;
            width: min(90vw, 800px);
            height: min(80vh, 600px);
            background: #fff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            transform: scale(0.9);
            transition: transform 0.3s ease;
        }
        .image-modal.active .modal-content {
            transform: scale(1);
        }
        .image-modal .modal-close {
            position: absolute;
            top: 15px;
            right: 15px;
            z-index: 10;
            background: rgba(0,0,0,0.7);
            color: #fff;
            width: 40px;
            height: 40px;
            border: none;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            transition: background 0.2s ease;
        }
        .image-modal .modal-close:hover {
            background: rgba(0,0,0,0.9);
        }
        .image-modal .modal-nav {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            width: 100%;
            display: flex;
            justify-content: space-between;
            padding: 0 20px;
            pointer-events: none;
        }
        .image-modal .modal-nav button {
            background: rgba(0,0,0,0.7);
            color: #fff;
            width: 50px;
            height: 50px;
            border: none;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            transition: background 0.2s ease;
            pointer-events: auto;
        }
        .image-modal .modal-nav button:hover {
            background: rgba(0,0,0,0.9);
        }
        .image-modal .modal-image {
            position: relative;
            height: calc(100% - 120px);
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f7fafc;
        }
        .image-modal .modal-image img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
            border-radius: 8px;
        }
        .image-modal .modal-info {
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.7);
            color: #fff;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
        }
    `;
    document.head.appendChild(style);
    
    return modal;
}

function closeImageModal() {
    const modal = document.getElementById('imageModal');
    if (modal) {
        modal.classList.remove('active');
        
        // Remove keyboard event listener
        if (modal._keydownHandler) {
            document.removeEventListener('keydown', modal._keydownHandler);
        }
    }
}

function addClickAnimations() {
    // Add click animation to interactive elements
    const clickableElements = document.querySelectorAll('.btn-map, .menu-item, .specialty-item, .review-item');
    
    clickableElements.forEach(element => {
        element.addEventListener('click', function(e) {
            // Add click animation
            this.style.transform = 'scale(0.98)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    });
}

// Utility function to format phone numbers
function formatPhoneNumber(phone) {
    if (!phone) return '';
    
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Format Vietnamese phone number
    if (cleaned.length === 10 && cleaned.startsWith('0')) {
        return cleaned.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
    }
    
    return phone;
}

// Function to share restaurant
function shareRestaurant() {
    if (navigator.share) {
        navigator.share({
            title: document.title,
            text: 'Khám phá nhà hàng này trên HÀ NỘI VIBES',
            url: window.location.href
        });
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(window.location.href).then(() => {
            alert('Đã sao chép link vào clipboard!');
        });
    }
}

// Function to add to favorites
function addToFavorites() {
    const restaurantName = document.querySelector('h1').textContent;
    const favorites = JSON.parse(localStorage.getItem('favoriteRestaurants') || '[]');
    
    if (!favorites.includes(restaurantName)) {
        favorites.push(restaurantName);
        localStorage.setItem('favoriteRestaurants', JSON.stringify(favorites));
        alert('Đã thêm vào danh sách yêu thích!');
    } else {
        alert('Nhà hàng đã có trong danh sách yêu thích!');
    }
}

// Initialize map if mapUrl is available
function initializeMap() {
    const mapButton = document.querySelector('.btn-map');
    if (mapButton && mapButton.dataset.mapUrl) {
        // You can add map initialization logic here
        console.log('Map URL available:', mapButton.dataset.mapUrl);
    }
}

// Call initialization functions
document.addEventListener('DOMContentLoaded', function() {
    initializeMap();
});
