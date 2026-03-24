import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient, getUser } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify user owns the business
  const supabase = await createClient()
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!business) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 })
  }

  const { configs } = await request.json() as {
    configs: Array<{ product_id: string; is_enabled: boolean }>
  }

  if (!Array.isArray(configs)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('business_product_configs')
    .upsert(
      configs.map(c => ({
        business_id: business.id,
        product_id: c.product_id,
        is_enabled: c.is_enabled,
      })),
      { onConflict: 'business_id,product_id' }
    )

  if (error) {
    console.error('Error saving product configs:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
