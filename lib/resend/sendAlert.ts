import { Resend } from 'resend'
import { ListingMatch } from '@/types/database'

export async function sendListingAlert(
  toEmail: string,
  monitorName: string,
  matches: ListingMatch[]
) {
  const listingLines = matches
    .map(m => {
      const beds = m.bedrooms != null ? `${m.bedrooms}BR` : 'Studio'
      const price = m.price ? `$${m.price.toLocaleString()}/mo` : 'Price TBD'
      const tags = [
        m.no_fee ? 'No Fee' : null,
        m.pet_friendly ? 'Pet Friendly' : null,
        m.has_laundry ? 'Laundry' : null,
      ]
        .filter(Boolean)
        .join(' · ')
      return `• ${beds} ${price} — ${m.address ?? m.neighborhood ?? 'NYC'}\n  ${m.listing_url}${tags ? `\n  ${tags}` : ''}`
    })
    .join('\n\n')

  const count = matches.length
  const subject =
    count === 1
      ? `New listing found: ${matches[0].address ?? matches[0].neighborhood}`
      : `${count} new listings match "${monitorName}"`

  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: toEmail,
    subject,
    text: `
StreetSnipe found ${count} new listing${count > 1 ? 's' : ''} matching your monitor "${monitorName}":

${listingLines}

—
View all matches: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard
Manage monitors: ${process.env.NEXT_PUBLIC_APP_URL}/monitors
    `.trim(),
  })
}
