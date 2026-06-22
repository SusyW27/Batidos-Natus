// Sistema de Gestión de Inventario
class InventoryManager {
    constructor() {
        this.products = [];
        this.loadProducts();
    }

    // Cargar productos desde localStorage
    loadProducts() {
        const stored = localStorage.getItem('inventory_products');
        if (stored) {
            this.products = JSON.parse(stored);
        } else {
            // Datos de ejemplo iniciales
            this.products = [
                { id: 1, nombre: 'Batido Energético', precio: 5.99, categoria: 'Energéticos', stock: 15, stockMinimo: 5, imagen: 'img/batido1.jpg', estado: 'activo' },
                { id: 2, nombre: 'Batido Detox', precio: 6.50, categoria: 'Detox', stock: 8, stockMinimo: 3, imagen: 'img/batido2.jpg', estado: 'activo' },
                { id: 3, nombre: 'Batido Proteico', precio: 7.99, categoria: 'Proteicos', stock: 0, stockMinimo: 5, imagen: 'img/batido3.jpg', estado: 'inactivo' },
            ];
            this.saveProducts();
        }
    }

    // Guardar en localStorage
    saveProducts() {
        localStorage.setItem('inventory_products', JSON.stringify(this.products));
    }

    // Obtener todos los productos
    getAllProducts() {
        return this.products;
    }

    // Obtener producto por ID
    getProductById(id) {
        return this.products.find(p => p.id === id);
    }

    // Agregar nuevo producto
    addProduct(product) {
        const newId = this.products.length > 0 ? Math.max(...this.products.map(p => p.id)) + 1 : 1;
        const newProduct = {
            ...product,
            id: newId,
            fechaActualizacion: new Date().toISOString()
        };
        this.products.push(newProduct);
        this.saveProducts();
        return newProduct;
    }

    // Actualizar producto
    updateProduct(id, updatedData) {
        const index = this.products.findIndex(p => p.id === id);
        if (index !== -1) {
            this.products[index] = {
                ...this.products[index],
                ...updatedData,
                fechaActualizacion: new Date().toISOString()
            };
            this.saveProducts();
            return this.products[index];
        }
        return null;
    }

    // Actualizar stock
    updateStock(id, cantidad) {
        const product = this.getProductById(id);
        if (product) {
            product.stock += cantidad;
            if (product.stock < 0) product.stock = 0;
            product.fechaActualizacion = new Date().toISOString();
            // Si el stock es 0, desactivar automáticamente
            if (product.stock === 0) {
                product.estado = 'inactivo';
            }
            this.saveProducts();
            return product;
        }
        return null;
    }

    // Verificar stock bajo
    getLowStockProducts() {
        return this.products.filter(p => p.stock <= p.stockMinimo && p.stock > 0);
    }

    // Verificar productos agotados
    getOutOfStockProducts() {
        return this.products.filter(p => p.stock === 0);
    }

    // Eliminar producto (soft delete)
    deleteProduct(id) {
        const product = this.getProductById(id);
        if (product) {
            product.estado = 'inactivo';
            product.stock = 0;
            this.saveProducts();
            return true;
        }
        return false;
    }

    // Buscar productos
    searchProducts(query) {
        const lowerQuery = query.toLowerCase();
        return this.products.filter(p => 
            p.nombre.toLowerCase().includes(lowerQuery) ||
            p.categoria.toLowerCase().includes(lowerQuery)
        );
    }

    // Obtener estadísticas de inventario
    getInventoryStats() {
        const total = this.products.length;
        const activos = this.products.filter(p => p.estado === 'activo').length;
        const inactivos = this.products.filter(p => p.estado === 'inactivo').length;
        const agotados = this.getOutOfStockProducts().length;
        const stockBajo = this.getLowStockProducts().length;
        const stockTotal = this.products.reduce((sum, p) => sum + p.stock, 0);
        
        return {
            total,
            activos,
            inactivos,
            agotados,
            stockBajo,
            stockTotal,
            valorInventario: this.products.reduce((sum, p) => sum + (p.precio * p.stock), 0)
        };
    }
}

// Inicializar el gestor de inventario
const inventoryManager = new InventoryManager();