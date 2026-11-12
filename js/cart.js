import { findProductConfigById } from './data.js?v=20261102_4';

export let cart = {};

export let AVAILABLE_EXTRAS = [
    { id: 'queso', name: 'Queso', price: 1.00, variant_id: '9a66356e-1dda-43bf-b4ac-dd3fd4e04064', available: true },
    { id: 'jamon', name: 'Jamón', price: 1.00, variant_id: '3336e1cc-3dd8-4c73-862d-833194e7a006', available: true },
    { id: 'huevo', name: 'Huevo', price: 1.50, variant_id: 'd2eba247-bc3d-4dde-bd82-5b0939caab7b', available: true },
    { id: 'tocino', name: 'Tocino', price: 2.00, variant_id: '2bedb4bb-8709-4b3d-9eca-3ef50bb5cccb', available: true }
];

export let AVAILABLE_CREMAS = [
    { id: 'may', name: 'MAYONESA', label: 'Mayonesa', available: true },
    { id: 'ket', name: 'KETCHUT', label: 'Kétchut', available: true },
    { id: 'mostaza', name: 'MOSTAZA', label: 'Mostaza', available: true },
    { id: 'golf', name: 'GOLF', label: 'Salsa Golf', available: true },
    { id: 'tartara', name: 'TÁRTARA', label: 'Tártara', available: true },
    { id: 'aji', name: 'AJÍ', label: 'Ají', available: true },
    { id: 'aceituna', name: 'ACEITUNA', label: 'Aceituna', available: true }
];

const CANONICAL_CREMAS_ORDER = [
    'MAYONESA',
    'KETCHUT',
    'MOSTAZA',
    'GOLF',
    'TÁRTARA',
    'TARTARA',
    'AJÍ',
    'AJI',
    'ACEITUNA'
];

export function parseCremaAparteItem(raw) {
    const str = String(raw || '').trim();
    const match = str.match(/^(.*?)\s+x(\d+)$/i);
    if (match) {
        return {
            name: match[1].trim(),
            qty: Math.max(1, parseInt(match[2], 10) || 1)
        };
    }
    return { name: str, qty: str ? 1 : 0 };
}

export function formatCremaAparteItem(name, qty) {
    const q = Math.max(1, parseInt(qty, 10) || 1);
    return q > 1 ? `${name} x${q}` : name;
}

export function getCremaAparteQty(item, cremaName) {
    if (!item || !Array.isArray(item.cremasAparte)) return 0;
    const target = String(cremaName || '').toUpperCase().trim();
    for (const raw of item.cremasAparte) {
        const parsed = parseCremaAparteItem(raw);
        if (parsed.name.toUpperCase().trim() === target) {
            return parsed.qty;
        }
    }
    return 0;
}

export function sortCremasCanonical(list) {
    if (!Array.isArray(list) || list.length <= 1) return Array.isArray(list) ? [...list] : [];
    const configuredOrder = AVAILABLE_CREMAS.map(c => String(c.name || '').toUpperCase().trim());

    const getRank = (rawName) => {
        const parsed = parseCremaAparteItem(rawName);
        const up = String(parsed.name || '').toUpperCase().trim();
        if (up === 'MAYONESA') return 1;
        if (up === 'ACEITUNA') return 9999; // Siempre última si se coloca en el pedido
        const cfgIdx = configuredOrder.indexOf(up);
        if (cfgIdx !== -1) return 10 + cfgIdx;
        const canIdx = CANONICAL_CREMAS_ORDER.indexOf(up);
        if (canIdx !== -1) return 100 + canIdx;
        return 500;
    };

    return [...list].sort((a, b) => getRank(a) - getRank(b));
}

export function sortExtrasCanonical(list) {
    if (!Array.isArray(list) || list.length <= 1) return Array.isArray(list) ? [...list] : [];
    const configuredIds = AVAILABLE_EXTRAS.map(e => String(e.id || ''));
    return [...list].sort((a, b) => {
        const ia = configuredIds.indexOf(String(a?.id || ''));
        const ib = configuredIds.indexOf(String(b?.id || ''));
        return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });
}

export let SIDE_OPTIONS = {
    ensaladaAvailable: true,
    papaHiloAvailable: true
};

export function setExtrasAndCremas(newExtras, newCremas, cremasRule, sideOptions) {
    if (sideOptions && typeof sideOptions === 'object') {
        SIDE_OPTIONS = {
            ensaladaAvailable: sideOptions.ensaladaAvailable !== false,
            papaHiloAvailable: sideOptions.papaHiloAvailable !== false
        };
    }
    if (cremasRule && typeof cremasRule === 'object') {
        if (cremasRule.maxFree !== undefined && !Number.isNaN(Number(cremasRule.maxFree))) {
            MAX_FREE_CREMAS = Math.max(0, parseInt(cremasRule.maxFree, 10));
        }
        if (cremasRule.maxPerAparteFree !== undefined && !Number.isNaN(Number(cremasRule.maxPerAparteFree))) {
            MAX_FREE_PER_APARTE = Math.max(1, parseInt(cremasRule.maxPerAparteFree, 10));
        }
        if (cremasRule.extraPrice !== undefined && !Number.isNaN(Number(cremasRule.extraPrice))) {
            EXTRA_CREMA_PRICE = Math.max(0, Number(cremasRule.extraPrice));
        }
    }
    if (Array.isArray(newExtras) && newExtras.length > 0) {
        AVAILABLE_EXTRAS = newExtras.map(ex => ({
            ...ex,
            price: Number(ex.price) || 0,
            available: ex.available !== false
        }));
    }
    if (Array.isArray(newCremas) && newCremas.length > 0) {
        AVAILABLE_CREMAS = newCremas.map(c => ({
            ...c,
            available: c.available !== false
        }));
        AVAILABLE_CREMAS.sort((a, b) => {
            const ua = String(a.name || '').toUpperCase().trim();
            const ub = String(b.name || '').toUpperCase().trim();
            if (ua === 'MAYONESA' && ub !== 'MAYONESA') return -1;
            if (ub === 'MAYONESA' && ua !== 'MAYONESA') return 1;
            if (ua === 'ACEITUNA' && ub !== 'ACEITUNA') return 1;
            if (ub === 'ACEITUNA' && ua !== 'ACEITUNA') return -1;
            return 0;
        });
    }

    // Limpiar del carrito activo cualquier extra o crema que se haya marcado como agotado
    const availExtraIds = new Set(AVAILABLE_EXTRAS.filter(e => e.available !== false).map(e => e.id));
    const availCremaNames = new Set(AVAILABLE_CREMAS.filter(c => c.available !== false).map(c => c.name));

    Object.keys(cart).forEach(id => {
        const item = cart[id];
        if (!item) return;
        if (!item.isBeverage) {
            if (SIDE_OPTIONS.ensaladaAvailable === false) {
                item.ensalada = 'no';
            }
            if (SIDE_OPTIONS.papaHiloAvailable === false && (item.tipoPapa === 'hilo' || item.tipoPapa === 'mixta')) {
                item.tipoPapa = 'fritas';
            }
        }
        if (Array.isArray(item.extras)) {
            item.extras = sortExtrasCanonical(
                item.extras
                    .filter(e => availExtraIds.has(e.id))
                    .map(e => {
                        const latest = AVAILABLE_EXTRAS.find(ae => ae.id === e.id);
                        return latest ? { id: latest.id, name: latest.name, price: latest.price, variant_id: latest.variant_id } : e;
                    })
            );
        }
        if (Array.isArray(item.cremasEnPedido)) {
            item.cremasEnPedido = sortCremasCanonical(item.cremasEnPedido.filter(name => availCremaNames.has(name)));
        }
        if (Array.isArray(item.cremasAparte)) {
            item.cremasAparte = sortCremasCanonical(
                item.cremasAparte.filter(raw => {
                    const parsed = parseCremaAparteItem(raw);
                    return availCremaNames.has(parsed.name);
                })
            );
        }
        item.price = getItemUnitPrice(item);
    });
}

export let MAX_FREE_CREMAS = 9;
export let MAX_FREE_PER_APARTE = 3; // x1, x2, x3 gratis; desde x4 cobra +S/ 0.50 c/u
export let EXTRA_CREMA_PRICE = 0.50;

export function getItemCremasSurcharge(item) {
    if (!item || item.isBeverage) {
        return {
            totalSelected: 0,
            freeLimit: MAX_FREE_CREMAS,
            maxPerAparteFree: MAX_FREE_PER_APARTE,
            extraByPerItemLimit: 0,
            extraByTotalLimit: 0,
            extraCount: 0,
            unitPrice: EXTRA_CREMA_PRICE,
            surcharge: 0,
            eligibleFreeUsed: 0
        };
    }
    const pedCount = Array.isArray(item.cremasEnPedido) ? item.cremasEnPedido.length : 0;
    const apRaw = Array.isArray(item.cremasAparte) ? item.cremasAparte : [];

    let apTotalUnits = 0;
    let apEligibleFreeUnits = 0;
    let extraByPerItemLimit = 0;

    apRaw.forEach(raw => {
        const parsed = parseCremaAparteItem(raw);
        const q = Math.max(0, parsed.qty || 0);
        apTotalUnits += q;
        const freePart = Math.min(q, MAX_FREE_PER_APARTE);
        const paidPart = Math.max(0, q - MAX_FREE_PER_APARTE);
        apEligibleFreeUnits += freePart;
        extraByPerItemLimit += paidPart;
    });

    const totalSelected = pedCount + apTotalUnits;
    const eligibleFreeUsed = pedCount + apEligibleFreeUnits;
    const extraByTotalLimit = Math.max(0, eligibleFreeUsed - MAX_FREE_CREMAS);
    const extraCount = extraByPerItemLimit + extraByTotalLimit;
    const surcharge = extraCount * EXTRA_CREMA_PRICE;

    return {
        totalSelected,
        freeLimit: MAX_FREE_CREMAS,
        maxPerAparteFree: MAX_FREE_PER_APARTE,
        extraByPerItemLimit,
        extraByTotalLimit,
        extraCount,
        unitPrice: EXTRA_CREMA_PRICE,
        surcharge,
        eligibleFreeUsed
    };
}

export function wouldNextCremaAparteCostExtra(item, cremaName) {
    const info = getItemCremasSurcharge(item);
    const currentQty = getCremaAparteQty(item, cremaName);
    if (currentQty >= info.maxPerAparteFree) return true; // Pasar a x4, x5... siempre cobra adicional
    if (info.eligibleFreeUsed >= info.freeLimit) return true; // Pasar de 9 cremas gratis en total cobra adicional
    return false;
}

export function isSandwich(id) {
    if (!id) return false;
    const prodCfg = findProductConfigById(id);
    if (prodCfg && typeof prodCfg.allowsPotatoChoice === 'boolean') {
        return prodCfg.allowsPotatoChoice;
    }
    const baseId = String(id).split('_')[0];
    return baseId.startsWith('h') || baseId.startsWith('pd') || baseId.startsWith('f') || baseId.startsWith('cr') || baseId.startsWith('c');
}

export function getItemUnitPrice(item) {
    if (!item) return 0;
    const base = Number(item.basePrice) || Number(item.price) || 0;
    const extrasSum = (item.extras || []).reduce((acc, ex) => acc + (Number(ex.price) || 0), 0);
    const { surcharge } = getItemCremasSurcharge(item);
    return base + extrasSum + surcharge;
}

export function addToCart(id, name, price, variantId) {
    const prodCfg = findProductConfigById(id);
    const isBeverage = prodCfg && typeof prodCfg.isBeverage === 'boolean'
        ? prodCfg.isBeverage
        : (id === 'ex9' || id === 'ex10' || name.toLowerCase().includes('gaseosa') || name.toLowerCase().includes('kola') || name.toLowerCase().includes('coca'));
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
        ensalada: SIDE_OPTIONS.ensaladaAvailable !== false ? 'si' : 'no', // 'si' o 'no'
        tipoPapa: 'fritas', // 'fritas', 'hilo', 'mixta'
        extras: [],
        cremasEnPedido: [], // Por requerimiento: NO marcar cremas por defecto
        cremasAparte: [],
        instrucciones: '',
        isExpanded: false
    };

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

    if (delta > 0) {
        const newCartItemId = `${item.productId || String(item.id).split('_')[0]}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        cart[newCartItemId] = {
            ...JSON.parse(JSON.stringify(item)),
            id: newCartItemId,
            qty: 1,
            isExpanded: false
        };
        cart[newCartItemId].price = getItemUnitPrice(cart[newCartItemId]);
    } else {
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
    if (!extraDef || extraDef.available === false) return getCartTotals();

    const existsIndex = item.extras.findIndex(e => e.id === extraId);
    if (existsIndex > -1) {
        item.extras.splice(existsIndex, 1);
    } else {
        item.extras.push({ id: extraDef.id, name: extraDef.name, price: extraDef.price, variant_id: extraDef.variant_id });
    }
    item.extras = sortExtrasCanonical(item.extras);

    item.price = getItemUnitPrice(item);
    return getCartTotals();
}

export function setEnsalada(id, value) {
    const item = cart[id];
    if (!item || item.isBeverage) return getCartTotals();

    if (SIDE_OPTIONS.ensaladaAvailable === false) {
        item.ensalada = 'no';
        return getCartTotals();
    }

    item.ensalada = value === 'no' ? 'no' : 'si';
    return getCartTotals();
}

export function setTipoPapa(id, tipo) {
    const item = cart[id];
    if (!item || item.isBeverage || !item.allowsPotatoChoice) return getCartTotals();

    if (SIDE_OPTIONS.papaHiloAvailable === false && (tipo === 'hilo' || tipo === 'mixta')) {
        item.tipoPapa = 'fritas';
        return getCartTotals();
    }

    if (['fritas', 'hilo', 'mixta'].includes(tipo)) {
        item.tipoPapa = tipo;
    }
    return getCartTotals();
}

export function toggleCremaEnPedido(id, cremaName) {
    const item = cart[id];
    if (!item || item.isBeverage) return getCartTotals();

    const cremaDef = AVAILABLE_CREMAS.find(c => c.name === cremaName);
    if (cremaDef && cremaDef.available === false) return getCartTotals();

    if (!Array.isArray(item.cremasEnPedido)) item.cremasEnPedido = [];
    const index = item.cremasEnPedido.indexOf(cremaName);
    if (index > -1) {
        item.cremasEnPedido.splice(index, 1);
    } else {
        item.cremasEnPedido.push(cremaName);
    }
    item.cremasEnPedido = sortCremasCanonical(item.cremasEnPedido);
    item.price = getItemUnitPrice(item);
    return getCartTotals();
}

export function changeCremaAparteQty(id, cremaName, delta) {
    const item = cart[id];
    if (!item || item.isBeverage) return getCartTotals();

    const cremaDef = AVAILABLE_CREMAS.find(c => c.name === cremaName);
    if (cremaDef && cremaDef.available === false) return getCartTotals();

    if (!Array.isArray(item.cremasAparte)) item.cremasAparte = [];
    const target = String(cremaName || '').toUpperCase().trim();
    const index = item.cremasAparte.findIndex(raw => parseCremaAparteItem(raw).name.toUpperCase().trim() === target);

    if (index > -1) {
        const currentQty = parseCremaAparteItem(item.cremasAparte[index]).qty;
        const nextQty = currentQty + delta;
        if (nextQty <= 0) {
            item.cremasAparte.splice(index, 1);
        } else {
            item.cremasAparte[index] = formatCremaAparteItem(cremaName, nextQty);
        }
    } else if (delta > 0) {
        item.cremasAparte.push(formatCremaAparteItem(cremaName, delta));
    }

    item.cremasAparte = sortCremasCanonical(item.cremasAparte);
    item.price = getItemUnitPrice(item);
    return getCartTotals();
}

export function toggleCremaAparte(id, cremaName) {
    // Al tocar una crema aparte se incrementa su cantidad (x1 -> x2 -> x3 -> x4...)
    return changeCremaAparteQty(id, cremaName, 1);
}

export function setAllCremasEnPedido(id) {
    const item = cart[id];
    if (!item || item.isBeverage) return getCartTotals();

    const availNames = AVAILABLE_CREMAS.filter(c => c.available !== false).map(c => c.name);
    if ((item.cremasEnPedido || []).length === availNames.length && availNames.length > 0) {
        item.cremasEnPedido = [];
    } else {
        item.cremasEnPedido = sortCremasCanonical(availNames);
    }
    item.price = getItemUnitPrice(item);
    return getCartTotals();
}

export function setAllCremasAparte(id) {
    const item = cart[id];
    if (!item || item.isBeverage) return getCartTotals();

    const availNames = AVAILABLE_CREMAS.filter(c => c.available !== false).map(c => c.name);
    if ((item.cremasAparte || []).length === availNames.length && availNames.length > 0) {
        item.cremasAparte = [];
    } else {
        item.cremasAparte = sortCremasCanonical(availNames);
    }
    item.price = getItemUnitPrice(item);
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
    return Object.keys(cart).map(id => {
        const it = cart[id];
        const cremasSurchargeInfo = getItemCremasSurcharge(it);
        return {
            id,
            ...it,
            cremasEnPedido: sortCremasCanonical(it.cremasEnPedido || []),
            cremasAparte: sortCremasCanonical(it.cremasAparte || []),
            extras: sortExtrasCanonical(it.extras || []),
            cremasExtraCount: cremasSurchargeInfo.extraCount,
            cremasExtraCost: cremasSurchargeInfo.surcharge,
            cremasSurchargeInfo,
            unitPrice: getItemUnitPrice(it),
            itemTotal: getItemUnitPrice(it) * it.qty
        };
    });
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
