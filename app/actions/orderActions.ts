'use server';

import { createClient } from '@/lib/server';
// 🧩 Fetch orders (optionally by date)
export async function fetchOrders(date?: string) {
  const supabase = await createClient(); // ✅ await added

  const query = supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        products (*),
        order_item_options (
          *,
          product_menu_options (
            *,
            product_menus (*)
          )
        )
      )
    `);

  if (date) {
    query.eq('timeline_date', date);
  }

  const { data: orders, error } = await query;

  if (error) {
    console.error('Error fetching orders:', error);
    return { success: false, error: error.message };
  }

  return { success: true, orders };
}

// 🧩 Update order timeline position
export async function updateOrderPosition(
  orderId: string,
  tickId: string | null,
  timelineDate: string
) {
  const supabase = await createClient(); // ✅ await added

  const { error } = await supabase
    .from('orders')
    .update({
      timeline_position: tickId,
      timeline_date: timelineDate,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  if (error) {
    console.error('Error updating order position:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// 🧩 Update order status
export async function updateOrderStatus(orderId: string, status: string) {
  const supabase = await createClient(); // ✅ await added

  const { error } = await supabase
    .from('orders')
    .update({
      status,
      updated_at: new Date().toISOString(),
      completed_at: status === 'completed' ? new Date().toISOString() : null,
    })
    .eq('id', orderId);

  if (error) {
    console.error('Error updating order status:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// 🧩 Assign order to user
export async function assignOrderToUser(orderId: string, userId: string | null) {
  const supabase = await createClient(); // ✅ await added

  const { error } = await supabase
    .from('orders')
    .update({
      assigned_user_id: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  if (error) {
    console.error('Error assigning order to user:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
