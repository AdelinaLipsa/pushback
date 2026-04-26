export const metadata = { robots: 'noindex' }

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="flex items-center justify-center gap-0.5 mb-10">
          <span className="font-extrabold text-xl tracking-tight text-text-primary">pushback</span>
          <span className="text-brand-lime font-extrabold text-xl">.</span>
        </div>
        <h1 className="font-bold text-2xl tracking-tight text-text-primary mb-3">
          Under maintenance
        </h1>
        <p className="text-text-muted text-sm leading-relaxed">
          We're making some improvements and will be back shortly.
        </p>
      </div>
    </div>
  )
}
