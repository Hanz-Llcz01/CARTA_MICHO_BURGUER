export let cart = {};

export const AVAILABLE_EXTRAS = [
    { id: 'queso', name: 'Queso', price: 1.00 },
    { id: 'jamon', name: 'Jamón', price: 1.00 },
    { id: 'huevo', name: 'Huevo', price: 1.50 },
    { id: 'tocino', name: 'Tocino', price: 2.00 }
];

export const AVAILABLE_CREMAS = [
    { id: 'may', name: 'MAYONESA', label: 'Mayonesa' },
    { id: 'ket', name: 'KETCHUT', label: 'Kétchut' },
    { id: 'mostaza', name: 'MOSTAZA', label: 'Mostaza' },
    { id: 'golf', name: 'GOLF', label: 'Salsa Golf' },
    { id: 'tartara', name: 'TÁRTARA', label: 'Tártara' },
    { id: 'aji', name: 'AJÍ', label: 'Ají' }
];

export function isSandwich(id) {
    if (!id) return false;
    const baseId = String(id).split('_')[0];
    // Sándwiches que permiten elegir tipo de papa: Hamburguesas (h), Pollo Deshilachado (pd), Filetes (f), Crispy (cr), Chorizos (c)
    return baseId.startsWith('h') || baseId.startsWith('pd') || baseId.startsWith('f') || baseId.startsWith('cr') || baseId.startsWith('c');
}

export function getItemUnitPrice(item) {
    if (!item) return 0;
    const base = Number(item.basePrice) || Number(item.price) || 0;
    const extrasSum = (item.extras || []).reduce((acc, ex) => acc + (Number(ex.price) || 0), 0);
    return base + extrasSum;
}

export function addToCart(id, name, price, variantId) {
    const isBeverage = id === 'ex9' || id === 'ex10' || name.toLowerCase().includes('gaseosa') || name.toLowerCase().includes('kola') || name.toLowerCase().includes('coca');
    const allowsPotatoChoice = isSandwich(id);

    if (isBeverage) {
        if (cart[id]) {
            cart[id].qty += 1;
        } else {
            cart[id] = {
                id,
                productId: id,
                name,
                basePrice: Number(price),
                price: Number(price),
                variant_id: variantId,
                qty: 1,
                isBeverage: true,
                allowsPotatoChoice: false,
                ensalada: 'no',
                tipoPapa: 'fritas',
                extras: [],
                cremasEnPedido: [],
                cremasAparte: [],
                instrucciones: '',
                isExpanded: false
            };
        }
        cart[id].price = getItemUnitPrice(cart[id]);
        return getCartTotals();
    }

    // Para platos de comida, cada unidad agregada es un ítem independiente en el carrito
    // para permitir personalizaciones individuales (ensalada, papas, cremas, extras, notas)
    const cartItemId = `${id}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    cart[cartItemId] = {
        id: cartItemId,
        productId: id,
        name,
        basePrice: Number(price),
        price: Number(price),
        variant_id: variantId,
        qty: 1,
        isBeverage: false,
        allowsPotatoChoice,
        ensalada: 'si', // 'si' o 'no'
        tipoPapa: 'fritas', // 'fritas', 'hilo', 'mixta'
        extras: [],
        cremasEnPedido: [], // Por requerimiento: NO marcar cremas por defecto
        cremasAparte: [],
        instrucciones: '',
        isExpanded: false
    };
    
    // Recalcular precio unitario
    cart[cartItemId].price = getItemUnitPrice(cart[cartItemId]);
    return getCartTotals();
}

export function updateQty(id, delta) {
    const item = cart[id];
    if (!item) return getCartTotals();

    if (item.isBeverage) {
        item.qty += delta;
        if (item.qty <= 0) {
            delete cart[id];
        }
        return getCartTotals();
    }

    // Para platos de comida:
    if (delta > 0) {
        // Al duplicar el plato, se crea una copia como un nuevo ítem independiente
        const newCartItemId = `${item.productId || String(item.id).split('_')[0]}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        cart[newCartItemId] = {
            ...JSON.parse(JSON.stringify(item)),
            id: newCartItemId,
            qty: 1,
            isExpanded: false
        };
        cart[newCartItemId].price = getItemUnitPrice(cart[newCartItemId]);
    } else {
        // Al reducir, se elimina este plato específico de la comanda
        item.qty += delta;
        if (item.qty <= 0) {
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
