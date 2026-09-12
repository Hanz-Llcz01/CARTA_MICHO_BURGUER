export let cart = {};

export function addToCart(id, name, price, variantId) {
    if (cart[id]) {
        cart[id].qty += 1;
    } else {
        cart[id] = { name, price, variant_id: variantId, qty: 1 };
    }
    return getCartTotals();
}

export function updateQty(id, delta) {
    if (cart[id]) {
        cart[id].qty += delta;
        if (cart[id].qty <= 0) {
            delete cart[id];
        }
    }
    return getCartTotals();
}

export function getCartItems() {
    return Object.keys(cart).map(id => ({
        id,
        ...cart[id]
    }));
}

export function clearCart() {
    cart = {};
}

export function getCartTotals() {
    let totalItems = 0;
    let totalPrice = 0;
    
    Object.keys(cart).forEach(id => {
        totalItems += cart[id].qty;
        totalPrice += cart[id].price * cart[id].qty;
    });
    
    return { totalItems, totalPrice };
}
