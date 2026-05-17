'use client'

import { Download } from 'lucide-react'
import Button from '@/components/shared/Button'

export default function ContractExportButton() {
  return (
    <Button
      variant="ghost"
      size="sm"
      icon={<Download size={13} />}
      onClick={() => window.print()}
    >
      Save as PDF
    </Button>
  )
}
