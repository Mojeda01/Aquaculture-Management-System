// risk-charts.js - Monte Carlo Risk Analytics Visualizations

document.addEventListener('DOMContentLoaded', function() {
    
    // Color palette
    const colors = {
        primary: 'rgba(30, 58, 138, 0.7)',
        primaryBorder: 'rgba(30, 58, 138, 1)',
        success: 'rgba(16, 185, 129, 0.7)',
        successBorder: 'rgba(16, 185, 129, 1)',
        warning: 'rgba(245, 158, 11, 0.7)',
        warningBorder: 'rgba(245, 158, 11, 1)',
        error: 'rgba(239, 68, 68, 0.7)',
        errorBorder: 'rgba(239, 68, 68, 1)',
        info: 'rgba(59, 130, 246, 0.7)',
        infoBorder: 'rgba(59, 130, 246, 1)'
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
                    font: { size: 12 }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleFont: { size: 14, weight: 'bold' },
                bodyFont: { size: 13 },
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
    // PROFIT HISTOGRAM
    // ==========================================
    const profitHistCanvas = document.getElementById('profitHistogram');
    if (profitHistCanvas) {
        const profits = JSON.parse(profitHistCanvas.dataset.profits);
        const bins = createHistogramBins(profits, 30);
        
        // Color bins based on profit/loss
        const backgroundColors = bins.bins.map((_, i) => {
            const midpoint = (bins.edges[i] + bins.edges[i + 1]) / 2;
            if (midpoint < 0) return colors.error;
            if (midpoint < 25000) return colors.warning;
            return colors.success;
        });
        
        const borderColors = bins.bins.map((_, i) => {
            const midpoint = (bins.edges[i] + bins.edges[i + 1]) / 2;
            if (midpoint < 0) return colors.errorBorder;
            if (midpoint < 25000) return colors.warningBorder;
            return colors.successBorder;
        });
        
        const ctx = profitHistCanvas.getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: bins.labels,
                datasets: [{
                    label: 'Number of Scenarios',
                    data: bins.bins,
                    backgroundColor: backgroundColors,
                    borderColor: borderColors,
                    borderWidth: 2,
                    borderRadius: 6
                }]
            },
            options: {
                ...commonOptions,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(0, 0, 0, 0.05)' },
                        ticks: { font: { size: 11 } }
                    },
                    x: {
                        grid: { display: false },
                        ticks: {
                            font: { size: 10 },
                            maxRotation: 45,
                            minRotation: 45,
                            callback: function(value, index) {
                                return index % 3 === 0 ? this.getLabelForValue(value) : '';
                            }
                        }
                    }
                },
                plugins: {
                    ...commonOptions.plugins,
                    legend: { display: false },
                    tooltip: {
                        ...commonOptions.plugins.tooltip,
                        callbacks: {
                            title: function(context) {
                                return 'Profit Range: ' + context[0].label;
                            },
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed.y / total) * 100).toFixed(1);
                                return [
                                    ` Scenarios: ${context.parsed.y}`,
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
    // VAR CHART (Box Plot Simulation)
    // ==========================================
    const varCanvas = document.getElementById('varChart');
    if (varCanvas) {
        const mean = parseFloat(varCanvas.dataset.mean);
        const median = parseFloat(varCanvas.dataset.median);
        const var95 = parseFloat(varCanvas.dataset.var95);
        const var99 = parseFloat(varCanvas.dataset.var99);
        const p10 = parseFloat(varCanvas.dataset.p10);
        const p25 = parseFloat(varCanvas.dataset.p25);
        const p75 = parseFloat(varCanvas.dataset.p75);
        const p90 = parseFloat(varCanvas.dataset.p90);
        
        const ctx = varCanvas.getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['VaR 99%', 'VaR 95%', 'P10', 'P25', 'Median', 'Mean', 'P75', 'P90'],
                datasets: [{
                    label: 'Value ($)',
                    data: [var99, var95, p10, p25, median, mean, p75, p90],
                    backgroundColor: [
                        colors.error, colors.error, colors.warning, colors.warning,
                        colors.info, colors.primary, colors.success, colors.success
                    ],
                    borderColor: [
                        colors.errorBorder, colors.errorBorder, colors.warningBorder, colors.warningBorder,
                        colors.infoBorder, colors.primaryBorder, colors.successBorder, colors.successBorder
                    ],
                    borderWidth: 2,
                    borderRadius: 6
                }]
            },
            options: {
                ...commonOptions,
                indexAxis: 'y',
                scales: {
                    x: {
                        grid: { color: 'rgba(0, 0, 0, 0.05)' },
                        ticks: {
                            font: { size: 11 },
                            callback: function(value) {
                                return '$' + (value / 1000).toFixed(0) + 'k';
                            }
                        }
                    },
                    y: {
                        grid: { display: false },
                        ticks: { font: { size: 11 } }
                    }
                },
                plugins: {
                    ...commonOptions.plugins,
                    legend: { display: false },
                    tooltip: {
                        ...commonOptions.plugins.tooltip,
                        callbacks: {
                            label: function(context) {
                                return ' $' + context.parsed.x.toLocaleString('en-US', { maximumFractionDigits: 0 });
                            }
                        }
                    }
                }
            }
        });
    }

    // ==========================================
    // PROFIT vs ROI SCATTER
    // ==========================================
    const profitRoiCanvas = document.getElementById('profitRoiScatter');
    if (profitRoiCanvas) {
        const profits = JSON.parse(profitRoiCanvas.dataset.profits);
        const rois = JSON.parse(profitRoiCanvas.dataset.rois);
        
        const scatterData = profits.slice(0, 1000).map((p, i) => ({
            x: p,
            y: rois[i] * 100  // Convert to percentage
        }));
        
        const ctx = profitRoiCanvas.getContext('2d');
        new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Scenarios',
                    data: scatterData,
                    backgroundColor: colors.primary,
                    borderColor: colors.primaryBorder,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                ...commonOptions,
                scales: {
                    x: {
                        grid: { color: 'rgba(0, 0, 0, 0.05)' },
                        ticks: {
                            font: { size: 11 },
                            callback: function(value) {
                                return '$' + (value / 1000).toFixed(0) + 'k';
                            }
                        },
                        title: {
                            display: true,
                            text: 'Profit ($)',
                            font: { size: 13, weight: 'bold' }
                        }
                    },
                    y: {
                        grid: { color: 'rgba(0, 0, 0, 0.05)' },
                        ticks: {
                            font: { size: 11 },
                            callback: function(value) {
                                return value.toFixed(0) + '%';
                            }
                        },
                        title: {
                            display: true,
                            text: 'ROI (%)',
                            font: { size: 13, weight: 'bold' }
                        }
                    }
                },
                plugins: {
                    ...commonOptions.plugins,
                    tooltip: {
                        ...commonOptions.plugins.tooltip,
                        callbacks: {
                            label: function(context) {
                                return [
                                    ` Profit: $${context.parsed.x.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
                                    ` ROI: ${context.parsed.y.toFixed(1)}%`
                                ];
                            }
                        }
                    }
                }
            }
        });
    }

    // ==========================================
    // ROI HISTOGRAM
    // ==========================================
    const roiHistCanvas = document.getElementById('roiHistogram');
    if (roiHistCanvas) {
        const rois = JSON.parse(roiHistCanvas.dataset.rois).map(r => r * 100);
        const bins = createHistogramBins(rois, 25);
        
        const ctx = roiHistCanvas.getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: bins.labels,
                datasets: [{
                    label: 'Number of Scenarios',
                    data: bins.bins,
                    backgroundColor: colors.primary,
                    borderColor: colors.primaryBorder,
                    borderWidth: 2,
                    borderRadius: 6
                }]
            },
            options: {
                ...commonOptions,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(0, 0, 0, 0.05)' },
                        ticks: { font: { size: 11 } }
                    },
                    x: {
                        grid: { display: false },
                        ticks: {
                            font: { size: 10 },
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                },
                plugins: {
                    ...commonOptions.plugins,
                    legend: { display: false }
                }
            }
        });
    }

    // ==========================================
    // SURVIVAL vs PROFIT SCATTER
    // ==========================================
    const survivalProfitCanvas = document.getElementById('survivalProfitScatter');
    if (survivalProfitCanvas) {
        const survival = JSON.parse(survivalProfitCanvas.dataset.survival);
        const profits = JSON.parse(survivalProfitCanvas.dataset.profits);
        
        const scatterData = survival.map((s, i) => ({
            x: s * 100,
            y: profits[i]
        }));
        
        const ctx = survivalProfitCanvas.getContext('2d');
        new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Scenarios',
                    data: scatterData,
                    backgroundColor: colors.success,
                    borderColor: colors.successBorder,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                ...commonOptions,
                scales: {
                    x: {
                        grid: { color: 'rgba(0, 0, 0, 0.05)' },
                        ticks: {
                            font: { size: 11 },
                            callback: function(value) {
                                return value.toFixed(0) + '%';
                            }
                        },
                        title: {
                            display: true,
                            text: 'Survival Rate (%)',
                            font: { size: 13, weight: 'bold' }
                        }
                    },
                    y: {
                        grid: { color: 'rgba(0, 0, 0, 0.05)' },
                        ticks: {
                            font: { size: 11 },
                            callback: function(value) {
                                return '$' + (value / 1000).toFixed(0) + 'k';
                            }
                        },
                        title: {
                            display: true,
                            text: 'Profit ($)',
                            font: { size: 13, weight: 'bold' }
                        }
                    }
                }
            }
        });
    }

    // ==========================================
    // MORTALITY EVENTS DISTRIBUTION
    // ==========================================
    const mortalityCanvas = document.getElementById('mortalityChart');
    if (mortalityCanvas) {
        const events = JSON.parse(mortalityCanvas.dataset.events);
        
        // Count frequency of each event count
        const eventCounts = {};
        events.forEach(e => {
            eventCounts[e] = (eventCounts[e] || 0) + 1;
        });
        
        const labels = Object.keys(eventCounts).sort((a, b) => a - b);
        const data = labels.map(l => eventCounts[l]);
        
        const ctx = mortalityCanvas.getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels.map(l => `${l} events`),
                datasets: [{
                    label: 'Number of Scenarios',
                    data: data,
                    backgroundColor: colors.error,
                    borderColor: colors.errorBorder,
                    borderWidth: 2,
                    borderRadius: 6
                }]
            },
            options: {
                ...commonOptions,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(0, 0, 0, 0.05)' },
                        ticks: { font: { size: 11 } }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { font: { size: 11 } }
                    }
                },
                plugins: {
                    ...commonOptions.plugins,
                    legend: { display: false }
                }
            }
        });
    }

    // ==========================================
    // CDF CHART (Cumulative Distribution)
    // ==========================================
    const cdfCanvas = document.getElementById('cdfChart');
    if (cdfCanvas) {
        const sortedProfits = JSON.parse(cdfCanvas.dataset.profits);
        const n = sortedProfits.length;
        
        // Create CDF data (every 50th point for performance)
        const cdfData = sortedProfits
            .filter((_, i) => i % 50 === 0)
            .map((profit, i) => ({
                x: profit,
                y: (i * 50 / n) * 100
            }));
        
        const ctx = cdfCanvas.getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'Cumulative Probability',
                    data: cdfData,
                    borderColor: colors.primaryBorder,
                    backgroundColor: colors.primary,
                    borderWidth: 3,
                    fill: true,
                    tension: 0.3,
                    pointRadius: 0
                }]
            },
            options: {
                ...commonOptions,
                scales: {
                    x: {
                        type: 'linear',
                        grid: { color: 'rgba(0, 0, 0, 0.05)' },
                        ticks: {
                            font: { size: 11 },
                            callback: function(value) {
                                return '$' + (value / 1000).toFixed(0) + 'k';
                            }
                        },
                        title: {
                            display: true,
                            text: 'Profit ($)',
                            font: { size: 13, weight: 'bold' }
                        }
                    },
                    y: {
                        grid: { color: 'rgba(0, 0, 0, 0.05)' },
                        ticks: {
                            font: { size: 11 },
                            callback: function(value) {
                                return value.toFixed(0) + '%';
                            }
                        },
                        title: {
                            display: true,
                            text: 'Probability (Cumulative %)',
                            font: { size: 13, weight: 'bold' }
                        }
                    }
                },
                plugins: {
                    ...commonOptions.plugins,
                    tooltip: {
                        ...commonOptions.plugins.tooltip,
                        callbacks: {
                            label: function(context) {
                                return [
                                    ` Profit: $${context.parsed.x.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
                                    ` Probability: ${context.parsed.y.toFixed(1)}% of scenarios`
                                ];
                            }
                        }
                    }
                }
            }
        });
    }

    // ==========================================
    // HELPER FUNCTION
    // ==========================================
    function createHistogramBins(data, numBins) {
        const min = Math.min(...data);
        const max = Math.max(...data);
        const binWidth = (max - min) / numBins;
        
        const bins = new Array(numBins).fill(0);
        const edges = [];
        
        for (let i = 0; i <= numBins; i++) {
            edges.push(min + i * binWidth);
        }
        
        data.forEach(val => {
            const binIndex = Math.min(Math.floor((val - min) / binWidth), numBins - 1);
            bins[binIndex]++;
        });
        
        const labels = bins.map((_, i) => {
            const start = edges[i];
            const end = edges[i + 1];
            return `$${(start / 1000).toFixed(0)}k`;
        });
        
        return { bins, labels, edges };
    }
});