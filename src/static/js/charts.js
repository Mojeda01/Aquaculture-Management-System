// charts.js - Enhanced Chart visualizations for Sites page

document.addEventListener('DOMContentLoaded', function() {
    
    // Define a professional color palette
    const colorPalette = {
        blue: {
            bg: 'rgba(0, 119, 190, 0.85)',
            border: 'rgba(0, 119, 190, 1)',
            hover: 'rgba(0, 119, 190, 0.95)'
        },
        teal: {
            bg: 'rgba(0, 168, 150, 0.85)',
            border: 'rgba(0, 168, 150, 1)',
            hover: 'rgba(0, 168, 150, 0.95)'
        },
        orange: {
            bg: 'rgba(247, 127, 0, 0.85)',
            border: 'rgba(247, 127, 0, 1)',
            hover: 'rgba(247, 127, 0, 0.95)'
        },
        green: {
            bg: 'rgba(6, 214, 160, 0.85)',
            border: 'rgba(6, 214, 160, 1)',
            hover: 'rgba(6, 214, 160, 0.95)'
        },
        red: {
            bg: 'rgba(214, 40, 40, 0.85)',
            border: 'rgba(214, 40, 40, 1)',
            hover: 'rgba(214, 40, 40, 0.95)'
        },
        purple: {
            bg: 'rgba(142, 68, 173, 0.85)',
            border: 'rgba(142, 68, 173, 1)',
            hover: 'rgba(142, 68, 173, 0.95)'
        },
        yellow: {
            bg: 'rgba(241, 196, 15, 0.85)',
            border: 'rgba(241, 196, 15, 1)',
            hover: 'rgba(241, 196, 15, 0.95)'
        }
    };

    const colors = [
        colorPalette.blue,
        colorPalette.teal,
        colorPalette.orange,
        colorPalette.green,
        colorPalette.red,
        colorPalette.purple,
        colorPalette.yellow
    ];

    // Common chart options
    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    padding: 20,
                    font: {
                        size: 13,
                        family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
                    },
                    usePointStyle: true,
                    pointStyle: 'circle'
                }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleFont: {
                    size: 14,
                    weight: 'bold'
                },
                bodyFont: {
                    size: 13
                },
                padding: 12,
                cornerRadius: 8,
                displayColors: true
            }
        },
        animation: {
            duration: 1000,
            easing: 'easeOutQuart'
        }
    };

    // ==========================================
    // REGULATORY ZONE CHART (Doughnut)
    // ==========================================
    const regulatoryCanvas = document.getElementById('regulatoryZoneChart');
    if (regulatoryCanvas) {
        const zoneLabels = JSON.parse(regulatoryCanvas.dataset.labels);
        const zoneCounts = JSON.parse(regulatoryCanvas.dataset.counts);
        
        const backgroundColors = zoneLabels.map((_, i) => colors[i % colors.length].bg);
        const borderColors = zoneLabels.map((_, i) => colors[i % colors.length].border);
        const hoverColors = zoneLabels.map((_, i) => colors[i % colors.length].hover);
        
        const regulatoryCtx = regulatoryCanvas.getContext('2d');
        new Chart(regulatoryCtx, {
            type: 'doughnut',
            data: {
                labels: zoneLabels.map(label => `Zone ${label}`),
                datasets: [{
                    data: zoneCounts,
                    backgroundColor: backgroundColors,
                    borderColor: borderColors,
                    hoverBackgroundColor: hoverColors,
                    borderWidth: 3,
                    hoverBorderWidth: 4,
                    hoverOffset: 15
                }]
            },
            options: {
                ...commonOptions,
                cutout: '50%',
                plugins: {
                    ...commonOptions.plugins,
                    legend: {
                        ...commonOptions.plugins.legend,
                        labels: {
                            ...commonOptions.plugins.legend.labels,
                            generateLabels: function(chart) {
                                const data = chart.data;
                                if (data.labels.length && data.datasets.length) {
                                    return data.labels.map((label, i) => {
                                        const dataset = data.datasets[0];
                                        const value = dataset.data[i];
                                        const total = dataset.data.reduce((a, b) => a + b, 0);
                                        const percentage = ((value / total) * 100).toFixed(1);
                                        
                                        return {
                                            text: `${label}: ${value} (${percentage}%)`,
                                            fillStyle: dataset.backgroundColor[i],
                                            strokeStyle: dataset.borderColor[i],
                                            lineWidth: 2,
                                            hidden: false,
                                            index: i
                                        };
                                    });
                                }
                                return [];
                            }
                        }
                    },
                    tooltip: {
                        ...commonOptions.plugins.tooltip,
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return [
                                    ` Sites: ${value}`,
                                    ` Percentage: ${percentage}%`
                                ];
                            }
                        }
                    }
                }
            }
        });
    }

    // ==========================================
    // SPECIES CHART (Polar Area)
    // ==========================================
    const speciesCanvas = document.getElementById('speciesChart');
    if (speciesCanvas) {
        const speciesLabels = JSON.parse(speciesCanvas.dataset.labels);
        const speciesCounts = JSON.parse(speciesCanvas.dataset.counts);
        
        const backgroundColors = speciesLabels.map((_, i) => colors[i % colors.length].bg);
        const borderColors = speciesLabels.map((_, i) => colors[i % colors.length].border);
        
        const speciesCtx = speciesCanvas.getContext('2d');
        new Chart(speciesCtx, {
            type: 'polarArea',
            data: {
                labels: speciesLabels.map(label => `Species ${label}`),
                datasets: [{
                    data: speciesCounts,
                    backgroundColor: backgroundColors,
                    borderColor: borderColors,
                    borderWidth: 2
                }]
            },
            options: {
                ...commonOptions,
                scales: {
                    r: {
                        beginAtZero: true,
                        ticks: {
                            backdropColor: 'transparent',
                            font: {
                                size: 10
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    }
                },
                plugins: {
                    ...commonOptions.plugins,
                    tooltip: {
                        ...commonOptions.plugins.tooltip,
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed.r || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return [
                                    ` Records: ${value}`,
                                    ` Percentage: ${percentage}%`
                                ];
                            }
                        }
                    }
                }
            }
        });
    }

    // ==========================================
    // CAGE DISTRIBUTION CHART (Horizontal Bar)
    // ==========================================
    const cageCanvas = document.getElementById('cageDistributionChart');
    if (cageCanvas) {
        const cageLabels = JSON.parse(cageCanvas.dataset.labels);
        const cageCounts = JSON.parse(cageCanvas.dataset.counts);
        
        const cageCtx = cageCanvas.getContext('2d');
        new Chart(cageCtx, {
            type: 'bar',
            data: {
                labels: cageLabels.map(label => `Site ${label}`),
                datasets: [{
                    label: 'Number of Cages',
                    data: cageCounts,
                    backgroundColor: 'rgba(0, 119, 190, 0.7)',
                    borderColor: 'rgba(0, 119, 190, 1)',
                    borderWidth: 2,
                    borderRadius: 8,
                    barThickness: 'flex',
                    maxBarThickness: 40
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        ...commonOptions.plugins.tooltip,
                        callbacks: {
                            label: function(context) {
                                return ` Cages: ${context.parsed.x}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            font: {
                                size: 11
                            }
                        }
                    },
                    y: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: {
                                size: 11
                            }
                        }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                }
            }
        });
    }

    // ==========================================
    // WATER QUALITY RADAR CHART
    // ==========================================
    const waterQualityCanvas = document.getElementById('waterQualityChart');
    if (waterQualityCanvas) {
        const avgTemp = parseFloat(waterQualityCanvas.dataset.avgTemp) || 0;
        const avgSalinity = parseFloat(waterQualityCanvas.dataset.avgSalinity) || 0;
        const avgDepth = parseFloat(waterQualityCanvas.dataset.avgDepth) || 0;
        const avgCurrent = parseFloat(waterQualityCanvas.dataset.avgCurrent) || 0;
        const avgWave = parseFloat(waterQualityCanvas.dataset.avgWave) || 0;
        
        const waterQualityCtx = waterQualityCanvas.getContext('2d');
        new Chart(waterQualityCtx, {
            type: 'radar',
            data: {
                labels: ['Temperature', 'Salinity', 'Water Depth', 'Current Speed', 'Wave Exposure'],
                datasets: [{
                    label: 'Average Conditions',
                    data: [avgTemp, avgSalinity, avgDepth, avgCurrent, avgWave],
                    backgroundColor: 'rgba(0, 168, 150, 0.2)',
                    borderColor: 'rgba(0, 168, 150, 1)',
                    borderWidth: 3,
                    pointBackgroundColor: 'rgba(0, 168, 150, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(0, 168, 150, 1)',
                    pointRadius: 5,
                    pointHoverRadius: 7
                }]
            },
            options: {
                ...commonOptions,
                scales: {
                    r: {
                        beginAtZero: true,
                        ticks: {
                            backdropColor: 'transparent',
                            font: {
                                size: 10
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        pointLabels: {
                            font: {
                                size: 12,
                                weight: 'bold'
                            }
                        }
                    }
                },
                plugins: {
                    ...commonOptions.plugins,
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    // ==========================================
    // PROFIT MARGIN TREND (Line Chart)
    // ==========================================
    const profitCanvas = document.getElementById('profitTrendChart');
    if (profitCanvas) {
        const siteIds = JSON.parse(profitCanvas.dataset.siteIds);
        const profitMargins = JSON.parse(profitCanvas.dataset.profitMargins);
        
        const profitCtx = profitCanvas.getContext('2d');
        new Chart(profitCtx, {
            type: 'line',
            data: {
                labels: siteIds.map(id => `Site ${id}`),
                datasets: [{
                    label: 'Profit Margin',
                    data: profitMargins,
                    borderColor: 'rgba(6, 214, 160, 1)',
                    backgroundColor: 'rgba(6, 214, 160, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: 'rgba(6, 214, 160, 1)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }]
            },
            options: {
                ...commonOptions,
                scales: {
                    y: {
                        beginAtZero: false,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            font: {
                                size: 11
                            },
                            callback: function(value) {
                                return value.toFixed(2);
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: {
                                size: 10
                            },
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                },
                plugins: {
                    ...commonOptions.plugins,
                    tooltip: {
                        ...commonOptions.plugins.tooltip,
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed.y;
                                return ` Profit Margin: ${value.toFixed(3)}`;
                            }
                        }
                    }
                }
            }
        });
    }
});