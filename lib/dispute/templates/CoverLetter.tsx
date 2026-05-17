import { Page, Text, View } from '@react-pdf/renderer'
import type { PackData } from '@/types'
import { styles, PAGE_SIZE } from './styles'
import { coverLetterTemplates } from './copy'
import { substitute } from './substitute'
import { formatDate, formatMoney } from './format'

const DISPUTE_TITLE: Record<PackData['disputeType'], string> = {
  not_as_described: 'Dispute Response — Goods/Services Not As Described',
  not_received: 'Dispute Response — Goods/Services Not Received',
  cancelled: 'Dispute Response — Cancelled Recurring/Engagement',
  unauthorized: 'Dispute Response — Unauthorized Charge',
}

export default function CoverLetter({ data }: { data: PackData }) {
  const transactionDate = formatDate(data.project.paymentReceivedAt ?? data.project.paymentDueDate)
  const transactionAmount = formatMoney(data.paymentRecord.amount, data.paymentRecord.currency)
  const statement = substitute(coverLetterTemplates[data.disputeType], {
    clientName: data.project.clientName,
    transactionDate,
    transactionAmount,
  })

  return (
    <Page size={PAGE_SIZE} style={styles.page}>
      <View style={styles.headerBlock}>
        <Text style={styles.pageTitle}>{DISPUTE_TITLE[data.disputeType]}</Text>
        <Text style={styles.pageSubtitle}>Evidence Pack — generated {formatDate(data.generatedAt)}</Text>
      </View>

      <View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>From</Text>
          <Text style={styles.metaValue}>{data.user.businessName} ({data.user.email})</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Re</Text>
          <Text style={styles.metaValue}>{data.project.title} — {data.project.clientName}</Text>
        </View>
        {data.caseReference ? (
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Case Reference</Text>
            <Text style={styles.metaValue}>{data.caseReference}</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.sectionTitle}>Transaction Summary</Text>
      <View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Date</Text>
          <Text style={styles.metaValue}>{transactionDate}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Amount</Text>
          <Text style={styles.metaValue}>{transactionAmount}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Currency</Text>
          <Text style={styles.metaValue}>{data.paymentRecord.currency}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Statement of Position</Text>
      <Text style={styles.paragraph}>{statement}</Text>

      <Text style={styles.sectionTitle}>Contents</Text>
      <Text style={styles.paragraph}>
        This pack contains, in order: (1) this cover letter, (2) contract excerpt with relevant clauses, (3) delivery timeline, (4) ranked communication log, (5) sign-off proofs, (6) payment record, (7) summary statement.
      </Text>

      <Text style={styles.footer} fixed>
        Pushback Dispute Pack · {data.project.clientName} · {data.user.businessName}
      </Text>
    </Page>
  )
}
