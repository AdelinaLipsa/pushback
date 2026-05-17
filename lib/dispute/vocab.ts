import type { DisputeType } from '@/types'

export const disputeVocab: Record<DisputeType, string[]> = {
  not_as_described: [
    'scope', 'deliverable', 'deliverables', 'specification', 'spec', 'specs',
    'acceptance', 'accepted', 'approved', 'approval', 'signed', 'signoff', 'sign-off',
    'agreed', 'agreement', 'revision', 'revisions', 'changes', 'rework', 'feedback',
    'milestone', 'milestones', 'requirement', 'requirements', 'brief', 'mockup', 'design',
    'completed', 'delivered', 'final', 'asset', 'assets',
  ],
  not_received: [
    'delivered', 'sent', 'shared', 'uploaded', 'attached', 'transferred', 'received',
    'access', 'login', 'credentials', 'link', 'download', 'file', 'files', 'asset',
    'assets', 'export', 'final', 'package', 'zip', 'drive', 'dropbox', 'email',
    'confirmation', 'milestone', 'handoff', 'tracking', 'shipping', 'timestamp',
    'recipient',
  ],
  cancelled: [
    'cancel', 'cancelled', 'cancellation', 'kill', 'terminate', 'termination',
    'withdraw', 'pause', 'stop', 'halted', 'abandoned', 'completed', 'partial',
    'progress', 'milestone', 'phase', 'deliverable', 'work', 'hours', 'paid',
    'invoice', 'fee', 'kill-fee', 'killfee', 'refund', 'retainer', 'deposit',
    'agreed', 'signed', 'contract', 'clause', 'reason',
  ],
  unauthorized: [
    'authorize', 'authorized', 'authorization', 'consent', 'agreed', 'signed',
    'contract', 'invoice', 'receipt', 'payment', 'card', 'charged', 'chargeback',
    'transaction', 'reference', 'date', 'email', 'identity', 'login', 'account',
    'verified', 'verification', 'confirmation', 'reply', 'thread', 'correspondence',
    'name', 'address', 'phone', 'records', 'logs', 'history',
  ],
}
