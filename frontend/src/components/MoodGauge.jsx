export default function MoodGauge({ rsi, macd, trendStrength }) {

  const calculateMood = () => {
    let score = 50
    if (rsi) {
      if (rsi > 70) score += 20
      else if (rsi < 30) score -= 20
      else score += (rsi - 50) * 0.4
    }
    if (macd) score += macd > 0 ? 10 : -10
    if (trendStrength) score += trendStrength > 0 ? 10 : -10
    return Math.min(100, Math.max(0, Math.round(score)))
  }

  const score = calculateMood()

  const getLabel = (s) => {
    if (s < 30) return { text: 'Fear', color: '#ef4444' }
    if (s < 55) return { text: 'Neutral', color: '#d4a017' }
    return { text: 'Greed', color: '#22c55e' }
  }

  const mood = getLabel(score)

  // Correct needle calculation
  const cx = 100
  const cy = 90
  const radius = 65
  const angle = Math.PI * (1 - score / 100)
  const needleX = cx + radius * Math.cos(angle)
  const needleY = cy - radius * Math.sin(angle)

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">
        Market Mood
      </p>

      <div className="flex flex-col items-center">
        <svg viewBox="0 0 200 110" className="w-full">
          {/* Background arc */}
          <path
            d="M20,90 A80,80 0 0,1 180,90"
            fill="none" stroke="#f0f0f0"
            strokeWidth="16" strokeLinecap="round"
          />
          {/* Fear - red */}
          <path
            d="M20,90 A80,80 0 0,1 60,27"
            fill="none" stroke="#ef4444"
            strokeWidth="16" strokeLinecap="round"
          />
          {/* Neutral - yellow */}
          <path
            d="M60,27 A80,80 0 0,1 140,27"
            fill="none" stroke="#f5c842"
            strokeWidth="16" strokeLinecap="round"
          />
          {/* Greed - green */}
          <path
            d="M140,27 A80,80 0 0,1 180,90"
            fill="none" stroke="#22c55e"
            strokeWidth="16" strokeLinecap="round"
          />

          {/* Needle */}
          <line
            x1={cx} y1={cy}
            x2={needleX} y2={needleY}
            stroke="#1a1a2e"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx={cx} cy={cy} r="5" fill="#1a1a2e"/>

          {/* Score */}
          <text
            x={cx} y={cy - 10}
            fill="#1a1a2e"
            fontSize="18"
            fontWeight="600"
            textAnchor="middle"
          >
            {score}
          </text>

          {/* 0 and 100 labels */}
          <text x="18" y="105" fill="#aaa" fontSize="9">0</text>
          <text x="170" y="105" fill="#aaa" fontSize="9">100</text>
        </svg>

        {/* Label */}
        <span
          className="text-sm font-semibold -mt-2"
          style={{ color: mood.color }}
        >
          {mood.text}
        </span>
      </div>
    </div>
  )
}