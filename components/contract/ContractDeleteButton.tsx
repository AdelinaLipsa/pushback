'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { btnStyles, dialogContentStyle } from '@/lib/ui'

interface ContractDeleteButtonProps {
  contractId: string
}

export default function ContractDeleteButton({ contractId }: ContractDeleteButtonProps) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [isError, setIsError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function handleDelete() {
    setDeleting(true)
    const res = await fetch(`/api/contracts/${contractId}`, { method: 'DELETE' })
    const data = await res.json()
    setDeleting(false)

    if (!res.ok) {
      setErrorMessage(data.error ?? 'Could not delete contract. Please try again.')
      setIsError(true)
      return
    }

    router.refresh()
    router.push('/contracts')
  }

  function handleOpen() {
    setIsError(false)
    setErrorMessage('')
    setDialogOpen(true)
  }

  function handleDismiss() {
    setDialogOpen(false)
    setIsError(false)
    setErrorMessage('')
  }

  return (
    <>
      <button
        onClick={handleOpen}
        style={btnStyles.outline}
      >
        Delete contract
      </button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent style={dialogContentStyle} showCloseButton={false}>
          {isError ? (
            <>
              <DialogHeader>
                <DialogTitle style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  Something went wrong
                </DialogTitle>
              </DialogHeader>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                {errorMessage}
              </p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={handleDismiss} style={btnStyles.ghost}>
                  Dismiss
                </button>
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  Are you sure?
                </DialogTitle>
              </DialogHeader>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                Delete this contract? The PDF stored with Anthropic will also be removed.
              </p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  style={{ ...btnStyles.destructive, ...(deleting ? { opacity: 0.7, cursor: 'not-allowed' } : {}) }}
                >
                  {deleting ? 'Deleting…' : 'Yes, delete'}
                </button>
                <button
                  onClick={() => setDialogOpen(false)}
                  style={btnStyles.ghost}
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
