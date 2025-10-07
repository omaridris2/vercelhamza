import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function DELETE(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }), 
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }), 
        { status: 400 }
      );
    }

    return new Response(
      JSON.stringify({ message: 'User deleted successfully' }), 
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting user:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { status: 500 }
    );
  }
}