// Configuración de horario dinámico de Micho Burguer
// Administrable en tiempo real desde el Panel de Administración sin tocar código
export let SCHEDULE_CONFIG = {
    mode: 'auto', // 'auto' | 'open' | 'closed'
    openTime: '18:30',
    closeTime: '22:30',
    openMinutes: 18 * 60 + 30, // 18:30 (1110 mins)
    closeMinutes: 22 * 60 + 30, // 22:30 (1350 mins)
    openDays: [1, 2, 3, 4, 5, 6], // Lunes a Sábado
    hoursLabel: '🕒 Lun - Sáb: 6:30 PM a 10:30 PM',
    customClosedTitle: 'Cocina Cerrada',
    customClosedMessage: '',
    estimatedTimeMins: 20,
    timeZone: 'America/Lima'
};

function parseMinutes(timeStr, fallback) {
    if (!timeStr || typeof timeStr !== 'string' || !timeStr.includes(':')) return fallback;
    const [h, m] = timeStr.split(':').map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return fallback;
    return h * 60 + m;
}

export function formatTime12h(timeStr) {
    if (!timeStr || !timeStr.includes(':')) return timeStr || '';
    const [hStr, mStr] = timeStr.split(':');
    let h = parseInt(hStr, 10);
    const m = mStr || '00';
    if (Number.isNaN(h)) return timeStr;
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    return `${h}:${m} ${ampm}`;
}

export function setScheduleConfig(newCfg) {
    if (!newCfg || typeof newCfg !== 'object') return;
    const openTime = newCfg.openTime || SCHEDULE_CONFIG.openTime;
    const closeTime = newCfg.closeTime || SCHEDULE_CONFIG.closeTime;
    const openDays = Array.isArray(newCfg.openDays) ? newCfg.openDays.map(Number) : SCHEDULE_CONFIG.openDays;

    SCHEDULE_CONFIG = {
        ...SCHEDULE_CONFIG,
        ...newCfg,
        openTime,
        closeTime,
        openDays,
        openMinutes: parseMinutes(openTime, 1110),
        closeMinutes: parseMinutes(closeTime, 1350)
    };
}

export function getStoreStatus() {
    try {
        const open12h = formatTime12h(SCHEDULE_CONFIG.openTime);
        const close12h = formatTime12h(SCHEDULE_CONFIG.closeTime);
        const hoursLabel = SCHEDULE_CONFIG.hoursLabel || `🕒 ${open12h} a ${close12h}`;
        const estimatedTimeMins = Number(SCHEDULE_CONFIG.estimatedTimeMins) || 20;

        // 1. Si el Administrador activó "Forzar Abierto Ahora"
        if (SCHEDULE_CONFIG.mode === 'open') {
            return {
                isOpen: true,
                badgeText: 'Abierto ahora • Pedidos Activos',
                badgeClass: 'status-open',
                notice: 'Cocina en marcha. Haz tu pedido y se preparará al instante.',
                shortReason: 'Abierto',
                hoursLabel,
                estimatedTimeMins
            };
        }

        // 2. Si el Administrador activó "Cerrar Tienda Ahora" (Feriado, imprevisto, fin de stock)
        if (SCHEDULE_CONFIG.mode === 'closed') {
            const customMsg = (SCHEDULE_CONFIG.customClosedMessage || '').trim();
            const customTitle = (SCHEDULE_CONFIG.customClosedTitle || '').trim() || 'Cocina Cerrada';
            return {
                isOpen: false,
                badgeText: 'Cerrado temporalmente',
                badgeClass: 'status-closed',
                title: customTitle,
                notice: customMsg || `Por el momento nuestra cocina se encuentra cerrada. Horario habitual: ${hoursLabel.replace('🕒 ', '')}. ¡Puedes ir revisando la carta!`,
                shortReason: customTitle,
                hoursLabel,
                estimatedTimeMins
            };
        }

        // 3. Modo Automático según horario configurado en Lima
        const now = new Date();
        const limaString = now.toLocaleString('en-US', { timeZone: SCHEDULE_CONFIG.timeZone });
        const limaDate = new Date(limaString);

        const day = limaDate.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
        const hours = limaDate.getHours();
        const minutes = limaDate.getMinutes();
        const currentMinutes = hours * 60 + minutes;

        const openDays = Array.isArray(SCHEDULE_CONFIG.openDays) ? SCHEDULE_CONFIG.openDays : [1, 2, 3, 4, 5, 6];
        const customMsg = (SCHEDULE_CONFIG.customClosedMessage || '').trim();

        // Día de descanso (ej. Domingo)
        if (!openDays.includes(day)) {
            return {
                isOpen: false,
                badgeText: 'Cerrado • Hoy descansamos',
                badgeClass: 'status-closed',
                title: 'Cocina Cerrada (Día de descanso)',
                notice: customMsg || `Hoy estamos descansando. ¡Te esperamos en nuestro próximo día de atención desde las ${open12h}!`,
                shortReason: 'Día de descanso',
                hoursLabel,
                estimatedTimeMins
            };
        }

        const openMins = SCHEDULE_CONFIG.openMinutes;
        const closeMins = SCHEDULE_CONFIG.closeMinutes;

        const isWithinHours = openMins <= closeMins
            ? (currentMinutes >= openMins && currentMinutes <= closeMins)
            : (currentMinutes >= openMins || currentMinutes <= closeMins);

        if (!isWithinHours) {
            if (currentMinutes < openMins) {
                return {
                    isOpen: false,
                    badgeText: `Cerrado • Abre ${open12h}`,
                    badgeClass: 'status-closed',
                    title: `Cocina Cerrada (Abrimos a las ${open12h})`,
                    notice: customMsg || `Nuestra cocina abre hoy a las ${open12h}. ¡Puedes ir armando tu comanda!`,
                    shortReason: `Abrimos a las ${open12h}`,
                    hoursLabel,
                    estimatedTimeMins
                };
            } else {
                return {
                    isOpen: false,
                    badgeText: 'Cerrado por hoy',
                    badgeClass: 'status-closed',
                    title: 'Cocina Cerrada (Horario finalizado)',
                    notice: customMsg || `Horario de cocina finalizado por hoy. Te esperamos mañana desde las ${open12h}.`,
                    shortReason: 'Cerrado por hoy',
                    hoursLabel,
                    estimatedTimeMins
                };
            }
        }

        // Dentro del horario de atención
        return {
            isOpen: true,
            badgeText: `Abierto ahora • Hasta ${close12h}`,
            badgeClass: 'status-open',
            title: 'Cocina Abierta',
            notice: 'Cocina en marcha. Haz tu pedido y se preparará al instante.',
            shortReason: 'Abierto',
            hoursLabel,
            estimatedTimeMins
        };
    } catch (e) {
        return {
            isOpen: true,
            badgeText: '🟢 Abierto ahora',
            badgeClass: 'status-open',
            title: 'Cocina Abierta',
            notice: 'Haz tu pedido online.',
            shortReason: 'Abierto',
            hoursLabel: SCHEDULE_CONFIG.hoursLabel,
            estimatedTimeMins: 20
        };
    }
}
