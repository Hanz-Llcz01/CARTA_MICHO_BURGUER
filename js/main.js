import * as cartLogic from './cart.js';
import * as ui from './ui.js';
import { getStoreStatus } from './schedule.js';

function init() {
    ui.updateScheduleUI();
    ui.renderNavigation(handleCategoryClick);
    ui.renderAllProducts(handleAddToCart);
    ui.setupSearch();
    ui.setupOrderTypeTabs();
    ui.restoreCustomerData(); // Recordar datos del cliente en su dispositivo
    setupEventListeners();

    // Sincronizar stock en tiempo real con Loyverse
    checkInventory();
    setInterval(checkInventory, 45000);

    // Actualizar el estado del horario cada 30 segundos en segundo plano
    setInterval(() => {
        ui.updateScheduleUI();
        const totals = cartLogic.getCartTotals();
        const cartItems = cartLogic.getCartItems();
        ui.updateCartUI(cartItems, totals, handleUpdateQty, handleCustomAction);
    }, 30000);
}

// Consultar stock en tiempo real a la API de Loyverse
async function checkInventory() {
    try {
        const res = await fetch('/api/inventory');
        if (!res.ok) return;
        const data = await res.json();
        if (data && data.success && data.stock) {
            ui.applyStockData(data.stock);
        }
    } catch (e) {
        // Si no hay conexión o se prueba localmente en XAMPP, la carta continúa operativa
        console.warn('Inventario en segundo plano:', e);
    }
}

function handleCategoryClick(categoryId) {
    ui.scrollToCategory(categoryId);
}

function handleAddToCart(id, name, price, variantId) {
    const totals = cartLogic.addToCart(id, name, price, variantId);
    const cartItems = cartLogic.getCartItems();
    
    ui.updateCartUI(cartItems, totals, handleUpdateQty, handleCustomAction);
    ui.animateCartButton();

    // Abrir el carrito para que el cliente vea y personalice sus cremas y adicionales
    if (!ui.cartSidebar.classList.contains('active')) {
        ui.toggleCart();
    }
}

function handleUpdateQty(id, delta) {
    const totals = cartLogic.updateQty(id, delta);
    const cartItems = cartLogic.getCartItems();
    
    ui.updateCartUI(cartItems, totals, handleUpdateQty, handleCustomAction);
}

// Manejador de personalizaciones de producto (Cremas y Adicionales)
function handleCustomAction(action, id, payload) {
    if (action === 'toggleExtra') {
        cartLogic.toggleExtra(id, payload);
    } else if (action === 'toggleCrema') {
        cartLogic.toggleCrema(id, payload);
    } else if (action === 'setAllCremas') {
        cartLogic.setAllCremas(id);
    } else if (action === 'setCremasMode') {
        cartLogic.setCremasMode(id, payload);
    } else if (action === 'toggleExpanded') {
        cartLogic.toggleItemExpanded(id);
    }

    const totals = cartLogic.getCartTotals();
    const cartItems = cartLogic.getCartItems();
    ui.updateCartUI(cartItems, totals, handleUpdateQty, handleCustomAction);
}

function setupEventListeners() {
    ui.floatingCartBtn.addEventListener('click', ui.toggleCart);
    ui.closeCartBtn.addEventListener('click', ui.toggleCart);
    ui.cartOverlay.addEventListener('click', ui.toggleCart);
    ui.closeModalBtn.addEventListener('click', ui.hideSuccessModal);
    
    // Paso 1: Clic en "Revisar Pedido" para abrir la Doble Confirmación
    ui.checkoutBtn.addEventListener('click', handleOpenConfirmation);

    // Paso 2: Modificar pedido (cierra el modal de confirmación y vuelve al carrito)
    if (ui.btnModifyOrder) {
        ui.btnModifyOrder.addEventListener('click', ui.hideConfirmOrderModal);
    }

    // Paso 3: Confirmación Final (envía a cocina, Loyverse y Telegram)
    if (ui.btnConfirmFinal) {
        ui.btnConfirmFinal.addEventListener('click', handleFinalSubmit);
    }

    // Clic en el Logo para volver arriba suavemente
    const brandLogo = document.querySelector('.brand-logo');
    if (brandLogo) {
        brandLogo.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}

// Validación y apertura de la ventana de Doble Confirmación
function handleOpenConfirmation() {
    const items = cartLogic.getCartItems();
    if (items.length === 0) {
        alert("El carrito está vacío. Agrega productos para continuar.");
        return;
    }

    const schedule = getStoreStatus();
    const testMode = ui.isTestMode();

    if (!schedule.isOpen && !testMode) {
        alert(`Cocina cerrada en este momento.\n\n${schedule.notice}`);
        return;
    }

    const customer = ui.getCustomerFormData();

    // 1. Validar nombre (obligatorio para ambas modalidades)
    if (!customer.name || customer.name.trim() === '') {
        alert("Por favor ingresa tu nombre.");
        ui.customerNameInput.focus();
        return;
    }

    // 2. Validar campos obligatorios si es A ENVIAR (Delivery)
    if (customer.orderType === 'A Enviar') {
        if (!customer.phone || customer.phone.trim() === '') {
            alert("Por favor ingresa tu número de celular para coordinar el delivery.");
            ui.customerPhoneInput.focus();
            return;
        }

        if (!customer.address || customer.address.trim() === '') {
            alert("Por favor ingresa tu dirección de entrega.");
            ui.customerAddressInput.focus();
            return;
        }
        // Torre y Dpto es opcional
    }

    const totals = cartLogic.getCartTotals();

    // Abrir ventana emergente con la tabla de detalles
    ui.showConfirmOrderModal(customer, items, totals);
}

// Envío real a Loyverse y Telegram tras confirmar
async function handleFinalSubmit() {
    const items = cartLogic.getCartItems();
    const customer = ui.getCustomerFormData();

    if (!ui.btnConfirmFinal) return;

    ui.btnConfirmFinal.disabled = true;
    const originalText = ui.btnConfirmFinal.innerHTML;
    ui.btnConfirmFinal.innerHTML = '<span>⏳ Enviando Pedido...</span>';

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
            ui.saveCustomerData(customer); // Guardar memoria en el dispositivo para próximos pedidos
            ui.hideConfirmOrderModal();
            ui.toggleCart(); // Cerrar el carrito
            ui.showSuccessModal(result.receipt_number, customer);
            cartLogic.clearCart();
            ui.updateCartUI([], { totalItems: 0, totalPrice: 0 }, handleUpdateQty);
        } else {
            console.error("Detalle del error:", result);
            alert("Atención: " + (result.error || "No se pudo procesar el pedido."));
        }
    } catch (error) {
        console.error("Error al enviar el pedido:", error);
        alert("Error de conexión. Revisa tu internet e intenta nuevamente.");
    } finally {
        ui.btnConfirmFinal.disabled = false;
        ui.btnConfirmFinal.innerHTML = originalText;
    }
}

// Iniciar aplicación al cargar el DOM
document.addEventListener('DOMContentLoaded', init);
