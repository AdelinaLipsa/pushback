export default function PageLoader() {
  return (
    <div className="fixed inset-0 bg-[#0a0a0a] flex items-center justify-center">
      <style>{`
        @keyframes pb-spin { to { transform: rotate(360deg); } }
        @keyframes pb-ping {
          0%   { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(2.8); opacity: 0; }
        }
      `}</style>

      <div className="flex flex-col items-center gap-7">
        <div className="relative w-11 h-11">
          <span
            className="absolute inset-0 rounded-full border border-[#84cc16]/25"
            style={{ animation: 'pb-ping 2s ease-out infinite' }}
          />
          <span
            className="absolute inset-0 rounded-full border border-[#84cc16]/15"
            style={{ animation: 'pb-ping 2s ease-out 0.6s infinite' }}
          />
          <span
            className="absolute inset-0 rounded-full border-[1.5px] border-transparent border-t-[#84cc16]"
            style={{ animation: 'pb-spin 0.9s linear infinite' }}
          />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-[#84cc16]" />
          </span>
        </div>

        <span className="text-[#3f3f46] tracking-[0.45em] text-[10px] font-medium uppercase select-none">
          PUSHBACK
        </span>
      </div>
    </div>
  )
}
