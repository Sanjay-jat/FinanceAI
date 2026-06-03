export default function SignalBanner({ data, asset, error }) {
  const labels = {
    gold: 'Gold / USD',
    silver: 'Silver / USD',
    nifty: 'Nifty 50 / INR'
  }

  // Error state — shows instead of infinite skeleton
  if (error || !data) {
    return (
      <div className="rounded-xl px-5 py-4 flex items-center justify-between bg-gray-50 border border-gray-200">
        <div className="flex items-center gap-3">
          <span className="text-gray-400 text-sm">
            {labels[asset]} · Signal unavailable
          </span>
          <span className="text-xs bg-red-50 border border-red-200 text-red-400 px-2 py-1 rounded-md">
            ⚠ Could not load signal
          </span>
        </div>
        <span className="text-xs text-gray-300">
          Backend may be warming up — try refreshing in 30s
        </span>
      </div>
    )
  }

  const isUp = data.signal === 'BUY'

  return (
    <div className={`rounded-xl px-5 py-4 flex items-center justify-between 
      ${isUp ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'}`}>

      {/* Left */}
      <div className="flex items-center gap-4">
        <div>
          <p className="text-xs text-gray-400 mb-1">
            {labels[asset]} · Next Day Signal
          </p>
          <div className="flex items-center gap-3">
            <span className={`text-2xl font-bold 
              ${isUp ? 'text-green-600' : 'text-red-600'}`}>
              {isUp ? '▲' : '▼'} {data.signal}
            </span>
            <span className="text-xs bg-white border border-gray-200 
              text-gray-500 px-2 py-1 rounded-md">
              XGBoost Model
            </span>
          </div>
        </div>
      </div>

      {/* Center — Market Status */}
      <div className="text-center">
        <p className="text-xs text-gray-400 mb-1">Market Status</p>
        <span className={`text-sm font-medium px-3 py-1 rounded-full 
          ${data.market_open 
            ? 'bg-green-100 text-green-600' 
            : 'bg-orange-100 text-orange-600'}`}>
          {data.market_open ? '🟢 Open' : '🔴 Closed'}
        </span>
        {!data.market_open && (
          <p className="text-xs text-orange-400 mt-1">
            {data.market_status}
          </p>
        )}
      </div>

      {/* Right — Confidence */}
      <div className="text-right">
        <p className="text-xs text-gray-400 mb-1">Confidence</p>
        <p className={`text-2xl font-bold 
          ${isUp ? 'text-green-600' : 'text-red-600'}`}>
          {Math.round(data.confidence * 100)}%
        </p>
        <div className="flex items-center gap-2 mt-1">
          <div className="w-24 h-1.5 bg-gray-200 rounded-full">
            <div
              className={`h-full rounded-full 
                ${isUp ? 'bg-green-500' : 'bg-red-500'}`}
              style={{ width: `${data.confidence * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}