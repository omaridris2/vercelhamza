'use server';

import { createClient } from '@/lib/server';

type AddToCartData = {
  product_id: number;
  quantity: number;
  user_id?: string;
  price: number;
  selected_option_ids: number[];
  resolved_option_prices?: Record<number, number>;
  discount_code_id?: string;
  customer_name?: string;
  order_no?: string;
  deadline?: string;
};

async function incrementDiscountUsage(supabase: any, discountCodeId: string) {
  try {
    const { error: rpcError } = await supabase.rpc('increment_discount_usage', {
      code_id: discountCodeId,
    });

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

async function validateDiscountCode(supabase: any, discountCodeId: string) {
  try {
    const { data: discount, error } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('id', discountCodeId)
      .single();

    if (error) throw error;

    if (!discount.is_active) {
      return { valid: false, error: 'Discount code is not active' };
    }

    const now = new Date();
    const expirationDate = new Date(discount.expiration_date);
    if (expirationDate < now) {
      return { valid: false, error: 'Discount code has expired' };
    }

    if (discount.times_used >= discount.use_limit) {
      return { valid: false, error: 'Discount code usage limit reached' };
    }

    return { valid: true, discount };
  } catch (error) {
    console.error('Error validating discount code:', error);
    return { valid: false, error: 'Failed to validate discount code' };
  }
}

export async function addToCart(data: AddToCartData) {
  try {
    const supabase = await createClient();

    const { data: product, error: productError } = await supabase
      .from('products')
      .select('type')
      .eq('id', data.product_id)
      .single();

    if (productError || !product) {
      console.error('Error fetching product type:', productError);
      return { success: false, error: 'Failed to fetch product type.' };
    }

    let discountValidated = false;
    if (data.discount_code_id) {
      const validation = await validateDiscountCode(supabase, data.discount_code_id);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }
      discountValidated = true;
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: data.user_id || '00000000-0000-0000-0000-000000000001',
        status: 'pending',
        Quantity: data.quantity,
        price: data.price,
        type: product.type,
        discount_code_id: data.discount_code_id || null,
        customer_name: data.customer_name || null,
        order_no: data.order_no || null,
        deadline: data.deadline || null,
      })
      .select('id')
      .single();

    if (orderError) throw orderError;

    if (discountValidated && data.discount_code_id) {
      try {
        await incrementDiscountUsage(supabase, data.discount_code_id);
      } catch (error) {
        console.error('Failed to increment discount usage:', error);
      }
    }

    const { data: orderItem, error: orderItemError } = await supabase
      .from('order_items')
      .insert({
        order_id: order.id,
        product_id: data.product_id,
      })
      .select('id')
      .single();

    if (orderItemError) throw orderItemError;

    // Build option rows — include resolved price_snapshot if provided
    const orderItemOptions = data.selected_option_ids.map((optionId) => ({
      order_item_id: orderItem.id,
      product_menu_option_id: optionId,
      price_snapshot: data.resolved_option_prices?.[optionId] ?? null,
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

export async function fetchOrders() {
  try {
    const supabase = await createClient();

    const { data: ordersData, error } = await supabase
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
        order_no,
        customer_name,
        deadline,
        created_at,
        user_id,
        updated_at,
        completed_at,
        order_items (
          id,
          product_id,
          option_name,
          products (
            name,
            type,
            image_url
          ),
          order_item_options (
            id,
            name,
            price_snapshot,
            product_menu_options (
              id,
              option_name,
              price,
              price_type,
              product_menus (
                id,
                name
              )
            )
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const userIds = [...new Set(ordersData?.map(order => order.user_id).filter(Boolean))];

    const { data: usersData, error: usersError } = await supabase
      .from('profiles')
      .select('id, name, email, role')
      .in('id', userIds);

    if (usersError) {
      console.error('Error fetching users:', usersError);
    }

    const usersMap = new Map(usersData?.map(user => [user.id, user]) || []);

    const ordersWithCreators = ordersData?.map(order => {
      const creator = usersMap.get(order.user_id);
      return {
        ...order,
        creator: creator
          ? { id: creator.id, name: creator.name, email: creator.email, role: creator.role }
          : null,
      };
    });

    return { success: true, orders: ordersWithCreators };
  } catch (error: any) {
    console.error('fetchOrders error:', error);
    return { success: false, error: error.message || 'Failed to fetch orders' };
  }
}

export async function updateOrderPosition(orderId: string, tickId: string | null, date: string | null) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('orders')
      .update({
        timeline_position: tickId,
        timeline_date: date,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('updateOrderPosition error:', error);
    return { success: false, error: error.message };
  }
}

export async function updateOrderStatus(orderId: string, status: string) {
  try {
    const supabase = await createClient();

    const validStatuses = [
      'pending',
      'completed',
      'reprint',
      'print',
      'lamination',
      'cut',
      'finishing',
      'installation',
      'delivery',
    ];

    if (!validStatuses.includes(status)) {
      console.error('Invalid status:', status);
      return { success: false, error: 'Invalid status' };
    }

    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    if (status === 'reprint' || ['print', 'lamination', 'cut', 'finishing', 'installation', 'delivery'].includes(status)) {
      updateData.completed_at = null;
    }

    const { error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    if (error) throw error;

    console.log(`Order ${orderId} status updated to: ${status}`);
    return { success: true };
  } catch (error: any) {
    console.error('updateOrderStatus error:', error);
    return { success: false, error: error.message };
  }
}

export async function assignOrderToUser(orderId: string, userId: string | null) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('orders')
      .update({
        assigned_user_id: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('assignOrderToUser error:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteOrder(orderId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('orders').delete().eq('id', orderId);
  if (error) throw error;
}