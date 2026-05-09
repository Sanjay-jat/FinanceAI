import { useState, useEffect } from 'react'
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend,
  LineChart, Line
} from 'recharts'
import API from '../api/axios'

const PERIODS = ['1M', '3M', '6M', '1Y', 'All']

export default function PriceChart({ asset, chartType }) {
  const [data, setData] = useState([])
  const [period, setPeriod] = useState('3M')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchChartData()
  }, [asset, period])

  const fetchChartData = async () => {
    setLoading(true)
    try {
      const res = await API.get(`/signals/chart/${asset}?period=${period}`)
      setData(res.data.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
  }

  const formatPrice = (val) => {
    if (asset === 'nifty') return val?.toLocaleString()
    return `$${val?.toLocaleString()}`
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg text-xs">
          <p className="text-gray-400 mb-1">{formatDate(label)}</p>
          {payload.map((p, i) => (
            <p key={i} style={{ color: p.color }} className="font-medium">
              {p.name}: {formatPrice(p.value)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  // Candlestick renderer
  const CandlestickChart = ({ data }) => {
    if (!data.length) return null
    const prices = data.map(d => d.close)
    const minP = Math.min(...prices)
    const maxP = Math.max(...prices)
    const range = maxP - minP
    const W = 800
    const H = 280
    const PAD = 40
    const candleW = Math.max(3, (W - PAD) / data.length - 2)

    const toY = (price) => H - ((price - minP) / range) * (H - PAD) - 10

    const sliced = data.slice(-60)

    return (
      <svg width="100%" viewBox={`0 0 ${W} ${H + 20}`} className="overflow-visible">
        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
          const price = minP + t * range
          const y = toY(price)
          return (
            <g key={i}>
              <line x1={PAD} y1={y} x2={W} y2={y} stroke="#f0f0f0" strokeWidth="0.5"/>
              <text x={2} y={y + 4} fill="#ccc" fontSize="9">
                {asset === 'nifty' ? Math.round(price).toLocaleString() : `$${Math.round(price)}`}
              </text>
            </g>
          )
        })}

        {sliced.map((d, i) => {
          const x = PAD + (i / sliced.length) * (W - PAD)
          const isUp = d.close >= d.open
          const color = isUp ? '#22c55e' : '#ef4444'
          const openY = toY(d.open)
          const closeY = toY(d.close)
          const highY = toY(d.high)
          const lowY = toY(d.low)
          const bodyTop = Math.min(openY, closeY)
          const bodyH = Math.max(2, Math.abs(openY - closeY))

          return (
            <g key={i}>
              <line x1={x + candleW / 2} y1={highY} x2={x + candleW / 2} y2={lowY} stroke={color} strokeWidth="1"/>
              <rect x={x} y={bodyTop} width={candleW} height={bodyH} fill={color}/>
            </g>
          )
        })}

        {/* Date labels */}
        {sliced.filter((_, i) => i % 10 === 0).map((d, i, arr) => {
          const origI = sliced.indexOf(d)
          const x = PAD + (origI / sliced.length) * (W - PAD)
          return (
            <text key={i} x={x} y={H + 15} fill="#ccc" fontSize="9" textAnchor="middle">
              {formatDate(d.date)}
            </text>
          )
        })}
      </svg>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl flex flex-col flex-1 overflow-hidden">

      {/* Chart Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-gray-900">
            {asset === 'gold' ? 'Gold / USD' : asset === 'silver' ? 'Silver / USD' : 'Nifty 50 / INR'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {PERIODS.map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`text-xs px-3 py-1 rounded-md ${period === p ? 'bg-yellow-500 text-white' : 'text-gray-400 hover:bg-gray-100'}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Body */}
      <div className="flex-1 p-4 min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            Loading chart...
          </div>
        ) : (
          <>
            {chartType === 'candlestick' && (
              <CandlestickChart data={data}/>
            )}

            {chartType === 'line' && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d4a017" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#d4a017" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5"/>
                  <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 10, fill: '#ccc' }} tickLine={false}/>
                  <YAxis tickFormatter={formatPrice} tick={{ fontSize: 10, fill: '#ccc' }} tickLine={false} width={60}/>
                  <Tooltip content={<CustomTooltip/>}/>
                  <Area type="monotone" dataKey="close" name="Price" stroke="#d4a017" strokeWidth={2} fill="url(#colorClose)"/>
                </AreaChart>
              </ResponsiveContainer>
            )}

            {chartType === 'ma' && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5"/>
                  <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 10, fill: '#ccc' }} tickLine={false}/>
                  <YAxis tickFormatter={formatPrice} tick={{ fontSize: 10, fill: '#ccc' }} tickLine={false} width={60}/>
                  <Tooltip content={<CustomTooltip/>}/>
                  <Legend/>
                  <Line type="monotone" dataKey="close" name="Price" stroke="#d4a017" strokeWidth={2} dot={false}/>
                  <Line type="monotone" dataKey="ma7" name="MA7" stroke="#4a9eff" strokeWidth={1.5} dot={false} strokeDasharray="4 4"/>
                  <Line type="monotone" dataKey="ma30" name="MA30" stroke="#ef4444" strokeWidth={1.5} dot={false} strokeDasharray="4 4"/>
                </LineChart>
              </ResponsiveContainer>
            )}
          </>
        )}
      </div>
    </div>
  )
}