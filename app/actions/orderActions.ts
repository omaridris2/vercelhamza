'use server';

import { createClient } from '@/lib/server';

// Type for adding to cart
type AddToCartData = {
  product_id: number;
  quantity: number;
  price: number;
  selected_option_ids: number[];
  discount_code_id?: string;
};

// Replace the existing discount code increment logic with this:
async function incrementDiscountUsage(supabase: any, discountCodeId: string) {
  try {
    // Try RPC first
    const { error: rpcError } = await supabase.rpc('increment_discount_usage', {
      code_id: discountCodeId,
    });

    // If RPC doesn't exist, fall back to direct update
    if (rpcError && rpcError.message?.includes('function')) {
      const { data: current, error: fetchError } = await supabase
        .from('discount_codes')
        .select('times_used')
        .eq('id', discountCodeId)
        .single();

      if (fetchError) throw fetchError;

      const { error: updateError } = await supabase
        .from('discount_codes')
        .update({ times_used: (current?.times_used || 0) + 1 })
        .eq('id', discountCodeId);

      if (updateError) throw updateError;
    } else if (rpcError) {
      throw rpcError;
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to increment discount usage:', error);
    throw error;
  }
}

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

    // If a discount code is provided, validate it first and lock it
    let discountValidated = false;
    

    // Create order with product type and discount code
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: TEMP_USER_ID,
        status: 'pending',
        Quantity: data.quantity,
        price: data.price,
        type: product.type,
        discount_code_id: data.discount_code_id || null,
      })
      .select('id')
      .single();

    if (orderError) throw orderError;

    // ✅ Increment discount usage ONCE - only if order was created successfully
    if (discountValidated && data.discount_code_id) {
      try {
        await incrementDiscountUsage(supabase, data.discount_code_id);
      } catch (error) {
        console.error('Failed to increment discount usage:', error);
        // Don't fail the entire order if increment fails - log it
      }
    }

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
        discount_code_id,
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