// Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize charts
    initProfileVisitChart();
    initEuropeChart();
    initVisitorsProfileChart();
    
    // Initialize theme toggle
    initThemeToggle();
    
    // Initialize sidebar collapse
    initSidebarCollapse();
    
    // Initialize mobile sidebar toggle
    initMobileSidebar();
});

// Profile Visit Chart (Bar Chart)
function initProfileVisitChart() {
    const chartElement = document.querySelector("#profile-visit-chart");
    if (!chartElement) return;
    
    const options = {
        series: [{
            name: 'Visits',
            data: [10, 15, 20, 25, 18, 30, 22, 28, 25, 20, 30, 25]
        }],
        chart: {
            type: 'bar',
            height: 300,
            toolbar: {
                show: false
            }
        },
        colors: ['#667eea'],
        plotOptions: {
            bar: {
                borderRadius: 4,
                horizontal: false,
            }
        },
        dataLabels: {
            enabled: false
        },
        xaxis: {
            categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        },
        yaxis: {
            min: 0,
            max: 30,
            tickAmount: 6
        },
        grid: {
            borderColor: '#f1f1f1',
            strokeDashArray: 4
        },
        tooltip: {
            y: {
                formatter: function (val) {
                    return val + " visits"
                }
            }
        }
    };

    const chart = new ApexCharts(chartElement, options);
    chart.render();
}

// Europe Chart (Area Chart)
function initEuropeChart() {
    const chartElement = document.querySelector("#europe-chart");
    if (!chartElement) return;
    
    const options = {
        series: [{
            name: 'Europe',
            data: [10, 20, 15, 25, 20, 30, 25, 35, 30, 25, 20, 15]
        }],
        chart: {
            type: 'area',
            height: 100,
            sparkline: {
                enabled: true
            },
            toolbar: {
                show: false
            }
        },
        colors: ['#667eea'],
        stroke: {
            curve: 'smooth',
            width: 2
        },
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.7,
                opacityTo: 0.3,
                stops: [0, 90, 100]
            }
        },
        dataLabels: {
            enabled: false
        },
        xaxis: {
            categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        },
        tooltip: {
            enabled: false
        }
    };

    const chart = new ApexCharts(chartElement, options);
    chart.render();
}

// Visitors Profile Chart (Donut Chart)
function initVisitorsProfileChart() {
    const chartElement = document.querySelector("#visitors-profile-chart");
    if (!chartElement) return;
    
    const options = {
        series: [30, 70],
        chart: {
            type: 'donut',
            height: 200,
            toolbar: {
                show: false
            }
        },
        colors: ['#667eea', '#e9ecef'],
        labels: ['Male', 'Female'],
        plotOptions: {
            pie: {
                donut: {
                    size: '70%'
                }
            }
        },
        dataLabels: {
            enabled: true,
            formatter: function (val, opts) {
                return opts.w.config.series[opts.seriesIndex] + '%'
            }
        },
        legend: {
            show: true,
            position: 'bottom',
            horizontalAlign: 'center'
        },
        tooltip: {
            y: {
                formatter: function (val) {
                    return val + '%'
                }
            }
        }
    };

    const chart = new ApexCharts(chartElement, options);
    chart.render();
}

// Theme Toggle
function initThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    const body = document.body;
    
    // Check if themeToggle exists before proceeding
    if (!themeToggle) {
        console.log('Theme toggle element not found, skipping theme initialization');
        return;
    }
    
    // Check for saved theme preference or default to light mode
    const currentTheme = localStorage.getItem('theme') || 'light';
    
    if (currentTheme === 'dark') {
        body.classList.add('dark-theme');
        themeToggle.checked = true;
    }
    
    themeToggle.addEventListener('change', function() {
        if (this.checked) {
            body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
        } else {
            body.classList.remove('dark-theme');
            localStorage.setItem('theme', 'light');
        }
    });
}

// Sidebar Collapse
function initSidebarCollapse() {
    const sidebarLinks = document.querySelectorAll('.sidebar .nav-link[data-bs-toggle="collapse"]');
    
    if (sidebarLinks.length === 0) {
        console.log('No sidebar collapse links found, skipping sidebar collapse initialization');
        return;
    }
    
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('data-bs-target'));
            const chevron = this.querySelector('.fa-chevron-down');
            
            if (target) {
                const bsCollapse = new bootstrap.Collapse(target, {
                    toggle: true
                });
                
                // Rotate chevron
                if (chevron) {
                    chevron.style.transform = target.classList.contains('show') ? 'rotate(0deg)' : 'rotate(180deg)';
                }
            }
        });
    });
}

// Mobile Sidebar Toggle
function initMobileSidebar() {
    const sidebar = document.querySelector('.sidebar');
    
    if (!sidebar) {
        console.log('Sidebar element not found, skipping mobile sidebar initialization');
        return;
    }
    
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'btn btn-primary position-fixed top-0 start-0 m-3 d-md-none';
    toggleBtn.style.zIndex = '1001';
    toggleBtn.innerHTML = '<i class="fas fa-bars"></i>';
    toggleBtn.onclick = function() {
        sidebar.classList.toggle('show');
    };
    
    if (window.innerWidth <= 768) {
        document.body.appendChild(toggleBtn);
    }
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 768 && 
            !sidebar.contains(e.target) && 
            !toggleBtn.contains(e.target)) {
            sidebar.classList.remove('show');
        }
    });
    
    // Handle window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            sidebar.classList.remove('show');
            if (toggleBtn.parentNode) {
                toggleBtn.parentNode.removeChild(toggleBtn);
            }
        } else if (window.innerWidth <= 768 && !document.body.contains(toggleBtn)) {
            document.body.appendChild(toggleBtn);
        }
    });
}

// Stats Cards Animation
function animateStatsCards() {
    const statsCards = document.querySelectorAll('.stats-card');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animation = 'fadeInUp 0.6s ease-out';
            }
        });
    });
    
    statsCards.forEach(card => {
        observer.observe(card);
    });
}

// Initialize animations
animateStatsCards();

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
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
    
    .dark-theme {
        --sidebar-bg: #2c3e50;
        --sidebar-text: #bdc3c7;
        --sidebar-active: #3498db;
        --main-bg: #34495e;
        color: #ecf0f1;
    }
    
    .dark-theme .card {
        background-color: #2c3e50;
        color: #ecf0f1;
    }
    
    .dark-theme .stats-card {
        background-color: #2c3e50;
        color: #ecf0f1;
    }
    
    .dark-theme .table {
        color: #ecf0f1;
    }
    
    .dark-theme .table th {
        background-color: #34495e;
        color: #ecf0f1;
    }
`;
document.head.appendChild(style);

console.log('Dashboard initialized successfully!');