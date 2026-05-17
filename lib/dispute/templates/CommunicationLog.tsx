import { Page, Text, View } from '@react-pdf/renderer'
import type { PackData, ScoredMessage } from '@/types'
import { styles, PAGE_SIZE } from './styles'
import { formatDate } from './format'

function weekKey(iso: string): string {
  const t = Date.parse(iso)
  if (isNaN(t)) return 'unknown'
  const d = new Date(t)
  const dayNum = (d.getUTCDay() + 6) % 7
  d.setUTCDate(d.getUTCDate() - dayNum + 3)
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4))
  const firstThursdayDayNum = (firstThursday.getUTCDay() + 6) % 7
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstThursdayDayNum + 3)
  const week = 1 + Math.round((d.getTime() - firstThursday.getTime()) / 604800000)
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

export default function CommunicationLog({ data }: { data: PackData }) {
  const groups = new Map<string, ScoredMessage[]>()
  for (const m of data.rankedMessages) {
    const k = weekKey(m.createdAt)
    const arr = groups.get(k)
    if (arr) arr.push(m)
    else groups.set(k, [m])
  }
  const weeks = Array.from(groups.keys()).sort()

  return (
    <Page size={PAGE_SIZE} style={styles.page}>
      <View style={styles.headerBlock}>
        <Text style={styles.pageTitle}>Communication Log</Text>
        <Text style={styles.pageSubtitle}>
          Top {data.rankedMessages.length} message(s) ranked by relevance — grouped by ISO week
        </Text>
      </View>

      {data.rankedMessages.length === 0 ? (
        <Text style={styles.placeholder}>No defense responses on file for this project.</Text>
      ) : (
        weeks.map(wk => {
          const items = [...(groups.get(wk) ?? [])].sort((a, b) =>
            a.createdAt.localeCompare(b.createdAt),
          )
          return (
            <View key={wk}>
              <Text style={styles.sectionTitle}>{wk}</Text>
              {items.map(m => (
                <View key={m.responseId} style={styles.messageBlock} wrap={false}>
                  <Text style={styles.messageMeta}>
                    {formatDate(m.createdAt)} · {m.toolType.replace(/_/g, ' ')} ·{' '}
                    {m.wasSent ? 'sent' : 'draft'}
                  </Text>
                  <Text>{m.response}</Text>
                </View>
              ))}
            </View>
          )
        })
      )}

      <Text style={styles.footer} fixed>
        Pushback Dispute Pack · {data.project.clientName} · {data.user.businessName}
      </Text>
    </Page>
  )
}
