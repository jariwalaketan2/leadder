const GHL_BASE_URL = 'https://services.leadconnectorhq.com'
const GHL_API_VERSION = '2021-07-28'

interface GHLContactUpsertPayload {
  locationId: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  address1?: string
  city?: string
  state?: string
  postalCode?: string
}

interface GHLOpportunityPayload {
  pipelineId: string
  locationId: string
  name: string
  contactId: string
  monetaryValue?: number
  status?: string
}

interface GHLContact {
  id: string
  email: string
  firstName: string
  lastName: string
}

interface GHLOpportunity {
  id: string
  name: string
  pipelineId: string
  contactId: string
}

function ghlHeaders(apiKey: string) {
  return {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'Version': GHL_API_VERSION,
  }
}

export async function upsertContact(
  apiKey: string,
  payload: GHLContactUpsertPayload
): Promise<GHLContact> {
  const res = await fetch(`${GHL_BASE_URL}/contacts/upsert`, {
    method: 'POST',
    headers: ghlHeaders(apiKey),
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`GHL upsert contact failed (${res.status}): ${text}`)
  }

  const data = await res.json()
  return data.contact as GHLContact
}

export async function createOpportunity(
  apiKey: string,
  payload: GHLOpportunityPayload
): Promise<GHLOpportunity> {
  const res = await fetch(`${GHL_BASE_URL}/opportunities/`, {
    method: 'POST',
    headers: ghlHeaders(apiKey),
    body: JSON.stringify({ ...payload, status: 'open' }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`GHL create opportunity failed (${res.status}): ${text}`)
  }

  const data = await res.json()
  return data.opportunity as GHLOpportunity
}
