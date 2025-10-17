import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  const body = await req.json();
  const {
    user_id,
    orderno,
    customer_name,
    type,
    deadline
  } = body;

  const { data, error } = await supabase
    .from('orders')
    .insert([
      {
        user_id,
        order_no: orderno,
        customer_name,
        type,
        status: 'pending',
        timeline_position: '', // default or adjust as needed
        timeline_date: new Date(),
        price: null,
        Quantity: null,
        discount_code_id: null,
        assigned_user_id: null,
        completed_at: null,
        updated_at: null,
        created_at: new Date(),
        // deadline is not a column, but you can use timeline_date + deadline hours if needed
      }
    ])
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
