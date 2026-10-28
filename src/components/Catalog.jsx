import { useEffect, useState, useMemo, useCallback } from 'react';
import { getProducts, subscribeToCatalogChanges } from '../services/productService';
import { calculateTotalStock } from '../utils/productUtils';
import ProductCard from './ProductCard';

export default function Catalog() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');

  const fetchProducts = useCallback(async () => {
    try {
      setErrorMessage(null);
      const data = await getProducts('hombre');
      setProducts(data);
    } catch (err) {
      console.error('Error al cargar catálogo de productos:', err);
      setErrorMessage('No se pudo conectar con el catálogo. Revisa tu conexión.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Carga inicial y suscripción a cambios en tiempo real
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setErrorMessage(null);
        const data = await getProducts('hombre');
        if (isMounted) {
          setProducts(data);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error al cargar catálogo:', err);
          setErrorMessage('No se pudo cargar el catálogo. Intenta nuevamente.');
          setLoading(false);
        }
      }
    };

    loadData();

    const unsubscribe = subscribeToCatalogChanges(() => {
      fetchProducts();
    });

    const handleReload = () => {
      fetchProducts();
    };
    window.addEventListener('catalog-reload-needed', handleReload);

    return () => {
      isMounted = false;
      unsubscribe();
      window.removeEventListener('catalog-reload-needed', handleReload);
    };
  }, [fetchProducts]);

  // ANIMACIONES DE LAS TARJETAS AL HACER SCROLL (Observer seguro)
  useEffect(() => {
    if (loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll('.reveal');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [products, activeFilter, loading]);

  // Categorías derivadas de forma inmutable y memoizada
  const categories = useMemo(() => {
    const list = [];
    const catSlugs = new Set();

    products.forEach((prod) => {
      const totalStock = calculateTotalStock(prod);
      if (totalStock > 0 && prod.categorias && !catSlugs.has(prod.categorias.slug)) {
        list.push(prod.categorias);
        catSlugs.add(prod.categorias.slug);
      }
    });

    return list;
  }, [products]);

  // Productos filtrados según la categoría seleccionada y con stock disponible
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const totalStock = calculateTotalStock(product);
      if (totalStock <= 0) return false;

      if (activeFilter === 'all') return true;
      return product.categorias?.slug === activeFilter;
    });
  }, [products, activeFilter]);

  return (
    <section className="catalog" id="catalogo">
      <div className="section-header reveal">
        <h2>Catálogo</h2>
        <p>Explora nuestros modelos exclusivos con corte impecable y telas de calidad premium.</p>
      </div>

      {/* RENDERIZADO DINÁMICO DE CATEGORÍAS */}
      <div className="filter-tabs reveal">
        <button
          type="button"
          className={`filter-tab ${activeFilter === 'all' ? 'active' : ''}`}
          onClick={() => setActiveFilter('all')}
        >
          Todos
        </button>
        {categories.map((cat) => (
          <button
            key={cat.slug}
            type="button"
            className={`filter-tab ${activeFilter === cat.slug ? 'active' : ''}`}
            onClick={() => setActiveFilter(cat.slug)}
          >
            {cat.nombre}
          </button>
        ))}
      </div>

      {/* GRILLA DE PRODUCTOS O ESTADO */}
      <div className="product-grid" id="product-grid">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton-card reveal" />)
        ) : errorMessage ? (
          <div
            style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              color: 'var(--grey-300)',
              padding: '40px 20px',
            }}
            className="reveal"
          >
            <p style={{ color: '#EF4444', marginBottom: '16px' }}>{errorMessage}</p>
            <button
              type="button"
              className="filter-tab active"
              onClick={fetchProducts}
              style={{ cursor: 'pointer' }}
            >
              Reintentar Conexión
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div
            style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#8D949A' }}
            className="reveal"
          >
            No hay productos disponibles por el momento.
          </div>
        ) : (
          filteredProducts.map((product) => (
            <div key={product.id} className="reveal">
              <ProductCard product={product} />
            </div>
          ))
        )}
      </div>
    </section>
  );
}
