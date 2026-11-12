import * as cartLogic from './cart.js?v=20261112_1';
import * as ui from './ui.js?v=20261112_1';
import { getStoreStatus, setScheduleConfig } from './schedule.js?v=20261112_1';
import { setMenuData, callApi } from './data.js?v=20261112_1';

const LIVE_CONFIG_CACHE_KEY = 'micho_burguer_live_config_v1';
let lastConfigFingerprint = '';
let latestStockMap = {};
let latestMasterGroups = [];

function getConfigFingerprint(cfg) {
    try {
        return JSON.stringify({
            categories: cfg.categories || [],
            schedule: cfg.schedule || {},
            cremas: cfg.cremas || [],
            cremasRule: cfg.cremasRule || {},
            sideOptions: cfg.sideOptions || {},
            extras: cfg.extras || [],
            masterStockGroups: cfg.masterStockGroups || []
        });
    } catch (e) {
        return '';
    }
}

function buildEffectiveStockMap() {
    const merged = JSON.parse(JSON.stringify(latestStockMap || {}));
    (latestMasterGroups || []).forEach(grp => {
        if (grp && grp.manualOutOfStock === true && Array.isArray(grp.variants)) {
            grp.variants.forEach(vid => {
                merged[vid] = { ...(merged[vid] || {}), isOutOfStock: true };
            });
        }
    });
    return merged;
}

function applyLiveConfig(cfg, isInitial = false) {
    if (!cfg || typeof cfg !== 'object') return;

    const newFp = getConfigFingerprint(cfg);
    const hasChanged = isInitial || newFp !== lastConfigFingerprint;
    lastConfigFingerprint = newFp;

    if (cfg.schedule) {
        setScheduleConfig(cfg.schedule);
    }

    if (Array.isArray(cfg.masterStockGroups)) {
        latestMasterGroups = cfg.masterStockGroups;
    }

    if (cfg.extras || cfg.cremas || cfg.cremasRule || cfg.sideOptions) {
        cartLogic.setExtrasAndCremas(cfg.extras, cfg.cremas, cfg.cremasRule, cfg.sideOptions);
    }

    if (Array.isArray(cfg.categories) && cfg.categories.length > 0 && hasChanged) {
        setMenuData(cfg.categories);
        ui.renderNavigation(handleCategoryClick);
        ui.renderAllProducts(handleAddToCart);
    }

    ui.updateScheduleUI();
    ui.applyStockData(buildEffectiveStockMap());
    const totals = cartLogic.getCartTotals();
    const cartItems = cartLogic.getCartItems();
    ui.updateCartUI(cartItems, totals, handleUpdateQty, handleCustomAction);
}

function init() {
    let loadedFromCache = false;
    // 1. Restaurar caché de configuración reciente si existe para carga instantánea
    try {
        const cachedRaw = localStorage.getItem(LIVE_CONFIG_CACHE_KEY);
        if (cachedRaw) {
            const cachedCfg = JSON.parse(cachedRaw);
            applyLiveConfig(cachedCfg, true);
            loadedFromCache = true;
        }
    } catch (e) {
        // Ignorar caché corrupta
    }

    if (!loadedFromCache) {
        ui.updateScheduleUI();
        ui.renderNavigation(handleCategoryClick);
        ui.renderAllProducts(handleAddToCart);
        ui.applyStockData(buildEffectiveStockMap());
    }
    ui.setupSearch();
    ui.setupOrderTypeTabs();
    ui.restoreCustomerData(); // Recordar datos del cliente en su dispositivo
    setupEventListeners();

    // 2. Sincronización ultrarrápida con el Panel Admin (< 15ms)
    syncFastConfig();
    setInterval(syncFastConfig, 2500);

    // 3. Sincronización de inventario y precios en tiempo real con Loyverse POS
    checkInventory();
    setInterval(checkInventory, 10000);

    // 4. Escuchar cambios instantáneos desde el Panel Admin en otra pestaña
    window.addEventListener('storage', (e) => {
        if (e.key === LIVE_CONFIG_CACHE_KEY && e.newValue) {
            try {
                const updatedCfg = JSON.parse(e.newValue);
                applyLiveConfig(updatedCfg, false);
            } catch (err) {}
        }
    });

    if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('micho_config_sync');
        bc.onmessage = (event) => {
            if (event.data && event.data.config) {
                applyLiveConfig(event.data.config, false);
            } else {
                syncFastConfig();
            }
        };
    }

    window.addEventListener('focus', syncFastConfig);
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) syncFastConfig();
    });

    // 5. Actualizar el estado del horario cada 20 segundos en segundo plano
    setInterval(() => {
        ui.updateScheduleUI();
        const totals = cartLogic.getCartTotals();
        const cartItems = cartLogic.getCartItems();
        ui.updateCartUI(cartItems, totals, handleUpdateQty, handleCustomAction);
    }, 20000);
}

// Consulta ultrarrápida de configuración del Panel Admin
async function syncFastConfig() {
    try {
        const { ok, data } = await callApi('config');
        if (ok && data && data.success && data.config) {
            try {
                localStorage.setItem(LIVE_CONFIG_CACHE_KEY, JSON.stringify(data.config));
            } catch (e) {}
            applyLiveConfig(data.config, false);
        }
    } catch (e) {
        // Silencioso
    }
}

// Consultar stock en tiempo real a Loyverse / Servidor
async function checkInventory() {
    try {
        const { ok, data } = await callApi('inventory');
        if (!ok || !data || !data.success) return;

        if (data.stock) {
            latestStockMap = data.stock;
        }

        if (data.config) {
            try {
                localStorage.setItem(LIVE_CONFIG_CACHE_KEY, JSON.stringify(data.config));
            } catch (e) {}
            applyLiveConfig(data.config, false);
        } else if (data.stock) {
            ui.applyStockData(buildEffectiveStockMap());
        }
    } catch (e) {
        console.warn('Sincronización en segundo plano:', e);
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
}

function handleUpdateQty(id, delta) {
    const totals = cartLogic.updateQty(id, delta);
    const cartItems = cartLogic.getCartItems();

    ui.updateCartUI(cartItems, totals, handleUpdateQty, handleCustomAction);
}

// Manejador de personalizaciones de producto (Ensalada, Papas, Cremas, Adicionales y Notas)
function handleCustomAction(action, id, payload) {
    if (action === 'toggleExtra') {
        cartLogic.toggleExtra(id, payload);
    } else if (action === 'setEnsalada') {
        cartLogic.setEnsalada(id, payload);
    } else if (action === 'setTipoPapa') {
        cartLogic.setTipoPapa(id, payload);
    } else if (action === 'toggleCremaEnPedido') {
        cartLogic.toggleCremaEnPedido(id, payload);
    } else if (action === 'toggleCremaAparte') {
        cartLogic.toggleCremaAparte(id, payload);
    } else if (action === 'changeCremaAparteQty') {
        cartLogic.changeCremaAparteQty(id, payload?.name, payload?.delta || 1);
    } else if (action === 'setAllCremasEnPedido') {
        cartLogic.setAllCremasEnPedido(id);
    } else if (action === 'setAllCremasAparte') {
        cartLogic.setAllCremasAparte(id);
    } else if (action === 'setInstrucciones') {
        cartLogic.setInstrucciones(id, payload);
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

    // Botón de imprimir comanda de prueba
    if (ui.printOrderBtn) {
        ui.printOrderBtn.addEventListener('click', () => {
            ui.printThermalTicket();
        });
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

    // 2. Validar celular (obligatorio para ambas modalidades)
    if (!customer.phone || customer.phone.trim() === '') {
        alert("Por favor ingresa tu número de celular.");
        ui.customerPhoneInput.focus();
        return;
    }

    // 3. Validar campos obligatorios si es A ENVIAR (Delivery)
    if (customer.orderType === 'A Enviar') {
        if (!customer.address || customer.address.trim() === '') {
            alert("Por favor ingresa tu dirección de entrega.");
            ui.customerAddressInput.focus();
            return;
        }
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
        const { ok, data: result } = await callApi('loyverse', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                items: items,
                customer: customer
            })
        });

        if (ok && result && result.success) {
            ui.saveCustomerData(customer); // Guardar memoria en el dispositivo para próximos pedidos
            ui.hideConfirmOrderModal();
            ui.toggleCart(); // Cerrar el carrito
            const totals = cartLogic.getCartTotals();
            ui.showSuccessModal(result.receipt_number, customer, items, totals);
            cartLogic.clearCart();
            ui.updateCartUI([], { totalItems: 0, totalPrice: 0 }, handleUpdateQty, handleCustomAction);
        } else {
            console.error("Detalle del error:", result);
            let errMsg = "No se pudo procesar el pedido.";
            if (result && typeof result.error === 'string') {
                errMsg = result.error;
            } else if (result && result.error && typeof result.error === 'object') {
                errMsg = result.error.message || (result.error.errors && result.error.errors.map(e => e.details || e.message || e.code).join('; ')) || JSON.stringify(result.error);
            }
            alert("Atención: " + errMsg);
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
