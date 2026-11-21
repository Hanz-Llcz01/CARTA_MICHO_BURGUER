import * as cartLogic from './cart.js?v=20261119_1';
import * as ui from './ui.js?v=20261119_1';
import { getStoreStatus, setScheduleConfig } from './schedule.js?v=20261119_1';
import { setMenuData, callApi } from './data.js?v=20261119_1';

const LIVE_CONFIG_CACHE_KEY = 'micho_burguer_live_config_v1';
let lastConfigFingerprint = '';
let latestStockMap = {};
let latestMasterGroups = [];
let latestCategories = [];

const CANONICAL_GROUP_VARIANTS = {
    grp_hamburguesas: ['6d767227-33a4-4738-9bad-426be19362fe', '8bf81c7e-7d00-48d3-b9e9-cda9f9d72c39', '6443424f-c859-44b2-81df-14b2259a1f5e', '4e4fef97-e474-4399-bd9c-a3018cc5f08e', 'ea59f87e-7011-4a3e-a7a9-44382e4a0e4c', 'b34af2ce-02d8-426a-ab23-44a9c4b1f845'],
    grp_pollo: ['c577b91a-a10f-4e1e-9911-a1f73b9f6c97', 'e4d1fbbf-1503-4317-94cb-acc75b1c913a', '060095b1-6642-4cb1-ae5a-2d2cd7c96334', '6906ccd6-cc74-4042-8601-e646c1129131', 'f1f36672-bc7c-41de-9961-ddd068380e4d', '9f238682-be0f-4853-91be-2824471e0ab0', '1dcb00a3-0b10-4384-9c2a-df9ab86cbca1', '2ce4b601-7b87-4eb3-9a66-5a6ebeb33f33', 'c526cfb0-c85d-466a-aa62-8b9ee2629d69'],
    grp_filetes: ['08d0e755-36f3-4253-b262-56430ea37cad', '8e2a954c-1719-4be3-99b2-f220b80f40a8', '2bfa628d-bdfb-468b-aafa-ac351846b7de', 'f9fad568-98bf-4dd9-a57d-b5d3f5f86ed4', '0e2ef7ed-82a0-43ad-a8d7-4e0d99ee9eea'],
    grp_crispy: ['5262de55-d870-46c2-aad9-25a7a096d8a0', '57bf1904-69f2-427a-8731-afe078274a6d', 'd94b34ba-f604-44b9-b76c-08286adaff5e', '54ca71a0-bb6d-44de-b3a3-af21b46924c3', '60bc53aa-36cd-4650-9707-c082244fbf7c'],
    grp_chorizos: ['8fdde459-5909-49a4-a2c9-eacbec3efa18', '9be1375d-d1ca-4ada-ab6d-55218b8a792d', '93e6270e-8acc-49f9-8c0f-3fee2faa4c70', 'c084ac1e-f45b-4c6d-8173-1527d39ca3f5', '6059ac60-e268-4809-9060-4253c62c24db', 'bc323c7e-358a-4853-855b-9e2f2beb1618'],
    grp_pecho_broaster: ['ef9fc0a8-c3e4-4b0f-8ad3-d15d14a5b526', '47fd3400-d49d-49fa-9f9b-b749a89414bd'],
    grp_encuentro_broaster: ['7433770a-524e-46b1-b07d-1c6f4c2a7eb1', '8d4008bc-a051-420f-bf69-d46e33878809'],
    grp_ala_broaster: ['8056dee7-40f6-4e43-bce8-a3344060997c', '2177ce33-0135-45b7-9a43-60167b803e1f', 'df1e6c91-9f19-4dbd-a065-b4b021fc4843'],
    grp_muzlo_broaster: ['7ff8ac6a-2ae7-4989-8a6e-5e535ca1fcb8', '139e2101-3055-4fb7-9413-b33432f8e55f']
};

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
    const manualOutVariants = new Set();
    (latestCategories || []).forEach(cat => {
        (cat.items || []).forEach(it => {
            if (it && it.manualOutOfStock === true && it.variant_id) {
                manualOutVariants.add(it.variant_id);
                merged[it.variant_id] = { ...(merged[it.variant_id] || {}), isOutOfStock: true };
            }
        });
    });

    (latestMasterGroups || []).forEach(grp => {
        if (!grp) return;
        const canonical = (grp.id && CANONICAL_GROUP_VARIANTS[grp.id]) ? CANONICAL_GROUP_VARIANTS[grp.id] : [];
        const allVars = Array.from(new Set([...(grp.variants || []), ...canonical]));
        const masterOut = grp.masterVariantId && (merged[grp.masterVariantId]?.isOutOfStock === true || manualOutVariants.has(grp.masterVariantId));
        const anyLinkedOut = allVars.some(vid => {
            if (vid === 'df1e6c91-9f19-4dbd-a065-b4b021fc4843' && grp.id === 'grp_ala_broaster') return false;
            return merged[vid]?.isOutOfStock === true;
        });

        if (grp.manualOutOfStock === true || masterOut || anyLinkedOut) {
            allVars.forEach(vid => {
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

    if (Array.isArray(cfg.categories)) {
        latestCategories = cfg.categories;
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
