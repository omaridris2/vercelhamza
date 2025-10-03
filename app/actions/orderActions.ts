// app/actions/orderActions.ts
'use server';

import { supabase } from '@/lib/supabaseClient';

type AddToCartData = {
  product_id: number;
  quantity: number;
  price: number;
  selected_option_ids: number[];
};

export async function addToCart(data: AddToCartData) {
  try {
    const TEMP_USER_ID = '00000000-0000-0000-0000-000000000001';

    // 1. Create the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: TEMP_USER_ID,
        status: 'pending',
        Quantity: data.quantity,
        price: data.price,
      })
      .select('id')
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      return { 
        success: false, 
        error: `Failed to create order: ${orderError.message}` 
      };
    }

    // 2. Create the order item
    const { data: orderItem, error: orderItemError } = await supabase
      .from('order_items')
      .insert({
        order_id: order.id,
        product_id: data.product_id,
      })
      .select('id')
      .single();

    if (orderItemError) {
      console.error('Order item creation error:', orderItemError);
      await supabase.from('orders').delete().eq('id', order.id);
      return { 
        success: false, 
        error: `Failed to create order item: ${orderItemError.message}` 
      };
    }

    // 3. Create order item options (batch insert)
    const orderItemOptions = data.selected_option_ids.map((optionId) => ({
      order_item_id: orderItem.id,
      product_menu_option_id: optionId,
    }));

    const { error: optionsError } = await supabase
      .from('order_item_options')
      .insert(orderItemOptions);

    if (optionsError) {
      console.error('Order item options creation error:', optionsError);
      await supabase.from('orders').delete().eq('id', order.id);
      return { 
        success: false, 
        error: `Failed to save product options: ${optionsError.message}` 
      };
    }

    return {
      success: true,
      order_id: order.id,
      order_item_id: orderItem.id,
      message: 'Added to cart successfully!',
    };
  } catch (error) {
    console.error('Unexpected error in addToCart:', error);
    return { 
      success: false, 
      error: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

// NEW: Fetch all orders with their details
export async function fetchOrders() {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id,
        created_at,
        status,
        Quantity,
        price,
        order_items (
          id,
          product_id,
          products (
            id,
            name
          ),
          order_item_options (
            id,
            product_menu_option_id,
            product_menu_options (
              id,
              option_name,
              price,
              product_menus (
                id,
                name
              )
            )
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      return { success: false, error: error.message, orders: [] };
    }

    return { success: true, orders: orders || [] };
  } catch (error) {
    console.error('Unexpected error fetching orders:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      orders: [] 
    };
  }
}