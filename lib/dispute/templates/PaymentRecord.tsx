import { Page, Text, View } from '@react-pdf/renderer'
import type { PackData } from '@/types'
import { styles, PAGE_SIZE } from './styles'
import { formatDate, formatMoney } from './format'

export default function PaymentRecord({ data }: { data: PackData }) {
  const r = data.paymentRecord
  return (
    <Page size={PAGE_SIZE} style={styles.page}>
      <View style={styles.headerBlock}>
        <Text style={styles.pageTitle}>Payment Record</Text>
        <Text style={styles.pageSubtitle}>{data.project.title} — {data.project.clientName}</Text>
      </View>

      {r.placeholder ? (
        <Text style={styles.placeholder}>
          No payment record on file for this project. Attach external payment proof (Stripe/PayPal receipt, bank statement) when submitting this pack.
        </Text>
      ) : (
        <>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Amount</Text>
            <Text style={styles.metaValue}>{formatMoney(r.amount, r.currency)}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Currency</Text>
            <Text style={styles.metaValue}>{r.currency}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Due date</Text>
            <Text style={styles.metaValue}>{formatDate(r.dueDate)}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Received at</Text>
            <Text style={styles.metaValue}>{formatDate(r.receivedAt)}</Text>
          </View>
          <Text style={styles.paragraph}>
            This is the payment record stored by Pushback for the disputed transaction. The user is responsible for attaching the corresponding external receipt (Stripe/PayPal/bank) alongside this pack.
          </Text>
        </>
      )}

      <Text style={styles.footer} fixed>
        Pushback Dispute Pack · {data.project.clientName} · {data.user.businessName}
      </Text>
    </Page>
  )
}
