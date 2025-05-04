document.addEventListener('DOMContentLoaded', function () {
    function updateCurrentTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString();
        document.getElementById('current-time').textContent = timeString;
    }

    setInterval(updateCurrentTime, 1000);
    updateCurrentTime();

    const refreshBtn = document.getElementById('refresh-btn');
    refreshBtn.addEventListener('click', function () {
        this.classList.add('animate__animated', 'animate__rotateIn');
        setTimeout(() => {
            this.classList.remove('animate__animated', 'animate__rotateIn');
        }, 1000);
        updateDashboard();
    });

    const cpuCtx = document.getElementById('cpu-chart').getContext('2d');
    const memoryCtx = document.getElementById('memory-chart').getContext('2d');

    const generateTimeLabels = () => {
        const labels = [];
        const now = new Date();
        for (let i = 11; i >= 0; i--) {
            const time = new Date(now.getTime() - (i * 5 * 60 * 1000));
            labels.push(time.getMinutes() + 'm ago');
        }
        return labels;
    };

    const cpuGradient = cpuCtx.createLinearGradient(0, 0, 0, 400);
    cpuGradient.addColorStop(0, 'rgba(99, 102, 241, 0.8)');
    cpuGradient.addColorStop(1, 'rgba(99, 102, 241, 0.1)');

    const cpuChart = new Chart(cpuCtx, {
        type: 'line',
        data: {
            labels: generateTimeLabels(),
            datasets: [{
                label: 'CPU Usage %',
                data: Array(12).fill(0),
                borderColor: cpuGradient,
                backgroundColor: 'rgba(99, 102, 241, 0.05)',
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: 'white',
                pointBorderColor: 'var(--primary)',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'white',
                    titleColor: 'var(--dark)',
                    bodyColor: 'var(--gray-dark)',
                    borderColor: 'var(--gray-light)',
                    borderWidth: 1,
                    padding: 12,
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                    callbacks: {
                        label: function (context) {
                            return `${context.dataset.label}: ${context.parsed.y}%`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)',
                        drawBorder: false
                    },
                    ticks: {
                        color: 'var(--gray-dark)'
                    }
                },
                x: {
                    grid: {
                        display: false,
                        drawBorder: false
                    },
                    ticks: {
                        maxRotation: 0,
                        autoSkip: true,
                        color: 'var(--gray-dark)'
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });

    const memoryChart = new Chart(memoryCtx, {
        type: 'bar',
        data: {
            labels: ['Used', 'Free', 'Cached'],
            datasets: [{
                label: 'Memory (GB)',
                data: [0, 0, 0],
                backgroundColor: [
                    'rgba(99, 102, 241, 0.7)',
                    'rgba(16, 185, 129, 0.7)',
                    'rgba(249, 115, 22, 0.7)'
                ],
                borderColor: [
                    'rgba(99, 102, 241, 1)',
                    'rgba(16, 185, 129, 1)',
                    'rgba(249, 115, 22, 1)'
                ],
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'white',
                    titleColor: 'var(--dark)',
                    bodyColor: 'var(--gray-dark)',
                    borderColor: 'var(--gray-light)',
                    borderWidth: 1,
                    padding: 12,
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                    callbacks: {
                        label: function (context) {
                            return `${context.dataset.label}: ${context.parsed.y} GB`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)',
                        drawBorder: false
                    },
                    ticks: {
                        color: 'var(--gray-dark)',
                        callback: function (value) {
                            return value + ' GB';
                        }
                    }
                },
                x: {
                    grid: {
                        display: false,
                        drawBorder: false
                    },
                    ticks: {
                        color: 'var(--gray-dark)'
                    }
                }
            }
        }
    });

    const formatDate = (timestamp) => {
        if (!timestamp) return 'Never';
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    function animateValue(element, start, end, duration) {
        if (start === end) return;

        const range = end - start;
        let current = start;
        const increment = end > start ? 1 : -1;
        const stepTime = Math.abs(Math.floor(duration / range));
        const timer = setInterval(() => {
            current += increment;
            element.textContent = current.toLocaleString();
            if (current === end) {
                clearInterval(timer);
            }
        }, stepTime);
    }

    const updateDashboard = async () => {
        try {
            const response = await fetch('/monitor/data');
            if (!response.ok) throw new Error('Network response was not ok');

            const data = await response.json();

            const totalRequestsEl = document.getElementById('total-requests');
            const newTotalRequests = data.totalRequests || 0;
            const currentTotalRequests = parseInt(totalRequestsEl.textContent.replace(/,/g, '') || '0');
            animateValue(totalRequestsEl, currentTotalRequests, newTotalRequests, 800);

            document.getElementById('uptime').textContent = data.uptime || '0h 0m';

            const successRate = data.totalRequests > 0
                ? Math.round((data.successfulRequests / data.totalRequests) * 100)
                : 0;
            document.getElementById('success-rate').textContent = successRate + '%';

            const activeUsersEl = document.getElementById('active-users');
            const newActiveUsers = Object.keys(data.apiKeys || {}).length;
            const currentActiveUsers = parseInt(activeUsersEl.textContent || '0');
            animateValue(activeUsersEl, currentActiveUsers, newActiveUsers, 800);

            gsap.from('.stat-card', {
                y: 20,
                opacity: 0,
                duration: 0.5,
                stagger: 0.1,
                ease: 'power2.out'
            });

            const cpuData = cpuChart.data.datasets[0].data;
            cpuData.shift();
            cpuData.push(data.loadAvg?.[0] ? data.loadAvg[0] * 10 : Math.random() * 30 + 20);
            cpuChart.update();

            const totalGB = data.systemMemory ? (data.systemMemory / (1024 ** 3)).toFixed(1) : 0;
            const freeGB = data.freeMemory ? (data.freeMemory / (1024 ** 3)).toFixed(1) : 0;
            memoryChart.data.datasets[0].data = [
                parseFloat((totalGB - freeGB).toFixed(1)),
                parseFloat(freeGB),
                parseFloat((freeGB * 0.3).toFixed(1))
            ];
            memoryChart.update();

            const topEndpointsTbody = document.querySelector('#top-endpoints tbody');
            topEndpointsTbody.innerHTML = '';
            (data.topEndpoints || []).forEach((endpoint, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${endpoint.path || ''}</td>
                    <td>${endpoint.count || 0}</td>
                    <td>${endpoint.success || 0}</td>
                    <td>${endpoint.fail || 0}</td>
                `;
                row.style.animationDelay = `${index * 0.1}s`;
                row.classList.add('animate__animated', 'animate__fadeInUp');
                topEndpointsTbody.appendChild(row);
            });

            const recentActivityTbody = document.querySelector('#recent-activity tbody');
            recentActivityTbody.innerHTML = '';
            (data.recentActivity || []).forEach((activity, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${activity.path || ''}</td>
                    <td>${formatDate(activity.lastUsed)}</td>
                    <td><span class="status-badge success">Success</span></td>
                `;
                row.style.animationDelay = `${index * 0.1}s`;
                row.classList.add('animate__animated', 'animate__fadeInUp');
                recentActivityTbody.appendChild(row);
            });

        } catch (error) {
            console.error('Error updating dashboard:', error);
            document.getElementById('total-requests').textContent = 'Error';
            document.getElementById('uptime').textContent = 'Error';
        }
    };

    updateDashboard();
    setInterval(updateDashboard, 5000);

    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');

    sidebarToggle.addEventListener('click', function () {
        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('sidebar-collapsed');
    });
});