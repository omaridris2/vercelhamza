'use server';

import { createClient } from '@/lib/server';

// Type for adding to cart
type AddToCartData = {
  product_id: number;
  quantity: number;
  price: number;
  selected_option_ids: number[];
};

// 🧩 Add product to cart — automatically fetch product type
export async function addToCart(data: AddToCartData) {
  try {
    const supabase = await createClient();
    const TEMP_USER_ID = '00000000-0000-0000-0000-000000000001';

    // Fetch product type
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('type')
      .eq('id', data.product_id)
      .single();

    if (productError || !product) {
      console.error('Error fetching product type:', productError);
      return { success: false, error: 'Failed to fetch product type.' };
    }

    // Create order with product type
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: TEMP_USER_ID,
        status: 'pending',
        Quantity: data.quantity,
        price: data.price,
        type: product.type,
      })
      .select('id')
      .single();

    if (orderError) throw orderError;

    // Create order item
    const { data: orderItem, error: orderItemError } = await supabase
      .from('order_items')
      .insert({
        order_id: order.id,
        product_id: data.product_id,
      })
      .select('id')
      .single();

    if (orderItemError) throw orderItemError;

    // Add order item options
    const orderItemOptions = data.selected_option_ids.map((optionId) => ({
      order_item_id: orderItem.id,
      product_menu_option_id: optionId,
    }));

    const { error: optionsError } = await supabase
      .from('order_item_options')
      .insert(orderItemOptions);

    if (optionsError) throw optionsError;

    return { success: true, order_id: order.id, message: 'Added to cart successfully!' };
  } catch (error: any) {
    console.error('addToCart error:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

// 🧾 Fetch orders with their related data
export async function fetchOrders() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        status,
        Quantity,
        price,
        type,
        timeline_position,
        timeline_date,
        assigned_user_id,
        order_items (
          id,
          product_id,
          products (
            name,
            type
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, orders: data };
  } catch (error: any) {
    console.error('fetchOrders error:', error);
    return { success: false, error: error.message || 'Failed to fetch orders' };
  }
}

// 📍 Update order position on timeline
export async function updateOrderPosition(orderId: string, tickId: string, date: string) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('orders')
      .update({
        timeline_position: tickId,
        timeline_date: date,
      })
      .eq('id', orderId);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('updateOrderPosition error:', error);
    return { success: false, error: error.message };
  }
}

// ✅ Update order status (e.g. completed)
export async function updateOrderStatus(orderId: string, status: string) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('updateOrderStatus error:', error);
    return { success: false, error: error.message };
  }
}

// ✅ Assign order to a user
export async function assignOrderToUser(orderId: string, userId: string | null) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('orders')
      .update({ assigned_user_id: userId })
      .eq('id', orderId);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('assignOrderToUser error:', error);
    return { success: false, error: error.message };
  }
}
