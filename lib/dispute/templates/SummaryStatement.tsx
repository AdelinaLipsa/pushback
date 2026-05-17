import { Page, Text, View } from '@react-pdf/renderer'
import type { PackData } from '@/types'
import { styles, PAGE_SIZE } from './styles'
import { summaryTemplates } from './copy'
import { substitute } from './substitute'
import { formatDate, formatMoney } from './format'

function deriveRevisionsNote(data: PackData): string {
  const hasRevisionClause = data.contractExcerpt.clauses.some(
    c => /revision/i.test(c.heading) || /revision/i.test(c.matchedKeyword),
  )
  return hasRevisionClause ? 'The agreed revision allowance is documented in the contract excerpt.' : ''
}

function deriveSignOffNote(data: PackData): string {
  if (data.signOffs.length === 0) return ''
  return `Sign-off proofs are attached on page 5 covering ${data.signOffs.length} delivery acknowledgement${data.signOffs.length === 1 ? '' : 's'}.`
}

function deriveCancellationClauseNote(data: PackData): string {
  const hasCancel = data.contractExcerpt.clauses.some(
    c => /cancel|terminat|kill fee/i.test(c.heading) || /cancel|terminat|kill/i.test(c.matchedKeyword),
  )
  return hasCancel ? 'The cancellation and kill-fee provisions are quoted on the contract excerpt pages.' : ''
}

export default function SummaryStatement({ data }: { data: PackData }) {
  const vars: Record<string, string> = {
    clientName: data.project.clientName,
    messageCount: String(data.rankedMessages.length),
    transactionSummary: `${formatMoney(data.paymentRecord.amount, data.paymentRecord.currency)} on ${formatDate(data.project.paymentReceivedAt ?? data.project.paymentDueDate)}`,
    revisionsNote: deriveRevisionsNote(data),
    signOffNote: deriveSignOffNote(data),
    cancellationClauseNote: deriveCancellationClauseNote(data),
  }
  const paragraphs = summaryTemplates[data.disputeType].map(p =>
    substitute(p, vars).replace(/\s+/g, ' ').trim(),
  )

  return (
    <Page size={PAGE_SIZE} style={styles.page}>
      <View style={styles.headerBlock}>
        <Text style={styles.pageTitle}>Summary Statement</Text>
        <Text style={styles.pageSubtitle}>Closing argument — {data.project.clientName}</Text>
      </View>

      {paragraphs.map((p, i) => (
        <Text key={i} style={styles.paragraph}>{p}</Text>
      ))}

      <Text style={styles.sectionTitle}>Authorised by</Text>
      <Text style={styles.paragraph}>{data.user.businessName} ({data.user.email})</Text>
      <Text style={styles.paragraph}>
        Generated {formatDate(data.generatedAt)}{data.caseReference ? ` · Ref ${data.caseReference}` : ''}
      </Text>

      <Text style={styles.footer} fixed>
        Pushback Dispute Pack · {data.project.clientName} · {data.user.businessName}
      </Text>
    </Page>
  )
}
