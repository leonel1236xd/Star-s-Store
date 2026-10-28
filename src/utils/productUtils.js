/**
 * Utilidades puras para el manejo de variantes, colores, tallas y stock
 */

/**
 * Obtiene solo las variantes de un producto con stock disponible (> 0),
 * descontando opcionalmente la cantidad que ya se encuentra agregada en el carrito.
 */
export function getAvailableVariants(product, cart = []) {
  if (!product || !Array.isArray(product.variantes)) return [];
  return product.variantes
    .map((v) => {
      const inCartItem = Array.isArray(cart)
        ? cart.find(
            (item) =>
              item.id === product.id &&
              String(item.color || '').trim().toLowerCase() === String(v.color || '').trim().toLowerCase() &&
              String(item.size || '').trim().toLowerCase() === String(v.talla || '').trim().toLowerCase()
          )
        : null;
      const inCartQty = inCartItem?.qty || 0;

      // En el sistema de STAR'S, el stock real consolidado reside en 'stock_global'
      const baseStock = Number(v.stock_global !== undefined && v.stock_global !== null ? v.stock_global : v.stock) || 0;
      const remainingStock = Math.max(0, baseStock - inCartQty);

      return {
        ...v,
        stock_disponible: remainingStock,
      };
    })
    .filter((v) => v.stock_disponible > 0);
}

/**
 * Extrae los colores únicos que tienen stock disponible
 */
export function getUniqueColors(availableVariants) {
  if (!Array.isArray(availableVariants)) return [];
  const uniqueNames = Array.from(
    new Set(availableVariants.map((v) => String(v.color || '').trim()).filter(Boolean))
  );

  return uniqueNames.map((colorName) => {
    const variant = availableVariants.find(
      (v) => String(v.color || '').trim().toLowerCase() === colorName.toLowerCase()
    );
    return {
      name: colorName,
      hex: variant?.color_hex || '#000000',
    };
  });
}

/**
 * Extrae las tallas disponibles para un color específico
 */
export function getAvailableSizesForColor(availableVariants, selectedColor) {
  if (!Array.isArray(availableVariants) || !selectedColor) return [];
  const normalizedColor = String(selectedColor).trim().toLowerCase();

  return Array.from(
    new Set(
      availableVariants
        .filter((v) => String(v.color || '').trim().toLowerCase() === normalizedColor)
        .map((v) => String(v.talla || '').trim())
        .filter(Boolean)
    )
  );
}

/**
 * Busca una variante específica por color y talla
 */
export function findVariant(variants, color, size) {
  if (!Array.isArray(variants) || !color || !size) return null;
  const normColor = String(color).trim().toLowerCase();
  const normSize = String(size).trim().toLowerCase();

  return (
    variants.find(
      (v) =>
        String(v.color || '').trim().toLowerCase() === normColor &&
        String(v.talla || '').trim().toLowerCase() === normSize
    ) || null
  );
}

/**
 * Calcula el stock máximo disponible para una variante específica
 */
export function calculateMaxStock(variants, color, size) {
  const variant = findVariant(variants, color, size);
  if (!variant) return 0;
  if (variant.stock_disponible !== undefined) {
    return Number(variant.stock_disponible) || 0;
  }
  return Number(variant.stock_global) || 0;
}

/**
 * Calcula el stock total sumado de todas las variantes de un producto
 */
export function calculateTotalStock(product) {
  if (!product || !Array.isArray(product.variantes)) return 0;
  return product.variantes.reduce((sum, v) => sum + (Number(v.stock_global) || 0), 0);
}
