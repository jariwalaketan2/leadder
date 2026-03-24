import { upsertContact, createOpportunity } from './client'

interface LeadData {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  address?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
  productName?: string | null
  capacityLabel?: string | null
  tierSelected?: string | null
  quotedPrice?: number | null
}

interface GHLSettings {
  apiKey: string
  locationId: string
  pipelineId: string
}

interface SyncResult {
  contactId: string
  opportunityId: string
}

export async function syncLeadToGHL(
  lead: LeadData,
  settings: GHLSettings
): Promise<SyncResult> {
  // Step 1: Create or update contact by email
  const contact = await upsertContact(settings.apiKey, {
    locationId: settings.locationId,
    email: lead.email,
    firstName: lead.firstName,
    lastName: lead.lastName,
    phone: lead.phone || undefined,
    address1: lead.address || undefined,
    city: lead.city || undefined,
    state: lead.state || undefined,
    postalCode: lead.zip || undefined,
  })

  // Step 2: Always create a new opportunity (one per quote request)
  const opportunityName = lead.productName
    ? `${lead.firstName} ${lead.lastName} - ${lead.productName}`
    : `${lead.firstName} ${lead.lastName} - Quote Request`

  const opportunity = await createOpportunity(settings.apiKey, {
    pipelineId: settings.pipelineId,
    locationId: settings.locationId,
    name: opportunityName,
    contactId: contact.id,
    monetaryValue: lead.quotedPrice || undefined,
  })

  return {
    contactId: contact.id,
    opportunityId: opportunity.id,
  }
}
