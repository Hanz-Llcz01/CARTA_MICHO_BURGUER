// Configuración de horario de Micho Burguer
// Lunes a Sábado de 6:30 PM (18:30) a 10:30 PM (22:30). Domingos descanso.
export const SCHEDULE_CONFIG = {
    openMinutes: 18 * 60 + 30, // 18:30 (1110 mins)
    closeMinutes: 22 * 60 + 30, // 22:30 (1350 mins)
    closedDays: [0], // 0 = Domingo
    timeZone: 'America/Lima'
};

export function getStoreStatus() {
    try {
        const now = new Date();
        const limaString = now.toLocaleString('en-US', { timeZone: SCHEDULE_CONFIG.timeZone });
        const limaDate = new Date(limaString);
        
        const day = limaDate.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
        const hours = limaDate.getHours();
        const minutes = limaDate.getMinutes();
        const currentMinutes = hours * 60 + minutes;

        // Si es Domingo
        if (SCHEDULE_CONFIG.closedDays.includes(day)) {
            return {
                isOpen: false,
                badgeText: 'Cerrado • Hoy descansamos',
                badgeClass: 'status-closed',
                notice: 'Hoy domingo estamos descansando. ¡Te esperamos mañana lunes desde las 6:30 PM!',
                shortReason: 'Descanso dominical'
            };
        }

        // Lunes a Sábado: antes de las 6:30 PM
        if (currentMinutes < SCHEDULE_CONFIG.openMinutes) {
            return {
                isOpen: false,
                badgeText: 'Cerrado • Abre 6:30 PM',
                badgeClass: 'status-closed',
                notice: 'Nuestra cocina abre hoy a las 6:30 PM. ¡Puedes ir armando tu comanda!',
                shortReason: 'Abrimos a las 6:30 PM'
            };
        }

        // Lunes a Sábado: después de las 10:30 PM
        if (currentMinutes > SCHEDULE_CONFIG.closeMinutes) {
            return {
                isOpen: false,
                badgeText: 'Cerrado por hoy',
                badgeClass: 'status-closed',
                notice: 'Horario de cocina finalizado por hoy. Te esperamos mañana desde las 6:30 PM.',
                shortReason: 'Cerrado por hoy'
            };
        }

        // Dentro del horario de atención (6:30 PM a 10:30 PM)
        return {
            isOpen: true,
            badgeText: 'Abierto ahora • Hasta 10:30 PM',
            badgeClass: 'status-open',
            notice: 'Cocina en marcha. Haz tu pedido y se preparará al instante.',
            shortReason: 'Abierto'
        };
    } catch (e) {
        // En caso de error de zona horaria en navegadores antiguos, permitimos pedidos
        return {
            isOpen: true,
            badgeText: '🟢 Abierto ahora',
            badgeClass: 'status-open',
            notice: 'Haz tu pedido online.',
            shortReason: 'Abierto'
        };
    }
}
