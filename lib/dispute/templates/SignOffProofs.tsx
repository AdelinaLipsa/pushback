import { Page, Text, View } from '@react-pdf/renderer'
import type { PackData } from '@/types'
import { styles, PAGE_SIZE } from './styles'
import { formatDate } from './format'

const MAX_CHARS = 800

export default function SignOffProofs({ data }: { data: PackData }) {
  return (
    <Page size={PAGE_SIZE} style={styles.page}>
      <View style={styles.headerBlock}>
        <Text style={styles.pageTitle}>Sign-Off Proofs</Text>
        <Text style={styles.pageSubtitle}>
          Delivery acknowledgements sent to {data.project.clientName}
        </Text>
      </View>

      {data.signOffs.length === 0 ? (
        <Text style={styles.placeholder}>
          No sign-off acknowledgements recorded. (Pushback&apos;s delivery_signoff tool was not used for this project.)
        </Text>
      ) : (
        data.signOffs.map((s, i) => {
          const truncated =
            s.text.length > MAX_CHARS ? s.text.slice(0, MAX_CHARS).trim() + '…' : s.text
          return (
            <View key={i} style={styles.messageBlock} wrap={false}>
              <Text style={styles.messageMeta}>{formatDate(s.when)}</Text>
              <Text>{truncated}</Text>
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
