import { STORE_CONFIG } from '../config/constants';

/**
 * Formatea un n\u00famero como moneda boliviana (ej: Bs 180)
 */
export function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return `${STORE_CONFIG.CURRENCY_SYMBOL} ${num.toLocaleString(STORE_CONFIG.LOCALE)}`;
}

/**
 * Formatea un n\u00famero telef\u00f3nico para visualizaci\u00f3n (ej: +591 76955435)
 */
export function formatWhatsappNumber(num) {
  if (!num) return '';
  const str = String(num).trim();
  if (str.startsWith('591') && str.length > 3) {
    return `+591 ${str.slice(3)}`;
  }
  return str.startsWith('+') ? str : `+${str}`;
}

/**
 * Construye la URL de WhatsApp lista para abrir en navegador o app.
 * Usa api.whatsapp.com/send en lugar de wa.me para evitar que la
 * redirecci\u00f3n 302 de wa.me corrompa la codificaci\u00f3n UTF-8 de los emojis.
 */
export function buildWhatsappUrl(phone, message = '') {
  let cleanPhone = String(phone || STORE_CONFIG.DEFAULT_PHONE).replace(/\D/g, '');
  if (cleanPhone.length === 8) {
    cleanPhone = `591${cleanPhone}`;
  }
  const encodedText = encodeURIComponent(message || STORE_CONFIG.DEFAULT_WA_MESSAGE);
  return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
}

/**
 * Genera el mensaje formateado con emojis para enviar el pedido a WhatsApp.
 * Los emojis se definen con secuencias de escape Unicode seguras para
 * evitar corrupci\u00f3n por encoding Windows-1252/ANSI en el build.
 */
export function formatWhatsAppOrderMessage({ customer, cart, total }) {
  const storeName = STORE_CONFIG.NAME || "STAR'S";

  // Caracteres especiales con secuencias de escape Unicode seguras en runtime
  const SEP = '\u2501'.repeat(17);
  const STAR = '\u2B50';
  const PERSON = '\u{1F464}';
  const BAG = '\u{1F6CD}\uFE0F';
  const CHECK = '\u2705';
  const PKG = '\u{1F4E6}';
  const TRUCK = '\u{1F69A}';
  const DOT = '\u2022';

  const lines = cart
    .map(
      (item, idx) =>
        `${idx + 1}. *${item.name}*\n   ${DOT} Color: ${item.color}   |   Talla: ${item.size}\n   ${DOT} Cant: ${item.qty}   |   ${formatCurrency(item.price * item.qty)}`
    )
    .join('\n\n');

  return [
    `${STAR} *NUEVO PEDIDO - ${storeName}* ${STAR}`,
    SEP,
    `${PERSON} *DATOS DEL CLIENTE*`,
    `${DOT} Nombre: ${customer.nombre.trim()}`,
    `${DOT} Celular: ${customer.telefono}`,
    `${DOT} Depto: ${customer.departamento}`,
    '',
    SEP,
    `${BAG} *PRENDAS*`,
    lines,
    '',
    SEP,
    `${CHECK} *TOTAL: ${formatCurrency(total)}*`,
    SEP,
    '',
    `${PKG} _Pedido generado desde el cat\u00E1logo web._`,
    `${TRUCK} _Quedo atento para coordinar el env\u00EDo._`,
  ].join('\n');
}
