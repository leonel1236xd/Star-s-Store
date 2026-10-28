import { useState, useEffect, useMemo, useCallback } from 'react';
import { STORAGE_KEYS } from '../config/constants';
import { calculateMaxStock } from '../utils/productUtils';
import { CartContext } from './CartContext';

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CART);
      return saved ? JSON.parse(saved) : [];
    } catch (err) {
      console.warn('No se pudo restaurar el carrito desde localStorage:', err);
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
    } catch (err) {
      console.warn('Error al guardar el carrito en localStorage:', err);
    }
  }, [cart]);

  const addToCart = useCallback((product, qty, color, size) => {
    if (!product || !color || !size) return false;

    const maxStock = calculateMaxStock(product.variantes, color, size);
    if (maxStock <= 0) return false;

    let wasSuccessful = true;

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (item) => item.id === product.id && item.color === color && item.size === size
      );

      if (existingIndex > -1) {
        const existingItem = prevCart[existingIndex];
        if (existingItem.qty >= maxStock) {
          wasSuccessful = false;
          return prevCart;
        }

        const newCart = [...prevCart];
        const newQty = Math.min(existingItem.qty + qty, maxStock);
        newCart[existingIndex] = { ...existingItem, qty: newQty };
        return newCart;
      }

      const initialQty = Math.min(qty, maxStock);
      return [
        ...prevCart,
        {
          id: product.id,
          name: product.nombre,
          price: Number(product.precio) || 0,
          image: product.imagenes?.[0] || '',
          color,
          size,
          qty: initialQty,
          variantes: product.variantes || [],
        },
      ];
    });

    if (wasSuccessful) {
      setIsCartOpen(true);
    }

    return wasSuccessful;
  }, []);

  const removeFromCart = useCallback((index) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateQuantity = useCallback((index, increment, maxStock) => {
    setCart((prev) => {
      if (!prev[index]) return prev;
      const newCart = [...prev];
      const item = { ...newCart[index] };

      let newQty = item.qty + increment;
      if (newQty < 1) newQty = 1;
      if (maxStock !== undefined && newQty > maxStock) newQty = maxStock;

      item.qty = newQty;
      newCart[index] = item;
      return newCart;
    });
  }, []);

  const updateCartItem = useCallback((index, updates) => {
    setCart((prev) => {
      if (!prev[index]) return prev;
      const newCart = [...prev];
      const itemToUpdate = { ...newCart[index], ...updates };

      const maxStock = calculateMaxStock(
        itemToUpdate.variantes,
        itemToUpdate.color,
        itemToUpdate.size
      );

      if (itemToUpdate.qty > maxStock) {
        itemToUpdate.qty = Math.max(1, maxStock);
      }
      if (itemToUpdate.qty < 1) itemToUpdate.qty = 1;

      // Si al modificar variante colisiona con otro ítem idéntico en el carrito, fusionarlos
      const duplicateIndex = newCart.findIndex(
        (item, i) =>
          i !== index &&
          item.id === itemToUpdate.id &&
          item.color === itemToUpdate.color &&
          item.size === itemToUpdate.size
      );

      if (duplicateIndex > -1) {
        const dupItem = { ...newCart[duplicateIndex] };
        const combinedQty = Math.min(dupItem.qty + itemToUpdate.qty, maxStock);
        dupItem.qty = combinedQty;
        newCart[duplicateIndex] = dupItem;
        newCart.splice(index, 1);
      } else {
        newCart[index] = itemToUpdate;
      }

      return newCart;
    });
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.qty) || 0), 0),
    [cart]
  );

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + (Number(item.qty) || 0), 0),
    [cart]
  );

  const value = useMemo(
    () => ({
      cart,
      isCartOpen,
      setIsCartOpen,
      isCheckoutOpen,
      setIsCheckoutOpen,
      addToCart,
      removeFromCart,
      updateQuantity,
      updateCartItem,
      clearCart,
      cartTotal,
      cartCount,
    }),
    [
      cart,
      isCartOpen,
      isCheckoutOpen,
      addToCart,
      removeFromCart,
      updateQuantity,
      updateCartItem,
      clearCart,
      cartTotal,
      cartCount,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
