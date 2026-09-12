import * as cartLogic from './cart.js';
import * as ui from './ui.js';

function init() {
    ui.renderNavigation(handleCategoryClick);
    ui.renderAllProducts(handleAddToCart);
    ui.setupOrderTypeTabs();
    setupEventListeners();
}

function handleCategoryClick(categoryId) {
    ui.scrollToCategory(categoryId);
}

function handleAddToCart(id, name, price, variantId) {
    const totals = cartLogic.addToCart(id, name, price, variantId);
    const cartItems = cartLogic.getCartItems();
    
    ui.updateCartUI(cartItems, totals, handleUpdateQty);
    ui.animateCartButton();
}

function handleUpdateQty(id, delta) {
    const totals = cartLogic.updateQty(id, delta);
    const cartItems = cartLogic.getCartItems();
    
    ui.updateCartUI(cartItems, totals, handleUpdateQty);
}

function setupEventListeners() {
    ui.floatingCartBtn.addEventListener('click', ui.toggleCart);
    ui.closeCartBtn.addEventListener('click', ui.toggleCart);
    ui.cartOverlay.addEventListener('click', ui.toggleCart);
    ui.closeModalBtn.addEventListener('click', ui.hideSuccessModal);
    
    ui.checkoutBtn.addEventListener('click', handleCheckout);
}

async function handleCheckout() {
    const items = cartLogic.getCartItems();
    if (items.length === 0) {
        alert("El carrito está vacío. Agrega productos para continuar.");
        return;
    }

    const customer = ui.getCustomerFormData();

    if (!customer.name || customer.name.trim() === '') {
        alert("Por favor ingresa el nombre del cliente.");
        ui.customerNameInput.focus();
        return;
    }

    if (customer.orderType === 'Mesa' && (!customer.table || customer.table.trim() === '')) {
        alert("Por favor ingresa el número o nombre de la mesa.");
        ui.customerTableInput.focus();
        return;
    }

    // Bloquear botón durante el envío para evitar duplicados
    ui.checkoutBtn.disabled = true;
    const originalBtnHTML = ui.checkoutBtn.innerHTML;
    ui.checkoutBtn.innerHTML = '<span class="btn-text">Enviando a Cocina...</span><span class="btn-subtext">Conectando con Loyverse</span>';

    try {
        const response = await fetch('/api/loyverse', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                items: items,
                customer: customer
            })
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            ui.toggleCart();
            ui.showSuccessModal(result.receipt_number, result.order);
            cartLogic.clearCart();
            ui.updateCartUI([], { totalItems: 0, totalPrice: 0 }, handleUpdateQty);
        } else {
            console.error("Detalle del error:", result);
            alert("Hubo un error al registrar la comanda en Loyverse: " + (result.error?.message || JSON.stringify(result.error) || "Error desconocido"));
        }
    } catch (error) {
        console.error("Error al enviar el pedido:", error);
        alert("Error de conexión. Revisa tu internet e intenta nuevamente.");
    } finally {
        ui.checkoutBtn.disabled = false;
        ui.checkoutBtn.innerHTML = originalBtnHTML;
    }
}

// Iniciar aplicación al cargar el DOM
document.addEventListener('DOMContentLoaded', init);
