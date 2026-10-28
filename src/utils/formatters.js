import { STORE_CONFIG } from '../config/constants';

/**
 * Formatea un número como moneda boliviana (ej: Bs 180)
 */
export function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return `${STORE_CONFIG.CURRENCY_SYMBOL} ${num.toLocaleString(STORE_CONFIG.LOCALE)}`;
}

/**
 * Formatea un número telefónico para visualización (ej: +591 76955435)
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
 * Construye la URL de WhatsApp lista para abrir en navegador o app
 */
export function buildWhatsappUrl(phone, message = '') {
  let cleanPhone = String(phone || STORE_CONFIG.DEFAULT_PHONE).replace(/\D/g, '');
  if (cleanPhone.length === 8) {
    cleanPhone = `591${cleanPhone}`;
  }
  const encodedText = encodeURIComponent(message || STORE_CONFIG.DEFAULT_WA_MESSAGE);
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}

/**
 * Genera el mensaje formateado con emojis para enviar el pedido a WhatsApp
 */
export function formatWhatsAppOrderMessage({ customer, cart, total }) {
  const E = {
    star: '\u{2605}',      // ★
    line: '\u{2501}'.repeat(17), // ━━━━━━━━━━━━━━━━━
    bullet: '\u{25AA}',    // ▪
    dot: '\u{2022}',       // •
    check: '\u{2713}',     // ✓
    arrow: '\u{27A4}',     // ➤
  };

  const lines = cart
    .map(
      (item, idx) =>
        `${idx + 1}. *${item.name}*\n   ${E.dot} Color: ${item.color}   ${E.bullet} Talla: ${item.size}\n   ${E.dot} Cant: ${item.qty}   ${E.bullet} ${formatCurrency(item.price * item.qty)}`
    )
    .join('\n\n');

  return `${E.star} *NUEVO PEDIDO - ${STORE_CONFIG.NAME}* ${E.star}
${E.line}
*DATOS DEL CLIENTE*
Nombre: ${customer.nombre.trim()}
Celular: ${customer.telefono}
Depto: ${customer.departamento}

${E.line}
*PRENDAS*
${lines}

${E.line}
${E.check} *TOTAL: ${formatCurrency(total)}*
${E.line}

Pedido generado desde el catálogo web.
Quedo atento para coordinar el envío ${E.arrow}`;
}
