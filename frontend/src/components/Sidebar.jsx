import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const assets = [
  { id: 'gold', label: 'Gold', color: '#d4a017' },
  { id: 'silver', label: 'Silver', color: '#888' },
  { id: 'nifty', label: 'Nifty 50', color: '#4a9eff' },
]

const chartTypes = [
  { id: 'line', label: 'Line Chart' },
  { id: 'candlestick', label: 'Candlestick' },
  { id: 'ma', label: 'MA Overlay' },
]

export default function Sidebar({ selectedAsset, setSelectedAsset, chartType, setChartType, news }) {
  const location = useLocation()
  const { token } = useAuth()

  return (
    <div className="w-52 bg-white border-r border-gray-200 flex flex-col h-full">

      {/* Navigation */}
      <div className="p-4">
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Navigation</p>
        <div className="flex flex-col gap-1">
          <Link
            to="/"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${location.pathname === '/' ? 'bg-yellow-50 text-yellow-600 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            🏠 Dashboard
          </Link>
          <Link
            to={token ? "/backtesting" : "/login"}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${location.pathname === '/backtesting' ? 'bg-yellow-50 text-yellow-600 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            📊 Backtesting {!token && <span className="ml-auto text-xs">🔒</span>}
          </Link>
          <Link
            to={token ? "/history" : "/login"}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${location.pathname === '/history' ? 'bg-yellow-50 text-yellow-600 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            🕐 History {!token && <span className="ml-auto text-xs">🔒</span>}
          </Link>
        </div>
      </div>

      <div className="border-t border-gray-100"/>

      {/* Asset Selector */}
      <div className="p-4">
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Asset</p>
        <div className="flex flex-col gap-1">
          {assets.map(asset => (
            <button
              key={asset.id}
              onClick={() => setSelectedAsset(asset.id)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm w-full text-left ${selectedAsset === asset.id ? 'bg-yellow-50 text-yellow-600 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <div className="w-2 h-2 rounded-full" style={{ background: asset.color }}/>
              {asset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-100"/>

      {/* Chart Type */}
      <div className="p-4">
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Chart</p>
        <div className="flex flex-col gap-1">
          {chartTypes.map(ct => (
            <button
              key={ct.id}
              onClick={() => setChartType(ct.id)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm w-full text-left ${chartType === ct.id ? 'bg-yellow-50 text-yellow-600 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              {ct.id === 'line' ? '📈' : ct.id === 'candlestick' ? '🕯️' : '〰️'} {ct.label}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-100"/>

{/* News Panel */}
<div className="p-4 flex-1 overflow-y-auto">
  <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">🔥 Hot News</p>
  <div className="flex flex-col gap-3">
    {!news ? (
      <p className="text-xs text-gray-400">Loading news...</p>
    ) : news.length === 0 ? (
      <p className="text-xs text-gray-400">No news available right now.</p>
    ) : (
      news.map((item, i) => (
        <a
          key={i}
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="block"
        >
          <p className="text-xs text-gray-700 font-medium leading-snug hover:text-yellow-600 line-clamp-2">
            {item.title}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {item.source} · {new Date(item.published_at).toLocaleDateString()}
          </p>
        </a>
      ))
    )}
  </div>
</div>

    </div>
  )
}