import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const {
      businessId,
      productId,
      capacityOptionId,
      pricingTierId,
      firstName,
      lastName,
      email,
      phone,
      address,
      city,
      state,
      zip,
      productName,
      capacityLabel,
      tierSelected,
      quotedPrice,
    } = body

    if (!businessId || !firstName || !lastName || !email || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { data: lead, error } = await supabaseAdmin
      .from('leads')
      .insert({
        business_id: businessId,
        product_id: productId || null,
        capacity_option_id: capacityOptionId || null,
        pricing_tier_id: pricingTierId || null,
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        address: address || null,
        city: city || null,
        state: state || null,
        zip: zip || null,
        product_name: productName || null,
        capacity_label: capacityLabel || null,
        tier_selected: tierSelected || null,
        quoted_price: quotedPrice || null,
        status: 'new',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating lead:', error)
      return NextResponse.json(
        { error: 'Failed to create lead' },
        { status: 500 }
      )
    }

    // Fire webhook if configured (Make.com / Zapier / n8n / any CRM) — non-blocking
    void fireWebhookAsync(businessId, lead)

    return NextResponse.json({ success: true, lead })
  } catch (error) {
    console.error('Error in leads API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function fireWebhookAsync(businessId: string, lead: Record<string, unknown>) {
  try {
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('business_settings')
      .select('webhook_url')
      .eq('business_id', businessId)
      .single()

    if (settingsError) {
      console.error('[webhook] Failed to fetch business settings:', settingsError.message)
      return
    }

    if (!settings?.webhook_url) {
      console.log('[webhook] No webhook_url configured for business', businessId)
      return
    }

    console.log('[webhook] Firing to:', settings.webhook_url)

    const res = await fetch(settings.webhook_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'lead.created',
        lead: {
          id: lead.id,
          firstName: lead.first_name,
          lastName: lead.last_name,
          email: lead.email,
          phone: lead.phone,
          address: lead.address,
          city: lead.city,
          state: lead.state,
          zip: lead.zip,
          productName: lead.product_name,
          capacityLabel: lead.capacity_label,
          tierSelected: lead.tier_selected,
          quotedPrice: lead.quoted_price,
          submittedAt: lead.created_at,
        },
      }),
    })

    if (!res.ok) {
      console.error('[webhook] Delivery failed — HTTP', res.status, await res.text().catch(() => ''))
    } else {
      console.log('[webhook] Delivered successfully — HTTP', res.status)
    }
  } catch (err) {
    console.error('[webhook] Network error for business', businessId, err)
  }
}
