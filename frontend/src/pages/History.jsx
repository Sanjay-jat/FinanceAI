import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import API from '../api/axios'

export default function History() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedAsset, setSelectedAsset] = useState('gold')
  const [chartType, setChartType] = useState('line')
  const [news, setNews] = useState([])
  const [filter, setFilter] = useState('all')

  const fetchHistory = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await API.get('/signals/history')
      setHistory(res.data.history)
    } catch (err) {
      console.error(err)
      if (err.response?.status === 401) {
        navigate('/login')
      } else {
        setError('Failed to load history. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }
    fetchHistory()
    API.get('/signals/news').then(r => setNews(r.data.news)).catch(() => {})
  }, [token])

  const filtered = history.filter(h => {
    if (filter === 'all') return true
    if (filter === 'buy') return h.signal === 'BUY'
    if (filter === 'sell') return h.signal === 'SELL'
    return h.asset === filter
  })

  const formatDate = (dateStr) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  const stats = {
    total: history.length,
    buys: history.filter(h => h.signal === 'BUY').length,
    sells: history.filter(h => h.signal === 'SELL').length,
    avgConfidence: history.length
      ? Math.round(history.reduce((a, b) => a + b.confidence, 0) / history.length * 100)
      : 0
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar prices={{}} />

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
          <div>
            <h1 className="text-xl font-bold text-gray-900">Signal History</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Your personal signal check history
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-xs text-gray-400 mb-1">Total Checks</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-xs text-gray-400 mb-1">BUY Signals</p>
              <p className="text-2xl font-bold text-green-500">{stats.buys}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-xs text-gray-400 mb-1">SELL Signals</p>
              <p className="text-2xl font-bold text-red-500">{stats.sells}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-xs text-gray-400 mb-1">Avg Confidence</p>
              <p className="text-2xl font-bold text-blue-500">{stats.avgConfidence}%</p>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 flex-wrap">
            {[
              { id: 'all', label: 'All' },
              { id: 'buy', label: 'BUY Only' },
              { id: 'sell', label: 'SELL Only' },
              { id: 'gold', label: 'Gold' },
              { id: 'silver', label: 'Silver' },
              { id: 'nifty', label: 'Nifty 50' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`text-xs px-4 py-2 rounded-lg ${
                  filter === f.id
                    ? 'bg-yellow-500 text-white'
                    : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* History Table */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 flex-1">
            {loading ? (
              <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
                Loading history...
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-40 gap-3">
                <p className="text-red-500 text-sm">{error}</p>
                <button
                  onClick={fetchHistory}
                  className="text-xs px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
                >
                  Retry
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 gap-2">
                <p className="text-gray-400 text-sm">No signal history yet</p>
                <p className="text-gray-300 text-xs">
                  Check signals on the dashboard to build your history
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-400 border-b border-gray-100">
                      <th className="text-left pb-3">Date & Time</th>
                      <th className="text-left pb-3">Asset</th>
                      <th className="text-left pb-3">Signal</th>
                      <th className="text-right pb-3">Confidence</th>
                      <th className="text-right pb-3">RSI</th>
                      <th className="text-right pb-3">MACD</th>
                      <th className="text-right pb-3">MA7</th>
                      <th className="text-right pb-3">MA30</th>
                      <th className="text-center pb-3">Market</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((h, i) => (
                      <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-3 text-gray-400">{formatDate(h.created_at)}</td>
                        <td className="py-3 font-medium text-gray-700 uppercase">{h.asset}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            h.signal === 'BUY'
                              ? 'bg-green-100 text-green-600'
                              : 'bg-red-100 text-red-600'
                          }`}>
                            {h.signal}
                          </span>
                        </td>
                        <td className="py-3 text-right font-medium text-blue-500">
                          {Math.round(h.confidence * 100)}%
                        </td>
                        <td className="py-3 text-right text-gray-600">
                          {h.rsi?.toFixed(2) ?? '--'}
                        </td>
                        <td className={`py-3 text-right ${h.macd < 0 ? 'text-red-500' : 'text-green-500'}`}>
                          {h.macd?.toFixed(2) ?? '--'}
                        </td>
                        <td className="py-3 text-right text-gray-600">
                          {h.ma7?.toFixed(2) ?? '--'}
                        </td>
                        <td className="py-3 text-right text-gray-600">
                          {h.ma30?.toFixed(2) ?? '--'}
                        </td>
                        <td className="py-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            h.market_open
                              ? 'bg-green-100 text-green-600'
                              : 'bg-orange-100 text-orange-600'
                          }`}>
                            {h.market_open ? 'Open' : 'Closed'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}