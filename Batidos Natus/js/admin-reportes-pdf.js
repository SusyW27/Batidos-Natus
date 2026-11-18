async function exportarGraficasPDF() {
    console.log('Generando PDF de gráficas...');
    
    const btn = document.getElementById('exportarPDFBtn');
    const textoOriginal = btn.innerHTML;
    btn.innerHTML = 'Generando PDF...';
    btn.disabled = true;
    
    try {
        const datosPDF = await obtenerDatosGraficas();
        const pdfContainer = document.createElement('div');
        pdfContainer.style.cssText = `
            position: fixed;
            left: -9999px;
            top: 0;
            width: 800px;
            background: white;
            padding: 30px;
            z-index: 9999;
            font-family: Arial, sans-serif;
        `;
        
        let contenidoHTML = `
            <!-- HEADER -->
            <div style="text-align: center; margin-bottom: 25px; padding-bottom: 20px; border-bottom: 3px solid #2c5f2d;">
                <h1 style="color: #2c5f2d; font-size: 28px; margin: 0;">Batidos-Natus</h1>
                <p style="color: #666; font-size: 14px; margin: 5px 0;">Energía natural, sabor auténtico</p>
                <p style="color: #888; font-size: 12px; margin: 0;">
                    Reporte de Ventas - ${new Date().toLocaleDateString('es-ES')}
                </p>
                <p style="color: #aaa; font-size: 10px; margin: 2px 0 0 0;">
                    Generado el ${new Date().toLocaleString('es-ES')}
                </p>
            </div>
            
            <!-- RESUMEN DE ESTADÍSTICAS -->
            <div style="display: flex; justify-content: space-around; margin-bottom: 25px; padding: 15px; background: #f5f7f6; border-radius: 10px;">
                <div style="text-align: center;">
                    <div style="font-size: 22px; font-weight: bold; color: #2c5f2d;">${datosPDF.totalPedidos}</div>
                    <div style="font-size: 11px; color: #666;">Total Pedidos</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 22px; font-weight: bold; color: #e67e22;">$${datosPDF.totalVentas.toFixed(2)}</div>
                    <div style="font-size: 11px; color: #666;">Total Ventas</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 22px; font-weight: bold; color: #f39c12;">${datosPDF.pendientes}</div>
                    <div style="font-size: 11px; color: #666;">Pendientes</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 22px; font-weight: bold; color: #2ecc71;">${datosPDF.pagados}</div>
                    <div style="font-size: 11px; color: #666;">Pagados</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 22px; font-weight: bold; color: #e74c3c;">${datosPDF.cancelados}</div>
                    <div style="font-size: 11px; color: #666;">Cancelados</div>
                </div>
            </div>
        `;
        
        const chartsContainer = document.querySelector('.charts-section');
        if (chartsContainer) {
            const clone = chartsContainer.cloneNode(true);
            const headerClone = clone.querySelector('.charts-header');
            if (headerClone) {
                const btnClone = headerClone.querySelector('.btn-export-pdf');
                if (btnClone) btnClone.remove();
            }
            const cardTitles = clone.querySelectorAll('.chart-card h3');
            cardTitles.forEach(title => {
                title.style.cssText = `
                    color: #2c5f2d;
                    font-size: 16px;
                    font-weight: bold;
                    text-align: center;
                    margin: 0 0 10px 0;
                    padding: 8px;
                    background: #f5f7f6;
                    border-radius: 6px;
                `;
            });
            const canvases = clone.querySelectorAll('canvas');
            for (const canvas of canvases) {
                const originalCanvas = document.getElementById(canvas.id);
                if (originalCanvas) {
                    const img = document.createElement('img');
                    img.src = originalCanvas.toDataURL('image/png');
                    img.style.width = '100%';
                    img.style.maxWidth = '380px';
                    img.style.display = 'block';
                    img.style.margin = '10px auto';
                    img.style.borderRadius = '8px';
                    img.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                    img.style.border = '1px solid #eee';
                    canvas.parentNode.replaceChild(img, canvas);
                }
            }
            contenidoHTML += clone.innerHTML;
        }
        if (datosPDF.ventasSemana && datosPDF.ventasSemana.length > 0) {
            contenidoHTML += `
                <div style="margin-top: 25px; padding: 15px; background: #f9f9f9; border-radius: 8px; border: 1px solid #e0e0e0;">
                    <h3 style="color: #2c5f2d; font-size: 15px; margin: 0 0 12px 0; text-align: center; border-bottom: 2px solid #2c5f2d; padding-bottom: 8px;">
                        📋 Detalle de Ventas (Últimos 7 Días)
                    </h3>
                    <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                        <thead>
                            <tr style="background: #2c5f2d; color: white;">
                                <th style="padding: 8px 12px; text-align: left;">Fecha</th>
                                <th style="padding: 8px 12px; text-align: center;">Pedidos</th>
                                <th style="padding: 8px 12px; text-align: right;">Total ($)</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            let totalSemana = 0;
            let totalPedidosSemana = 0;
            datosPDF.ventasSemana.forEach(dia => {
                totalSemana += dia.total;
                totalPedidosSemana += dia.cantidad;
                contenidoHTML += `
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 6px 12px;">${dia.fecha}</td>
                        <td style="padding: 6px 12px; text-align: center;">${dia.cantidad}</td>
                        <td style="padding: 6px 12px; text-align: right; font-weight: bold;">$${dia.total.toFixed(2)}</td>
                    </tr>
                `;
            });
            contenidoHTML += `
                        <tr style="background: #f0f2f1; font-weight: bold;">
                            <td style="padding: 8px 12px;">TOTAL</td>
                            <td style="padding: 8px 12px; text-align: center;">${totalPedidosSemana}</td>
                            <td style="padding: 8px 12px; text-align: right; color: #2c5f2d;">$${totalSemana.toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>
                </div>
            `;
        }
        if (datosPDF.estados) {
            contenidoHTML += `
                <div style="margin-top: 15px; padding: 15px; background: #f9f9f9; border-radius: 8px; border: 1px solid #e0e0e0;">
                    <h3 style="color: #2c5f2d; font-size: 15px; margin: 0 0 12px 0; text-align: center; border-bottom: 2px solid #2c5f2d; padding-bottom: 8px;">
                        Distribución por Estado
                    </h3>
                    <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                        <thead>
                            <tr style="background: #2c5f2d; color: white;">
                                <th style="padding: 8px 12px; text-align: left;">Estado</th>
                                <th style="padding: 8px 12px; text-align: right;">Cantidad</th>
                                <th style="padding: 8px 12px; text-align: right;">Porcentaje</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            const totalEstados = datosPDF.pendientes + datosPDF.pagados + datosPDF.cancelados;
            const estados = [
                { nombre: 'Pendiente', valor: datosPDF.pendientes, color: '#f39c12' },
                { nombre: 'Pagado', valor: datosPDF.pagados, color: '#2ecc71' },
                { nombre: 'Cancelado', valor: datosPDF.cancelados, color: '#e74c3c' }
            ];
            estados.forEach(estado => {
                const porcentaje = totalEstados > 0 ? (estado.valor / totalEstados * 100).toFixed(1) : 0;
                contenidoHTML += `
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 6px 12px;">
                            <span style="display: inline-block; width: 12px; height: 12px; border-radius: 3px; background: ${estado.color}; margin-right: 8px;"></span>
                            ${estado.nombre}
                        </td>
                        <td style="padding: 6px 12px; text-align: right; font-weight: bold;">${estado.valor}</td>
                        <td style="padding: 6px 12px; text-align: right;">${porcentaje}%</td>
                    </tr>
                `;
            });
            contenidoHTML += `
                        </tbody>
                    </table>
                </div>
            `;
        }
        if (datosPDF.ventasMeses && datosPDF.ventasMeses.length > 0) {
            contenidoHTML += `
                <div style="margin-top: 15px; padding: 15px; background: #f9f9f9; border-radius: 8px; border: 1px solid #e0e0e0;">
                    <h3 style="color: #2c5f2d; font-size: 15px; margin: 0 0 12px 0; text-align: center; border-bottom: 2px solid #2c5f2d; padding-bottom: 8px;">
                        Ventas Mensuales
                    </h3>
                    <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                        <thead>
                            <tr style="background: #2c5f2d; color: white;">
                                <th style="padding: 8px 12px; text-align: left;">Mes</th>
                                <th style="padding: 8px 12px; text-align: center;">Pedidos</th>
                                <th style="padding: 8px 12px; text-align: right;">Total ($)</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            let totalMensual = 0;
            let totalPedidosMensual = 0;
            datosPDF.ventasMeses.forEach(mes => {
                totalMensual += mes.total;
                totalPedidosMensual += mes.cantidad;
                contenidoHTML += `
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 6px 12px;">${mes.mes}</td>
                        <td style="padding: 6px 12px; text-align: center;">${mes.cantidad}</td>
                        <td style="padding: 6px 12px; text-align: right; font-weight: bold;">$${mes.total.toFixed(2)}</td>
                    </tr>
                `;
            });
            contenidoHTML += `
                        <tr style="background: #f0f2f1; font-weight: bold;">
                            <td style="padding: 8px 12px;">TOTAL</td>
                            <td style="padding: 8px 12px; text-align: center;">${totalPedidosMensual}</td>
                            <td style="padding: 8px 12px; text-align: right; color: #2c5f2d;">$${totalMensual.toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>
                </div>
            `;
        }
        if (datosPDF.topProductos && datosPDF.topProductos.length > 0) {
            contenidoHTML += `
                <div style="margin-top: 15px; padding: 15px; background: #f9f9f9; border-radius: 8px; border: 1px solid #e0e0e0;">
                    <h3 style="color: #2c5f2d; font-size: 15px; margin: 0 0 12px 0; text-align: center; border-bottom: 2px solid #2c5f2d; padding-bottom: 8px;">
                        Productos Más Vendidos
                    </h3>
                    <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                        <thead>
                            <tr style="background: #2c5f2d; color: white;">
                                <th style="padding: 8px 12px; text-align: left;">#</th>
                                <th style="padding: 8px 12px; text-align: left;">Producto</th>
                                <th style="padding: 8px 12px; text-align: right;">Unidades</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            const colores = ['#FFD700', '#C0C0C0', '#CD7F32', '#2c5f2d', '#4CAF50'];
            datosPDF.topProductos.forEach((producto, index) => {
                const medalla = index === 0 ? '①' : index === 1 ? '②' : index === 2 ? '③' : `${index + 1}.`;
                contenidoHTML += `
                    <tr style="border-bottom: 1px solid #eee; ${index < 3 ? 'background: #fafffa;' : ''}">
                        <td style="padding: 6px 12px; text-align: center; font-size: 14px;">${medalla}</td>
                        <td style="padding: 6px 12px; font-weight: ${index < 3 ? 'bold' : 'normal'};">
                            ${producto.nombre}
                            ${index === 0 ? '★' : ''}
                        </td>
                        <td style="padding: 6px 12px; text-align: right; font-weight: bold; color: #2c5f2d;">${producto.cantidad}</td>
                    </tr>
                `;
            });
            contenidoHTML += `
                        </tbody>
                    </table>
                </div>
            `;
        }
        contenidoHTML += `
            <div style="text-align: center; margin-top: 25px; padding-top: 15px; border-top: 1px solid #ddd; color: #888; font-size: 10px;">
                Batidos-Natus - Energía natural, sabor auténtico<br>
                Reporte generado automáticamente - ${new Date().toLocaleString('es-ES')}
            </div>
        `;
        
        pdfContainer.innerHTML = contenidoHTML;
        document.body.appendChild(pdfContainer);
        const canvas = await html2canvas(pdfContainer, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            width: 800,
            height: pdfContainer.scrollHeight,
            logging: false
        });
        document.body.removeChild(pdfContainer);
        const imgData = canvas.toDataURL('image/png');
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        const pageHeight = pdf.internal.pageSize.getHeight();
        let heightLeft = pdfHeight;
        let position = 0;
        
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
        let pageNum = 1;
        while (heightLeft > 0) {
            position = -pageNum * pageHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
            heightLeft -= pageHeight;
            pageNum++;
        }
        pdf.save(`Reporte_Ventas_${new Date().toISOString().slice(0,10)}.pdf`);
        
        console.log('PDF generado correctamente');
        
    } catch (error) {
        console.error('Error al generar PDF:', error);
        alert(`Error al generar PDF: ${error.message}`);
    } finally {
        btn.innerHTML = textoOriginal;
        btn.disabled = false;
    }
}
async function obtenerDatosGraficas() {
    try {
        const stats = await getEstadisticasPedidos();
        
        const responseSemana = await fetch(API_URL + 'estadisticas_graficas.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'ventas_semana' })
        });
        const dataSemana = await responseSemana.json();
        const responseMeses = await fetch(API_URL + 'estadisticas_graficas.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'ventas_meses' })
        });
        const dataMeses = await responseMeses.json();
        const responseTop = await fetch(API_URL + 'estadisticas_graficas.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'top_productos' })
        });
        const dataTop = await responseTop.json();
        
        return {
            totalPedidos: stats.totalPedidos || 0,
            totalVentas: stats.totalVentas || 0,
            pendientes: stats.porEstado?.Pendiente || 0,
            pagados: stats.porEstado?.Pagado || 0,
            cancelados: stats.porEstado?.Cancelado || 0,
            estados: stats.porEstado || { Pendiente: 0, Pagado: 0, Cancelado: 0 },
            ventasSemana: dataSemana.success ? dataSemana.datos : [],
            ventasMeses: dataMeses.success ? dataMeses.datos : [],
            topProductos: dataTop.success ? dataTop.datos : []
        };
    } catch (error) {
        console.warn('Error al obtener datos para PDF:', error);
        return {
            totalPedidos: 0,
            totalVentas: 0,
            pendientes: 0,
            pagados: 0,
            cancelados: 0,
            estados: { Pendiente: 0, Pagado: 0, Cancelado: 0 },
            ventasSemana: [],
            ventasMeses: [],
            topProductos: []
        };
    }
}

window.exportarGraficasPDF = exportarGraficasPDF;

console.log('admin-reportes-pdf.js cargado correctamente');