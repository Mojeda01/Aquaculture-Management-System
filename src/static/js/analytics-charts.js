// analytics-charts.js - Advanced chart visualizations for Analytics page

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
        purpleBorder: 'rgba(142, 68, 173, 1)',
        yellow: 'rgba(241, 196, 15, 0.7)',
        yellowBorder: 'rgba(241, 196, 15, 1)'
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
    // REVENUE VS COST CHART (Grouped Bar)
    // ==========================================
    const revenueCostCanvas = document.getElementById('revenueCostChart');
    if (revenueCostCanvas) {
        const sites = JSON.parse(revenueCostCanvas.dataset.sites);
        const revenue = JSON.parse(revenueCostCanvas.dataset.revenue);
        const cost = JSON.parse(revenueCostCanvas.dataset.cost);
        
        const rcCtx = revenueCostCanvas.getContext('2d');
        new Chart(rcCtx, {
            type: 'bar',
            data: {
                labels: sites.map(s => `Site ${s}`),
                datasets: [
                    {
                        label: 'Revenue',
                        data: revenue,
                        backgroundColor: colors.green,
                        borderColor: colors.greenBorder,
                        borderWidth: 2,
                        borderRadius: 6
                    },
                    {
                        label: 'Cost',
                        data: cost,
                        backgroundColor: colors.red,
                        borderColor: colors.redBorder,
                        borderWidth: 2,
                        borderRadius: 6
                    }
                ]
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
                            font: { size: 11 },
                            callback: function(value) {
                                return '$' + value.toFixed(2);
                            }
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
    // PROFIT DISTRIBUTION (Histogram)
    // ==========================================
    const profitDistCanvas = document.getElementById('profitDistributionChart');
    if (profitDistCanvas) {
        const margins = JSON.parse(profitDistCanvas.dataset.margins);
        
        // Create histogram bins
        const bins = createHistogramBins(margins, 12);
        
        const pdCtx = profitDistCanvas.getContext('2d');
        new Chart(pdCtx, {
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
                            font: { size: 10 },
                            maxRotation: 45,
                            minRotation: 45
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
    // HARVEST BY SPECIES (Doughnut)
    // ==========================================
    const harvestCanvas = document.getElementById('harvestBySpeciesChart');
    if (harvestCanvas) {
        const species = JSON.parse(harvestCanvas.dataset.species);
        const harvest = JSON.parse(harvestCanvas.dataset.harvest);
        
        const colorList = [colors.blue, colors.teal, colors.orange, colors.green, colors.purple, colors.yellow];
        const borderList = [colors.blueBorder, colors.tealBorder, colors.orangeBorder, colors.greenBorder, colors.purpleBorder, colors.yellowBorder];
        
        const harvestCtx = harvestCanvas.getContext('2d');
        new Chart(harvestCtx, {
            type: 'doughnut',
            data: {
                labels: species.map(s => `Species ${s}`),
                datasets: [{
                    data: harvest,
                    backgroundColor: colorList.slice(0, species.length),
                    borderColor: borderList.slice(0, species.length),
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
                                            text: `${label}: ${value.toFixed(0)}kg (${percentage}%)`,
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
    // MARKET PRICE TRENDS (Line)
    // ==========================================
    const marketPriceCanvas = document.getElementById('marketPriceChart');
    if (marketPriceCanvas) {
        const sites = JSON.parse(marketPriceCanvas.dataset.sites);
        const prices = JSON.parse(marketPriceCanvas.dataset.prices);
        
        const mpCtx = marketPriceCanvas.getContext('2d');
        new Chart(mpCtx, {
            type: 'line',
            data: {
                labels: sites.map(s => `Site ${s}`),
                datasets: [{
                    label: 'Market Price ($/kg)',
                    data: prices,
                    borderColor: colors.orangeBorder,
                    backgroundColor: colors.orange,
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: colors.orangeBorder,
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
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
                            font: { size: 11 },
                            callback: function(value) {
                                return '$' + value.toFixed(2);
                            }
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
    // STOCKING DENSITY VS PROFIT (Scatter)
    // ==========================================
    const densityProfitCanvas = document.getElementById('densityProfitChart');
    if (densityProfitCanvas) {
        const density = JSON.parse(densityProfitCanvas.dataset.density);
        const profit = JSON.parse(densityProfitCanvas.dataset.profit);
        
        const scatterData = density.map((d, i) => ({ x: d, y: profit[i] }));
        
        const dpCtx = densityProfitCanvas.getContext('2d');
        new Chart(dpCtx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Stocking Density vs Profit',
                    data: scatterData,
                    backgroundColor: colors.teal,
                    borderColor: colors.tealBorder,
                    borderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
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
                        },
                        title: {
                            display: true,
                            text: 'Profit Margin',
                            font: {
                                size: 13,
                                weight: 'bold'
                            }
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            font: { size: 11 }
                        },
                        title: {
                            display: true,
                            text: 'Stocking Density (kg/m³)',
                            font: {
                                size: 13,
                                weight: 'bold'
                            }
                        }
                    }
                }
            }
        });
    }

    // ==========================================
    // LABOR & ENERGY EFFICIENCY (Multi-line)
    // ==========================================
    const efficiencyCanvas = document.getElementById('efficiencyChart');
    if (efficiencyCanvas) {
        const labor = JSON.parse(efficiencyCanvas.dataset.labor);
        const energy = JSON.parse(efficiencyCanvas.dataset.energy);
        const sites = JSON.parse(efficiencyCanvas.dataset.sites);
        
        const effCtx = efficiencyCanvas.getContext('2d');
        new Chart(effCtx, {
            type: 'line',
            data: {
                labels: sites.map(s => `Site ${s}`),
                datasets: [
                    {
                        label: 'Labor Hours/Day',
                        data: labor,
                        borderColor: colors.blueBorder,
                        backgroundColor: colors.blue,
                        borderWidth: 2,
                        tension: 0.3,
                        fill: false,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Energy (kWh/Day)',
                        data: energy,
                        borderColor: colors.purpleBorder,
                        backgroundColor: colors.purple,
                        borderWidth: 2,
                        tension: 0.3,
                        fill: false,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                ...commonOptions,
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            font: { size: 11 }
                        },
                        title: {
                            display: true,
                            text: 'Labor Hours',
                            font: { size: 12, weight: 'bold' }
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        grid: {
                            drawOnChartArea: false
                        },
                        ticks: {
                            font: { size: 11 }
                        },
                        title: {
                            display: true,
                            text: 'Energy (kWh)',
                            font: { size: 12, weight: 'bold' }
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
    // MORTALITY VS TREATMENT (Grouped Bar)
    // ==========================================
    const mortalityCanvas = document.getElementById('mortalityTreatmentChart');
    if (mortalityCanvas) {
        const species = JSON.parse(mortalityCanvas.dataset.species);
        const mortality = JSON.parse(mortalityCanvas.dataset.mortality);
        const treatment = JSON.parse(mortalityCanvas.dataset.treatment);
        
        const mtCtx = mortalityCanvas.getContext('2d');
        new Chart(mtCtx, {
            type: 'bar',
            data: {
                labels: species.map(s => `Species ${s}`),
                datasets: [
                    {
                        label: 'Mortality Events',
                        data: mortality,
                        backgroundColor: colors.red,
                        borderColor: colors.redBorder,
                        borderWidth: 2,
                        borderRadius: 6
                    },
                    {
                        label: 'Treatment Events',
                        data: treatment,
                        backgroundColor: colors.yellow,
                        borderColor: colors.yellowBorder,
                        borderWidth: 2,
                        borderRadius: 6
                    }
                ]
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
                }
            }
        });
    }

    // ==========================================
    // CAGE VOLUME UTILIZATION (Polar Area)
    // ==========================================
    const cageUtilCanvas = document.getElementById('cageUtilizationChart');
    if (cageUtilCanvas) {
        const volumes = JSON.parse(cageUtilCanvas.dataset.volumes);
        const labels = JSON.parse(cageUtilCanvas.dataset.labels);
        
        const colorList = [colors.blue, colors.teal, colors.orange, colors.green, colors.purple, colors.yellow, colors.red];
        const borderList = [colors.blueBorder, colors.tealBorder, colors.orangeBorder, colors.greenBorder, colors.purpleBorder, colors.yellowBorder, colors.redBorder];
        
        const cuCtx = cageUtilCanvas.getContext('2d');
        new Chart(cuCtx, {
            type: 'polarArea',
            data: {
                labels: labels,
                datasets: [{
                    data: volumes,
                    backgroundColor: colorList.slice(0, volumes.length),
                    borderColor: borderList.slice(0, volumes.length),
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
                            font: { size: 10 }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    }
                }
            }
        });
    }

    // ==========================================
    // CORRELATION HEATMAP
    // ==========================================
    const heatmapCanvas = document.getElementById('correlationHeatmap');
    if (heatmapCanvas) {
        const correlations = JSON.parse(heatmapCanvas.dataset.correlations);
        
        // Create heatmap using bar chart
        const variables = ['Growth', 'Survival', 'FCR', 'Profit', 'Density'];
        const heatmapData = [];
        
        variables.forEach((varY, y) => {
            variables.forEach((varX, x) => {
                const value = correlations[y * variables.length + x];
                heatmapData.push({
                    x: varX,
                    y: varY,
                    v: value
                });
            });
        });
        
        const hmCtx = heatmapCanvas.getContext('2d');
        
        // Draw custom heatmap
        const cellWidth = hmCtx.canvas.width / variables.length;
        const cellHeight = hmCtx.canvas.height / variables.length;
        
        hmCtx.clearRect(0, 0, hmCtx.canvas.width, hmCtx.canvas.height);
        
        heatmapData.forEach(cell => {
            const xIndex = variables.indexOf(cell.x);
            const yIndex = variables.indexOf(cell.y);
            
            // Color based on correlation value
            const intensity = Math.abs(cell.v);
            const color = cell.v > 0 
                ? `rgba(6, 214, 160, ${intensity})`
                : `rgba(214, 40, 40, ${intensity})`;
            
            hmCtx.fillStyle = color;
            hmCtx.fillRect(xIndex * cellWidth, yIndex * cellHeight, cellWidth, cellHeight);
            
            // Draw border
            hmCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            hmCtx.strokeRect(xIndex * cellWidth, yIndex * cellHeight, cellWidth, cellHeight);
            
            // Draw value
            hmCtx.fillStyle = '#333';
            hmCtx.font = '14px Arial';
            hmCtx.textAlign = 'center';
            hmCtx.textBaseline = 'middle';
            hmCtx.fillText(
                cell.v.toFixed(2),
                xIndex * cellWidth + cellWidth / 2,
                yIndex * cellHeight + cellHeight / 2
            );
        });
        
        // Draw labels
        hmCtx.fillStyle = '#333';
        hmCtx.font = 'bold 13px Arial';
        variables.forEach((label, i) => {
            // X labels
            hmCtx.save();
            hmCtx.translate(i * cellWidth + cellWidth / 2, hmCtx.canvas.height - 10);
            hmCtx.rotate(-Math.PI / 4);
            hmCtx.textAlign = 'right';
            hmCtx.fillText(label, 0, 0);
            hmCtx.restore();
            
            // Y labels
            hmCtx.textAlign = 'right';
            hmCtx.fillText(label, -10, i * cellHeight + cellHeight / 2);
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
            labels.push(`${binStart.toFixed(2)}-${binEnd.toFixed(2)}`);
        }
        
        return { counts: bins, labels: labels };
    }
});