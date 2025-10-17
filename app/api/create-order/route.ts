import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      user_id,
      orderno,
      customer_name,
      type,
      deadline
    } = body;

    // Validate required fields
    if (!customer_name || !orderno) {
      return NextResponse.json(
        { error: 'Customer name and order number are required.' },
        { status: 400 }
      );
    }

    // Convert deadline to ISO string if provided, otherwise null
    const deadlineISO = deadline ? new Date(deadline).toISOString() : null;

    const { data, error } = await supabase
      .from('orders')
      .insert([
        {
          user_id,
          order_no: orderno,
          customer_name,
          type,
          status: 'pending',
          timeline_position: null, // null for unplaced orders
          timeline_date: new Date().toISOString().split('T')[0], // today's date in YYYY-MM-DD format
          price: null,
          Quantity: null,
          discount_code_id: null,
          assigned_user_id: null,
          completed_at: null,
          updated_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          deadline: deadlineISO, // Add the deadline field
        }
      ])
      .select();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      data,
      message: 'Order created successfully!'
    });

  } catch (error: any) {
    console.error('Create order API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}