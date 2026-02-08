// water-quality-charts.js - Chart visualizations for Water Quality page

document.addEventListener('DOMContentLoaded', function() {
    
    // Color palette
    const colors = {
        blue: 'rgba(0, 119, 190, 0.7)',
        blueBorder: 'rgba(0, 119, 190, 1)',
        teal: 'rgba(0, 168, 150, 0.7)',
        tealBorder: 'rgba(0, 168, 150, 1)',
        orange: 'rgba(247, 127, 0, 0.7)',
        orangeBorder: 'rgba(247, 127, 0, 1)',
        green: 'rgba(6, 214, 160, 0.7)',
        greenBorder: 'rgba(6, 214, 160, 1)',
        red: 'rgba(214, 40, 40, 0.7)',
        redBorder: 'rgba(214, 40, 40, 1)',
        purple: 'rgba(142, 68, 173, 0.7)',
        purpleBorder: 'rgba(142, 68, 173, 1)'
    };

    // Common options
    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    padding: 15,
                    font: {
                        size: 12,
                        family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
                    }
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
                cornerRadius: 8
            }
        },
        animation: {
            duration: 1000,
            easing: 'easeOutQuart'
        }
    };

    // ==========================================
    // TEMPERATURE DISTRIBUTION (Histogram/Bar)
    // ==========================================
    const tempCanvas = document.getElementById('temperatureChart');
    if (tempCanvas) {
        const temps = JSON.parse(tempCanvas.dataset.temps);
        
        // Create histogram bins
        const bins = createHistogramBins(temps, 10);
        
        const tempCtx = tempCanvas.getContext('2d');
        new Chart(tempCtx, {
            type: 'bar',
            data: {
                labels: bins.labels,
                datasets: [{
                    label: 'Number of Sites',
                    data: bins.counts,
                    backgroundColor: colors.blue,
                    borderColor: colors.blueBorder,
                    borderWidth: 2,
                    borderRadius: 6
                }]
            },
            options: {
                ...commonOptions,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            font: { size: 11 }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: { size: 11 }
                        }
                    }
                },
                plugins: {
                    ...commonOptions.plugins,
                    legend: {
                        display: false
                    },
                    tooltip: {
                        ...commonOptions.plugins.tooltip,
                        callbacks: {
                            label: function(context) {
                                return ` Sites: ${context.parsed.y}`;
                            }
                        }
                    }
                }
            }
        });
    }

    // ==========================================
    // SALINITY LEVELS (Line)
    // ==========================================
    const salinityCanvas = document.getElementById('salinityChart');
    if (salinityCanvas) {
        const salinity = JSON.parse(salinityCanvas.dataset.salinity);
        
        // Sort and create indices
        const sorted = salinity.sort((a, b) => a - b);
        const indices = sorted.map((_, i) => i + 1);
        
        const salinityCtx = salinityCanvas.getContext('2d');
        new Chart(salinityCtx, {
            type: 'line',
            data: {
                labels: indices,
                datasets: [{
                    label: 'Salinity (PSU)',
                    data: sorted,
                    borderColor: colors.tealBorder,
                    backgroundColor: colors.teal,
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 2,
                    pointHoverRadius: 5
                }]
            },
            options: {
                ...commonOptions,
                scales: {
                    y: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            font: { size: 11 }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: { size: 11 },
                            maxTicksLimit: 10
                        }
                    }
                },
                plugins: {
                    ...commonOptions.plugins,
                    tooltip: {
                        ...commonOptions.plugins.tooltip,
                        callbacks: {
                            title: function(context) {
                                return `Site ${context[0].label}`;
                            },
                            label: function(context) {
                                return ` Salinity: ${context.parsed.y.toFixed(2)} PSU`;
                            }
                        }
                    }
                }
            }
        });
    }

    // ==========================================
    // DISSOLVED OXYGEN (Area Chart)
    // ==========================================
    const oxygenCanvas = document.getElementById('oxygenChart');
    if (oxygenCanvas) {
        const oxygen = JSON.parse(oxygenCanvas.dataset.oxygen);
        
        const sorted = oxygen.sort((a, b) => a - b);
        const indices = sorted.map((_, i) => i + 1);
        
        const oxygenCtx = oxygenCanvas.getContext('2d');
        new Chart(oxygenCtx, {
            type: 'line',
            data: {
                labels: indices,
                datasets: [{
                    label: 'Dissolved O₂ (mg/L)',
                    data: sorted,
                    borderColor: colors.greenBorder,
                    backgroundColor: colors.green,
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 2,
                    pointHoverRadius: 5
                }]
            },
            options: {
                ...commonOptions,
                scales: {
                    y: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            font: { size: 11 }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: { size: 11 },
                            maxTicksLimit: 10
                        }
                    }
                },
                plugins: {
                    ...commonOptions.plugins,
                    tooltip: {
                        ...commonOptions.plugins.tooltip,
                        callbacks: {
                            label: function(context) {
                                return ` Oxygen: ${context.parsed.y.toFixed(2)} mg/L`;
                            }
                        }
                    }
                }
            }
        });
    }

    // ==========================================
    // WATER QUALITY PARAMETERS (Radar)
    // ==========================================
    const radarCanvas = document.getElementById('parametersRadarChart');
    if (radarCanvas) {
        const temp = parseFloat(radarCanvas.dataset.temp);
        const salinity = parseFloat(radarCanvas.dataset.salinity);
        const oxygen = parseFloat(radarCanvas.dataset.oxygen);
        const ammonia = parseFloat(radarCanvas.dataset.ammonia);
        const nitrate = parseFloat(radarCanvas.dataset.nitrate);
        const turbidity = parseFloat(radarCanvas.dataset.turbidity);
        
        const radarCtx = radarCanvas.getContext('2d');
        new Chart(radarCtx, {
            type: 'radar',
            data: {
                labels: ['Temperature', 'Salinity', 'Oxygen', 'Ammonia', 'Nitrate', 'Turbidity'],
                datasets: [{
                    label: 'Average Values',
                    data: [temp, salinity, oxygen, ammonia, nitrate, turbidity],
                    backgroundColor: colors.blue,
                    borderColor: colors.blueBorder,
                    borderWidth: 3,
                    pointBackgroundColor: colors.blueBorder,
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: colors.blueBorder,
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
                            font: { size: 10 }
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
                }
            }
        });
    }

    // ==========================================
    // NUTRIENTS CHART (Multi-line)
    // ==========================================
    const nutrientsCanvas = document.getElementById('nutrientsChart');
    if (nutrientsCanvas) {
        const ammonia = JSON.parse(nutrientsCanvas.dataset.ammonia);
        const nitrate = JSON.parse(nutrientsCanvas.dataset.nitrate);
        const sites = JSON.parse(nutrientsCanvas.dataset.sites);
        
        const nutrientsCtx = nutrientsCanvas.getContext('2d');
        new Chart(nutrientsCtx, {
            type: 'line',
            data: {
                labels: sites.slice(0, 20).map(s => `Site ${s}`),
                datasets: [
                    {
                        label: 'Ammonia (mg/L)',
                        data: ammonia.slice(0, 20),
                        borderColor: colors.orangeBorder,
                        backgroundColor: colors.orange,
                        borderWidth: 2,
                        tension: 0.3,
                        fill: false
                    },
                    {
                        label: 'Nitrate (mg/L)',
                        data: nitrate.slice(0, 20),
                        borderColor: colors.purpleBorder,
                        backgroundColor: colors.purple,
                        borderWidth: 2,
                        tension: 0.3,
                        fill: false
                    }
                ]
            },
            options: {
                ...commonOptions,
                scales: {
                    y: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            font: { size: 11 }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: { size: 10 },
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                }
            }
        });
    }

    // ==========================================
    // CLARITY CHART (Turbidity & Chlorophyll)
    // ==========================================
    const clarityCanvas = document.getElementById('clarityChart');
    if (clarityCanvas) {
        const turbidity = JSON.parse(clarityCanvas.dataset.turbidity);
        const chlorophyll = JSON.parse(clarityCanvas.dataset.chlorophyll);
        const sites = JSON.parse(clarityCanvas.dataset.sites);
        
        const clarityCtx = clarityCanvas.getContext('2d');
        new Chart(clarityCtx, {
            type: 'bar',
            data: {
                labels: sites.slice(0, 15).map(s => `Site ${s}`),
                datasets: [
                    {
                        label: 'Turbidity (NTU)',
                        data: turbidity.slice(0, 15),
                        backgroundColor: colors.orange,
                        borderColor: colors.orangeBorder,
                        borderWidth: 2,
                        borderRadius: 6
                    },
                    {
                        label: 'Chlorophyll Index',
                        data: chlorophyll.slice(0, 15),
                        backgroundColor: colors.green,
                        borderColor: colors.greenBorder,
                        borderWidth: 2,
                        borderRadius: 6
                    }
                ]
            },
            options: {
                ...commonOptions,
                scales: {
                    y: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            font: { size: 11 }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: { size: 10 },
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                }
            }
        });
    }

    // ==========================================
    // ZONE QUALITY CHART (Grouped Bar)
    // ==========================================
    const zoneCanvas = document.getElementById('zoneQualityChart');
    if (zoneCanvas) {
        const zones = JSON.parse(zoneCanvas.dataset.zones);
        const temps = JSON.parse(zoneCanvas.dataset.temp);
        const oxygen = JSON.parse(zoneCanvas.dataset.oxygen);
        const salinity = JSON.parse(zoneCanvas.dataset.salinity);
        
        const zoneCtx = zoneCanvas.getContext('2d');
        new Chart(zoneCtx, {
            type: 'bar',
            data: {
                labels: zones.map(z => `Zone ${z}`),
                datasets: [
                    {
                        label: 'Temperature (°C)',
                        data: temps,
                        backgroundColor: colors.blue,
                        borderColor: colors.blueBorder,
                        borderWidth: 2,
                        borderRadius: 6
                    },
                    {
                        label: 'Dissolved O₂ (mg/L)',
                        data: oxygen,
                        backgroundColor: colors.green,
                        borderColor: colors.greenBorder,
                        borderWidth: 2,
                        borderRadius: 6
                    },
                    {
                        label: 'Salinity (PSU)',
                        data: salinity,
                        backgroundColor: colors.teal,
                        borderColor: colors.tealBorder,
                        borderWidth: 2,
                        borderRadius: 6
                    }
                ]
            },
            options: {
                ...commonOptions,
                scales: {
                    y: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            font: { size: 11 }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: { size: 12 }
                        }
                    }
                }
            }
        });
    }

    // Helper function to create histogram bins
    function createHistogramBins(data, numBins) {
        const min = Math.min(...data);
        const max = Math.max(...data);
        const binWidth = (max - min) / numBins;
        
        const bins = [];
        const labels = [];
        
        for (let i = 0; i < numBins; i++) {
            const binStart = min + (i * binWidth);
            const binEnd = binStart + binWidth;
            const count = data.filter(val => val >= binStart && val < binEnd).length;
            
            bins.push(count);
            labels.push(`${binStart.toFixed(1)}-${binEnd.toFixed(1)}`);
        }
        
        return { counts: bins, labels: labels };
    }
});