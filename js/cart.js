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

export function isSandwich(id) {
    if (!id) return false;
    // Sándwiches que permiten elegir tipo de papa: Hamburguesas (h), Pollo Deshilachado (pd), Filetes (f), Chorizos (c)
    return id.startsWith('h') || id.startsWith('pd') || id.startsWith('f') || id.startsWith('c');
}

export function getItemUnitPrice(item) {
    if (!item) return 0;
    const base = Number(item.basePrice) || Number(item.price) || 0;
    const extrasSum = (item.extras || []).reduce((acc, ex) => acc + (Number(ex.price) || 0), 0);
    return base + extrasSum;
}

export function addToCart(id, name, price, variantId) {
    const isBeverage = id === 'ex9' || id === 'ex10' || name.toLowerCase().includes('gaseosa') || name.toLowerCase().includes('kola');
    const allowsPotatoChoice = isSandwich(id);

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
            allowsPotatoChoice,
            ensalada: 'si', // 'si' o 'no'
            tipoPapa: 'fritas', // 'fritas', 'hilo', 'mixta'
            extras: [],
            cremasEnPedido: isBeverage ? [] : ['MAY', 'KET'], // Cremas dentro del plato
            cremasAparte: isBeverage ? [] : [], // Cremas aparte
            instrucciones: '',
            isExpanded: !isBeverage
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

export function setEnsalada(id, value) {
    const item = cart[id];
    if (!item || item.isBeverage) return getCartTotals();

    item.ensalada = value === 'no' ? 'no' : 'si';
    return getCartTotals();
}

export function setTipoPapa(id, tipo) {
    const item = cart[id];
    if (!item || item.isBeverage || !item.allowsPotatoChoice) return getCartTotals();

    if (['fritas', 'hilo', 'mixta'].includes(tipo)) {
        item.tipoPapa = tipo;
    }
    return getCartTotals();
}

export function toggleCremaEnPedido(id, cremaName) {
    const item = cart[id];
    if (!item || item.isBeverage) return getCartTotals();

    if (!Array.isArray(item.cremasEnPedido)) item.cremasEnPedido = [];
    const index = item.cremasEnPedido.indexOf(cremaName);
    if (index > -1) {
        item.cremasEnPedido.splice(index, 1);
    } else {
        item.cremasEnPedido.push(cremaName);
    }
    return getCartTotals();
}

export function toggleCremaAparte(id, cremaName) {
    const item = cart[id];
    if (!item || item.isBeverage) return getCartTotals();

    if (!Array.isArray(item.cremasAparte)) item.cremasAparte = [];
    const index = item.cremasAparte.indexOf(cremaName);
    if (index > -1) {
        item.cremasAparte.splice(index, 1);
    } else {
        item.cremasAparte.push(cremaName);
    }
    return getCartTotals();
}

export function setAllCremasEnPedido(id) {
    const item = cart[id];
    if (!item || item.isBeverage) return getCartTotals();

    const allNames = AVAILABLE_CREMAS.map(c => c.name);
    if ((item.cremasEnPedido || []).length === allNames.length) {
        item.cremasEnPedido = [];
    } else {
        item.cremasEnPedido = [...allNames];
    }
    return getCartTotals();
}

export function setAllCremasAparte(id) {
    const item = cart[id];
    if (!item || item.isBeverage) return getCartTotals();

    const allNames = AVAILABLE_CREMAS.map(c => c.name);
    if ((item.cremasAparte || []).length === allNames.length) {
        item.cremasAparte = [];
    } else {
        item.cremasAparte = [...allNames];
    }
    return getCartTotals();
}

export function setInstrucciones(id, text) {
    const item = cart[id];
    if (!item) return getCartTotals();

    item.instrucciones = text || '';
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
