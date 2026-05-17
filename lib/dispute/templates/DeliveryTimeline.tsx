import { Page, Text, View } from '@react-pdf/renderer'
import type { PackData } from '@/types'
import { styles, PAGE_SIZE } from './styles'
import { formatDate } from './format'

export default function DeliveryTimeline({ data }: { data: PackData }) {
  return (
    <Page size={PAGE_SIZE} style={styles.page}>
      <View style={styles.headerBlock}>
        <Text style={styles.pageTitle}>Delivery Timeline</Text>
        <Text style={styles.pageSubtitle}>Project milestones with timestamps</Text>
      </View>

      {data.timeline.length === 0 ? (
        <Text style={styles.placeholder}>No timeline events recorded for this project.</Text>
      ) : (
        data.timeline.map((t, i) => (
          <View key={i} style={styles.metaRow} wrap={false}>
            <Text style={styles.metaLabel}>{formatDate(t.when)}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold' }}>{t.label}</Text>
              {t.detail ? (
                <Text style={{ fontSize: 10, color: '#444444' }}>{t.detail}</Text>
              ) : null}
            </View>
          </View>
        ))
      )}

      <Text style={styles.footer} fixed>
        Pushback Dispute Pack · {data.project.clientName} · {data.user.businessName}
      </Text>
    </Page>
  )
}
