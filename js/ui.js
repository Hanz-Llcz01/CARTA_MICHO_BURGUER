import { menuData } from './data.js';

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
export const tableGroup = document.getElementById('table-group');
export const customerTableInput = document.getElementById('customer-table');
export const customerNameInput = document.getElementById('customer-name');
export const customerNotesInput = document.getElementById('customer-notes');
export const currentTypeTag = document.getElementById('current-type-tag');

export function renderNavigation(onCategoryClick) {
    categoryNav.innerHTML = '';
    menuData.forEach((category, index) => {
        const btn = document.createElement('button');
        btn.className = `cat-btn ${index === 0 ? 'active' : ''}`;
        btn.textContent = category.name;
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
        catTitle.innerHTML = `<span>${category.name}</span>`;
        
        const productGrid = document.createElement('div');
        productGrid.className = 'product-grid';
        
        category.items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <div class="product-info">
                    <h3 class="product-name">${item.name}</h3>
                    <p class="product-desc">${item.desc}</p>
                    <div class="product-price">S/ ${item.price.toFixed(2)}</div>
                </div>
            `;
            
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

export function setupOrderTypeTabs() {
    if (!orderTypeTabs) return;
    const tabButtons = orderTypeTabs.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const type = btn.dataset.type;

            if (currentTypeTag) {
                currentTypeTag.textContent = type === 'Mesa' ? 'En Mesa' : 'Para Llevar';
            }

            if (type === 'Para Llevar') {
                if (tableGroup) tableGroup.style.display = 'none';
            } else {
                if (tableGroup) tableGroup.style.display = 'block';
            }
        });
    });
}

export function updateCartUI(cartItems, totals, onUpdateQty) {
    cartItemsContainer.innerHTML = '';
    const customerForm = document.getElementById('cart-customer-form');
    
    if (cartItems.length === 0) {
        cartItemsContainer.innerHTML = '<div class="empty-cart-msg">Tu comanda está vacía.<br>Selecciona productos de la carta para empezar.</div>';
        checkoutBtn.disabled = true;
        if (customerForm) customerForm.style.display = 'none';
    } else {
        checkoutBtn.disabled = false;
        if (customerForm) customerForm.style.display = 'block';

        cartItems.forEach(item => {
            const cartItemEl = document.createElement('div');
            cartItemEl.className = 'cart-item';
            
            cartItemEl.innerHTML = `
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">S/ ${(item.price * item.qty).toFixed(2)}</div>
                </div>
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
            
            cartItemEl.appendChild(controls);
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
    const orderType = activeTab?.dataset.type || 'Mesa';
    
    const table = orderType === 'Mesa' 
        ? (customerTableInput?.value.trim() || 'Mesa 1') 
        : 'Para Llevar';
        
    const name = customerNameInput?.value.trim() || 'Cliente';
    const notes = customerNotesInput?.value.trim() || '';
    
    const paymentRadio = document.querySelector('input[name="payment-method"]:checked');
    const paymentMethod = paymentRadio ? paymentRadio.value : 'efectivo';

    return {
        orderType,
        table,
        name,
        paymentMethod,
        notes
    };
}

export function scrollToCategory(id) {
    const el = document.getElementById(id);
    if (el) {
        const headerOffset = 110;
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

export function showSuccessModal(receiptNumber, orderTitle) {
    const badge = document.getElementById('modal-receipt-badge');
    const summary = document.getElementById('modal-order-summary');
    
    if (badge && receiptNumber) {
        badge.textContent = `Comanda #${receiptNumber}`;
    }
    if (summary && orderTitle) {
        summary.textContent = `Orden recibida para: ${orderTitle}`;
    }
    successModal.classList.add('active');
}

export function hideSuccessModal() {
    successModal.classList.remove('active');
}
