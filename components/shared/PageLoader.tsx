export default function PageLoader() {
  return (
    <div className="fixed inset-0 bg-[#0a0a0a] flex items-center justify-center">
      <style>{`
        @keyframes dot-glow {
          0%, 100% { opacity: 1;   text-shadow: 0 0 8px #84cc16, 0 0 24px #84cc1650; }
          50%       { opacity: 0.4; text-shadow: none; }
        }
      `}</style>
      <div className="flex items-baseline select-none">
        <span style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.025em', color: '#fafafa' }}>
          Pushback
        </span>
        <span style={{ fontWeight: 800, fontSize: '1.25rem', color: '#84cc16', animation: 'dot-glow 1.6s ease-in-out infinite' }}>
          .
        </span>
      </div>
    </div>
  )
}
