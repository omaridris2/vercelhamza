import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(req: Request) {
  try {
    const { email, password, name, role,type } = await req.json()

    // Validation
    if (!email || !password || !name) {
      return new Response(
        JSON.stringify({ error: 'Email, password, and name are required' }), 
        { status: 400 }
      )
    }

    // Step 1: Create the user in Auth
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400 })
    }

    const user = data.user

    // Step 2: Insert into profiles with name, email, and role
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert([
        {
          id: user.id,  // must match auth.users.id
          name,
          email,       // Add the email field
          role, 
          type,       // store role/title
        },
      ])

    if (profileError) {
      // If profile creation fails, we should clean up the auth user
      await supabaseAdmin.auth.admin.deleteUser(user.id)
      return new Response(JSON.stringify({ error: profileError.message }), { status: 400 })
    }

    return new Response(JSON.stringify({ user }), { status: 200 })
  } catch (error) {
    console.error('Error creating user:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { status: 500 }
    )
  }
}