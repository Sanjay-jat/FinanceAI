import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import AssetCard from '../components/AssetCard'
import SignalBanner from '../components/SignalBanner'
import PriceChart from '../components/PriceChart'
import MoodGauge from '../components/MoodGauge'
import API from '../api/axios'
import { useAuth } from '../context/AuthContext'

// Helper function to process signal and price data
const processData = (signalRes, priceRes) => {
  if (signalRes.status !== 'fulfilled') return null
  return {
    ...signalRes.value.data,
    price: priceRes.value?.data?.price,
    change: priceRes.value?.data?.change,
    changePercent: priceRes.value?.data?.changePercent
  }
}

export default function Dashboard() {
  const { token } = useAuth()
  const [selectedAsset, setSelectedAsset] = useState('gold')
  const [chartType, setChartType] = useState('line')
  const [signals, setSignals] = useState({ gold: null, silver: null, nifty: null })
  const [prices, setPrices] = useState({ gold: null, silver: null, nifty: null })
  const [news, setNews] = useState(null)
  const [watchlist, setWatchlist] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAbout, setShowAbout] = useState(false)

  useEffect(() => {
    fetchAllData()
  }, [token]) // re-fetch when login state changes

  const fetchAllData = async (retryCount = 0) => {
    try {
      setError(null)

      // ✅ KEY FIX: use private route when logged in (saves to DB → history works)
      // use public route when not logged in
      const signalRoute = (asset) =>
        token ? `/signals/private/${asset}` : `/signals/public/${asset}`

      const [goldRes, silverRes, niftyRes, newsRes,
             goldPrice, silverPrice, niftyPrice] = await Promise.allSettled([
        API.get(signalRoute('gold')),
        API.get(signalRoute('silver')),
        API.get(signalRoute('nifty')),
        API.get('/signals/news'),
        API.get('/signals/price/gold'),
        API.get('/signals/price/silver'),
        API.get('/signals/price/nifty'),
      ])

      // Check if all signal calls failed (server still waking up)
      const allFailed = [goldRes, silverRes, niftyRes].every(
        r => r.status === 'rejected' || r.value?.data?.error
      )

      if (allFailed && retryCount < 3) {
        setError(`Server is waking up... retrying (${retryCount + 1}/3)`)
        setTimeout(() => fetchAllData(retryCount + 1), 5000)
        return
      }

      setSignals({
        gold: processData(goldRes, goldPrice),
        silver: processData(silverRes, silverPrice),
        nifty: processData(niftyRes, niftyPrice)
      })

      setPrices({
        gold: goldPrice.status === 'fulfilled' ? goldPrice.value.data : null,
        silver: silverPrice.status === 'fulfilled' ? silverPrice.value.data : null,
        nifty: niftyPrice.status === 'fulfilled' ? niftyPrice.value.data : null,
      })

      if (newsRes.status === 'fulfilled') {
        setNews(newsRes.value.data.news)
      }

      setWatchlist([
        { symbol: 'GOLDUSD', price: `$${goldPrice.value?.data?.price ?? '--'}`, change: `${goldPrice.value?.data?.changePercent ?? '--'}%`, up: goldPrice.value?.data?.change >= 0 },
        { symbol: 'SILVERUSD', price: `$${silverPrice.value?.data?.price ?? '--'}`, change: `${silverPrice.value?.data?.changePercent ?? '--'}%`, up: silverPrice.value?.data?.change >= 0 },
        { symbol: 'NIFTY50', price: niftyPrice.value?.data?.price ?? '--', change: `${niftyPrice.value?.data?.changePercent ?? '--'}%`, up: niftyPrice.value?.data?.change >= 0 },
        { symbol: 'CRUDEOIL', price: '$78.14', change: '+1.45%', up: true },
        { symbol: 'US10Y', price: '4.21', change: '-0.71%', up: false },
      ])

    } catch (err) {
      console.error(err)
      setError("Failed to load dashboard data. Please check your connection or try again later.")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium animate-pulse">Loading FinanceAI Dashboard...</p>
        </div>
      </div>
    )
  }

  const currentSignal = signals[selectedAsset]
  const currentFeatures = currentSignal?.features

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar prices={prices}/>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          selectedAsset={selectedAsset}
          setSelectedAsset={setSelectedAsset}
          chartType={chartType}
          setChartType={setChartType}
          news={news}
        />

        <div className="flex-1 flex flex-col overflow-auto">

          {error && (
            <div className="mx-4 mt-4 bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-md shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-yellow-700 font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Asset Cards */}
          <div className="flex gap-4 p-4">
            {['gold', 'silver', 'nifty'].map(asset => (
              <AssetCard
                key={asset}
                asset={asset}
                data={signals[asset]}
                selected={selectedAsset === asset}
                onClick={() => setSelectedAsset(asset)}
              />
            ))}
          </div>

          {/* Signal Banner */}
          <div className="px-4 pb-3">
            <SignalBanner data={currentSignal} asset={selectedAsset}/>
          </div>

          {/* Chart + Right Panel */}
          <div className="flex gap-4 px-4 pb-3 flex-1 min-h-0" style={{ height: '420px' }}>
            <div className="flex-1 flex flex-col min-h-0">
              <PriceChart asset={selectedAsset} chartType={chartType}/>
            </div>

            <div className="w-52 flex flex-col gap-3">
              <MoodGauge
                rsi={currentFeatures?.RSI}
                macd={currentFeatures?.MACD}
                trendStrength={currentFeatures?.TrendStrength}
              />
              <div className="bg-white border border-gray-200 rounded-xl p-4 flex-1">
                <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Live Features</p>
                <div className="flex flex-col gap-2">
                  {currentFeatures && Object.entries(currentFeatures).map(([key, val]) => (
                    <div key={key} className="flex justify-between items-center py-1 border-b border-gray-50">
                      <span className="text-xs text-gray-500">{key}</span>
                      <span className={`text-xs font-medium ${val < 0 ? 'text-red-500' : 'text-gray-900'}`}>
                        {typeof val === 'number' ? val.toFixed(2) : val}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="flex gap-4 px-4 pb-4 items-start">

            {/* LEFT COLUMN: Metrics + About */}
            <div className="flex-1 flex flex-col gap-4">

              {/* Model Metrics */}
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex gap-6">
                  {[
                    { label: 'Accuracy', val: selectedAsset === 'gold' ? '59%' : selectedAsset === 'silver' ? '51%' : '52%', icon: '🎯' },
                    { label: 'Precision', val: selectedAsset === 'gold' ? '0.56' : selectedAsset === 'silver' ? '0.55' : '0.51', icon: '📊' },
                    { label: 'Recall', val: selectedAsset === 'gold' ? '0.59' : selectedAsset === 'silver' ? '0.51' : '0.52', icon: '🔄' },
                    { label: 'F1 Score', val: selectedAsset === 'gold' ? '0.53' : selectedAsset === 'silver' ? '0.49' : '0.48', icon: '⭐' },
                    { label: 'Model', val: 'XGBoost', icon: '🤖' },
                  ].map((m, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xl">{m.icon}</span>
                      <div>
                        <p className="text-xs text-gray-400">{m.label}</p>
                        <p className="text-base font-semibold text-gray-900">{m.val}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* About FinanceAI */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setShowAbout(!showAbout)}
                  className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition"
                >
                  <span className="text-gray-500 text-sm">
                    {showAbout ? '▼' : '▶'}
                  </span>
                  <div className="text-left">
                    <h2 className="text-sm font-bold text-gray-900">About FinanceAI</h2>
                    <p className="text-xs text-gray-400">Financial Signal Classification System</p>
                  </div>
                </button>

                {showAbout && (
                  <div className="px-6 pb-6 border-t border-gray-100">
                    <p className="text-xs text-gray-500 leading-relaxed mt-4 mb-5">
                      FinanceAI is a full-stack machine learning project that predicts next-day
                      directional signals — BUY or SELL — for Gold, Silver, and Nifty 50.
                      Built using XGBoost trained on 10 years of historical market data with
                      technical indicators including RSI, MACD, and Moving Averages. The platform
                      features a FastAPI backend with JWT authentication, a PostgreSQL database,
                      a backtesting engine to evaluate historical signal performance, and automated
                      weekly model retraining.
                    </p>

                    <div className="grid grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                      <div>
                        <p className="text-xs text-gray-400 mb-1">ML Model</p>
                        <p className="text-xs font-semibold text-gray-900">XGBoost</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Data Source</p>
                        <p className="text-xs font-semibold text-gray-900">Yahoo Finance (10Y)</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Tech Stack</p>
                        <p className="text-xs font-semibold text-gray-900">FastAPI · React · PostgreSQL</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Assets Covered</p>
                        <p className="text-xs font-semibold text-gray-900">Gold · Silver · Nifty 50</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* RIGHT COLUMN: Watchlist + Developer */}
            <div className="w-80 flex flex-col gap-4">

              {/* Watchlist */}
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Watchlist</p>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-400 border-b border-gray-100">
                      <th className="text-left pb-2">Symbol</th>
                      <th className="text-right pb-2">Price</th>
                      <th className="text-right pb-2">Change %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {watchlist.map((w, i) => (
                      <tr key={i} className="border-b border-gray-50">
                        <td className="py-2 font-medium text-gray-700">{w.symbol}</td>
                        <td className="py-2 text-right text-gray-900">{w.price}</td>
                        <td className={`py-2 text-right font-medium ${w.up ? 'text-green-500' : 'text-red-500'}`}>
                          {w.change}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Developer Card */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col gap-3 w-full">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center text-xl font-bold text-yellow-600">
                    SJ
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Sanjay Jat</p>
                    <p className="text-xs text-gray-400">B.Tech CSE · 3rd Year</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>🎓</span> Rajasthan, India
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>💡</span> Exploring ML · Building Full Stack
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>🚀</span> Open to Opportunities
                  </div>
                </div>

                <div className="flex gap-2 mt-1">
                  <a
                    href="https://github.com/sanjayjat354339-cell"
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 text-center text-xs py-1.5 rounded-lg bg-gray-900 text-white hover:bg-gray-700"
                  >
                    GitHub
                  </a>
                  <a
                    href="https://www.linkedin.com/in/sanjay-jat-250767346"
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 text-center text-xs py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                  >
                    LinkedIn
                  </a>
                </div>
              </div>

            </div>

          </div>

        </div>
      </div>
    </div>
  )
}