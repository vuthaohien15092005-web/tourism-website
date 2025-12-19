/**
 * Accommodation Admin JavaScript
 * Handles form interactions, validation, and dynamic field management
 */

// Global variables
let accommodationForm = null;
let imagePreviewContainer = null;
let fileUploadArea = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeAccommodationAdmin();
});

/**
 * Initialize accommodation admin functionality
 */
function initializeAccommodationAdmin() {
    try {
        // Initialize form
        accommodationForm = document.getElementById('accommodationForm');
        if (accommodationForm) {
            initializeForm();
        }

        // Initialize image preview
        initializeImagePreview();

        // Initialize file upload
        initializeFileUpload();

        // Initialize dynamic fields
        initializeDynamicFields();

        // Initialize validation
        initializeValidation();

        // Initialize tooltips
        initializeTooltips();

        // Initialize modals
        initializeModals();

        console.log('Accommodation admin initialized successfully');
    } catch (error) {
        console.error('Error initializing accommodation admin:', error);
    }
}

/**
 * Initialize form functionality
 */
function initializeForm() {
    if (!accommodationForm) return;

    try {
        // Form submission handler
        accommodationForm.addEventListener('submit', handleFormSubmit);

        // Real-time validation
        const requiredFields = accommodationForm.querySelectorAll('[required]');
        requiredFields.forEach(field => {
            if (field) {
                field.addEventListener('blur', validateField);
                field.addEventListener('input', function() {
                    clearFieldError(this);
                });
            }
        });

        // Auto-generate slug from name
        const nameField = document.getElementById('name');
        const slugField = document.getElementById('slug');
        if (nameField && slugField) {
            nameField.addEventListener('input', function() {
                if (!slugField.value) {
                    slugField.value = generateSlug(this.value);
                }
            });
        }

        // Price formatting
        const priceField = document.getElementById('priceFrom');
        if (priceField) {
            priceField.addEventListener('input', function(e) {
                formatPrice(e);
            });
        }
    } catch (error) {
        console.error('Error initializing form:', error);
    }
}

/**
 * Handle form submission
 */
function handleFormSubmit(e) {
    if (!validateForm()) {
        e.preventDefault();
        showAlert('Vui lòng kiểm tra lại thông tin!', 'error');
        return false;
    }

    // Show loading state
    showLoadingState(true);
    
    // Let the form submit normally
    // The server will handle the response and redirect
}

/**
 * Initialize image preview functionality
 */
function initializeImagePreview() {
    try {
        const imageInput = document.getElementById('images');
        if (!imageInput) return;

        imageInput.addEventListener('change', function(e) {
            const files = Array.from(e.target.files);
            if (files.length === 0) return;

            // Clear existing previews
            clearImagePreviews();

            // Create preview container if it doesn't exist
            if (!imagePreviewContainer) {
                createImagePreviewContainer();
            }

            // Process each file
            files.forEach((file, index) => {
                if (file.type.startsWith('image/')) {
                    createImagePreview(file, index);
                }
            });
        });
    } catch (error) {
        console.error('Error initializing image preview:', error);
    }
}

/**
 * Create image preview container
 */
function createImagePreviewContainer() {
    const imageInput = document.getElementById('images');
    if (!imageInput) return;

    imagePreviewContainer = document.createElement('div');
    imagePreviewContainer.className = 'image-preview-container mt-3';
    imagePreviewContainer.innerHTML = '<h6>Hình ảnh đã chọn:</h6><div class="image-gallery" id="imageGallery"></div>';
    
    imageInput.parentNode.insertBefore(imagePreviewContainer, imageInput.nextSibling);
}

/**
 * Create individual image preview
 */
function createImagePreview(file, index) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const gallery = document.getElementById('imageGallery');
        if (!gallery) return;

        const previewDiv = document.createElement('div');
        previewDiv.className = 'image-preview-item position-relative';
        previewDiv.innerHTML = `
            <img src="${e.target.result}" alt="Preview ${index + 1}" class="img-fluid rounded">
            <button type="button" class="btn btn-sm btn-danger position-absolute top-0 end-0 m-1" onclick="removeImagePreview(this)">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        gallery.appendChild(previewDiv);
    };
    
    reader.readAsDataURL(file);
}

/**
 * Remove image preview
 */
function removeImagePreview(button) {
    const previewItem = button.closest('.image-preview-item');
    if (previewItem) {
        previewItem.remove();
    }
}

/**
 * Clear all image previews
 */
function clearImagePreviews() {
    const gallery = document.getElementById('imageGallery');
    if (gallery) {
        gallery.innerHTML = '';
    }
}

/**
 * Initialize file upload functionality
 */
function initializeFileUpload() {
    try {
        fileUploadArea = document.querySelector('.file-upload-area');
        if (!fileUploadArea) return;

        const fileInput = fileUploadArea.querySelector('input[type="file"]');
        if (!fileInput) return;

        // Drag and drop functionality
        fileUploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.classList.add('dragover');
        });

        fileUploadArea.addEventListener('dragleave', function(e) {
            e.preventDefault();
            this.classList.remove('dragover');
        });

        fileUploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('dragover');
            
            const files = Array.from(e.dataTransfer.files);
            if (files.length > 0) {
                fileInput.files = e.dataTransfer.files;
                fileInput.dispatchEvent(new Event('change'));
            }
        });

        // Click to upload
        fileUploadArea.addEventListener('click', function() {
            fileInput.click();
        });
    } catch (error) {
        console.error('Error initializing file upload:', error);
    }
}

/**
 * Initialize dynamic fields functionality
 */
function initializeDynamicFields() {
    try {
        // Add field buttons
        const addButtons = document.querySelectorAll('[onclick*="addField"]');
        addButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                const onclick = this.getAttribute('onclick');
                const matches = onclick.match(/addField\('([^']+)',\s*'([^']+)',\s*'([^']+)'\)/);
                if (matches) {
                    addDynamicField(matches[1], matches[2], matches[3]);
                }
            });
        });

        // Remove field buttons
        document.addEventListener('click', function(e) {
            if (e.target.closest('[onclick*="removeField"]')) {
                e.preventDefault();
                const button = e.target.closest('[onclick*="removeField"]');
                removeDynamicField(button);
            }
        });
    } catch (error) {
        console.error('Error initializing dynamic fields:', error);
    }
}

/**
 * Add dynamic field
 */
function addDynamicField(containerId, name, placeholder) {
    if (!containerId || !name || !placeholder) return;
    
    const container = document.getElementById(containerId);
    if (!container) return;

    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'input-group mb-2';
    fieldDiv.innerHTML = `
        <input type="text" class="form-control" name="${name}" placeholder="${placeholder}">
        <button type="button" class="btn btn-outline-danger" onclick="removeField(this)">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(fieldDiv);
    
    // Add animation
    fieldDiv.style.opacity = '0';
    fieldDiv.style.transform = 'translateY(-10px)';
    setTimeout(() => {
        fieldDiv.style.transition = 'all 0.3s ease';
        fieldDiv.style.opacity = '1';
        fieldDiv.style.transform = 'translateY(0)';
    }, 10);
}

/**
 * Remove dynamic field
 */
function removeDynamicField(button) {
    if (!button) return;
    
    const fieldDiv = button.closest('.input-group');
    if (fieldDiv) {
        fieldDiv.style.transition = 'all 0.3s ease';
        fieldDiv.style.opacity = '0';
        fieldDiv.style.transform = 'translateY(-10px)';
        setTimeout(() => {
            if (fieldDiv.parentNode) {
                fieldDiv.remove();
            }
        }, 300);
    }
}

/**
 * Initialize form validation
 */
function initializeValidation() {
    try {
        // Custom validation rules
        const validationRules = {
            name: {
                required: true,
                minLength: 2,
                maxLength: 100
            },
            priceFrom: {
                required: true,
                min: 0,
                type: 'number'
            },
            description: {
                required: true,
                minLength: 10
            },
            'address[street]': {
                required: true,
                minLength: 5
            },
            'address[district]': {
                required: true,
                minLength: 2
            }
        };

        // Apply validation rules
        Object.keys(validationRules).forEach(fieldName => {
            const field = document.querySelector(`[name="${fieldName}"]`);
            if (field) {
                field.addEventListener('blur', function() {
                    validateFieldWithRules(this, validationRules[fieldName]);
                });
            }
        });
    } catch (error) {
        console.error('Error initializing validation:', error);
    }
}

/**
 * Validate field with custom rules
 */
function validateFieldWithRules(field, rules) {
    if (!field || !rules) return true;
    
    const value = field.value ? field.value.trim() : '';
    let isValid = true;
    let errorMessage = '';

    // Required validation
    if (rules.required && !value) {
        isValid = false;
        errorMessage = 'Trường này là bắt buộc';
    }

    // Min length validation
    if (isValid && rules.minLength && value.length < rules.minLength) {
        isValid = false;
        errorMessage = `Tối thiểu ${rules.minLength} ký tự`;
    }

    // Max length validation
    if (isValid && rules.maxLength && value.length > rules.maxLength) {
        isValid = false;
        errorMessage = `Tối đa ${rules.maxLength} ký tự`;
    }

    // Number validation
    if (isValid && rules.type === 'number' && value) {
        // Remove formatting for validation
        const cleanValue = value.replace(/[^\d]/g, '');
        const numValue = parseFloat(cleanValue);
        if (isNaN(numValue)) {
            isValid = false;
            errorMessage = 'Vui lòng nhập số hợp lệ';
        } else if (rules.min !== undefined && numValue < rules.min) {
            isValid = false;
            errorMessage = `Giá trị tối thiểu là ${rules.min}`;
        }
    }

    // Show/hide error
    if (isValid) {
        clearFieldError(field);
    } else {
        showFieldError(field, errorMessage);
    }

    return isValid;
}

/**
 * Validate individual field
 */
function validateField(e) {
    if (!e || !e.target) return true;
    
    const field = e.target;
    const value = field.value ? field.value.trim() : '';
    
    if (field.hasAttribute('required') && !value) {
        showFieldError(field, 'Trường này là bắt buộc');
        return false;
    }
    
    clearFieldError(field);
    return true;
}

/**
 * Clear field error
 */
function clearFieldError(field) {
    if (!field) return;
    
    field.classList.remove('is-invalid');
    field.classList.add('is-valid');
    
    if (field.parentNode) {
        const errorDiv = field.parentNode.querySelector('.invalid-feedback');
        if (errorDiv) {
            errorDiv.remove();
        }
    }
}

/**
 * Show field error
 */
function showFieldError(field, message) {
    if (!field) return;
    
    field.classList.remove('is-valid');
    field.classList.add('is-invalid');
    
    if (field.parentNode) {
        // Remove existing error message
        const existingError = field.parentNode.querySelector('.invalid-feedback');
        if (existingError) {
            existingError.remove();
        }
        
        // Add new error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'invalid-feedback';
        errorDiv.textContent = message;
        field.parentNode.appendChild(errorDiv);
    }
}

/**
 * Validate entire form
 */
function validateForm() {
    if (!accommodationForm) return true;
    
    const requiredFields = accommodationForm.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (field && !validateField({ target: field })) {
            isValid = false;
        }
    });
    
    return isValid;
}

/**
 * Initialize tooltips
 */
function initializeTooltips() {
    try {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    } catch (error) {
        console.error('Error initializing tooltips:', error);
    }
}

/**
 * Initialize modals
 */
function initializeModals() {
    try {
        // Image modal
        const imageModal = document.getElementById('imageModal');
        if (imageModal) {
            imageModal.addEventListener('show.bs.modal', function (event) {
                const button = event.relatedTarget;
                const imageSrc = button.getAttribute('data-bs-image');
                const imageAlt = button.getAttribute('data-bs-alt');
                
                const modalImage = imageModal.querySelector('#modalImage');
                const modalTitle = imageModal.querySelector('#imageModalTitle');
                
                if (modalImage) modalImage.src = imageSrc;
                if (modalTitle) modalTitle.textContent = imageAlt;
            });
        }
    } catch (error) {
        console.error('Error initializing modals:', error);
    }
}

/**
 * Show loading state
 */
function showLoadingState(show) {
    if (!accommodationForm) return;
    
    const submitButton = accommodationForm.querySelector('button[type="submit"]');
    if (submitButton) {
        if (show) {
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Đang lưu...';
        } else {
            submitButton.disabled = false;
            submitButton.innerHTML = '<i class="fas fa-save me-2"></i>Lưu lưu trú';
        }
    }
}

/**
 * Show alert message
 */
function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alertContainer') || createAlertContainer();
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        <i class="fas fa-${getAlertIcon(type)} me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    alertContainer.appendChild(alertDiv);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

/**
 * Create alert container
 */
function createAlertContainer() {
    const container = document.createElement('div');
    container.id = 'alertContainer';
    container.className = 'position-fixed top-0 end-0 p-3';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
    return container;
}

/**
 * Get alert icon based on type
 */
function getAlertIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-triangle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

/**
 * Generate slug from text
 */
function generateSlug(text) {
    if (!text) return '';
    
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-');
}

/**
 * Format price input
 */
function formatPrice(e) {
    const field = e.target;
    if (!field) return;
    
    // Remove all non-digit characters
    let value = field.value.replace(/[^\d]/g, '');
    
    if (value) {
        // Convert to number and format
        const numValue = parseInt(value);
        if (!isNaN(numValue)) {
            field.value = numValue.toLocaleString('vi-VN');
        }
    }
}

/**
 * Confirm delete action
 */
function confirmDelete(id, name) {
    if (!id || !name) return;
    
    const modal = document.getElementById('deleteModal');
    if (!modal) return;
    
    const deleteName = document.getElementById('deleteName');
    const deleteForm = document.getElementById('deleteForm');
    
    if (deleteName) deleteName.textContent = name;
    if (deleteForm) deleteForm.action = `/admin/accommodations/delete/${id}`;
    
    try {
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    } catch (error) {
        console.error('Error showing modal:', error);
    }
}

/**
 * Show image modal
 */
function showImageModal(imageSrc, imageAlt) {
    if (!imageSrc || !imageAlt) return;
    
    const modal = document.getElementById('imageModal');
    if (!modal) return;
    
    const modalImage = document.getElementById('modalImage');
    const modalTitle = document.getElementById('imageModalTitle');
    
    if (modalImage) modalImage.src = imageSrc;
    if (modalTitle) modalTitle.textContent = imageAlt;
    
    try {
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    } catch (error) {
        console.error('Error showing image modal:', error);
    }
}

/**
 * Utility functions for backward compatibility
 */
function addField(containerId, name, placeholder) {
    addDynamicField(containerId, name, placeholder);
}

function removeField(button) {
    removeDynamicField(button);
}

// Export functions for global access
window.accommodationAdmin = {
    initialize: initializeAccommodationAdmin,
    addField: addDynamicField,
    removeField: removeDynamicField,
    validateForm: validateForm,
    showAlert: showAlert,
    confirmDelete: confirmDelete,
    showImageModal: showImageModal
};
