import * as cartLogic from './cart.js';
import * as ui from './ui.js';

function init() {
    ui.renderNavigation(handleCategoryClick);
    ui.renderAllProducts(handleAddToCart);
    setupEventListeners();
}

function handleCategoryClick(categoryId) {
    ui.scrollToCategory(categoryId);
}

function handleAddToCart(id, name, price) {
    const totals = cartLogic.addToCart(id, name, price);
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
    // Prevent multiple clicks
    ui.checkoutBtn.disabled = true;
    ui.checkoutBtn.textContent = "Procesando...";

    const items = cartLogic.getCartItems();
    
    try {
        // Enviar pedido al backend PHP que se comunica con Loyverse
        const response = await fetch('/api/loyverse', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ items: items })
        });
        
        const result = await response.json();
        
        if (result.success) {
            ui.toggleCart();
            ui.showSuccessModal();
            cartLogic.clearCart();
            ui.updateCartUI([], { totalItems: 0, totalPrice: 0 }, handleUpdateQty);
        } else {
            alert("Hubo un error al procesar tu pedido. Intenta nuevamente.");
        }
    } catch (error) {
        console.error("Error al enviar el pedido:", error);
        alert("Error de conexión. Revisa tu internet.");
    } finally {
        ui.checkoutBtn.disabled = false;
        ui.checkoutBtn.textContent = "Confirmar Pedido";
    }
}

// Iniciar aplicación
document.addEventListener('DOMContentLoaded', init);
