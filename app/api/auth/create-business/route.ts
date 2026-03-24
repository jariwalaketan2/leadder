import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Use service role to bypass RLS for business creation
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 50) + '-' + Math.random().toString(36).substring(2, 8)
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function POST(request: Request) {
  try {
    const { userId, businessName, email } = await request.json()

    if (!userId || !businessName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const slug = generateSlug(businessName)

    // Retry logic: Sometimes the user isn't fully committed to auth.users yet
    let lastError = null
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) {
        // Wait before retrying (exponential backoff: 500ms, 1000ms)
        await sleep(500 * attempt)
      }

      // Use PostgreSQL function to bypass RLS
      const { data, error } = await supabaseAdmin
        .rpc('create_business_with_settings', {
          p_owner_id: userId,
          p_name: businessName,
          p_slug: slug,
          p_email: email,
        })

      if (!error) {
        const businessInfo = data[0]
        return NextResponse.json({
          success: true,
          business: {
            id: businessInfo.business_id,
            name: businessInfo.business_name,
            slug: businessInfo.business_slug,
          }
        })
      }

      lastError = error

      // Check for unique constraint violation (user already has a business)
      if (error.code === '23505' && error.message?.includes('businesses_owner_id_unique')) {
        return NextResponse.json(
          { error: 'User already has a business' },
          { status: 409 } // Conflict
        )
      }

      // If it's not a foreign key error, don't retry
      if (error.code !== '23503') {
        break
      }

      console.log(`Attempt ${attempt + 1} failed, retrying...`, error.message)
    }

    // All retries failed
    console.error('Error creating business after retries:', lastError)
    return NextResponse.json(
      { error: 'Failed to create business' },
      { status: 500 }
    )
  } catch (error) {
    console.error('Error in create-business:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
