export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-enter" style={{ minHeight: '100%' }}>
      {children}
    </div>
  )
}
