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

            // Si es un plato de comida (no bebida), renderizar menú desplegable de cremas y adicionales
            if (!item.isBeverage) {
                // Resumen compacto de cremas y adicionales
                const cremasList = (item.cremas && item.cremas.length > 0) ? item.cremas.join(', ') : 'Sin cremas';
                const modeLabel = item.cremasMode === 'aparte' ? 'Aparte' : 'En el pedido';
                const extrasList = (item.extras && item.extras.length > 0)
                    ? ' • +' + item.extras.map(e => `${e.name} (+S/ ${Number(e.price).toFixed(2)})`).join(', ')
                    : '';

                const summaryEl = document.createElement('div');
                summaryEl.className = 'item-custom-summary';
                summaryEl.innerHTML = `🥫 <strong>Cremas (${modeLabel}):</strong> ${cremasList}${extrasList}`;
                cartItemEl.appendChild(summaryEl);

                // Botón Desplegable para Modificar / Ver Opciones
                const toggleBtn = document.createElement('button');
                toggleBtn.type = 'button';
                toggleBtn.className = `btn-toggle-custom ${item.isExpanded ? 'open' : ''}`;
                toggleBtn.innerHTML = `
                    <span>⚙️ Personalizar (Cremas y Adicionales)</span>
                    <span class="chevron">${item.isExpanded ? '▲ Ocultar' : '▼ Opciones'}</span>
                `;
                toggleBtn.onclick = () => {
                    if (onCustomAction) onCustomAction('toggleExpanded', item.id);
                };
                cartItemEl.appendChild(toggleBtn);

                // Panel Acordeón
                const accordion = document.createElement('div');
                accordion.className = `item-custom-accordion ${item.isExpanded ? 'expanded' : ''}`;

                // 1. Sección Adicionales con costo
                const extrasSection = document.createElement('div');
                extrasSection.innerHTML = `<div class="custom-block-title">🧀 Adicionales con costo:</div>`;
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

                // 2. Sección Cremas
                const cremasSection = document.createElement('div');
                const allSelected = (item.cremas || []).length === AVAILABLE_CREMAS.length;
                cremasSection.innerHTML = `
                    <div class="custom-block-header">
                        <div class="custom-block-title" style="margin-bottom: 0;">🥫 Cremas:</div>
                        <button type="button" class="btn-quick-all">${allSelected ? 'Quitar todas' : 'Todas las cremas'}</button>
                    </div>
                    <div class="cremas-mode-toggle">
                        <button type="button" class="mode-toggle-btn ${item.cremasMode === 'en_pedido' ? 'active' : ''}">🥪 En el pedido</button>
                        <button type="button" class="mode-toggle-btn ${item.cremasMode === 'aparte' ? 'active' : ''}">🥡 Llevar aparte</button>
                    </div>
                `;

                const quickAllBtn = cremasSection.querySelector('.btn-quick-all');
                quickAllBtn.onclick = () => {
                    if (onCustomAction) onCustomAction('setAllCremas', item.id);
                };

                const modeBtns = cremasSection.querySelectorAll('.mode-toggle-btn');
                modeBtns[0].onclick = () => {
                    if (onCustomAction) onCustomAction('setCremasMode', item.id, 'en_pedido');
                };
                modeBtns[1].onclick = () => {
                    if (onCustomAction) onCustomAction('setCremasMode', item.id, 'aparte');
                };

                const cremasGrid = document.createElement('div');
                cremasGrid.className = 'cremas-chips-grid';

                AVAILABLE_CREMAS.forEach(c => {
                    const isCremaSelected = (item.cremas || []).includes(c.name);
                    const chip = document.createElement('div');
                    chip.className = `crema-chip ${isCremaSelected ? 'active' : ''}`;
                    chip.textContent = `${isCremaSelected ? '✓ ' : ''}${c.name}`;
                    chip.onclick = () => {
                        if (onCustomAction) onCustomAction('toggleCrema', item.id, c.name);
                    };
                    cremasGrid.appendChild(chip);
                });

                cremasSection.appendChild(cremasGrid);
                accordion.appendChild(cremasSection);

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
            const cremasText = (it.cremas && it.cremas.length > 0)
                ? `Cremas: ${it.cremas.join(', ')} (${it.cremasMode === 'aparte' ? 'Aparte' : 'En el pedido'})`
                : 'Sin cremas';
            const extrasText = (it.extras && it.extras.length > 0)
                ? ` • Adicionales: +${it.extras.map(e => e.name).join(', ')}`
                : '';
            specsHtml = `<div class="summary-item-specs">🥫 ${cremasText}${extrasText}</div>`;
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

export function showSuccessModal(receiptNumber, customer) {
    const timeEstimate = document.getElementById('modal-time-estimate');
    const isDelivery = customer?.orderType === 'A Enviar';

    if (timeEstimate) {
        if (isDelivery) {
            timeEstimate.innerHTML = `Su pedido ya fue enviado, en base a ello en unos <strong>20 minutos aproximadamente</strong> estará listo para ser enviado a su dirección.`;
        } else {
            timeEstimate.innerHTML = `Su pedido ya fue enviado, en base a ello en unos <strong>20 minutos aproximadamente</strong> estará listo para que pueda pasar a recogerlo.`;
        }
    }

    successModal.classList.add('active');
}

export function hideSuccessModal() {
    successModal.classList.remove('active');
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

