export let cart = {};

export const AVAILABLE_EXTRAS = [
    { id: 'queso', name: 'Queso', price: 1.00 },
    { id: 'jamon', name: 'Jamón', price: 1.00 },
    { id: 'huevo', name: 'Huevo', price: 1.50 }
];

export const AVAILABLE_CREMAS = [
    { id: 'may', name: 'MAY', label: 'Mayonesa' },
    { id: 'ket', name: 'KET', label: 'Kétchup' },
    { id: 'mostaza', name: 'MOSTAZA', label: 'Mostaza' },
    { id: 'golf', name: 'GOLF', label: 'Salsa Golf' },
    { id: 'tartara', name: 'TÁRTARA', label: 'Tártara' },
    { id: 'aji', name: 'AJÍ', label: 'Ají' }
];

export function getItemUnitPrice(item) {
    if (!item) return 0;
    const base = Number(item.basePrice) || Number(item.price) || 0;
    const extrasSum = (item.extras || []).reduce((acc, ex) => acc + (Number(ex.price) || 0), 0);
    return base + extrasSum;
}

export function addToCart(id, name, price, variantId) {
    const isBeverage = id === 'ex9' || id === 'ex10' || name.toLowerCase().includes('gaseosa') || name.toLowerCase().includes('kola');

    if (cart[id]) {
        cart[id].qty += 1;
        cart[id].isExpanded = true;
    } else {
        cart[id] = {
            id,
            name,
            basePrice: Number(price),
            price: Number(price),
            variant_id: variantId,
            qty: 1,
            isBeverage,
            extras: [],
            cremas: isBeverage ? [] : ['MAY', 'KET', 'TÁRTARA'], // Cremas populares por defecto
            cremasMode: 'en_pedido', // 'en_pedido' o 'aparte'
            isExpanded: !isBeverage // Abre desplegable automáticamente en platos de comida
        };
    }
    
    // Recalcular precio unitario
    cart[id].price = getItemUnitPrice(cart[id]);
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

export function toggleExtra(id, extraId) {
    const item = cart[id];
    if (!item) return getCartTotals();

    const extraDef = AVAILABLE_EXTRAS.find(e => e.id === extraId);
    if (!extraDef) return getCartTotals();

    const existsIndex = item.extras.findIndex(e => e.id === extraId);
    if (existsIndex > -1) {
        item.extras.splice(existsIndex, 1);
    } else {
        item.extras.push({ id: extraDef.id, name: extraDef.name, price: extraDef.price });
    }

    item.price = getItemUnitPrice(item);
    return getCartTotals();
}

export function toggleCrema(id, cremaName) {
    const item = cart[id];
    if (!item || item.isBeverage) return getCartTotals();

    const index = item.cremas.indexOf(cremaName);
    if (index > -1) {
        item.cremas.splice(index, 1);
    } else {
        item.cremas.push(cremaName);
    }
    return getCartTotals();
}

export function setAllCremas(id) {
    const item = cart[id];
    if (!item || item.isBeverage) return getCartTotals();

    const allNames = AVAILABLE_CREMAS.map(c => c.name);
    if (item.cremas.length === allNames.length) {
        item.cremas = []; // Deseleccionar todas
    } else {
        item.cremas = [...allNames]; // Seleccionar todas
    }
    return getCartTotals();
}

export function setCremasMode(id, mode) {
    const item = cart[id];
    if (!item || item.isBeverage) return getCartTotals();

    item.cremasMode = mode === 'aparte' ? 'aparte' : 'en_pedido';
    return getCartTotals();
}

export function toggleItemExpanded(id) {
    if (cart[id]) {
        cart[id].isExpanded = !cart[id].isExpanded;
    }
    return getCartTotals();
}

export function getCartItems() {
    return Object.keys(cart).map(id => ({
        id,
        ...cart[id],
        unitPrice: getItemUnitPrice(cart[id]),
        itemTotal: getItemUnitPrice(cart[id]) * cart[id].qty
    }));
}

export function clearCart() {
    cart = {};
}

export function getCartTotals() {
    let totalItems = 0;
    let totalPrice = 0;
    
    Object.keys(cart).forEach(id => {
        const item = cart[id];
        totalItems += item.qty;
        totalPrice += getItemUnitPrice(item) * item.qty;
    });
    
    return { totalItems, totalPrice };
}
