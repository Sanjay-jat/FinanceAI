import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine
} from 'recharts'
import API from '../api/axios'

const PERIODS = ['1M', '3M', '6M', '1Y']

export default function Backtesting() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [selectedAsset, setSelectedAsset] = useState('gold')
  const [chartType, setChartType] = useState('line')
  const [period, setPeriod] = useState('6M')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [news, setNews] = useState([])

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }
    fetchBacktest()
  }, [selectedAsset, period, token])

  useEffect(() => {
    API.get('/signals/news').then(r => setNews(r.data.news)).catch(() => {})
  }, [])

  const fetchBacktest = async () => {
    setLoading(true)
    setError('')
    setData(null)
    try {
      const res = await API.get(`/signals/backtest/${selectedAsset}?period=${period}`)
      if (res.data && res.data.data) {
        setData(res.data)
      } else {
        setError('No backtest data returned. Try a different period or asset.')
      }
    } catch (err) {
      console.error(err)
      if (err.response?.status === 401) {
        navigate('/login')
      } else {
        setError('Failed to load backtest. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg text-xs">
          <p className="text-gray-400 mb-1">{label}</p>
          <p className="font-medium text-blue-600">
            Return: {payload[0]?.value}%
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar prices={{}}/>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          selectedAsset={selectedAsset}
          setSelectedAsset={setSelectedAsset}
          chartType={chartType}
          setChartType={setChartType}
          news={news}
        />

        <div className="flex-1 flex flex-col overflow-auto p-6 gap-5">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Backtesting</h1>
              <p className="text-sm text-gray-400 mt-0.5">
                Historical performance of our model signals
              </p>
            </div>
            <div className="flex gap-2">
              {PERIODS.map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`text-xs px-4 py-2 rounded-lg ${period === p ? 'bg-yellow-500 text-white' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"/>
              <p className="text-gray-400 text-sm">Running backtest for {selectedAsset.toUpperCase()}...</p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <p className="text-red-400 text-sm">{error}</p>
              <button
                onClick={fetchBacktest}
                className="text-xs px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Data */}
          {!loading && !error && data && (
            <>
              {/* Stats Row */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <p className="text-xs text-gray-400 mb-1">Total Return</p>
                  <p className={`text-2xl font-bold ${data.total_return >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {data.total_return >= 0 ? '+' : ''}{data.total_return}%
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Following model signals</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <p className="text-xs text-gray-400 mb-1">Win Rate</p>
                  <p className="text-2xl font-bold text-blue-500">{data.win_rate}%</p>
                  <p className="text-xs text-gray-400 mt-1">Correct signals</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <p className="text-xs text-gray-400 mb-1">Total Trades</p>
                  <p className="text-2xl font-bold text-gray-900">{data.total_trades}</p>
                  <p className="text-xs text-gray-400 mt-1">Signals generated</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <p className="text-xs text-gray-400 mb-1">Wins / Losses</p>
                  <p className="text-2xl font-bold text-gray-900">
                    <span className="text-green-500">{data.wins}</span>
                    {' / '}
                    <span className="text-red-500">{data.losses}</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Signal breakdown</p>
                </div>
              </div>

              {/* Chart */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 flex-1">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">
                      Cumulative Return — {selectedAsset.toUpperCase()} ({period})
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Hypothetical return following every model signal
                    </p>
                  </div>
                  <div className={`text-sm font-semibold px-3 py-1 rounded-lg ${data.total_return >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {data.total_return >= 0 ? '+' : ''}{data.total_return}% total
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data.data}>
                    <defs>
                      <linearGradient id="retGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4a9eff" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#4a9eff" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5"/>
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: '#ccc' }}
                      tickLine={false}
                      interval={Math.floor(data.data.length / 6)}
                    />
                    <YAxis
                      tickFormatter={v => `${v}%`}
                      tick={{ fontSize: 10, fill: '#ccc' }}
                      tickLine={false}
                      width={50}
                    />
                    <Tooltip content={<CustomTooltip/>}/>
                    <ReferenceLine y={0} stroke="#e5e7eb" strokeDasharray="4 4"/>
                    <Area
                      type="monotone"
                      dataKey="cumulative"
                      name="Cumulative Return"
                      stroke="#4a9eff"
                      strokeWidth={2}
                      fill="url(#retGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Trade History Table */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h2 className="text-sm font-semibold text-gray-900 mb-4">
                  Recent Signal History
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-gray-400 border-b border-gray-100">
                        <th className="text-left pb-2">Date</th>
                        <th className="text-left pb-2">Signal</th>
                        <th className="text-right pb-2">Market Return</th>
                        <th className="text-right pb-2">Strategy Return</th>
                        <th className="text-right pb-2">Cumulative</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.data.slice(-15).reverse().map((row, i) => (
                        <tr key={i} className="border-b border-gray-50">
                          <td className="py-2 text-gray-500">{row.date}</td>
                          <td className="py-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${row.signal === 'BUY' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                              {row.signal}
                            </span>
                          </td>
                          <td className={`py-2 text-right ${row.return >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {row.return >= 0 ? '+' : ''}{row.return}%
                          </td>
                          <td className={`py-2 text-right font-medium ${row.strategy_return >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {row.strategy_return >= 0 ? '+' : ''}{row.strategy_return}%
                          </td>
                          <td className={`py-2 text-right font-medium ${row.cumulative >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
                            {row.cumulative >= 0 ? '+' : ''}{row.cumulative}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  )
}