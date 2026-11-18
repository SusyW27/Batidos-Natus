let chartSemana = null;
let chartEstados = null;
let chartMeses = null;
let chartTopProductos = null;

async function inicializarGraficas() {
    console.log('Inicializando gráficas...');
    await cargarGraficaSemana();
    await cargarGraficaEstados();
    await cargarGraficaMeses();
    await cargarGraficaTopProductos();
}

async function cargarGraficaSemana() {
    try {
        const response = await fetch(API_URL + 'estadisticas_graficas.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'ventas_semana'
            })
        });
        const data = await response.json();
        console.log('Ventas semana:', data);
        
        if (data.success && data.datos) {
            const fechas = data.datos.map(d => d.fecha);
            const totales = data.datos.map(d => d.total);
            
            if (chartSemana) {
                chartSemana.destroy();
            }
            
            const ctx = document.getElementById('chartSemana').getContext('2d');
            chartSemana = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: fechas,
                    datasets: [{
                        label: 'Ventas ($)',
                        data: totales,
                        backgroundColor: 'rgba(44, 95, 45, 0.7)',
                        borderColor: '#2c5f2d',
                        borderWidth: 2,
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            labels: {
                                font: { size: 12, weight: 'bold' }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return '$' + context.parsed.y.toFixed(2);
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return '$' + value.toFixed(2);
                                }
                            }
                        }
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error al cargar gráfica semana:', error);
    }
}

async function cargarGraficaEstados() {
    try {
        const response = await fetch(API_URL + 'estadisticas_graficas.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'estados_pedidos'
            })
        });
        const data = await response.json();
        console.log('Estados:', data);
        
        if (data.success && data.datos) {
            const estados = Object.keys(data.datos);
            const cantidades = Object.values(data.datos);
            const colores = ['#f39c12', '#2ecc71', '#e74c3c'];
            
            if (chartEstados) {
                chartEstados.destroy();
            }
            
            const ctx = document.getElementById('chartEstados').getContext('2d');
            chartEstados = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: estados,
                    datasets: [{
                        data: cantidades,
                        backgroundColor: colores,
                        borderColor: '#ffffff',
                        borderWidth: 3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                font: { size: 13, weight: 'bold' },
                                padding: 15
                            }
                        }
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error al cargar gráfica estados:', error);
    }
}

async function cargarGraficaMeses() {
    try {
        const response = await fetch(API_URL + 'estadisticas_graficas.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'ventas_meses'
            })
        });
        const data = await response.json();
        console.log('Ventas meses:', data);
        
        if (data.success && data.datos) {
            const meses = data.datos.map(d => d.mes);
            const totales = data.datos.map(d => d.total);
            
            if (chartMeses) {
                chartMeses.destroy();
            }
            
            const ctx = document.getElementById('chartMeses').getContext('2d');
            chartMeses = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: meses,
                    datasets: [{
                        label: 'Ventas ($)',
                        data: totales,
                        backgroundColor: 'rgba(44, 95, 45, 0.1)',
                        borderColor: '#2c5f2d',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.3,
                        pointBackgroundColor: '#2c5f2d',
                        pointRadius: 5
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            labels: {
                                font: { size: 12, weight: 'bold' }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return '$' + context.parsed.y.toFixed(2);
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return '$' + value.toFixed(2);
                                }
                            }
                        }
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error al cargar gráfica meses:', error);
    }
}

async function cargarGraficaTopProductos() {
    try {
        const response = await fetch(API_URL + 'estadisticas_graficas.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'top_productos'
            })
        });
        const data = await response.json();
        console.log('Top productos:', data);
        
        if (data.success && data.datos) {
            const nombres = data.datos.map(d => d.nombre);
            const cantidades = data.datos.map(d => d.cantidad);
            const colores = ['#2c5f2d', '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B'];
            
            if (chartTopProductos) {
                chartTopProductos.destroy();
            }
            
            const ctx = document.getElementById('chartTopProductos').getContext('2d');
            chartTopProductos = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: nombres,
                    datasets: [{
                        label: 'Unidades vendidas',
                        data: cantidades,
                        backgroundColor: colores,
                        borderColor: '#2c5f2d',
                        borderWidth: 1,
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        x: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1
                            }
                        }
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error al cargar top productos:', error);
    }
}

function recargarGraficas() {
    console.log('Recargando gráficas...');
    inicializarGraficas();
}

window.inicializarGraficas = inicializarGraficas;
window.recargarGraficas = recargarGraficas;

console.log('admin-charts.js cargado correctamente');