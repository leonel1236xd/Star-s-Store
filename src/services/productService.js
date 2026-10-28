import { supabase } from './supabase';

/**
 * Consulta el catálogo de productos activos y visibles filtrados por género
 */
export async function getProducts(genero = 'hombre') {
  const { data, error } = await supabase
    .from('productos')
    .select('*, categorias(nombre, slug), variantes(*)')
    .eq('genero', genero)
    .eq('estado', 'activo')
    .eq('visible', true);

  if (error) throw error;

  const rawProducts = data || [];

  // Ordenamiento inmutable: Novedades o Promociones primero
  return [...rawProducts].sort((a, b) => {
    const priorityA = a.is_novelty || a.is_promo ? 1 : 0;
    const priorityB = b.is_novelty || b.is_promo ? 1 : 0;
    return priorityB - priorityA;
  });
}

/**
 * Suscripción en tiempo real a cambios de variantes o inventario
 */
export function subscribeToCatalogChanges(onChangeCallback) {
  const channel = supabase
    .channel('catalog-live-sync')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'variantes' },
      () => onChangeCallback()
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'productos' },
      () => onChangeCallback()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
