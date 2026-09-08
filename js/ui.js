import { menuData } from './data.js';

// DOM Elements
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

export function renderNavigation(onCategoryClick) {
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
    menuData.forEach(category => {
        const catContainer = document.createElement('div');
        catContainer.className = 'menu-category';
        catContainer.id = category.id;
        
        const catTitle = document.createElement('h2');
        catTitle.className = 'category-title';
        catTitle.textContent = category.name;
        
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
            addBtn.textContent = '+';
            addBtn.onclick = () => onAddToCart(item.id, item.name, item.price);
            
            card.appendChild(addBtn);
            productGrid.appendChild(card);
        });
        
        catContainer.appendChild(catTitle);
        catContainer.appendChild(productGrid);
        menuSection.appendChild(catContainer);
    });
}

export function updateCartUI(cartItems, totals, onUpdateQty) {
    cartItemsContainer.innerHTML = '';
    
    if (cartItems.length === 0) {
        cartItemsContainer.innerHTML = '<div class="empty-cart-msg">Tu carrito está vacío</div>';
        checkoutBtn.disabled = true;
    } else {
        checkoutBtn.disabled = false;
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
    
    if(totals.totalItems > 0) {
        cartBadge.style.display = 'flex';
    } else {
        cartBadge.style.display = 'none';
    }
}

export function scrollToCategory(id) {
    const el = document.getElementById(id);
    if(el) {
        const headerOffset = 100;
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
    floatingCartBtn.style.transform = 'scale(1.2)';
    setTimeout(() => {
        floatingCartBtn.style.transform = 'scale(1)';
    }, 200);
}

export function showSuccessModal() {
    successModal.classList.add('active');
}

export function hideSuccessModal() {
    successModal.classList.remove('active');
}
