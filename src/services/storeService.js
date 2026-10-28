import { supabase } from './supabase';
import { STORE_CONFIG } from '../config/constants';

/**
 * Consulta la información de la sucursal de la tienda desde Supabase
 */
export async function getStoreInfo(storeName = STORE_CONFIG.NAME) {
  try {
    const { data, error } = await supabase
      .from('sucursales')
      .select('*')
      .eq('nombre', storeName)
      .single();

    if (error) {
      console.warn(`No se pudo obtener información de la sucursal "${storeName}":`, error.message);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Error de red al consultar sucursal:', err);
    return null;
  }
}
