'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { dialogContentStyle } from '@/lib/ui'
import { deleteContract } from '@/lib/api'
import Button from '@/components/shared/Button'

export default function ContractDeleteButton({ contractId }: { contractId: string }) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    const result = await deleteContract(contractId)
    setDeleting(false)
    if (!result) return
    router.refresh()
    router.push('/contracts')
  }

  return (
    <>
      <Button variant="destructive" size="sm" icon={<Trash2 size={13} />} onClick={() => setDialogOpen(true)}>
        Delete contract
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent style={dialogContentStyle} showCloseButton={false}>
          <DialogHeader>
            <DialogTitle style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              Are you sure?
            </DialogTitle>
          </DialogHeader>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            This will permanently delete the contract and its analysis. There&apos;s no undo.
          </p>
          <div className="flex gap-2">
            <Button variant="destructive" icon={<Trash2 size={13} />} loading={deleting} onClick={handleDelete}>
              {deleting ? 'Deleting…' : 'Delete contract'}
            </Button>
            <Button variant="ghost" icon={<X size={13} />} onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
