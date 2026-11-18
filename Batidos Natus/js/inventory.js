class InventoryManager {
    constructor() {
        this.products = [];
        this.cargado = false;
        this.loadProducts();
    }

    async loadProducts() {
        try {
            if (typeof API_URL === 'undefined') {
                console.error('API_URL no está definida.');
                const stored = localStorage.getItem('inventory_products');
                if (stored) {
                    this.products = JSON.parse(stored);
                    this.cargado = true;
                    console.log(`Cargados ${this.products.length} productos desde localStorage (fallback)`);
                }
                return;
            }
            
            console.log('Cargando productos para inventario desde API...');
            console.log('API_URL:', API_URL);
            
            const response = await fetch(API_URL + 'productos.php');
            
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Datos de productos para inventario:', data);
            
            if (data.success && data.productos && data.productos.length > 0) {
                this.products = data.productos.map(p => ({
                    id: parseInt(p.id_producto) || parseInt(p.id) || 0,
                    nombre: p.nombre || p.name || 'Sin nombre',
                    descripcion: p.descripcion || p.description || '',
                    categoria: p.categoria || 'Frutales',
                    precio: parseFloat(p.precio || p.price || 0),
                    stock: parseInt(p.stock || 0),
                    stockMinimo: 5,
                    estado: parseInt(p.stock || 0) > 0 ? 'activo' : 'inactivo',
                    imagen: p.imagen_url || p.image || 'img/default.jpg'
                }));
                this.cargado = true;
                this.saveProducts();
                console.log(`${this.products.length} productos cargados en inventario`);
                document.dispatchEvent(new CustomEvent('inventoryLoaded'));
            } else {
                console.warn('No se recibieron productos de la API');
                const stored = localStorage.getItem('inventory_products');
                if (stored) {
                    this.products = JSON.parse(stored);
                    this.cargado = true;
                    console.log(`Cargados ${this.products.length} productos desde localStorage`);
                }
            }
        } catch (error) {
            console.error('Error al cargar productos para inventario:', error);
            const stored = localStorage.getItem('inventory_products');
            if (stored) {
                this.products = JSON.parse(stored);
                this.cargado = true;
                console.log(`Cargados ${this.products.length} productos desde localStorage (fallback)`);
            }
        }
    }

    detectarCategoria(nombre) {
        const nombreLower = nombre.toLowerCase();
        if (nombreLower.includes('energ') || nombreLower.includes('prote')) return 'Energéticos';
        if (nombreLower.includes('detox') || nombreLower.includes('verde')) return 'Detox';
        if (nombreLower.includes('prote')) return 'Proteicos';
        if (nombreLower.includes('tropical') || nombreLower.includes('fruta') || 
            nombreLower.includes('coco') || nombreLower.includes('mango')) return 'Frutales';
        return 'Frutales';
    }

    saveProducts() {
        localStorage.setItem('inventory_products', JSON.stringify(this.products));
    }

    getAllProducts() {
        return this.products;
    }

    getProductById(id) {
        return this.products.find(p => p.id === id);
    }

    async addProduct(product) {
        try {
            console.log('CREANDO producto:', product);
            const response = await fetch(API_URL + 'productos.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'crear',
                    nombre: product.nombre,
                    descripcion: product.descripcion || '',
                    categoria: product.categoria || 'Frutales',
                    precio: product.precio,
                    stock: product.stock,
                    imagen_base64: product.imagen_base64 || ''
                })
            });
            
            const data = await response.json();
            console.log('Respuesta crear:', data);
            
            if (data.success) {
                await this.loadProducts();
                return data.producto;
            } else {
                console.error('Error al crear producto:', data.message);
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error en addProduct:', error);
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
    }

    async updateProduct(id, updatedData) {
        console.log('ACTUALIZANDO producto ID:', id);
        console.log('Datos a actualizar:', updatedData);
        console.log('Categoría a actualizar:', updatedData.categoria);
        
        try {
            const response = await fetch(API_URL + 'productos.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'actualizar',
                    id: id,
                    nombre: updatedData.nombre,
                    descripcion: updatedData.descripcion || '',
                    categoria: updatedData.categoria || 'Frutales',
                    precio: updatedData.precio,
                    stock: updatedData.stock,
                    imagen_base64: updatedData.imagen_base64 || '',
                    imagen_actual: updatedData.imagen_actual || 'img/default.jpg',
                    activo: updatedData.estado === 'activo' ? 1 : 0
                })
            });
            
            const data = await response.json();
            console.log('Respuesta del servidor:', data);
            
            if (data.success) {
                await this.loadProducts();
                console.log('Producto actualizado exitosamente');
                return true;
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error en updateProduct:', error);
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
    }

    async deleteProduct(id) {
        try {
            console.log('ELIMINANDO producto ID:', id);
            const response = await fetch(API_URL + 'productos.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'eliminar',
                    id: id
                })
            });
            
            const data = await response.json();
            console.log('Respuesta eliminar:', data);
            
            if (data.success) {
                await this.loadProducts();
                return true;
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error en deleteProduct:', error);
            const product = this.getProductById(id);
            if (product) {
                product.estado = 'inactivo';
                product.stock = 0;
                this.saveProducts();
                return true;
            }
            return false;
        }
    }

    updateStock(id, cantidad) {
        const product = this.getProductById(id);
        if (product) {
            product.stock += cantidad;
            if (product.stock < 0) product.stock = 0;
            product.fechaActualizacion = new Date().toISOString();
            if (product.stock === 0) {
                product.estado = 'inactivo';
            } else {
                product.estado = 'activo';
            }
            this.saveProducts();
            return product;
        }
        return null;
    }

    async updateStockInDatabase(id, cantidad) {
        const product = this.getProductById(id);
        if (!product) {
            throw new Error('Producto no encontrado');
        }
        
        const nuevoStock = product.stock + cantidad;
        if (nuevoStock < 0) {
            throw new Error('El stock no puede ser negativo');
        }
        
        const response = await fetch(API_URL + 'productos.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'actualizar',
                id: id,
                nombre: product.nombre,
                descripcion: product.descripcion || '',
                categoria: product.categoria || 'Frutales',
                precio: product.precio,
                stock: nuevoStock,
                imagen_actual: product.imagen || 'img/default.jpg',
                activo: nuevoStock > 0 ? 1 : 0
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            await this.loadProducts();
            return true;
        } else {
            throw new Error(data.message || 'Error al actualizar stock');
        }
    }

    getLowStockProducts() {
        return this.products.filter(p => p.stock <= p.stockMinimo && p.stock > 0);
    }

    getOutOfStockProducts() {
        return this.products.filter(p => p.stock === 0);
    }

    searchProducts(query) {
        const lowerQuery = query.toLowerCase();
        return this.products.filter(p => 
            p.nombre.toLowerCase().includes(lowerQuery) ||
            (p.categoria && p.categoria.toLowerCase().includes(lowerQuery))
        );
    }

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

const inventoryManager = new InventoryManager();
window.inventoryManager = inventoryManager;

console.log('inventory.js cargado correctamente');