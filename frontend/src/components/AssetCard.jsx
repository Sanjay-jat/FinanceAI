export default function AssetCard({ asset, data, selected, onClick }) {
  if (!data) return (
    <div className="flex-1 bg-white border border-gray-200 rounded-xl p-4 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"/>
      <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"/>
      <div className="h-3 bg-gray-200 rounded w-1/3"/>
    </div>
  )

  const isUp = data.signal === 'BUY'
  const priceUp = data.change >= 0
  const icons = { gold: '🥇', silver: '🥈', nifty: '📈' }
  const labels = { gold: 'GOLD', silver: 'SILVER', nifty: 'NIFTY 50' }
  const borderColors = {
    gold: 'border-t-yellow-500',
    silver: 'border-t-gray-400',
    nifty: 'border-t-blue-500'
  }

  return (
    <div
      onClick={onClick}
      className={`flex-1 bg-white border border-gray-200 rounded-xl p-4 cursor-pointer transition-all hover:shadow-md border-t-2 ${borderColors[asset]} ${selected ? 'ring-2 ring-yellow-400' : ''}`}
    >
      {/* Top Row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icons[asset]}</span>
          <span className="text-xs font-medium text-gray-400 tracking-widest">
            {labels[asset]}
          </span>
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-md ${isUp ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
          {data.signal}
        </span>
      </div>

      {/* Price */}
      <div className="text-2xl font-semibold text-gray-900 mb-1">
        {asset === 'nifty' ? '' : '$'}{data.price ? Number(data.price).toLocaleString() : '--'}
      </div>

      {/* Change — uses actual price movement */}
      <div className={`text-sm mb-3 ${priceUp ? 'text-green-500' : 'text-red-500'}`}>
        {priceUp ? '▲' : '▼'} {Math.abs(data.changePercent ?? 0)}% today
      </div>

      {/* Confidence Bar — uses signal */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full">
          <div
            className={`h-full rounded-full ${isUp ? 'bg-yellow-400' : 'bg-red-400'}`}
            style={{ width: `${(data.confidence ?? 0) * 100}%` }}
          />
        </div>
        <span className="text-xs text-gray-400">
          {Math.round((data.confidence ?? 0) * 100)}%
        </span>
      </div>

      {/* Market Status */}
      {!data.market_open && (
        <div className="mt-2 text-xs text-orange-500 bg-orange-50 px-2 py-1 rounded-md">
          🕐 Market Closed
        </div>
      )}
    </div>
  )
}