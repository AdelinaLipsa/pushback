'use client'

import { useTransition } from 'react'
import { setMaintenanceMode } from './actions'

export function MaintenanceToggle({ isOn }: { isOn: boolean }) {
  const [pending, startTransition] = useTransition()

  return (
    <div className="flex items-center justify-between px-5 py-4">
      <div>
        <p className="text-sm font-medium text-text-primary">Maintenance mode</p>
        <p className="text-xs text-text-muted mt-0.5">
          {isOn ? 'All routes redirected to /maintenance' : 'Site is live'}
        </p>
      </div>
      <button
        onClick={() => startTransition(() => setMaintenanceMode(!isOn))}
        disabled={pending}
        aria-label={isOn ? 'Turn off maintenance mode' : 'Turn on maintenance mode'}
        className={[
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lime',
          isOn ? 'bg-red-500' : 'bg-bg-elevated',
          pending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        ].join(' ')}
      >
        <span
          className={[
            'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
            isOn ? 'translate-x-6' : 'translate-x-1',
          ].join(' ')}
        />
      </button>
    </div>
  )
}
