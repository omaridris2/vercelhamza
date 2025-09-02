import { supabase } from '@/lib/supabaseClient'

export default async function HomePage() {
  const { data, error } = await supabase
    .from('products')
    .select('*')

  console.log("✅ Supabase data:", data)
  console.log("⚠️ Supabase error:", error)

  return (
    <main>
      <h1>Profiles</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </main>
  )
}
