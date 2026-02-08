// model-charts.js - Chart visualizations for Model Results page

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
        redBorder: 'rgba(214, 40, 40, 1)'
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
    // OLS COEFFICIENTS CHART (Horizontal Bar)
    // ==========================================
    const olsCoefCanvas = document.getElementById('olsCoefficientsChart');
    if (olsCoefCanvas) {
        const variables = JSON.parse(olsCoefCanvas.dataset.variables);
        const coefficients = JSON.parse(olsCoefCanvas.dataset.coefficients);
        const pvalues = JSON.parse(olsCoefCanvas.dataset.pvalues);
        
        // Color based on significance and direction
        const backgroundColors = coefficients.map((coef, i) => {
            const pval = pvalues[i];
            if (pval < 0.05) {
                return coef > 0 ? colors.green : colors.red;
            } else {
                return 'rgba(200, 200, 200, 0.5)';
            }
        });
        
        const borderColors = coefficients.map((coef, i) => {
            const pval = pvalues[i];
            if (pval < 0.05) {
                return coef > 0 ? colors.greenBorder : colors.redBorder;
            } else {
                return 'rgba(150, 150, 150, 0.8)';
            }
        });
        
        const olsCoefCtx = olsCoefCanvas.getContext('2d');
        new Chart(olsCoefCtx, {
            type: 'bar',
            data: {
                labels: variables,
                datasets: [{
                    label: 'Coefficient Value',
                    data: coefficients,
                    backgroundColor: backgroundColors,
                    borderColor: borderColors,
                    borderWidth: 2,
                    borderRadius: 6
                }]
            },
            options: {
                indexAxis: 'y',
                ...commonOptions,
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            font: { size: 11 }
                        }
                    },
                    y: {
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
                                const idx = context.dataIndex;
                                const coef = context.parsed.x;
                                const pval = pvalues[idx];
                                return [
                                    ` Coefficient: ${coef.toFixed(6)}`,
                                    ` P-value: ${pval.toFixed(4)}`,
                                    ` Significant: ${pval < 0.05 ? 'Yes' : 'No'}`
                                ];
                            }
                        }
                    }
                }
            }
        });
    }

    // ==========================================
    // FITTED VS ACTUAL (Scatter)
    // ==========================================
    const fittedActualCanvas = document.getElementById('fittedActualChart');
    if (fittedActualCanvas) {
        const olsFitted = JSON.parse(fittedActualCanvas.dataset.olsFitted);
        const olsActual = JSON.parse(fittedActualCanvas.dataset.olsActual);
        const glsarFitted = JSON.parse(fittedActualCanvas.dataset.glsarFitted);
        const glsarActual = JSON.parse(fittedActualCanvas.dataset.glsarActual);
        
        const olsData = olsFitted.map((f, i) => ({ x: olsActual[i], y: f }));
        const glsarData = glsarFitted.map((f, i) => ({ x: glsarActual[i], y: f }));
        
        const faCtx = fittedActualCanvas.getContext('2d');
        new Chart(faCtx, {
            type: 'scatter',
            data: {
                datasets: [
                    {
                        label: 'OLS',
                        data: olsData,
                        backgroundColor: colors.blue,
                        borderColor: colors.blueBorder,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    },
                    {
                        label: 'GLSAR',
                        data: glsarData,
                        backgroundColor: colors.orange,
                        borderColor: colors.orangeBorder,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }
                ]
            },
            options: {
                ...commonOptions,
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            font: { size: 11 }
                        },
                        title: {
                            display: true,
                            text: 'Actual Values',
                            font: { size: 13, weight: 'bold' }
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            font: { size: 11 }
                        },
                        title: {
                            display: true,
                            text: 'Fitted Values',
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
                                return ` Actual: ${context.parsed.x.toFixed(4)}, Fitted: ${context.parsed.y.toFixed(4)}`;
                            }
                        }
                    }
                }
            }
        });
        
        // Add perfect prediction line
        const ctx = faCtx;
        const chart = Chart.getChart(fittedActualCanvas);
        if (chart) {
            const minVal = Math.min(...olsActual, ...glsarActual);
            const maxVal = Math.max(...olsActual, ...glsarActual);
            
            chart.data.datasets.push({
                label: 'Perfect Prediction',
                data: [{ x: minVal, y: minVal }, { x: maxVal, y: maxVal }],
                type: 'line',
                borderColor: 'rgba(0, 0, 0, 0.3)',
                borderWidth: 2,
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false
            });
            chart.update();
        }
    }

    // ==========================================
    // OLS RESIDUALS (Histogram)
    // ==========================================
    const olsResidualsCanvas = document.getElementById('olsResidualsChart');
    if (olsResidualsCanvas) {
        const residuals = JSON.parse(olsResidualsCanvas.dataset.residuals);
        
        const bins = createHistogramBins(residuals, 15);
        
        const olsResCtx = olsResidualsCanvas.getContext('2d');
        new Chart(olsResCtx, {
            type: 'bar',
            data: {
                labels: bins.labels,
                datasets: [{
                    label: 'Frequency',
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
    // GLSAR RESIDUALS (Histogram)
    // ==========================================
    const glsarResidualsCanvas = document.getElementById('glsarResidualsChart');
    if (glsarResidualsCanvas) {
        const residuals = JSON.parse(glsarResidualsCanvas.dataset.residuals);
        
        const bins = createHistogramBins(residuals, 15);
        
        const glsarResCtx = glsarResidualsCanvas.getContext('2d');
        new Chart(glsarResCtx, {
            type: 'bar',
            data: {
                labels: bins.labels,
                datasets: [{
                    label: 'Frequency',
                    data: bins.counts,
                    backgroundColor: colors.orange,
                    borderColor: colors.orangeBorder,
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
    // COEFFICIENT COMPARISON (Grouped Bar)
    // ==========================================
    const comparisonCanvas = document.getElementById('coefficientComparisonChart');
    if (comparisonCanvas) {
        const variables = JSON.parse(comparisonCanvas.dataset.variables);
        const olsCoefs = JSON.parse(comparisonCanvas.dataset.olsCoefs);
        const glsarCoefs = JSON.parse(comparisonCanvas.dataset.glsarCoefs);
        
        const compCtx = comparisonCanvas.getContext('2d');
        new Chart(compCtx, {
            type: 'bar',
            data: {
                labels: variables,
                datasets: [
                    {
                        label: 'OLS',
                        data: olsCoefs,
                        backgroundColor: colors.blue,
                        borderColor: colors.blueBorder,
                        borderWidth: 2,
                        borderRadius: 6
                    },
                    {
                        label: 'GLSAR',
                        data: glsarCoefs,
                        backgroundColor: colors.orange,
                        borderColor: colors.orangeBorder,
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
                            font: { size: 9 },
                            maxRotation: 90,
                            minRotation: 90
                        }
                    }
                }
            }
        });
    }

    // Helper function
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
            labels.push(`${binStart.toFixed(3)}`);
        }
        
        return { counts: bins, labels: labels };
    }
});