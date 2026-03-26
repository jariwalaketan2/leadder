'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Business, BusinessSettings } from '@/lib/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Save, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

interface SettingsFormProps {
  business: Business
  settings: BusinessSettings | null
}

export function SettingsForm({ business, settings }: SettingsFormProps) {
  const supabase = createClient()
  const [saving, setSaving] = useState(false)

  // Business fields
  const [name, setName] = useState(business.name)
  const [phone, setPhone] = useState(business.phone || '')
  const [website, setWebsite] = useState(business.website || '')
  const [email, setEmail] = useState(business.email || '')

  // Widget settings
  const [widgetTitle, setWidgetTitle] = useState(settings?.widget_title || 'Get Your Instant Quote')
  const [widgetSubtitle, setWidgetSubtitle] = useState(settings?.widget_subtitle || 'Select your HVAC service to see pricing')
  const [widgetThankYou, setWidgetThankYou] = useState(settings?.widget_thank_you_message || "Thank you! We'll be in touch soon.")
  const [widgetEnabled, setWidgetEnabled] = useState(settings?.widget_enabled ?? true)

  // Post-submission redirect
  const [redirectUrl, setRedirectUrl] = useState(settings?.redirect_url || '')
  const [redirectButtonText, setRedirectButtonText] = useState(settings?.redirect_button_text || '')

  // Integrations
  const [webhookUrl, setWebhookUrl] = useState(settings?.webhook_url || '')

const handleSave = async () => {
    setSaving(true)
    try {
      const [businessRes, settingsRes] = await Promise.all([
        supabase
          .from('businesses')
          .update({ name, phone: phone || null, website: website || null, email: email || null })
          .eq('id', business.id),

        supabase
          .from('business_settings')
          .update({
            widget_title: widgetTitle,
            widget_subtitle: widgetSubtitle,
            widget_thank_you_message: widgetThankYou,
            widget_enabled: widgetEnabled,
            redirect_url: redirectUrl || null,
            redirect_button_text: redirectButtonText || null,
            webhook_url: webhookUrl || null,
          })
          .eq('business_id', business.id),
      ])

      if (businessRes.error) throw businessRes.error
      if (settingsRes.error) throw settingsRes.error

      toast.success('Settings saved')
    } catch (err) {
      console.error('Error saving settings:', err)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Business Info */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">Business Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-foreground">Business Name</Label>
            <Input
              id="name"
              value={name}
              onChange={e => setName(e.target.value)}
              className="bg-input border-border text-foreground"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="bg-input border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-foreground">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="bg-input border-border text-foreground"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="website" className="text-foreground">Website</Label>
            <Input
              id="website"
              type="url"
              placeholder="https://yourcompany.com"
              value={website}
              onChange={e => setWebsite(e.target.value)}
              className="bg-input border-border text-foreground"
            />
          </div>
        </CardContent>
      </Card>


      {/* Widget Settings */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">Widget Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
            <div>
              <Label htmlFor="widgetEnabled" className="text-foreground font-medium cursor-pointer">
                Enable Widget
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Allow customers to access your quote widget
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                id="widgetEnabled"
                type="checkbox"
                checked={widgetEnabled}
                onChange={e => setWidgetEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          <div className="space-y-2">
            <Label htmlFor="widgetTitle" className="text-foreground">Widget Title</Label>
            <Input
              id="widgetTitle"
              value={widgetTitle}
              onChange={e => setWidgetTitle(e.target.value)}
              className="bg-input border-border text-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="widgetSubtitle" className="text-foreground">Subtitle</Label>
            <Input
              id="widgetSubtitle"
              value={widgetSubtitle}
              onChange={e => setWidgetSubtitle(e.target.value)}
              className="bg-input border-border text-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="widgetThankYou" className="text-foreground">Thank You Message</Label>
            <Textarea
              id="widgetThankYou"
              rows={2}
              value={widgetThankYou}
              onChange={e => setWidgetThankYou(e.target.value)}
              className="bg-input border-border text-foreground resize-none"
            />
          </div>

          {/* Post-submission redirect */}
          <div className="pt-2 border-t border-border space-y-4">
            <div>
              <p className="text-sm font-medium text-foreground">Post-Submission Button</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Optional button shown on the quote results screen that links to any URL you choose.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="redirectButtonText" className="text-foreground">Button Text</Label>
              <Input
                id="redirectButtonText"
                placeholder="e.g. Check Out Our Services"
                value={redirectButtonText}
                onChange={e => setRedirectButtonText(e.target.value)}
                className="bg-input border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="redirectUrl" className="text-foreground flex items-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5" />
                Redirect URL
              </Label>
              <Input
                id="redirectUrl"
                type="url"
                placeholder="https://yourbooking.com/schedule"
                value={redirectUrl}
                onChange={e => setRedirectUrl(e.target.value)}
                className="bg-input border-border text-foreground"
              />
              <p className="text-xs text-muted-foreground">
                Leave blank to hide the button. Opens in a new tab — homeowner can still see their quote.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CRM Integration */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">CRM Integration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Paste a webhook URL to forward every new lead to your CRM automatically.
            Works with Make.com, Zapier, n8n, HubSpot, Pipedrive, and any service
            that accepts a POST request.
          </p>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {['Make.com', 'Zapier', 'n8n', 'HubSpot', 'Pipedrive', 'Any CRM'].map(p => (
              <span key={p} className="px-2 py-0.5 rounded-full border border-border bg-muted/40">
                {p}
              </span>
            ))}
          </div>
          <div className="space-y-2">
            <Label htmlFor="webhookUrl" className="text-foreground">Webhook URL</Label>
            <Input
              id="webhookUrl"
              type="url"
              placeholder="https://hook.make.com/xxxx  or  https://hooks.zapier.com/xxxx"
              value={webhookUrl}
              onChange={e => setWebhookUrl(e.target.value)}
              className="bg-input border-border text-foreground font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Leave blank to disable. We&apos;ll send a JSON POST with lead name, email,
              phone, address, product, tier, and quoted price.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
