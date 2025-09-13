import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(req: Request) {
  const { email, password, name, role } = await req.json()

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

  // Step 2: Insert into profiles with name + role/title
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert([
      {
          // must match auth.users.idzzzzz
        name,
        role,        // store role/title
      },
    ])

  if (profileError) {
    return new Response(JSON.stringify({ error: profileError.message }), { status: 400 })
  }

  return new Response(JSON.stringify({ user }), { status: 200 })
}
