import { useMemo } from 'react';
import {
  getUniqueColors,
  getAvailableSizesForColor,
  calculateMaxStock,
} from '../utils/productUtils';
import { formatCurrency } from '../utils/formatters';

export default function CartItem({
  item,
  index,
  updateQuantity,
  updateCartItem,
  removeFromCart,
}) {
  const variantes = useMemo(() => item.variantes || [], [item.variantes]);

  // Colores únicos para este producto
  const uniqueColors = useMemo(() => {
    const list = getUniqueColors(variantes).map((c) => c.name);
    if (list.length === 0 && item.color) list.push(String(item.color).trim());
    return list;
  }, [variantes, item.color]);

  // Tallas disponibles para el color seleccionado
  const availableSizes = useMemo(() => {
    const list = getAvailableSizesForColor(variantes, item.color);
    if (list.length === 0 && item.size) list.push(String(item.size).trim());
    return list;
  }, [variantes, item.color, item.size]);

  // Stock máximo exacto para esta variante
  const maxStock = useMemo(
    () => calculateMaxStock(variantes, item.color, item.size),
    [variantes, item.color, item.size]
  );

  const handleColorChange = (newColor) => {
    const sizesForNewColor = getAvailableSizesForColor(variantes, newColor);
    let newSize = item.size;
    if (!sizesForNewColor.includes(item.size) && sizesForNewColor.length > 0) {
      newSize = sizesForNewColor[0];
    }
    updateCartItem(index, { color: newColor, size: newSize });
  };

  const handleSizeChange = (newSize) => {
    updateCartItem(index, { size: newSize });
  };

  return (
    <div className="cart-item">
      <div className="cart-item-img">
        {item.image ? (
          <img src={item.image} alt={item.name} loading="lazy" />
        ) : (
          <div style={{ background: '#1C2541', height: '100%' }} />
        )}
      </div>

      <div className="cart-item-info">
        <h4>{item.name}</h4>

        {/* SELECTORES DE COLOR Y TALLA */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '4px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '.7rem', color: 'var(--grey-300)' }}>Color:</span>
            <select
              className="cart-item-select"
              value={item.color}
              onChange={(e) => handleColorChange(e.target.value)}
              aria-label={`Color de ${item.name}`}
            >
              {uniqueColors.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '.7rem', color: 'var(--grey-300)' }}>Talla:</span>
            <select
              className="cart-item-select"
              value={item.size}
              onChange={(e) => handleSizeChange(e.target.value)}
              aria-label={`Talla de ${item.name}`}
            >
              {availableSizes.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* CONTROLES DE CANTIDAD */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
          <span style={{ fontSize: '.7rem', color: 'var(--grey-300)' }}>Cant:</span>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '4px',
              background: 'rgba(255,255,255,0.03)',
            }}
          >
            <button
              type="button"
              onClick={() => updateQuantity(index, -1, maxStock)}
              style={{
                width: '24px',
                cursor: 'pointer',
                border: 'none',
                background: 'none',
                color: 'inherit',
              }}
              aria-label="Disminuir"
            >
              -
            </button>
            <span
              style={{
                fontSize: '.75rem',
                fontWeight: '700',
                padding: '0 6px',
                minWidth: '20px',
                textAlign: 'center',
              }}
            >
              {item.qty}
            </span>
            <button
              type="button"
              onClick={() => updateQuantity(index, 1, maxStock)}
              disabled={item.qty >= maxStock}
              style={{
                width: '24px',
                cursor: item.qty >= maxStock ? 'not-allowed' : 'pointer',
                border: 'none',
                background: 'none',
                color: item.qty >= maxStock ? 'var(--grey-400)' : 'inherit',
              }}
              aria-label="Aumentar"
            >
              +
            </button>
          </div>
        </div>

        <span className="cart-item-price" style={{ marginTop: '4px', display: 'inline-block' }}>
          {formatCurrency(item.price * item.qty)}
        </span>
      </div>

      <button
        type="button"
        className="btn-remove-item"
        onClick={() => removeFromCart(index)}
        aria-label={`Eliminar ${item.name} del carrito`}
      >
        <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" fill="none">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
