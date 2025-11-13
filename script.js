// Catálogo de Productos (Dataset inicial)
const productos = [
    { id: 1, nombre: 'Hoodie "Black Street"', categoria: 'Hoodies', precio: 120000, imagen: 'Imagenes/hoodie Black.jpg' },
    { id: 2, nombre: 'Hoodie "Retro Gray"', categoria: 'Hoodies', precio: 115000, imagen: 'Imagenes/grey hoodie.jpg' },
    { id: 3, nombre: 'Gorra "NYC Flat"', categoria: 'Gorras', precio: 75000, imagen: 'Imagenes/gorra NYC.jpg' },
    { id: 4, nombre: 'Gorra "Classic White"', categoria: 'Gorras', precio: 70000, imagen: 'Imagenes/gorra white.jpg' },
    { id: 5, nombre: 'Buso Oversize "Storm"', categoria: 'Busos oversize', precio: 95000, imagen: 'Imagenes/storm.jpg' },
    { id: 6, nombre: 'Buso Oversize "Skyline"', categoria: 'Busos oversize', precio: 99000, imagen: 'Imagenes/skyline.jpg' },
];

// Variables DOM
const productContainer = document.getElementById('product-container');
const filterBar = document.getElementById('filter-bar');
const cartIcon = document.getElementById('cart-icon');
const cartSidebar = document.getElementById('cart-sidebar');
const closeCartBtn = document.getElementById('close-cart');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalAmount = document.getElementById('cart-total-amount');
const cartCount = document.getElementById('cart-count');
const paypalBtn = document.querySelector('.paypal-btn'); // Botón 'Pagar' en el sidebar

// Variables del Modal de Pago
const paymentModal = document.getElementById('payment-modal');
const closeModalBtn = paymentModal.querySelector('.close-modal-btn');
const confirmPaymentBtn = document.getElementById('confirm-payment-btn');
const paymentOptions = paymentModal.querySelectorAll('input[name="paymentMethod"]');
const paymentWarning = paymentModal.querySelector('.payment-warning');

// Formateador de Moneda COP (Intl.NumberFormat)
const formatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
});

// ** FUNCIONES DEL CARRITO Y RENDERIZADO (Sin cambios) **
function renderProductos(productosArray) {
    productContainer.innerHTML = ''; 
    if (productosArray.length === 0) {
        productContainer.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: var(--color-gray);">No hay productos disponibles en esta categoría.</p>';
        return;
    }

    productosArray.forEach(producto => {
        const card = document.createElement('div');
        card.classList.add('product-card');
        card.innerHTML = `
            <img src="${producto.imagen}" alt="${producto.nombre}">
            <p class="category">${producto.categoria}</p>
            <h3>${producto.nombre}</h3>
            <p class="price">${formatter.format(producto.precio)}</p>
            <button class="add-to-cart-btn" data-id="${producto.id}">Añadir al Carrito</button>
        `;
        productContainer.appendChild(card);
    });
}

function setupFilters() {
    const categories = ['TODOS', ...new Set(productos.map(p => p.categoria))];
    filterBar.innerHTML = '';

    categories.forEach(category => {
        const button = document.createElement('button');
        button.classList.add('filter-btn');
        button.textContent = category;
        button.dataset.category = category;
        if (category === 'TODOS') {
            button.classList.add('active'); 
        }

        button.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            if (category === 'TODOS') {
                renderProductos(productos);
            } else {
                const filtered = productos.filter(p => p.categoria === category);
                renderProductos(filtered);
            }
        });
        filterBar.appendChild(button);
    });
}


let cart = JSON.parse(localStorage.getItem('streetstyleCart')) || [];

function saveCart() {
    localStorage.setItem('streetstyleCart', JSON.stringify(cart));
}

function updateCartCount() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
}

function calculateTotal() {
    const total = cart.reduce((sum, item) => sum + (item.precio * item.quantity), 0);
    cartTotalAmount.textContent = formatter.format(total);

    // Activar botón de 'Pagar' del sidebar solo si hay productos
    if (total > 0) {
        paypalBtn.disabled = false;
        paypalBtn.textContent = `Pagar ${formatter.format(total)} - Opciones`;
        paypalBtn.style.backgroundColor = '#0070BA';
    } else {
        paypalBtn.disabled = true;
        paypalBtn.textContent = 'Pagar con PayPal'; // Texto base cuando está vacío
        paypalBtn.style.backgroundColor = '#ccc';
    }
}

function renderCartItems() {
    cartItemsContainer.innerHTML = '';
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p style="text-align: center; color: var(--color-gray); margin-top: 50px;">El carrito está vacío.</p>';
        
    } else {
        cart.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.classList.add('cart-item');
            itemElement.innerHTML = `
                <div class="item-info">
                    <span class="item-name">${item.nombre}</span>
                    <span class="item-subtotal">${formatter.format(item.precio * item.quantity)}</span>
                </div>
                <div class="item-controls">
                    <button class="qty-btn decrement" data-id="${item.id}">-</button>
                    <span class="item-quantity">${item.quantity}</span>
                    <button class="qty-btn increment" data-id="${item.id}">+</button>
                    <button class="remove-btn" data-id="${item.id}">Eliminar</button>
                </div>
            `;
            cartItemsContainer.appendChild(itemElement);
        });
    }
    
    calculateTotal();
    updateCartCount();
}

function addToCart(productId) {
    const product = productos.find(p => p.id === parseInt(productId));
    const cartItem = cart.find(item => item.id === parseInt(productId));

    if (product) {
        if (cartItem) {
            cartItem.quantity += 1;
        } else {
            cart.push({ ...product, quantity: 1 });
        }
        saveCart();
        renderCartItems();
    }
}

function updateQuantity(productId, type) {
    const cartItem = cart.find(item => item.id === parseInt(productId));
    if (!cartItem) return;

    if (type === 'increment') {
        cartItem.quantity += 1;
    } else if (type === 'decrement') {
        cartItem.quantity -= 1;
        if (cartItem.quantity < 1) {
            cart = cart.filter(item => item.id !== parseInt(productId));
        }
    }
    saveCart();
    renderCartItems();
}

// ** MODIFICACIÓN: FUNCIÓN FINALIZAR COMPRA **

function finalizePurchase() {
    const selectedMethod = document.querySelector('input[name="paymentMethod"]:checked');
    if (!selectedMethod) {
        // Esto no debería pasar si el botón está deshabilitado, pero es una buena práctica.
        paymentWarning.style.display = 'block'; 
        return;
    }

    // 1. Mostrar Mensaje de Compra Exitosa
    const totalCompra = cartTotalAmount.textContent;
    const metodo = selectedMethod.value;
    alert(`¡Compra Satisfactoria!\nSe ha procesado tu pedido por ${totalCompra} con ${metodo.toUpperCase()}.\nGracias por comprar en StreetStyle.`);

    // 2. Vaciar el Carrito y Guardar
    cart = [];
    saveCart();

    // 3. Cerrar Modales y actualizar interfaz
    paymentModal.classList.remove('open');
    cartSidebar.classList.remove('open'); 
    renderCartItems(); 
    paymentWarning.style.display = 'none';
}


// ** MANEJADORES DE EVENTOS **

// MODIFICADO: El botón de Pagar del carrito AHORA abre el modal.
paypalBtn.addEventListener('click', (e) => {
    e.preventDefault(); 
    if (!paypalBtn.disabled) {
        // Cierra el sidebar y abre el modal de pago
        cartSidebar.classList.remove('open');
        paymentModal.classList.add('open');
    }
});

// Cerrar Modal de Pago
closeModalBtn.addEventListener('click', () => {
    paymentModal.classList.remove('open');
});

// Control para habilitar/deshabilitar botón de Confirmar Pago
paymentOptions.forEach(radio => {
    radio.addEventListener('change', () => {
        confirmPaymentBtn.disabled = !document.querySelector('input[name="paymentMethod"]:checked');
        paymentWarning.style.display = 'none'; // Ocultar advertencia al seleccionar
    });
});

// Botón de Confirmar Pago en el Modal
confirmPaymentBtn.addEventListener('click', finalizePurchase);


// Funcionalidad de navegación (Simulación)
const navLinks = document.querySelectorAll('header nav a');
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        // Prevenir la acción por defecto para simular la navegación
        e.preventDefault(); 
        const page = e.target.textContent;

        if (page === 'Sobre Nosotros' || page === 'Contacto') {
            alert(`Simulando navegación a la página: ${page}\n(En una implementación real, esto cargaría un nuevo HTML.)`);
        } else if (page === 'Tienda') {
            // Regresar a la vista principal
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
});


// (Otros Event Listeners del carrito se mantienen igual)
cartIcon.addEventListener('click', () => { cartSidebar.classList.add('open'); });
closeCartBtn.addEventListener('click', () => { cartSidebar.classList.remove('open'); });

productContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('add-to-cart-btn')) {
        addToCart(e.target.dataset.id);
        cartSidebar.classList.add('open');
    }
});

cartItemsContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('increment')) {
        updateQuantity(e.target.dataset.id, 'increment');
    } else if (e.target.classList.contains('decrement')) {
        updateQuantity(e.target.dataset.id, 'decrement');
    } else if (e.target.classList.contains('remove-btn')) {
        cart = cart.filter(item => item.id !== parseInt(e.target.dataset.id));
        saveCart();
        renderCartItems();
    }
});

// Inicialización de la Tienda
document.addEventListener('DOMContentLoaded', () => {
    setupFilters(); 
    renderProductos(productos); 
    renderCartItems(); 
});
// ** LÓGICA DEL CARRUSEL **

let slideIndex = 0;
const slides = document.querySelectorAll('.carousel-slide');
const prevButton = document.querySelector('.prev-slide');
const nextButton = document.querySelector('.next-slide');

function showSlide(index) {
    slides.forEach((slide, i) => {
        slide.classList.remove('active');
        if (i === index) {
            slide.classList.add('active');
        }
    });
}

function nextSlide() {
    slideIndex = (slideIndex + 1) % slides.length;
    showSlide(slideIndex);
}

function prevSlide() {
    slideIndex = (slideIndex - 1 + slides.length) % slides.length;
    showSlide(slideIndex);
}

// Inicializar y automatizar el carrusel
if (slides.length > 1) {
    // Rotación automática cada 5 segundos
    setInterval(nextSlide, 5000); 

    // Asignar eventos a los botones de navegación
    prevButton.addEventListener('click', prevSlide);
    nextButton.addEventListener('click', nextSlide);
}


// ** FUNCIÓN PARA SCROLL A PRODUCTOS (Llamada desde el CTA) **
window.scrollToProducts = function() {
    // Encuentra la posición del contenedor principal de productos
    const catalogHeader = document.querySelector('.catalog-header');
    if (catalogHeader) {
        window.scrollTo({
            top: catalogHeader.offsetTop - 80, // Restamos un poco para el header fijo
            behavior: 'smooth'
        });
    }
}

// Asegúrate de que showSlide(0) se ejecute al cargar el DOM para mostrar el primer slide
document.addEventListener('DOMContentLoaded', () => {
    // ... (El resto del código de inicialización existente) ...
    
    // Inicialización del Carrusel (si hay slides)
    if (slides.length > 0) {
        showSlide(0);
    }
});