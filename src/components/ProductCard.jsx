import { useState, useMemo, useRef, useEffect } from 'react';
import { useCart } from '../hooks/useCart';
import {
  getAvailableVariants,
  getUniqueColors,
  getAvailableSizesForColor,
  calculateMaxStock,
} from '../utils/productUtils';
import { formatCurrency } from '../utils/formatters';

export default function ProductCard({ product }) {
  const { addToCart, cart } = useCart();
  const timerRef = useRef(null);

  // 1. Filtrar variantes disponibles con stock restante (> 0), descontando lo que ya está en el carrito
  const availableVariants = useMemo(
    () => getAvailableVariants(product, cart),
    [product, cart]
  );

  // 2. Extraer colores únicos disponibles
  const colors = useMemo(
    () => getUniqueColors(availableVariants),
    [availableVariants]
  );

  // Estados locales
  const [selectedColor, setSelectedColor] = useState(() => colors[0]?.name || '');
  const [userSelectedSize, setUserSelectedSize] = useState('');
  const [qty, setQty] = useState(1);
  const [buttonState, setButtonStatus] = useState('idle'); // 'idle' | 'success' | 'error'
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Limpiar timer al desmontar el componente para evitar memory leaks
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // 3. Determinar color y tallas activas de forma segura
  const activeColor = useMemo(() => {
    if (colors.some((c) => c.name === selectedColor)) return selectedColor;
    return colors[0]?.name || '';
  }, [colors, selectedColor]);

  const availableSizes = useMemo(
    () => getAvailableSizesForColor(availableVariants, activeColor),
    [availableVariants, activeColor]
  );

  // Talla activa: si la elegida por el usuario es válida la usamos, sino la primera disponible
  const activeSize = useMemo(() => {
    if (availableSizes.includes(userSelectedSize)) return userSelectedSize;
    return availableSizes[0] || '';
  }, [availableSizes, userSelectedSize]);

  // Stock máximo para la combinación actual
  const maxStock = useMemo(
    () => calculateMaxStock(availableVariants, activeColor, activeSize),
    [availableVariants, activeColor, activeSize]
  );

  // Cantidad segura calculada directamente en base al stock disponible (evita renders en cascada)
  const safeQty = maxStock <= 0 ? 1 : Math.min(qty, maxStock);

  const handleColorSelect = (colorName) => {
    setSelectedColor(colorName);
    setQty(1);
    const newSizes = getAvailableSizesForColor(availableVariants, colorName);
    if (!newSizes.includes(userSelectedSize) && newSizes.length > 0) {
      setUserSelectedSize(newSizes[0]);
    }
  };

  const handleSizeSelect = (size) => {
    setUserSelectedSize(size);
    setQty(1);
  };

  const handleAdd = () => {
    if (!activeColor || !activeSize || maxStock <= 0) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    const wasAdded = addToCart(product, safeQty, activeColor, activeSize);

    if (wasAdded) {
      setButtonStatus('success');
      setQty(1);
      timerRef.current = setTimeout(() => setButtonStatus('idle'), 1500);
    } else {
      setButtonStatus('error');
      timerRef.current = setTimeout(() => setButtonStatus('idle'), 2000);
    }
  };

  // Controles de carrusel
  const images = Array.isArray(product.imagenes) && product.imagenes.length > 0 ? product.imagenes : [];

  const nextImage = (e) => {
    e.preventDefault();
    if (images.length > 1) {
      setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }
  };

  const prevImage = (e) => {
    e.preventDefault();
    if (images.length > 1) {
      setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    }
  };

  return (
    <article className="product-card reveal visible">
      {/* ─── CONTENEDOR DEL CARRUSEL ─── */}
      <div className="carousel">
        {/* Badges de Estado */}
        <div
          style={{
            position: 'absolute',
            top: '14px',
            left: '14px',
            zIndex: 5,
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          {availableVariants.length === 0 && (
            <div
              style={{
                background: '#4B5563',
                color: '#FFFFFF',
                fontSize: '0.7rem',
                fontWeight: 800,
                padding: '4px 10px',
                borderRadius: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.4)',
                textAlign: 'center',
                whiteSpace: 'nowrap',
              }}
            >
              AGOTADO
            </div>
          )}
          {product.is_promo && (
            <div
              className="badge-shimmer"
              style={{
                background: '#EF4444',
                color: '#FFFFFF',
                fontSize: '0.7rem',
                fontWeight: 800,
                padding: '4px 10px',
                borderRadius: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                boxShadow: '0 2px 10px rgba(239, 68, 68, 0.45)',
                textAlign: 'center',
                whiteSpace: 'nowrap',
              }}
            >
              PROMO
            </div>
          )}
          {product.is_novelty && (
            <div
              className="badge-shimmer"
              style={{
                background: '#10B981',
                color: '#FFFFFF',
                fontSize: '0.7rem',
                fontWeight: 800,
                padding: '4px 10px',
                borderRadius: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                boxShadow: '0 2px 10px rgba(16, 185, 129, 0.45)',
                textAlign: 'center',
                whiteSpace: 'nowrap',
              }}
            >
              NUEVO
            </div>
          )}
        </div>

        {/* Pista de imágenes */}
        <div
          className="carousel-track"
          style={{
            transition: 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            transform: `translateX(-${currentImageIndex * 100}%)`,
            overflowX: 'visible',
          }}
        >
          {images.length > 0 ? (
            images.map((imgUrl, index) => (
              <div className="carousel-slide" key={index}>
                <img
                  src={imgUrl}
                  alt={`${product.nombre} - vista ${index + 1}`}
                  loading="lazy"
                />
              </div>
            ))
          ) : (
            <div
              className="carousel-slide"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#1C2541',
                color: 'var(--grey-300)',
                minHeight: '280px',
              }}
            >
              <span>Sin imagen</span>
            </div>
          )}
        </div>

        {/* Controles del Carrusel */}
        {images.length > 1 && (
          <>
            <div className="carousel-dots">
              {images.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  className={`carousel-dot ${currentImageIndex === index ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentImageIndex(index);
                  }}
                  aria-label={`Ver imagen ${index + 1}`}
                />
              ))}
            </div>

            <button
              type="button"
              className="carousel-arrow prev"
              aria-label="Anterior imagen"
              onClick={prevImage}
            >
              <svg
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              type="button"
              className="carousel-arrow next"
              aria-label="Siguiente imagen"
              onClick={nextImage}
            >
              <svg
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 6 15 12 9 18" />
              </svg>
            </button>
          </>
        )}

        {/* PRECIO */}
        <div className="price-badge">{formatCurrency(product.precio)}</div>
      </div>

      {/* ─── CUERPO DE LA TARJETA ─── */}
      <div className="card-body">
        <h3>{product.nombre}</h3>
        <p className="model-desc">{product.descripcion}</p>

        {colors.length > 0 && (
          <>
            <span className="selector-label">Color</span>
            <div className="color-selector">
              {colors.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  className={`color-swatch ${activeColor === c.name ? 'selected' : ''}`}
                  style={{ background: c.hex }}
                  onClick={() => handleColorSelect(c.name)}
                  title={c.name}
                  aria-label={c.name}
                />
              ))}
            </div>
          </>
        )}

        {availableSizes.length > 0 && (
          <>
            <span className="selector-label">Talla</span>
            <div className="size-selector">
              {availableSizes.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`size-btn ${activeSize === s ? 'selected' : ''}`}
                  onClick={() => handleSizeSelect(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </>
        )}

        <div className="qty-row">
          <span className="selector-label" style={{ marginBottom: 0 }}>
            Cantidad
          </span>
          <div className="qty-control">
            <button
              type="button"
              className="qty-btn"
              onClick={() => setQty((prev) => Math.max(1, prev - 1))}
              disabled={safeQty <= 1 || maxStock <= 0}
              aria-label="Disminuir cantidad"
            >
              -
            </button>
            <span className="qty-val">{maxStock <= 0 ? 0 : safeQty}</span>
            <button
              type="button"
              className="qty-btn"
              onClick={() => setQty((prev) => Math.min(maxStock, prev + 1))}
              disabled={safeQty >= maxStock || maxStock <= 0}
              aria-label="Aumentar cantidad"
            >
              +
            </button>
          </div>
        </div>

        <button
          type="button"
          className={`btn-add-cart ${buttonState === 'success' ? 'added' : ''}`}
          style={
            maxStock <= 0
              ? {
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: 'var(--grey-400)',
                  cursor: 'not-allowed',
                  boxShadow: 'none',
                }
              : buttonState === 'error'
              ? { background: '#EF4444', boxShadow: 'none' }
              : {}
          }
          onClick={handleAdd}
          disabled={maxStock <= 0}
        >
          {buttonState === 'success' ? (
            <>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              ¡Añadido!
            </>
          ) : buttonState === 'error' ? (
            <>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              ¡Stock Máximo!
            </>
          ) : maxStock <= 0 ? (
            'Agotado'
          ) : (
            <>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              Añadir al Carrito
            </>
          )}
        </button>
      </div>
    </article>
  );
}
