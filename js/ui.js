import { menuData } from './data.js';
import { getStoreStatus } from './schedule.js';
import { AVAILABLE_EXTRAS, AVAILABLE_CREMAS } from './cart.js';

// Elementos del DOM
export const categoryNav = document.getElementById('category-nav');
export const menuSection = document.getElementById('menu-section');
export const cartOverlay = document.getElementById('cart-overlay');
export const cartSidebar = document.getElementById('cart-sidebar');
export const closeCartBtn = document.getElementById('close-cart');
export const floatingCartBtn = document.getElementById('floating-cart-btn');
export const cartItemsContainer = document.getElementById('cart-items');
export const cartTotalPrice = document.getElementById('cart-total-price');
export const cartBadge = document.getElementById('cart-badge');
export const checkoutBtn = document.getElementById('checkout-btn');
export const successModal = document.getElementById('success-modal');
export const closeModalBtn = document.getElementById('close-modal-btn');
export const printOrderBtn = document.getElementById('print-order-btn');
export const orderTypeTabs = document.getElementById('order-type-tabs');
export const customerNameInput = document.getElementById('customer-name');
export const customerPhoneInput = document.getElementById('customer-phone');
export const customerAddressInput = document.getElementById('customer-address');
export const customerBuildingInput = document.getElementById('customer-building');
export const deliveryFieldsGroup = document.getElementById('delivery-fields-group');
export const customerNotesInput = document.getElementById('customer-notes');
export const currentTypeTag = document.getElementById('current-type-tag');
export const searchInput = document.getElementById('menu-search-input');
export const clearSearchBtn = document.getElementById('clear-search-btn');
export const storeStatusBadge = document.getElementById('store-status-badge');
export const statusText = document.getElementById('status-text');
export const closedAlertBanner = document.getElementById('closed-alert-banner');
export const closedTitle = document.getElementById('closed-title');
export const closedSubtitle = document.getElementById('closed-subtitle');
export const closedCartWarning = document.getElementById('closed-cart-warning');

// Modal de Doble Confirmación
export const confirmOrderModal = document.getElementById('confirm-order-modal');
export const confirmSummaryBox = document.getElementById('confirm-summary-box');
export const btnModifyOrder = document.getElementById('btn-modify-order');
export const btnConfirmFinal = document.getElementById('btn-confirm-final');

// Comprobar si hay parámetro de prueba (?abierto=1 o ?test=1)
export function isTestMode() {
    const params = new URLSearchParams(window.location.search);
    return params.get('abierto') === '1' || params.get('test') === '1';
}

export function updateScheduleUI() {
    const status = getStoreStatus();
    const testMode = isTestMode();

    if (testMode) {
        if (storeStatusBadge) {
            storeStatusBadge.className = 'store-status-badge status-test';
            statusText.textContent = '🛠️ Modo Prueba Activo (Abierto)';
        }
        if (closedAlertBanner) closedAlertBanner.style.display = 'none';
        if (closedCartWarning) closedCartWarning.style.display = 'none';
        return { isOpen: true, testMode: true };
    }

    if (storeStatusBadge) {
        storeStatusBadge.className = `store-status-badge ${status.badgeClass}`;
        statusText.textContent = status.badgeText;
    }

    if (!status.isOpen) {
        if (closedAlertBanner) {
            closedAlertBanner.style.display = 'block';
            if (closedTitle) closedTitle.textContent = `Cocina Cerrada (${status.shortReason})`;
            if (closedSubtitle) closedSubtitle.textContent = status.notice;
        }
        if (closedCartWarning) {
            closedCartWarning.style.display = 'block';
            closedCartWarning.textContent = `⚠️ ${status.notice}`;
        }
    } else {
        if (closedAlertBanner) closedAlertBanner.style.display = 'none';
        if (closedCartWarning) closedCartWarning.style.display = 'none';
    }

    return status;
}

export function renderNavigation(onCategoryClick) {
    categoryNav.innerHTML = '';
    menuData.forEach((category, index) => {
        const btn = document.createElement('button');
        btn.className = `cat-btn ${index === 0 ? 'active' : ''}`;
        btn.innerHTML = `<span class="cat-icon">${category.icon || '🍽️'}</span> <span>${category.name}</span>`;
        btn.onclick = () => {
            document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            onCategoryClick(category.id);
        };
        categoryNav.appendChild(btn);
    });
}

export function renderAllProducts(onAddToCart) {
    menuSection.innerHTML = '';
    menuData.forEach(category => {
        const catContainer = document.createElement('div');
        catContainer.className = 'menu-category';
        catContainer.id = category.id;
        
        const catTitle = document.createElement('h2');
        catTitle.className = 'category-title';
        catTitle.innerHTML = `<span class="cat-header-icon">${category.icon || ''}</span> <span>${category.name}</span>`;
        
        const productGrid = document.createElement('div');
        productGrid.className = 'product-grid';
        
        category.items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.setAttribute('data-name', item.name.toLowerCase());
            card.setAttribute('data-desc', item.desc.toLowerCase());

            const badgeHtml = item.badge 
                ? `<div class="product-badge">${item.badge}</div>` 
                : '';

            card.innerHTML = `
                ${badgeHtml}
                <div class="product-info">
                    <h3 class="product-name">${item.name}</h3>
                    <p class="product-desc">${item.desc}</p>
                    <div class="product-bottom-row">
                        <div class="product-price">
                            <span class="currency">S/</span>
                            <span class="amount">${item.price.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            `;
            
            card.setAttribute('data-variant-id', item.variant_id || '');
            card.setAttribute('data-item-id', item.id || '');

            const addBtn = document.createElement('button');
            addBtn.className = 'add-btn';
            addBtn.setAttribute('aria-label', `Agregar ${item.name}`);
            addBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
            `;
            addBtn.onclick = () => onAddToCart(item.id, item.name, item.price, item.variant_id);
            
            card.appendChild(addBtn);
            productGrid.appendChild(card);
        });
        
        catContainer.appendChild(catTitle);
        catContainer.appendChild(productGrid);
        menuSection.appendChild(catContainer);
    });
}

// Aplicar disponibilidad de stock de Loyverse a los productos
export function applyStockData(stockMap) {
    if (!stockMap) return;

    const cards = document.querySelectorAll('.product-card');
    cards.forEach(card => {
        const variantId = card.getAttribute('data-variant-id');
        if (!variantId || !stockMap[variantId]) return;

        const info = stockMap[variantId];
        const isOutOfStock = info.isOutOfStock === true;

        const addBtn = card.querySelector('.add-btn');
        let badge = card.querySelector('.product-badge');

        if (isOutOfStock) {
            card.classList.add('product-out-of-stock');
            if (badge) {
                badge.className = 'product-badge badge-out-of-stock';
                badge.textContent = '❌ Agotado';
            } else {
                badge = document.createElement('div');
                badge.className = 'product-badge badge-out-of-stock';
                badge.textContent = '❌ Agotado';
                card.prepend(badge);
            }
            if (addBtn) {
                addBtn.className = 'add-btn btn-out-of-stock';
                addBtn.disabled = true;
                addBtn.innerHTML = 'Agotado';
                addBtn.onclick = null;
            }
        }
    });
}

export function setupSearch() {
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim().toLowerCase();
        if (clearSearchBtn) {
            clearSearchBtn.style.display = query.length > 0 ? 'flex' : 'none';
        }

        const cards = document.querySelectorAll('.product-card');

        cards.forEach(card => {
            const name = card.getAttribute('data-name') || '';
            const desc = card.getAttribute('data-desc') || '';

            if (query === '' || name.includes(query) || desc.includes(query)) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        });

        document.querySelectorAll('.menu-category').forEach(cat => {
            const hasVisible = Array.from(cat.querySelectorAll('.product-card')).some(c => c.style.display !== 'none');
            cat.style.display = hasVisible ? 'block' : 'none';
        });
    });

    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
            searchInput.value = '';
            clearSearchBtn.style.display = 'none';
            searchInput.dispatchEvent(new Event('input'));
            searchInput.focus();
        });
    }
}

export function setupOrderTypeTabs() {
    if (!orderTypeTabs) return;
    const tabButtons = orderTypeTabs.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const type = btn.dataset.type; // 'A Enviar' o 'A Recoger'

            if (currentTypeTag) {
                currentTypeTag.textContent = type;
            }

            if (type === 'A Recoger') {
                if (deliveryFieldsGroup) deliveryFieldsGroup.style.display = 'none';
            } else {
                if (deliveryFieldsGroup) deliveryFieldsGroup.style.display = 'block';
            }
        });
    });
}

export function updateCartUI(cartItems, totals, onUpdateQty, onCustomAction) {
    cartItemsContainer.innerHTML = '';
    const customerForm = document.getElementById('cart-customer-form');
    const schedule = getStoreStatus();
    const testMode = isTestMode();
    const canOrder = schedule.isOpen || testMode;
    
    if (cartItems.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="empty-cart-msg">
                <span class="empty-icon">🛒</span>
                <p>Tu comanda está vacía.</p>
                <small>Selecciona tus platos favoritos de la carta para empezar.</small>
            </div>
        `;
        checkoutBtn.disabled = true;
        if (customerForm) customerForm.style.display = 'none';
    } else {
        if (customerForm) customerForm.style.display = 'block';

        if (!canOrder) {
            checkoutBtn.disabled = true;
            checkoutBtn.querySelector('.btn-text').textContent = "Cocina Cerrada";
            checkoutBtn.querySelector('.btn-subtext').textContent = schedule.shortReason;
        } else {
            checkoutBtn.disabled = false;
            checkoutBtn.querySelector('.btn-text').textContent = "Revisar Pedido";
            checkoutBtn.querySelector('.btn-subtext').textContent = "Ver resumen y confirmar";
        }

        cartItems.forEach(item => {
            const cartItemEl = document.createElement('div');
            cartItemEl.className = 'cart-item';
            
            // Fila superior: Nombre, Precio y Botones de Cantidad (- / +)
            const topRow = document.createElement('div');
            topRow.className = 'cart-item-top';

            const info = document.createElement('div');
            info.className = 'cart-item-info';
            info.innerHTML = `
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">S/ ${(item.price * item.qty).toFixed(2)}</div>
            `;
            
            const controls = document.createElement('div');
            controls.className = 'cart-item-controls';
            
            const minusBtn = document.createElement('button');
            minusBtn.className = 'qty-btn';
            minusBtn.textContent = '-';
            minusBtn.onclick = () => onUpdateQty(item.id, -1);
            
            const qtySpan = document.createElement('span');
            qtySpan.className = 'cart-item-qty';
            qtySpan.textContent = item.qty;
            
            const plusBtn = document.createElement('button');
            plusBtn.className = 'qty-btn';
            plusBtn.textContent = '+';
            plusBtn.onclick = () => onUpdateQty(item.id, 1);
            
            controls.appendChild(minusBtn);
            controls.appendChild(qtySpan);
            controls.appendChild(plusBtn);

            topRow.appendChild(info);
            topRow.appendChild(controls);
            cartItemEl.appendChild(topRow);

            // Si es un plato de comida (no bebida), renderizar menú desplegable de opciones
            if (!item.isBeverage) {
                // Resumen compacto
                const ensaladaLabel = item.ensalada === 'no' ? 'Sin ensalada' : 'Con ensalada';
                const papaLabel = item.tipoPapa === 'hilo' ? 'Al Hilo' : (item.tipoPapa === 'mixta' ? 'Mixta' : 'Fritas');
                const cremasPedStr = (item.cremasEnPedido && item.cremasEnPedido.length > 0) ? item.cremasEnPedido.join(', ') : 'Ninguna';
                const cremasApartStr = (item.cremasAparte && item.cremasAparte.length > 0) ? item.cremasAparte.join(', ') : 'Ninguna';
                const extrasList = (item.extras && item.extras.length > 0)
                    ? ' • +' + item.extras.map(e => `${e.name} (+S/ ${Number(e.price).toFixed(2)})`).join(', ')
                    : '';
                const notaStr = item.instrucciones ? ` • ✏️ ${item.instrucciones}` : '';

                const summaryEl = document.createElement('div');
                summaryEl.className = 'item-custom-summary';
                summaryEl.innerHTML = `🥗 <strong>${ensaladaLabel}</strong> | 🥔 <strong>Papa:</strong> ${papaLabel} | 🥪 <strong>En pedido:</strong> ${cremasPedStr} | 🥡 <strong>Aparte:</strong> ${cremasApartStr}${extrasList}${notaStr}`;
                cartItemEl.appendChild(summaryEl);

                // Botón Desplegable para Modificar / Ver Opciones
                const toggleBtn = document.createElement('button');
                toggleBtn.type = 'button';
                toggleBtn.className = `btn-toggle-custom ${item.isExpanded ? 'open' : ''}`;
                const toggleLabel = item.allowsPotatoChoice
                    ? '⚙️ Personalizar (Ensalada, Papas, Cremas y Extras)'
                    : '⚙️ Personalizar (Ensalada, Cremas y Extras)';
                toggleBtn.innerHTML = `
                    <span>${toggleLabel}</span>
                    <span class="chevron">${item.isExpanded ? '▲ Ocultar' : '▼ Opciones'}</span>
                `;
                toggleBtn.onclick = () => {
                    if (onCustomAction) onCustomAction('toggleExpanded', item.id);
                };
                cartItemEl.appendChild(toggleBtn);

                // Panel Acordeón
                const accordion = document.createElement('div');
                accordion.className = `item-custom-accordion ${item.isExpanded ? 'expanded' : ''}`;

                // 1. Selector de Ensalada (Sí / No)
                const ensaladaRow = document.createElement('div');
                ensaladaRow.className = 'options-segment-row';
                ensaladaRow.innerHTML = `
                    <span class="options-segment-label">🥗 Ensalada:</span>
                    <div class="options-segment-group">
                        <button type="button" class="segment-btn ${item.ensalada !== 'no' ? 'active' : ''}" data-val="si">SÍ</button>
                        <button type="button" class="segment-btn ${item.ensalada === 'no' ? 'active' : ''}" data-val="no">NO</button>
                    </div>
                `;
                ensaladaRow.querySelectorAll('.segment-btn').forEach(btn => {
                    btn.onclick = () => {
                        if (onCustomAction) onCustomAction('setEnsalada', item.id, btn.dataset.val);
                    };
                });
                accordion.appendChild(ensaladaRow);

                // 2. Selector de Tipo de Papa (Solo para Sándwiches / Hamburguesas / Filetes / Chorizos)
                if (item.allowsPotatoChoice) {
                    const papaRow = document.createElement('div');
                    papaRow.className = 'options-segment-row';
                    papaRow.innerHTML = `
                        <span class="options-segment-label">🥔 Tipo de Papa:</span>
                        <div class="options-segment-group">
                            <button type="button" class="segment-btn ${(!item.tipoPapa || item.tipoPapa === 'fritas') ? 'active' : ''}" data-tipo="fritas">🍟 Fritas</button>
                            <button type="button" class="segment-btn ${item.tipoPapa === 'hilo' ? 'active' : ''}" data-tipo="hilo">🥔 Al Hilo</button>
                            <button type="button" class="segment-btn ${item.tipoPapa === 'mixta' ? 'active' : ''}" data-tipo="mixta">🔄 Mixta</button>
                        </div>
                    `;
                    papaRow.querySelectorAll('.segment-btn').forEach(btn => {
                        btn.onclick = () => {
                            if (onCustomAction) onCustomAction('setTipoPapa', item.id, btn.dataset.tipo);
                        };
                    });
                    accordion.appendChild(papaRow);
                }

                // 3. Sección Adicionales con costo
                const extrasSection = document.createElement('div');
                extrasSection.innerHTML = `<div class="custom-block-title" style="margin-top: 0.35rem;">🧀 Adicionales con costo:</div>`;
                const extrasGrid = document.createElement('div');
                extrasGrid.className = 'extras-chips-grid';

                AVAILABLE_EXTRAS.forEach(ex => {
                    const isSelected = (item.extras || []).some(e => e.id === ex.id);
                    const chip = document.createElement('div');
                    chip.className = `extra-chip ${isSelected ? 'active' : ''}`;
                    chip.innerHTML = `<span>${isSelected ? '✓ ' : '+ '}${ex.name}</span> <span class="extra-chip-price">+S/ ${ex.price.toFixed(2)}</span>`;
                    chip.onclick = () => {
                        if (onCustomAction) onCustomAction('toggleExtra', item.id, ex.id);
                    };
                    extrasGrid.appendChild(chip);
                });
                extrasSection.appendChild(extrasGrid);
                accordion.appendChild(extrasSection);

                // 4. Cremas en el Pedido (dentro del plato)
                const allPedido = (item.cremasEnPedido || []).length === AVAILABLE_CREMAS.length;
                const cremasPedidoBlock = document.createElement('div');
                cremasPedidoBlock.className = 'cremas-sub-block';
                cremasPedidoBlock.innerHTML = `
                    <div class="cremas-sub-header">
                        <span class="cremas-sub-title">🥪 Cremas en el pedido:</span>
                        <button type="button" class="btn-quick-all">${allPedido ? 'Quitar todas' : 'Todas'}</button>
                    </div>
                `;
                cremasPedidoBlock.querySelector('.btn-quick-all').onclick = () => {
                    if (onCustomAction) onCustomAction('setAllCremasEnPedido', item.id);
                };

                const gridPedido = document.createElement('div');
                gridPedido.className = 'cremas-chips-grid';
                AVAILABLE_CREMAS.forEach(c => {
                    const isSel = (item.cremasEnPedido || []).includes(c.name);
                    const chip = document.createElement('div');
                    chip.className = `crema-chip ${isSel ? 'active' : ''}`;
                    chip.textContent = `${isSel ? '✓ ' : ''}${c.name}`;
                    chip.onclick = () => {
                        if (onCustomAction) onCustomAction('toggleCremaEnPedido', item.id, c.name);
                    };
                    gridPedido.appendChild(chip);
                });
                cremasPedidoBlock.appendChild(gridPedido);
                accordion.appendChild(cremasPedidoBlock);

                // 5. Cremas Aparte (para llevar aparte)
                const allAparte = (item.cremasAparte || []).length === AVAILABLE_CREMAS.length;
                const cremasAparteBlock = document.createElement('div');
                cremasAparteBlock.className = 'cremas-sub-block';
                cremasAparteBlock.innerHTML = `
                    <div class="cremas-sub-header">
                        <span class="cremas-sub-title">🥡 Cremas aparte:</span>
                        <button type="button" class="btn-quick-all">${allAparte ? 'Quitar todas' : 'Todas'}</button>
                    </div>
                `;
                cremasAparteBlock.querySelector('.btn-quick-all').onclick = () => {
                    if (onCustomAction) onCustomAction('setAllCremasAparte', item.id);
                };

                const gridAparte = document.createElement('div');
                gridAparte.className = 'cremas-chips-grid';
                AVAILABLE_CREMAS.forEach(c => {
                    const isSel = (item.cremasAparte || []).includes(c.name);
                    const chip = document.createElement('div');
                    chip.className = `crema-chip ${isSel ? 'active-aparte' : ''}`;
                    chip.textContent = `${isSel ? '✓ ' : ''}${c.name}`;
                    chip.onclick = () => {
                        if (onCustomAction) onCustomAction('toggleCremaAparte', item.id, c.name);
                    };
                    gridAparte.appendChild(chip);
                });
                cremasAparteBlock.appendChild(gridAparte);
                accordion.appendChild(cremasAparteBlock);

                // 6. Campo de detalles específicos por plato
                const notesBlock = document.createElement('div');
                notesBlock.className = 'item-specific-notes-wrapper';
                notesBlock.innerHTML = `
                    <div class="custom-block-title" style="margin-top: 0.35rem;">✏️ Detalles para este plato:</div>
                    <input type="text" class="item-notes-input" placeholder="Ej: poco aceite, bien frito, poca papa..." value="${item.instrucciones || ''}">
                `;
                const notesInput = notesBlock.querySelector('.item-notes-input');
                notesInput.onchange = (e) => {
                    if (onCustomAction) onCustomAction('setInstrucciones', item.id, e.target.value.trim());
                };
                notesInput.onblur = (e) => {
                    if (onCustomAction) onCustomAction('setInstrucciones', item.id, e.target.value.trim());
                };
                accordion.appendChild(notesBlock);

                cartItemEl.appendChild(accordion);
            }

            cartItemsContainer.appendChild(cartItemEl);
        });
    }

    cartBadge.textContent = totals.totalItems;
    cartTotalPrice.textContent = `S/ ${totals.totalPrice.toFixed(2)}`;
    
    if (totals.totalItems > 0) {
        cartBadge.style.display = 'flex';
    } else {
        cartBadge.style.display = 'none';
    }
}

export function getCustomerFormData() {
    const activeTab = orderTypeTabs?.querySelector('.tab-btn.active');
    const orderType = activeTab?.dataset.type || 'A Enviar'; // 'A Enviar' o 'A Recoger'
    
    const name = customerNameInput?.value.trim() || '';
    const phone = customerPhoneInput?.value.trim() || '';
    const address = customerAddressInput?.value.trim() || '';
    const building = customerBuildingInput?.value.trim() || '';
    const notes = customerNotesInput?.value.trim() || '';
    
    const paymentRadio = document.querySelector('input[name="payment-method"]:checked');
    const paymentMethod = paymentRadio ? paymentRadio.value : 'efectivo';

    return {
        orderType,
        name,
        phone,
        address,
        building,
        paymentMethod,
        notes,
        isTestOrder: isTestMode()
    };
}

// Modal de Doble Confirmación
export function showConfirmOrderModal(customer, items, totals) {
    if (!confirmSummaryBox) return;

    const paymentLabels = {
        'efectivo': '💵 Efectivo',
        'yape': '🟣 Yape',
        'plin': '🔵 Plin',
        'tarjeta': '💳 Tarjeta'
    };
    const paymentText = paymentLabels[customer.paymentMethod] || '💵 Efectivo';
    const notesText = customer.notes ? customer.notes : 'Sin observaciones especiales';

    let deliveryHtml = '';
    if (customer.orderType === 'A Enviar') {
        const buildingHtml = customer.building 
            ? `<div class="summary-data-row">
                 <span class="data-label">🏢 Torre / Dpto:</span>
                 <span class="data-val font-bold">${customer.building}</span>
               </div>` 
            : '';

        deliveryHtml = `
            <div class="summary-data-row">
                <span class="data-label">📍 Modalidad:</span>
                <span class="data-val badge-delivery">🛵 A Enviar (Delivery)</span>
            </div>
            <div class="summary-data-row">
                <span class="data-label">👤 Cliente:</span>
                <span class="data-val font-bold">${customer.name}</span>
            </div>
            <div class="summary-data-row">
                <span class="data-label">📞 Celular:</span>
                <span class="data-val font-bold">${customer.phone}</span>
            </div>
            <div class="summary-data-row">
                <span class="data-label">🏠 Dirección:</span>
                <span class="data-val address-text">${customer.address}</span>
            </div>
            ${buildingHtml}
        `;
    } else {
        deliveryHtml = `
            <div class="summary-data-row">
                <span class="data-label">📍 Modalidad:</span>
                <span class="data-val badge-pickup">🛍️ A Recoger en Local</span>
            </div>
            <div class="summary-data-row">
                <span class="data-label">👤 Cliente:</span>
                <span class="data-val font-bold">${customer.name}</span>
            </div>
        `;
    }

    const itemsRows = items.map(it => {
        let specsHtml = '';
        if (!it.isBeverage) {
            const ensaladaBadge = it.ensalada === 'no' ? '❌ Sin ensalada' : '🥗 Con ensalada';
            const papaMap = { 'fritas': '🍟 Papas fritas', 'hilo': '🥔 Papas al hilo', 'mixta': '🔄 Papas mixtas' };
            const papaBadge = it.allowsPotatoChoice ? ` • ${papaMap[it.tipoPapa] || '🍟 Papas fritas'}` : '';

            const pedCremas = (it.cremasEnPedido && it.cremasEnPedido.length > 0)
                ? it.cremasEnPedido.join(', ')
                : 'Sin cremas';
            const aparteCremas = (it.cremasAparte && it.cremasAparte.length > 0)
                ? `<div class="sub-spec">🥡 <strong>Aparte:</strong> ${it.cremasAparte.join(', ')}</div>`
                : '';

            const extrasText = (it.extras && it.extras.length > 0)
                ? `<div class="sub-spec">🧀 <strong>Adicionales:</strong> +${it.extras.map(e => e.name).join(', ')}</div>`
                : '';

            const notesText = (it.instrucciones && it.instrucciones.trim())
                ? `<div class="summary-item-inst">✏️ "${it.instrucciones.trim()}"</div>`
                : '';

            specsHtml = `
                <div class="summary-item-specs">
                    <div class="sub-spec">${ensaladaBadge}${papaBadge}</div>
                    <div class="sub-spec">🥪 <strong>En pedido:</strong> ${pedCremas}</div>
                    ${aparteCremas}
                    ${extrasText}
                    ${notesText}
                </div>
            `;
        }

        return `
        <div class="summary-item-row">
            <div class="summary-item-col-left">
                <span class="summary-item-qty">${it.qty}x</span>
                <div class="summary-item-details">
                    <span class="summary-item-title">${it.name}</span>
                    ${specsHtml}
                </div>
            </div>
            <span class="summary-item-col-price">S/ ${(it.price * it.qty).toFixed(2)}</span>
        </div>
        `;
    }).join('');

    confirmSummaryBox.innerHTML = `
        <div class="summary-info-card">
            ${deliveryHtml}
            <div class="summary-data-row">
                <span class="data-label">💳 Método de Pago:</span>
                <span class="data-val">${paymentText}</span>
            </div>
            <div class="summary-data-row">
                <span class="data-label">📝 Observaciones:</span>
                <span class="data-val notes-italic">${notesText}</span>
            </div>
        </div>

        <div class="summary-items-header">Detalle del Pedido:</div>
        <div class="summary-items-container">
            ${itemsRows}
        </div>

        <div class="summary-total-box">
            <span>Total a Pagar:</span>
            <span class="summary-total-num">S/ ${totals.totalPrice.toFixed(2)}</span>
        </div>
    `;

    confirmOrderModal.classList.add('active');
}

export function hideConfirmOrderModal() {
    if (confirmOrderModal) {
        confirmOrderModal.classList.remove('active');
    }
}

export function scrollToCategory(id) {
    const el = document.getElementById(id);
    if (el) {
        const headerOffset = 135;
        const elementPosition = el.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      
        window.scrollTo({
             top: offsetPosition,
             behavior: "smooth"
        });
    }
}

export function toggleCart() {
    cartSidebar.classList.toggle('active');
    cartOverlay.classList.toggle('active');
}

export function animateCartButton() {
    floatingCartBtn.style.transform = 'scale(1.25)';
    setTimeout(() => {
        floatingCartBtn.style.transform = 'scale(1)';
    }, 200);
}

let lastReceiptInfo = null;

export function showSuccessModal(receiptNumber, customer, items, totals) {
    const timeEstimate = document.getElementById('modal-time-estimate');
    const isDelivery = customer?.orderType === 'A Enviar';
    lastReceiptInfo = { receiptNumber, customer, items, totals };

    if (timeEstimate) {
        if (isDelivery) {
            timeEstimate.innerHTML = `Su pedido ya fue enviado, en base a ello en unos <strong>20 minutos aproximadamente</strong> estará listo para ser enviado a su dirección.`;
        } else {
            timeEstimate.innerHTML = `Su pedido ya fue enviado, en base a ello en unos <strong>20 minutos aproximadamente</strong> estará listo para que pueda pasar a recogerlo.`;
        }
    }

    if (printOrderBtn) {
        if (isTestMode() || customer?.isTestOrder) {
            printOrderBtn.style.display = 'flex';
        } else {
            printOrderBtn.style.display = 'none';
        }
    }

    successModal.classList.add('active');
}

export function hideSuccessModal() {
    successModal.classList.remove('active');
}

// Imprimir comanda de prueba en formato de ticket térmico
export function printThermalTicket(info) {
    const data = info || lastReceiptInfo;
    if (!data) return;

    const receiptNum = data.receiptNumber || 'WEB-TEST';
    const cust = data.customer || {};
    const items = data.items || [];
    const total = (data.totals && data.totals.totalPrice) || 0;
    const now = new Date();
    const dateStr = now.toLocaleDateString('es-PE') + ' ' + now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

    let itemsHtml = '';
    items.forEach(it => {
        let specs = '';
        if (!it.isBeverage) {
            const ensText = it.ensalada === 'no' ? 'NO ENSALADA' : 'CON ENSALADA';
            const papaMap = { 'fritas': 'PAPAS FRITAS', 'hilo': 'PAPAS AL HILO', 'mixta': 'PAPAS MIXTAS' };
            const papaPart = it.allowsPotatoChoice ? ` | ${papaMap[it.tipoPapa] || 'PAPAS FRITAS'}` : '';
            const cremasPed = (it.cremasEnPedido && it.cremasEnPedido.length > 0) ? it.cremasEnPedido.join(', ') : 'SIN CREMAS';
            const cremasAp = (it.cremasAparte && it.cremasAparte.length > 0) ? `<div>* APARTE: ${it.cremasAparte.join(', ')}</div>` : '';
            const extras = (it.extras && it.extras.length > 0) ? `<div>* +ADIC: ${it.extras.map(e => e.name).join(', ')}</div>` : '';
            const inst = (it.instrucciones && it.instrucciones.trim()) ? `<div style="font-weight: bold; background: #eee; padding: 2px 4px; margin-top: 2px;">* NOTA: ${it.instrucciones.trim().toUpperCase()}</div>` : '';

            specs = `
                <div style="font-size: 11px; padding-left: 8px; color: #222; margin-bottom: 4px;">
                    <div>* ${ensText}${papaPart}</div>
                    <div>* EN PEDIDO: ${cremasPed}</div>
                    ${cremasAp}
                    ${extras}
                    ${inst}
                </div>
            `;
        }
        itemsHtml += `
            <div style="display: flex; justify-content: space-between; font-weight: bold; margin-top: 5px;">
                <span>${it.qty}x ${it.name}</span>
                <span>S/ ${(it.price * it.qty).toFixed(2)}</span>
            </div>
            ${specs}
        `;
    });

    const isDelivery = cust.orderType === 'A Enviar';
    const printWindow = window.open('', '_blank', 'width=380,height=600');
    if (!printWindow) {
        alert('Por favor permite abrir ventanas emergentes para imprimir la comanda.');
        return;
    }

    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Comanda #${receiptNum} - Micho Burguer</title>
            <style>
                @page { size: 80mm auto; margin: 0; }
                body {
                    font-family: 'Courier New', Courier, monospace;
                    font-size: 12px;
                    line-height: 1.35;
                    width: 76mm;
                    margin: 0 auto;
                    padding: 8px 4px;
                    color: #000;
                }
                .text-center { text-align: center; }
                .divider { border-top: 1px dashed #000; margin: 6px 0; }
                .double-divider { border-top: 2px solid #000; margin: 8px 0; }
                .bold { font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="text-center bold" style="font-size: 16px;">🍔 MICHO BURGUER 🍗</div>
            <div class="text-center" style="font-size: 11px;">El sabor que te encanta</div>
            <div class="text-center bold" style="font-size: 11px; margin-top: 3px;">*** COMANDA DE PRUEBA ***</div>
            <div class="double-divider"></div>
            <div><span class="bold">Ticket Loyverse:</span> #${receiptNum}</div>
            <div><span class="bold">Fecha:</span> ${dateStr}</div>
            <div><span class="bold">Tipo:</span> ${isDelivery ? '🛵 A ENVIAR (Delivery)' : '🛍️ A RECOGER'}</div>
            <div><span class="bold">Cliente:</span> ${cust.name || 'Cliente'}</div>
            ${cust.phone ? `<div><span class="bold">Celular:</span> ${cust.phone}</div>` : ''}
            ${isDelivery ? `<div><span class="bold">Dirección:</span> ${cust.address || ''} ${cust.building ? '(' + cust.building + ')' : ''}</div>` : ''}
            <div><span class="bold">Pago:</span> ${(cust.paymentMethod || 'Efectivo').toUpperCase()}</div>
            ${cust.notes ? `<div><span class="bold">Notas:</span> ${cust.notes}</div>` : ''}
            <div class="divider"></div>
            <div class="bold" style="font-size: 11px;">DETALLE DE PLATOS:</div>
            ${itemsHtml}
            <div class="double-divider"></div>
            <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: bold;">
                <span>TOTAL:</span>
                <span>S/ ${Number(total).toFixed(2)}</span>
            </div>
            <div class="divider"></div>
            <div class="text-center" style="font-size: 10px; margin-top: 10px;">
                ¡Comanda enviada a Loyverse y Telegram!<br>
                Micho Burguer
            </div>
            <script>
                window.onload = function() {
                    window.print();
                };
            <\/script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

// Memoria en el dispositivo del cliente (localStorage)
const STORAGE_KEY = 'micho_burguer_saved_customer_data';

export function saveCustomerData(customer) {
    try {
        const toSave = {
            name: customer.name || '',
            phone: customer.phone || '',
            address: customer.address || '',
            building: customer.building || '',
            orderType: customer.orderType || 'A Enviar',
            paymentMethod: customer.paymentMethod || 'efectivo'
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (e) {
        console.warn('No se pudo guardar en localStorage:', e);
    }
}

export function restoreCustomerData() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const saved = JSON.parse(raw);

        if (saved.name && customerNameInput) {
            customerNameInput.value = saved.name;
        }
        if (saved.phone && customerPhoneInput) {
            customerPhoneInput.value = saved.phone;
        }
        if (saved.address && customerAddressInput) {
            customerAddressInput.value = saved.address;
        }
        if (saved.building && customerBuildingInput) {
            customerBuildingInput.value = saved.building;
        }

        if (saved.orderType) {
            const tab = orderTypeTabs?.querySelector(`[data-type="${saved.orderType}"]`);
            if (tab) tab.click();
        }

        if (saved.paymentMethod) {
            const radio = document.querySelector(`input[name="payment-method"][value="${saved.paymentMethod}"]`);
            if (radio) radio.checked = true;
        }
    } catch (e) {
        console.warn('Error al restaurar datos del cliente:', e);
    }
}

