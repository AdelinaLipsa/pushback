interface HeroArtifactSVGProps {
  className?: string
}

const BODY_LINES: Array<{ y: number; width: number; isClause?: boolean; isHighlighted?: boolean }> = [
  { y: 190, width: 420, isClause: true },
  { y: 212, width: 456 },
  { y: 234, width: 388 },
  { y: 256, width: 312 },
  { y: 286, width: 400, isClause: true },
  { y: 308, width: 456 },
  { y: 330, width: 348 },
  { y: 360, width: 412, isClause: true, isHighlighted: true },
  { y: 382, width: 456, isHighlighted: true },
  { y: 404, width: 296 },
  { y: 434, width: 420, isClause: true },
  { y: 456, width: 456 },
  { y: 478, width: 372 },
  { y: 508, width: 408, isClause: true, isHighlighted: true },
  { y: 530, width: 280 },
  { y: 560, width: 444 },
]

const CLAUSE_NUMERALS = ['1.', '2.', '3.', '4.', '5.']

export default function HeroArtifactSVG({ className }: HeroArtifactSVGProps) {
  let clauseIndex = 0

  return (
    <svg
      className={className}
      viewBox="0 0 600 800"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="52" y="46" width="520" height="740" rx="6" fill="rgba(0,0,0,0.45)" />

      <rect x="40" y="30" width="520" height="740" rx="6" fill="#f5f3ef" />

      <g>
        <text
          x="72"
          y="90"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize="14"
          letterSpacing="3"
          fill="#5a5a55"
        >
          CONTRACT
        </text>
        <text
          x="72"
          y="130"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize="32"
          fontWeight="700"
          fill="#1a1a18"
        >
          Service Agreement
        </text>
        <line x1="72" y1="160" x2="528" y2="160" stroke="#1a1a18" strokeWidth="2" />
      </g>

      {BODY_LINES.map((line, i) =>
        line.isHighlighted ? (
          <rect
            key={`hl-${i}`}
            x={68}
            y={line.y - 5}
            width={line.width + 8}
            height={16}
            rx={1}
            fill="#84cc16"
            fillOpacity="0.32"
          />
        ) : null
      )}

      <g>
        {BODY_LINES.map((line, i) => (
          <rect
            key={`line-${i}`}
            x={72}
            y={line.y}
            width={line.width}
            height={6}
            rx={1}
            fill="#2a2a28"
          />
        ))}
      </g>

      <g>
        {BODY_LINES.map((line, i) => {
          if (!line.isClause || clauseIndex >= CLAUSE_NUMERALS.length) return null
          const numeral = CLAUSE_NUMERALS[clauseIndex++]
          return (
            <text
              key={`num-${i}`}
              x={48}
              y={line.y + 6}
              fontFamily="Georgia, 'Times New Roman', serif"
              fontSize="13"
              fill="#5a5a55"
            >
              {numeral}
            </text>
          )
        })}
      </g>

      <g>
        <polyline
          points="500,386 488,382 488,390"
          fill="#84cc16"
        />
        <line x1="488" y1="386" x2="478" y2="386" stroke="#84cc16" strokeWidth="1.5" />
        <text
          x="504"
          y="390"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontStyle="italic"
          fontSize="13"
          fill="#84cc16"
        >
          MISSING: kill fee
        </text>
      </g>

      <g>
        <polyline
          points="500,514 488,510 488,518"
          fill="#84cc16"
        />
        <line x1="488" y1="514" x2="478" y2="514" stroke="#84cc16" strokeWidth="1.5" />
        <text
          x="504"
          y="518"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontStyle="italic"
          fontSize="13"
          fill="#84cc16"
        >
          REDLINE
        </text>
      </g>

      <g>
        <line x1="72" y1="700" x2="280" y2="700" stroke="#1a1a18" strokeWidth="1.5" />
        <text
          x="72"
          y="720"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize="11"
          fill="#5a5a55"
        >
          Authorized signature
        </text>
        <line x1="340" y1="700" x2="488" y2="700" stroke="#1a1a18" strokeWidth="1.5" />
        <text
          x="340"
          y="720"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize="11"
          fill="#5a5a55"
        >
          Date
        </text>
      </g>
    </svg>
  )
}
