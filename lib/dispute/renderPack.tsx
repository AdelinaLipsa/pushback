// Server-side only. Composes all 7 pages in locked D-05 order.
import { Document, renderToBuffer } from '@react-pdf/renderer'
import type { PackData } from '@/types'
import CoverLetter from './templates/CoverLetter'
import ContractExcerpt from './templates/ContractExcerpt'
import DeliveryTimeline from './templates/DeliveryTimeline'
import CommunicationLog from './templates/CommunicationLog'
import SignOffProofs from './templates/SignOffProofs'
import PaymentRecord from './templates/PaymentRecord'
import SummaryStatement from './templates/SummaryStatement'

export function PackDocument({ data }: { data: PackData }) {
  return (
    <Document
      title={`Pushback Dispute Pack — ${data.project.clientName}`}
      author={data.user.businessName}
      subject={`Dispute response: ${data.disputeType}`}
      creator="Pushback (https://pushback.to)"
      producer="@react-pdf/renderer"
    >
      <CoverLetter data={data} />
      <ContractExcerpt data={data} />
      <DeliveryTimeline data={data} />
      <CommunicationLog data={data} />
      <SignOffProofs data={data} />
      <PaymentRecord data={data} />
      <SummaryStatement data={data} />
    </Document>
  )
}

export async function renderPack(data: PackData): Promise<Buffer> {
  return await renderToBuffer(<PackDocument data={data} />)
}
