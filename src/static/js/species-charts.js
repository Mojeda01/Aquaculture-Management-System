// species-charts.js - Chart visualizations for Species page

document.addEventListener('DOMContentLoaded', function() {
    
    // Color palette
    const colorPalette = {
        blue: 'rgba(0, 119, 190, 0.85)',
        teal: 'rgba(0, 168, 150, 0.85)',
        orange: 'rgba(247, 127, 0, 0.85)',
        green: 'rgba(6, 214, 160, 0.85)',
        red: 'rgba(214, 40, 40, 0.85)',
        purple: 'rgba(142, 68, 173, 0.85)',
        yellow: 'rgba(241, 196, 15, 0.85)'
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

    const borderColors = [
        'rgba(0, 119, 190, 1)',
        'rgba(0, 168, 150, 1)',
        'rgba(247, 127, 0, 1)',
        'rgba(6, 214, 160, 1)',
        'rgba(214, 40, 40, 1)',
        'rgba(142, 68, 173, 1)',
        'rgba(241, 196, 15, 1)'
    ];

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
    // GROWTH RATE CHART (Bar)
    // ==========================================
    const growthCanvas = document.getElementById('growthRateChart');
    if (growthCanvas) {
        const speciesLabels = JSON.parse(growthCanvas.dataset.species);
        const growthRates = JSON.parse(growthCanvas.dataset.growthRates);
        
        const backgroundColors = speciesLabels.map((_, i) => colors[i % colors.length]);
        const borderColorsList = speciesLabels.map((_, i) => borderColors[i % borderColors.length]);
        
        const growthCtx = growthCanvas.getContext('2d');
        new Chart(growthCtx, {
            type: 'bar',
            data: {
                labels: speciesLabels.map(s => `Species ${s}`),
                datasets: [{
                    label: 'Growth Rate (g/day)',
                    data: growthRates,
                    backgroundColor: backgroundColors,
                    borderColor: borderColorsList,
                    borderWidth: 2,
                    borderRadius: 8
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
                            font: {
                                size: 11
                            }
                        }
                    },
                    x: {
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
                plugins: {
                    ...commonOptions.plugins,
                    tooltip: {
                        ...commonOptions.plugins.tooltip,
                        callbacks: {
                            label: function(context) {
                                return ` Growth Rate: ${context.parsed.y.toFixed(3)} g/day`;
                            }
                        }
                    }
                }
            }
        });
    }

    // ==========================================
    // SURVIVAL RATE CHART (Line)
    // ==========================================
    const survivalCanvas = document.getElementById('survivalRateChart');
    if (survivalCanvas) {
        const speciesLabels = JSON.parse(survivalCanvas.dataset.species);
        const survivalRates = JSON.parse(survivalCanvas.dataset.survivalRates);
        
        const survivalCtx = survivalCanvas.getContext('2d');
        new Chart(survivalCtx, {
            type: 'line',
            data: {
                labels: speciesLabels.map(s => `Species ${s}`),
                datasets: [{
                    label: 'Survival Rate (%)',
                    data: survivalRates,
                    borderColor: 'rgba(6, 214, 160, 1)',
                    backgroundColor: 'rgba(6, 214, 160, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 6,
                    pointHoverRadius: 8,
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
                                return value.toFixed(1) + '%';
                            }
                        }
                    },
                    x: {
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
                plugins: {
                    ...commonOptions.plugins,
                    tooltip: {
                        ...commonOptions.plugins.tooltip,
                        callbacks: {
                            label: function(context) {
                                return ` Survival Rate: ${context.parsed.y.toFixed(1)}%`;
                            }
                        }
                    }
                }
            }
        });
    }

    // ==========================================
    // FCR CHART (Horizontal Bar)
    // ==========================================
    const fcrCanvas = document.getElementById('fcrChart');
    if (fcrCanvas) {
        const speciesLabels = JSON.parse(fcrCanvas.dataset.species);
        const fcrValues = JSON.parse(fcrCanvas.dataset.fcr);
        
        const fcrCtx = fcrCanvas.getContext('2d');
        new Chart(fcrCtx, {
            type: 'bar',
            data: {
                labels: speciesLabels.map(s => `Species ${s}`),
                datasets: [{
                    label: 'Feed Conversion Ratio',
                    data: fcrValues,
                    backgroundColor: 'rgba(247, 127, 0, 0.7)',
                    borderColor: 'rgba(247, 127, 0, 1)',
                    borderWidth: 2,
                    borderRadius: 8
                }]
            },
            options: {
                indexAxis: 'y',
                ...commonOptions,
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
                plugins: {
                    ...commonOptions.plugins,
                    legend: {
                        display: false
                    },
                    tooltip: {
                        ...commonOptions.plugins.tooltip,
                        callbacks: {
                            label: function(context) {
                                return ` FCR: ${context.parsed.x.toFixed(3)}`;
                            }
                        }
                    }
                }
            }
        });
    }

    // ==========================================
    // WEIGHT CHART (Radar)
    // ==========================================
    const weightCanvas = document.getElementById('weightChart');
    if (weightCanvas) {
        const speciesLabels = JSON.parse(weightCanvas.dataset.species);
        const weights = JSON.parse(weightCanvas.dataset.weights);
        
        const weightCtx = weightCanvas.getContext('2d');
        new Chart(weightCtx, {
            type: 'radar',
            data: {
                labels: speciesLabels.map(s => `Species ${s}`),
                datasets: [{
                    label: 'Average Weight (g)',
                    data: weights,
                    backgroundColor: 'rgba(0, 119, 190, 0.2)',
                    borderColor: 'rgba(0, 119, 190, 1)',
                    borderWidth: 3,
                    pointBackgroundColor: 'rgba(0, 119, 190, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(0, 119, 190, 1)',
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
                    tooltip: {
                        ...commonOptions.plugins.tooltip,
                        callbacks: {
                            label: function(context) {
                                return ` Weight: ${context.parsed.r.toFixed(2)}g`;
                            }
                        }
                    }
                }
            }
        });
    }

    // ==========================================
    // DISEASE STATUS CHART (Doughnut)
    // ==========================================
    const diseaseCanvas = document.getElementById('diseaseChart');
    if (diseaseCanvas) {
        const diseaseLabels = JSON.parse(diseaseCanvas.dataset.labels);
        const diseaseCounts = JSON.parse(diseaseCanvas.dataset.counts);
        
        const diseaseCtx = diseaseCanvas.getContext('2d');
        new Chart(diseaseCtx, {
            type: 'doughnut',
            data: {
                labels: diseaseLabels.map(label => `Status ${label}`),
                datasets: [{
                    data: diseaseCounts,
                    backgroundColor: [
                        'rgba(6, 214, 160, 0.85)',
                        'rgba(241, 196, 15, 0.85)',
                        'rgba(214, 40, 40, 0.85)'
                    ],
                    borderColor: [
                        'rgba(6, 214, 160, 1)',
                        'rgba(241, 196, 15, 1)',
                        'rgba(214, 40, 40, 1)'
                    ],
                    borderWidth: 3,
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
                    }
                }
            }
        });
    }

    // ==========================================
    // AGE DISTRIBUTION CHART (Bar)
    // ==========================================
    const ageCanvas = document.getElementById('ageDistributionChart');
    if (ageCanvas) {
        const speciesLabels = JSON.parse(ageCanvas.dataset.species);
        const ages = JSON.parse(ageCanvas.dataset.ages);
        
        const backgroundColors = speciesLabels.map((_, i) => colors[i % colors.length]);
        const borderColorsList = speciesLabels.map((_, i) => borderColors[i % borderColors.length]);
        
        const ageCtx = ageCanvas.getContext('2d');
        new Chart(ageCtx, {
            type: 'bar',
            data: {
                labels: speciesLabels.map(s => `Species ${s}`),
                datasets: [{
                    label: 'Average Age (days)',
                    data: ages,
                    backgroundColor: backgroundColors,
                    borderColor: borderColorsList,
                    borderWidth: 2,
                    borderRadius: 8
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
                            font: {
                                size: 11
                            }
                        }
                    },
                    x: {
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
                plugins: {
                    ...commonOptions.plugins,
                    tooltip: {
                        ...commonOptions.plugins.tooltip,
                        callbacks: {
                            label: function(context) {
                                return ` Age: ${context.parsed.y.toFixed(0)} days`;
                            }
                        }
                    }
                }
            }
        });
    }
});