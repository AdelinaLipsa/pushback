import { forwardRef } from 'react'

type Variant = 'primary' | 'outline' | 'ghost' | 'destructive' | 'confirm'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: React.ReactNode
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-lg border-0 cursor-pointer transition-all duration-150 font-medium select-none active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none'

const variants: Record<Variant, string> = {
  primary:
    'bg-brand-lime text-[#0a0a0a] font-bold hover:opacity-90',
  confirm:
    'bg-brand-lime text-[#0a0a0a] font-bold hover:opacity-90',
  outline:
    'bg-white/5 border border-bg-border text-zinc-300 hover:bg-white/10 hover:border-zinc-500 hover:text-white',
  ghost:
    'bg-transparent border-0 text-zinc-400 hover:text-zinc-100 hover:bg-white/5',
  destructive:
    'bg-urgency-high-dim border border-urgency-high text-urgency-high font-bold hover:bg-urgency-high/20',
}

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-sm',
}

const Spinner = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-spin shrink-0">
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
)

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, icon, disabled, className = '', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {loading ? <Spinner /> : icon && <span className="shrink-0 flex items-center">{icon}</span>}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
