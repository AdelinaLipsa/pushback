import { Page, Text, View } from '@react-pdf/renderer'
import type { PackData } from '@/types'
import { styles, PAGE_SIZE } from './styles'

export default function ContractExcerpt({ data }: { data: PackData }) {
  return (
    <Page size={PAGE_SIZE} style={styles.page}>
      <View style={styles.headerBlock}>
        <Text style={styles.pageTitle}>Contract Excerpt</Text>
        <Text style={styles.pageSubtitle}>
          Clauses relevant to: {data.disputeType.replace(/_/g, ' ')}
        </Text>
      </View>

      {data.contractExcerpt.available ? (
        data.contractExcerpt.clauses.map((c, i) => (
          <View key={i} wrap={false}>
            <Text style={styles.clauseHeading}>{c.heading}</Text>
            <View style={styles.clauseHighlight}>
              <Text>{c.paragraph}</Text>
            </View>
            <Text style={styles.messageMeta}>Matched on: &quot;{c.matchedKeyword}&quot;</Text>
          </View>
        ))
      ) : (
        <Text style={styles.placeholder}>
          Contract not analyzed — upload via Pushback first to include clause excerpts.
        </Text>
      )}

      <Text style={styles.footer} fixed>
        Pushback Dispute Pack · {data.project.clientName} · {data.user.businessName}
      </Text>
    </Page>
  )
}
