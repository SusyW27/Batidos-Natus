document.addEventListener('DOMContentLoaded', function() {
    const currentUser = getCurrentUser();
    
    if (!currentUser || currentUser.role !== 'admin') {
        alert('Acceso denegado. Esta sección es solo para administradores.');
        window.location.href = 'dashboard.html';
        return;
    }

    const adminUserSpan = document.getElementById('adminUser');
    if (adminUserSpan) {
        adminUserSpan.textContent = `${currentUser.username}`;
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
                logout();
            }
        });
    }

    let currentProductId = null;
    let productToDelete = null;
    let imagenBase64 = null;
    let imagenActual = 'img/default.jpg';

    const inventoryBody = document.getElementById('inventoryBody');
    const statsElements = {
        total: document.getElementById('totalProductos'),
        valor: document.getElementById('valorInventario'),
        stockBajo: document.getElementById('stockBajo'),
        agotados: document.getElementById('agotados')
    };
    const searchInput = document.getElementById('buscarProducto');
    const filterCategory = document.getElementById('filtroCategoria');
    const filterStatus = document.getElementById('filtroEstado');
    const modal = document.getElementById('productModal');
    const confirmModal = document.getElementById('confirmModal');
    const closeModalBtn = document.getElementById('closeModal');
    const productForm = document.getElementById('productForm');

    function debugProductos() {
        console.log('DEPURACIÓN');
        console.log('Productos en memoria:', inventoryManager.products);
        console.log('Total de productos:', inventoryManager.products.length);
        
        const categorias = [...new Set(inventoryManager.products.map(p => p.categoria))];
        console.log('Categorías disponibles:', categorias);
        
        categorias.forEach(cat => {
            const count = inventoryManager.products.filter(p => p.categoria === cat).length;
            console.log(`${cat}: ${count} productos`);
        });
        
        console.log('====================================');
    }

    const imagenInput = document.getElementById('imagenProducto');
    const previewContainer = document.getElementById('previewContainer');
    const imagePreview = document.getElementById('imagePreview');
    const removeImageBtn = document.getElementById('removeImageBtn');

    if (imagenInput) {
        imagenInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const tiposPermitidos = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
                if (!tiposPermitidos.includes(file.type)) {
                    showNotification('Solo se permiten PNG, JPG y WEBP', 'error');
                    this.value = '';
                    return;
                }
                
                if (file.size > 2 * 1024 * 1024) {
                    showNotification('La imagen no puede superar los 2MB', 'error');
                    this.value = '';
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = function(event) {
                    imagenBase64 = event.target.result;
                    imagePreview.src = imagenBase64;
                    previewContainer.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (removeImageBtn) {
        removeImageBtn.addEventListener('click', function() {
            imagenBase64 = null;
            imagenInput.value = '';
            previewContainer.style.display = 'none';
            imagePreview.src = '';
        });
    }

    function renderInventory() {
        let products = inventoryManager.getAllProducts();
        console.log('Renderizando inventario, productos:', products.length);
        
        const searchTerm = searchInput.value.toLowerCase();
        const category = filterCategory.value;
        const status = filterStatus.value;

        if (searchTerm) {
            products = products.filter(p => 
                p.nombre.toLowerCase().includes(searchTerm) ||
                (p.categoria && p.categoria.toLowerCase().includes(searchTerm))
            );
        }
        if (category !== 'todos') {
            products = products.filter(p => p.categoria === category);
        }
        if (status !== 'todos') {
            products = products.filter(p => p.estado === status);
        }

        if (products.length === 0) {
            inventoryBody.innerHTML = `<tr><td colspan="9" class="empty-message">No hay productos que coincidan con los filtros</td></tr>`;
        } else {
            inventoryBody.innerHTML = products.map((product, index) => `
                <tr class="${product.stock === 0 ? 'stock-agotado' : product.stock <= product.stockMinimo ? 'stock-bajo' : ''}">
                    <td>${index + 1}</td>
                    <td><strong>${product.nombre}</strong></td>
                    <td style="max-width: 200px; font-size: 0.85rem; color: #555;">
                        ${product.descripcion || 'Sin descripción'}
                    </td>
                    <td>${product.categoria || 'Sin categoría'}</td>
                    <td>$${product.precio.toFixed(2)}</td>
                    <td>
                        <span class="stock-badge ${product.stock === 0 ? 'agotado' : product.stock <= product.stockMinimo ? 'bajo' : 'normal'}">
                            ${product.stock}
                        </span>
                    </td>
                    <td>${product.stockMinimo}</td>
                    <td>
                        <span class="status-badge ${product.estado}">
                            ${product.estado === 'activo' ? 'Activo' : 'Inactivo'}
                        </span>
                    </td>
                    <td class="actions-cell">
                        <button class="btn-edit" data-id="${product.id}">Editar</button>
                        <button class="btn-delete" data-id="${product.id}">Eliminar</button>
                        <button class="btn-add-stock" data-id="${product.id}">Stock</button>
                    </td>
                </tr>
            `).join('');
        }

        updateStats();

        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', () => openEditModal(parseInt(btn.dataset.id)));
        });
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => openConfirmModal(parseInt(btn.dataset.id)));
        });
        document.querySelectorAll('.btn-add-stock').forEach(btn => {
            btn.addEventListener('click', () => addStock(parseInt(btn.dataset.id)));
        });
    }

    function updateStats() {
        const stats = inventoryManager.getInventoryStats();
        console.log('Estadísticas:', stats);
        if (statsElements.total) statsElements.total.textContent = stats.total;
        if (statsElements.valor) statsElements.valor.textContent = `$${stats.valorInventario.toFixed(2)}`;
        if (statsElements.stockBajo) statsElements.stockBajo.textContent = stats.stockBajo;
        if (statsElements.agotados) statsElements.agotados.textContent = stats.agotados;
    }

    function openAddModal() {
        document.getElementById('modalTitle').textContent = 'Agregar Producto';
        productForm.reset();
        document.getElementById('productId').value = '';
        document.getElementById('estadoProducto').value = 'activo';
        document.getElementById('descripcionProducto').value = '';
        imagenBase64 = null;
        imagenActual = 'img/default.jpg';
        imagenInput.value = '';
        previewContainer.style.display = 'none';
        imagePreview.src = '';
        modal.style.display = 'block';
    }

    function openEditModal(id) {
        const product = inventoryManager.getProductById(id);
        if (!product) {
            console.error('Producto no encontrado ID:', id);
            return;
        }

        console.log('Editando producto:', product);

        document.getElementById('modalTitle').textContent = 'Editar Producto';
        document.getElementById('productId').value = product.id;
        document.getElementById('nombreProducto').value = product.nombre;
        document.getElementById('descripcionProducto').value = product.descripcion || '';
        document.getElementById('categoriaProducto').value = product.categoria || 'Frutales';
        document.getElementById('precioProducto').value = product.precio;
        document.getElementById('stockProducto').value = product.stock;
        document.getElementById('stockMinimoProducto').value = product.stockMinimo;
        document.getElementById('estadoProducto').value = product.estado;
        
        imagenActual = product.imagen || 'img/default.jpg';
        imagenBase64 = null;
        imagenInput.value = '';
        
        if (imagenActual && imagenActual !== 'img/default.jpg') {
            imagePreview.src = imagenActual;
            previewContainer.style.display = 'block';
        } else {
            previewContainer.style.display = 'none';
            imagePreview.src = '';
        }
        
        modal.style.display = 'block';
    }

    function openConfirmModal(id) {
        productToDelete = id;
        confirmModal.style.display = 'block';
    }

    async function addStock(id) {
        const cantidad = prompt('¿Cuántas unidades quieres agregar?', '1');
        if (cantidad === null) return;
        
        const cantidadNumerica = parseInt(cantidad);
        if (isNaN(cantidadNumerica) || cantidadNumerica <= 0) {
            showNotification('Ingresa un número válido mayor a 0', 'error');
            return;
        }
        
        const btn = document.querySelector(`.btn-add-stock[data-id="${id}"]`);
        const textoOriginal = btn ? btn.textContent : 'Stock';
        if (btn) {
            btn.textContent = '...';
            btn.disabled = true;
        }
        
        try {
            await inventoryManager.updateStockInDatabase(id, cantidadNumerica);
            showNotification(`Stock actualizado: +${cantidadNumerica} unidades`, 'success');
            renderInventory();
        } catch (error) {
            showNotification(`${error.message}`, 'error');
        } finally {
            if (btn) {
                btn.textContent = textoOriginal;
                btn.disabled = false;
            }
        }
    }

    async function saveProduct(event) {
        event.preventDefault();
        
        const id = document.getElementById('productId').value;
        const categoriaSeleccionada = document.getElementById('categoriaProducto').value;
        
        console.log('Categoría seleccionada en el formulario:', categoriaSeleccionada);
        
        const productData = {
            nombre: document.getElementById('nombreProducto').value.trim(),
            descripcion: document.getElementById('descripcionProducto').value.trim() || '',
            categoria: categoriaSeleccionada,
            precio: parseFloat(document.getElementById('precioProducto').value),
            stock: parseInt(document.getElementById('stockProducto').value),
            stockMinimo: parseInt(document.getElementById('stockMinimoProducto').value),
            estado: document.getElementById('estadoProducto').value,
            imagen_base64: imagenBase64 || '',
            imagen_actual: imagenActual || 'img/default.jpg'
        };

        console.log('Datos a enviar:', productData);

        if (!productData.nombre) {
            showNotification('El nombre del producto es requerido', 'error');
            document.getElementById('nombreProducto').focus();
            return;
        }

        if (productData.precio <= 0) {
            showNotification('El precio debe ser mayor a 0', 'error');
            document.getElementById('precioProducto').focus();
            return;
        }

        try {
            if (id) {
                console.log('Actualizando producto ID:', id);
                
                const response = await fetch(API_URL + 'productos.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'actualizar',
                        id: parseInt(id),
                        nombre: productData.nombre,
                        descripcion: productData.descripcion,
                        categoria: productData.categoria,
                        precio: productData.precio,
                        stock: productData.stock,
                        imagen_base64: productData.imagen_base64 || '',
                        imagen_actual: productData.imagen_actual,
                        activo: productData.estado === 'activo' ? 1 : 0
                    })
                });
                
                const data = await response.json();
                console.log('Respuesta del servidor:', data);
                
                if (data.success) {
                    showNotification('Producto actualizado correctamente');
                    
                    await inventoryManager.loadProducts();
                    
                    renderInventory();
                    
                    modal.style.display = 'none';
                    
                    imagenBase64 = null;
                    imagenInput.value = '';
                    previewContainer.style.display = 'none';
                } else {
                    showNotification('Error: ' + data.message, 'error');
                }
            } else {
                console.log('Creando nuevo producto');
                const result = await inventoryManager.addProduct(productData);
                if (result) {
                    showNotification('Producto agregado correctamente');
                    await inventoryManager.loadProducts();
                    renderInventory();
                    modal.style.display = 'none';
                    imagenBase64 = null;
                    imagenInput.value = '';
                    previewContainer.style.display = 'none';
                }
            }
        } catch (error) {
            console.error('Error en saveProduct:', error);
            showNotification('Error: ' + error.message, 'error');
        }
    }

    async function deleteProduct() {
        if (productToDelete) {
            try {
                const success = await inventoryManager.deleteProduct(productToDelete);
                if (success) {
                    showNotification('Producto eliminado del inventario');
                }
            } catch (error) {
                showNotification('Error al eliminar: ' + error.message, 'error');
            }
            productToDelete = null;
            confirmModal.style.display = 'none';
            renderInventory();
        }
    }

    function showNotification(message, type = 'success') {
        const existingNotifications = document.querySelectorAll('.notification-toast');
        existingNotifications.forEach(notif => notif.remove());

        const notification = document.createElement('div');
        notification.className = 'notification-toast';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 12px 24px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 9999;
            background: ${type === 'error' ? '#e74c3c' : '#27ae60'};
            animation: slideInRight 0.3s ease;
            max-width: 400px;
        `;
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    const recargarBtn = document.getElementById('recargarBtn');
    if (recargarBtn) {
        recargarBtn.addEventListener('click', function() {
            console.log('Recargando productos...');
            const btn = this;
            btn.textContent = 'Cargando...';
            btn.disabled = true;
            inventoryManager.loadProducts();
            setTimeout(() => {
                renderInventory();
                showNotification('Productos recargados');
                btn.textContent = 'Recargar';
                btn.disabled = false;
            }, 1000);
        });
    }

    const agregarBtn = document.getElementById('agregarProductoBtn');
    if (agregarBtn) {
        agregarBtn.addEventListener('click', openAddModal);
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => modal.style.display = 'none');
    }

    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', () => confirmModal.style.display = 'none');
    }

    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', deleteProduct);
    }

    if (productForm) {
        productForm.addEventListener('submit', saveProduct);
    }

    if (searchInput) {
        searchInput.addEventListener('input', renderInventory);
    }
    if (filterCategory) {
        filterCategory.addEventListener('change', renderInventory);
    }
    if (filterStatus) {
        filterStatus.addEventListener('change', renderInventory);
    }

    window.addEventListener('click', (event) => {
        if (event.target === modal) modal.style.display = 'none';
        if (event.target === confirmModal) confirmModal.style.display = 'none';
    });

    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.shiftKey && e.key === 'D') {
            debugProductos();
        }
    });

    document.addEventListener('inventoryLoaded', function() {
        console.log('Evento inventoryLoaded recibido, actualizando UI...');
        renderInventory();
    });

    setTimeout(() => {
        if (inventoryManager.products && inventoryManager.products.length > 0) {
            console.log('Productos ya cargados, renderizando...');
            renderInventory();
        } else {
            console.log('Esperando carga de productos...');
        }
    }, 1000);

    renderInventory();
});