// Admin Panel JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Initialize popovers
    var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });

    // Auto-hide alerts after 5 seconds
    setTimeout(function() {
        var alerts = document.querySelectorAll('.alert');
        alerts.forEach(function(alert) {
            var bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        });
    }, 5000);

    // Image preview functionality
    function previewImage(input, previewId) {
        if (input.files && input.files[0]) {
            var reader = new FileReader();
            reader.onload = function(e) {
                document.getElementById(previewId).src = e.target.result;
                document.getElementById(previewId).style.display = 'block';
            };
            reader.readAsDataURL(input.files[0]);
        }
    }

    // Multiple image preview
    function previewMultipleImages(input, containerId) {
        var container = document.getElementById(containerId);
        container.innerHTML = '';
        
        if (input.files) {
            Array.from(input.files).forEach(function(file, index) {
                var reader = new FileReader();
                reader.onload = function(e) {
                    var div = document.createElement('div');
                    div.className = 'col-md-3 mb-3';
                    div.innerHTML = `
                        <div class="position-relative">
                            <img src="${e.target.result}" class="img-fluid rounded" style="height: 150px; width: 100%; object-fit: cover;">
                            <button type="button" class="btn btn-sm btn-danger position-absolute top-0 end-0 m-1" onclick="removeImagePreview(this)">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    `;
                    container.appendChild(div);
                };
                reader.readAsDataURL(file);
            });
        }
    }

    // Remove image preview
    window.removeImagePreview = function(button) {
        button.closest('.col-md-3').remove();
    };

    // Form validation
    function validateForm(formId) {
        var form = document.getElementById(formId);
        if (form) {
            form.addEventListener('submit', function(event) {
                var isValid = true;
                var requiredFields = form.querySelectorAll('[required]');
                
                requiredFields.forEach(function(field) {
                    if (!field.value.trim()) {
                        field.classList.add('is-invalid');
                        isValid = false;
                    } else {
                        field.classList.remove('is-invalid');
                    }
                });
                
                if (!isValid) {
                    event.preventDefault();
                    showAlert('Vui lòng điền đầy đủ thông tin bắt buộc', 'danger');
                }
            });
        }
    }

    // Show alert function
    window.showAlert = function(message, type) {
        var alertContainer = document.getElementById('alert-container') || createAlertContainer();
        var alertId = 'alert-' + Date.now();
        
        var alertHtml = `
            <div id="${alertId}" class="alert alert-${type} alert-dismissible fade show" role="alert">
                <i class="fas fa-${getAlertIcon(type)} me-2"></i>
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        alertContainer.insertAdjacentHTML('beforeend', alertHtml);
        
        // Auto-hide after 5 seconds
        setTimeout(function() {
            var alert = document.getElementById(alertId);
            if (alert) {
                var bsAlert = new bootstrap.Alert(alert);
                bsAlert.close();
            }
        }, 5000);
    };

    function createAlertContainer() {
        var container = document.createElement('div');
        container.id = 'alert-container';
        container.className = 'position-fixed top-0 end-0 p-3';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
        return container;
    }

    function getAlertIcon(type) {
        var icons = {
            'success': 'check-circle',
            'danger': 'exclamation-circle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    // Confirm delete function (admin attractions)
    window.confirmDelete = function(id, name) {
        var modal = new bootstrap.Modal(document.getElementById('deleteModal'));
        document.getElementById('deleteName').textContent = name;
        // Default admin attractions delete URL
        var form = document.getElementById('deleteForm');
        if (form) form.action = '/admin/attractions/delete/' + id;
        modal.show();
    };

    // Toggle sidebar on mobile
    function toggleSidebar() {
        var sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.classList.toggle('show');
        }
    }

    // Add toggle button for mobile
    if (window.innerWidth <= 768) {
        var toggleBtn = document.createElement('button');
        toggleBtn.className = 'btn btn-primary position-fixed top-0 start-0 m-3';
        toggleBtn.style.zIndex = '1001';
        toggleBtn.innerHTML = '<i class="fas fa-bars"></i>';
        toggleBtn.onclick = toggleSidebar;
        document.body.appendChild(toggleBtn);
    }

    // Search functionality
    function initSearch() {
        var searchInputs = document.querySelectorAll('.search-input');
        searchInputs.forEach(function(input) {
            input.addEventListener('input', function() {
                var searchTerm = this.value.toLowerCase();
                var targetTable = document.querySelector(this.dataset.target);
                
                if (targetTable) {
                    var rows = targetTable.querySelectorAll('tbody tr');
                    rows.forEach(function(row) {
                        var text = row.textContent.toLowerCase();
                        if (text.includes(searchTerm)) {
                            row.style.display = '';
                        } else {
                            row.style.display = 'none';
                        }
                    });
                }
            });
        });
    }

    // Initialize search
    initSearch();

    // Data table functionality
    function initDataTable() {
        var tables = document.querySelectorAll('.data-table');
        tables.forEach(function(table) {
            // Add sorting functionality
            var headers = table.querySelectorAll('th[data-sort]');
            headers.forEach(function(header) {
                header.style.cursor = 'pointer';
                header.addEventListener('click', function() {
                    var column = this.dataset.sort;
                    var tbody = table.querySelector('tbody');
                    var rows = Array.from(tbody.querySelectorAll('tr'));
                    
                    rows.sort(function(a, b) {
                        var aVal = a.querySelector('td[data-sort="' + column + '"]').textContent;
                        var bVal = b.querySelector('td[data-sort="' + column + '"]').textContent;
                        return aVal.localeCompare(bVal);
                    });
                    
                    rows.forEach(function(row) {
                        tbody.appendChild(row);
                    });
                });
            });
        });
    }

    // Initialize data tables
    initDataTable();

    // File upload with progress
    function initFileUpload() {
        var fileInputs = document.querySelectorAll('input[type="file"]');
        fileInputs.forEach(function(input) {
            input.addEventListener('change', function() {
                var files = this.files;
                var maxSize = 5 * 1024 * 1024; // 5MB
                
                Array.from(files).forEach(function(file) {
                    if (file.size > maxSize) {
                        showAlert('File ' + file.name + ' quá lớn. Kích thước tối đa là 5MB.', 'warning');
                        return;
                    }
                    
                    if (!file.type.startsWith('image/')) {
                        showAlert('Chỉ được upload file ảnh.', 'warning');
                        return;
                    }
                });
            });
        });
    }

    // Initialize file upload
    initFileUpload();

    // Auto-save form data
    function initAutoSave() {
        var forms = document.querySelectorAll('form[data-autosave]');
        forms.forEach(function(form) {
            var formId = form.id || 'form-' + Date.now();
            var inputs = form.querySelectorAll('input, textarea, select');
            
            inputs.forEach(function(input) {
                input.addEventListener('input', function() {
                    var data = {};
                    inputs.forEach(function(inp) {
                        if (inp.name) {
                            data[inp.name] = inp.value;
                        }
                    });
                    localStorage.setItem('autosave-' + formId, JSON.stringify(data));
                });
            });
            
            // Restore saved data
            var savedData = localStorage.getItem('autosave-' + formId);
            if (savedData) {
                try {
                    var data = JSON.parse(savedData);
                    Object.keys(data).forEach(function(key) {
                        var input = form.querySelector('[name="' + key + '"]');
                        if (input && input.type !== 'password') {
                            input.value = data[key];
                        }
                    });
                } catch (e) {
                    console.error('Error restoring form data:', e);
                }
            }
        });
    }

    // Initialize auto-save
    initAutoSave();

    // Clear auto-save on form submit
    document.addEventListener('submit', function(event) {
        var form = event.target;
        if (form.dataset.autosave) {
            var formId = form.id || 'form-' + Date.now();
            localStorage.removeItem('autosave-' + formId);
        }
    });

    // Loading state only when the form actually submits
    function initLoadingStates() {
        var forms = document.querySelectorAll('form');
        forms.forEach(function(form) {
            form.addEventListener('submit', function() {
                var submitBtn = form.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Đang xử lý...';
                    submitBtn.disabled = true;
                }
            });
        });
    }

    // Initialize loading states on submit
    initLoadingStates();

    // Copy to clipboard functionality
    window.copyToClipboard = function(text) {
        navigator.clipboard.writeText(text).then(function() {
            showAlert('Đã sao chép vào clipboard', 'success');
        }).catch(function() {
            showAlert('Không thể sao chép', 'danger');
        });
    };

    // Print functionality
    window.printPage = function() {
        window.print();
    };

    // Export functionality
    window.exportTable = function(tableId, filename) {
        var table = document.getElementById(tableId);
        if (!table) return;
        
        var csv = [];
        var rows = table.querySelectorAll('tr');
        
        rows.forEach(function(row) {
            var rowData = [];
            var cells = row.querySelectorAll('td, th');
            cells.forEach(function(cell) {
                rowData.push('"' + cell.textContent.replace(/"/g, '""') + '"');
            });
            csv.push(rowData.join(','));
        });
        
        var csvContent = csv.join('\n');
        var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        var link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename || 'export.csv';
        link.click();
    };

    console.log('Admin panel initialized successfully!');
});
