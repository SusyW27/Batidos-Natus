// UI del Gestor de Inventario
document.addEventListener('DOMContentLoaded', function() {

    // VERIFICACIÓN DE AUTENTICACIÓN (ADMIN)
    const currentUser = getCurrentUser();
    
    // Verificar que sea admin
    if (!currentUser || currentUser.role !== 'admin') {
        alert('⚠️ Acceso denegado. Esta sección es solo para administradores.');
        window.location.href = 'dashboard.html';
        return;
    }

    // Mostrar usuario admin
    const adminUserSpan = document.getElementById('adminUser');
    if (adminUserSpan) {
        adminUserSpan.textContent = `👤 ${currentUser.username}`;
    }

    // EVENTO PARA CERRAR SESIÓN
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
                logout(); // Usa la función de auth.js
            }
        });
    }

    // VARIABLES Y ELEMENTOS DEL INVENTARIO
    let currentProductId = null;
    let productToDelete = null;

    // Elementos
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

    // Cargar y renderizar inventario
    function renderInventory() {
        let products = inventoryManager.getAllProducts();
        
        // Aplicar filtros
        const searchTerm = searchInput.value.toLowerCase();
        const category = filterCategory.value;
        const status = filterStatus.value;

        if (searchTerm) {
            products = products.filter(p => 
                p.nombre.toLowerCase().includes(searchTerm) ||
                p.categoria.toLowerCase().includes(searchTerm)
            );
        }
        if (category !== 'todos') {
            products = products.filter(p => p.categoria === category);
        }
        if (status !== 'todos') {
            products = products.filter(p => p.estado === status);
        }

        // Renderizar tabla
        if (products.length === 0) {
            inventoryBody.innerHTML = `<tr><td colspan="8" class="empty-message">No hay productos que coincidan con los filtros</td></tr>`;
        } else {
            inventoryBody.innerHTML = products.map(product => `
                <tr class="${product.stock === 0 ? 'stock-agotado' : product.stock <= product.stockMinimo ? 'stock-bajo' : ''}">
                    <td>#${product.id}</td>
                    <td><strong>${product.nombre}</strong></td>
                    <td>${product.categoria}</td>
                    <td>$${product.precio.toFixed(2)}</td>
                    <td>
                        <span class="stock-badge ${product.stock === 0 ? 'agotado' : product.stock <= product.stockMinimo ? 'bajo' : 'normal'}">
                            ${product.stock}
                        </span>
                    </td>
                    <td>${product.stockMinimo}</td>
                    <td>
                        <span class="status-badge ${product.estado}">
                            ${product.estado === 'activo' ? '✅ Activo' : '❌ Inactivo'}
                        </span>
                    </td>
                    <td class="actions-cell">
                        <button class="btn-edit" data-id="${product.id}">✏️ Editar</button>
                        <button class="btn-delete" data-id="${product.id}">🗑️</button>
                        <button class="btn-add-stock" data-id="${product.id}">➕ Stock</button>
                    </td>
                </tr>
            `).join('');
        }

        // Actualizar estadísticas
        updateStats();

        // Agregar event listeners a botones
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

    // Actualizar estadísticas
    function updateStats() {
        const stats = inventoryManager.getInventoryStats();
        if (statsElements.total) statsElements.total.textContent = stats.total;
        if (statsElements.valor) statsElements.valor.textContent = `$${stats.valorInventario.toFixed(2)}`;
        if (statsElements.stockBajo) statsElements.stockBajo.textContent = stats.stockBajo;
        if (statsElements.agotados) statsElements.agotados.textContent = stats.agotados;
    }

    // Abrir modal para agregar producto
    function openAddModal() {
        document.getElementById('modalTitle').textContent = '➕ Agregar Producto';
        productForm.reset();
        document.getElementById('productId').value = '';
        document.getElementById('estadoProducto').value = 'activo';
        modal.style.display = 'block';
    }

    // Abrir modal para editar producto
    function openEditModal(id) {
        const product = inventoryManager.getProductById(id);
        if (!product) return;

        document.getElementById('modalTitle').textContent = '✏️ Editar Producto';
        document.getElementById('productId').value = product.id;
        document.getElementById('nombreProducto').value = product.nombre;
        document.getElementById('categoriaProducto').value = product.categoria;
        document.getElementById('precioProducto').value = product.precio;
        document.getElementById('stockProducto').value = product.stock;
        document.getElementById('stockMinimoProducto').value = product.stockMinimo;
        document.getElementById('estadoProducto').value = product.estado;
        modal.style.display = 'block';
    }

    // Abrir modal de confirmación
    function openConfirmModal(id) {
        productToDelete = id;
        confirmModal.style.display = 'block';
    }

    // Agregar stock a un producto
    function addStock(id) {
        const cantidad = prompt('¿Cuántas unidades quieres agregar?', '1');
        if (cantidad !== null && !isNaN(cantidad) && parseInt(cantidad) > 0) {
            const product = inventoryManager.updateStock(id, parseInt(cantidad));
            if (product) {
                // Cambiar estado a activo si tenía stock 0
                if (product.estado === 'inactivo' && product.stock > 0) {
                    inventoryManager.updateProduct(id, { estado: 'activo' });
                }
                renderInventory();
                showNotification(`✅ Stock actualizado: +${cantidad} unidades`);
            }
        }
    }

    // Guardar producto (crear o editar)
    function saveProduct(event) {
        event.preventDefault();
        
        const id = document.getElementById('productId').value;
        const productData = {
            nombre: document.getElementById('nombreProducto').value,
            categoria: document.getElementById('categoriaProducto').value,
            precio: parseFloat(document.getElementById('precioProducto').value),
            stock: parseInt(document.getElementById('stockProducto').value),
            stockMinimo: parseInt(document.getElementById('stockMinimoProducto').value),
            estado: document.getElementById('estadoProducto').value
        };

        if (id) {
            // Editar
            const updated = inventoryManager.updateProduct(parseInt(id), productData);
            if (updated) {
                showNotification('✅ Producto actualizado correctamente');
            }
        } else {
            // Agregar
            const newProduct = inventoryManager.addProduct(productData);
            if (newProduct) {
                showNotification('✅ Producto agregado correctamente');
            }
        }

        modal.style.display = 'none';
        renderInventory();
    }

    // Eliminar producto
    function deleteProduct() {
        if (productToDelete) {
            inventoryManager.deleteProduct(productToDelete);
            showNotification('🗑️ Producto eliminado del inventario');
            productToDelete = null;
            confirmModal.style.display = 'none';
            renderInventory();
        }
    }

    // Notificaciones simples
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Botón agregar producto
    const agregarBtn = document.getElementById('agregarProductoBtn');
    if (agregarBtn) {
        agregarBtn.addEventListener('click', openAddModal);
    }

    // Cerrar modal
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => modal.style.display = 'none');
    }

    // Cancelar eliminación
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', () => confirmModal.style.display = 'none');
    }

    // Confirmar eliminación
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', deleteProduct);
    }

    // Formulario de producto
    if (productForm) {
        productForm.addEventListener('submit', saveProduct);
    }

    // Filtros y búsqueda
    if (searchInput) {
        searchInput.addEventListener('input', renderInventory);
    }
    if (filterCategory) {
        filterCategory.addEventListener('change', renderInventory);
    }
    if (filterStatus) {
        filterStatus.addEventListener('change', renderInventory);
    }

    // Cerrar modal al hacer click fuera
    window.addEventListener('click', (event) => {
        if (event.target === modal) modal.style.display = 'none';
        if (event.target === confirmModal) confirmModal.style.display = 'none';
    });

    // INICIALIZAR
    renderInventory();
});