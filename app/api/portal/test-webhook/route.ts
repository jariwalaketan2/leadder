import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient, getUser } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createClient()
  const { data: business } = await supabase
    .from('businesses')
    .select('id, name')
    .eq('owner_id', user.id)
    .single()

  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

  const { data: settings, error: settingsError } = await supabaseAdmin
    .from('business_settings')
    .select('webhook_url')
    .eq('business_id', business.id)
    .single()

  if (settingsError) {
    return NextResponse.json({ error: 'Failed to fetch settings', detail: settingsError.message }, { status: 500 })
  }

  if (!settings?.webhook_url) {
    return NextResponse.json({ error: 'No webhook URL configured. Save a webhook URL in Settings first.' }, { status: 400 })
  }

  const testPayload = {
    event: 'lead.test',
    lead: {
      id: 'test-' + Date.now(),
      firstName: 'Test',
      lastName: 'Lead',
      email: 'test@example.com',
      phone: '555-000-0000',
      address: null,
      city: 'Test City',
      state: null,
      zip: null,
      productName: 'Split System - Gas Furnace',
      capacityLabel: '2 Ton',
      tierSelected: 'better',
      quotedPrice: 3500,
      submittedAt: new Date().toISOString(),
    },
  }

  try {
    const res = await fetch(settings.webhook_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload),
    })

    const responseText = await res.text().catch(() => '')

    return NextResponse.json({
      success: res.ok,
      webhookUrl: settings.webhook_url,
      httpStatus: res.status,
      response: responseText.slice(0, 500),
    })
  } catch (err) {
    return NextResponse.json({
      success: false,
      webhookUrl: settings.webhook_url,
      error: err instanceof Error ? err.message : 'Network error',
    }, { status: 500 })
  }
}
