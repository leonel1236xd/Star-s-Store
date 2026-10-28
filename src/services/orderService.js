import { supabase } from './supabase';

/**
 * Registra cliente, pedido e ítems del pedido en Supabase
 */
export async function createOrder({ customer, cart, total, sucursalId }) {
  // 1. Registrar cliente
  const { data: client, error: clientErr } = await supabase
    .from('clientes')
    .insert([
      {
        nombre: customer.nombre.trim(),
        telefono: customer.telefono,
        ciudad: customer.departamento,
        total_gastado: total,
      },
    ])
    .select()
    .single();

  if (clientErr) {
    throw new Error('Error al registrar tus datos de cliente: ' + clientErr.message);
  }

  // 2. Registrar cabecera del pedido
  const { data: pedido, error: pedidoErr } = await supabase
    .from('pedidos')
    .insert([
      {
        cliente_id: client.id,
        sucursal_id: sucursalId || null,
        subtotal: total,
        envio: 0,
        total: total,
        estado: 'Pendiente',
      },
    ])
    .select()
    .single();

  if (pedidoErr) {
    throw new Error('Error al generar la orden: ' + pedidoErr.message);
  }

  // 3. Registrar ítems del pedido
  const itemsToInsert = cart.map((item) => ({
    pedido_id: pedido.id,
    producto_id: item.id,
    producto_nombre: item.name,
    imagen_url: item.image,
    color: item.color,
    talla: item.size,
    cantidad: item.qty,
    precio_unitario: item.price,
    total: item.price * item.qty,
  }));

  const { error: itemsErr } = await supabase.from('pedido_items').insert(itemsToInsert);

  if (itemsErr) {
    throw new Error('Error al procesar los productos del pedido: ' + itemsErr.message);
  }

  // 4. Descuento directo en 'variantes' en Supabase para reflejo inmediato
  try {
    for (const item of cart) {
      const { data: vData } = await supabase
        .from('variantes')
        .select('id, stock, stock_global')
        .eq('producto_id', item.id)
        .ilike('color', item.color.trim())
        .ilike('talla', item.size.trim())
        .limit(1)
        .maybeSingle();

      if (vData) {
        const curStock = Math.max(Number(vData.stock_global) || 0, Number(vData.stock) || 0);
        const newStock = Math.max(0, curStock - item.qty);
        await supabase
          .from('variantes')
          .update({
            stock: newStock,
            stock_global: newStock,
          })
          .eq('id', vData.id);
      }
    }
  } catch (stockErr) {
    console.info('Descuento directo en variantes manejado por trigger BD:', stockErr);
  }

  // 5. Notificar a la aplicación para recargar el catálogo de inmediato
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('catalog-reload-needed'));
  }

  return { client, pedido };
}
