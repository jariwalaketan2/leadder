import { createClient, getUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsForm } from '@/components/portal/settings-form'

export default async function SettingsPage() {
  const user = await getUser()
  if (!user) {
    redirect('/auth/login')
  }
  const supabase = await createClient()

  // Fetch the user's business
  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('owner_id', user.id)
    .single()

  if (!business) {
    redirect('/auth/login')
  }

  const { data: settings } = await supabase
    .from('business_settings')
    .select('*')
    .eq('business_id', business.id)
    .single()

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Settings</h2>
        <p className="text-muted-foreground mt-1">
          Manage your business profile and integrations
        </p>
      </div>

      <SettingsForm
        business={business}
        settings={settings}
      />
    </div>
  )
}
