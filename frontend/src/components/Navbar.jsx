import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'


export default function Navbar({ prices }) {
  const { token, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
      
      {/* Logo */}
      <div className="flex items-center gap-8">
        <Link to="/" className="text-xl font-bold text-gray-900">
          Finance<span className="text-yellow-500">AI</span>
        </Link>

        {/* Search */}
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 w-64">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            type="text"
            placeholder="Search assets, news..."
            className="bg-transparent text-sm outline-none text-gray-600 w-full"
          />
        </div>
      </div>

      {/* Live Prices Ticker */}
      <div className="flex items-center gap-6 text-sm">
        {prices?.gold && (
          <span className="flex items-center gap-1">
            <span className="text-gray-500">Gold</span>
            <span className="font-medium">${prices.gold.price}</span>
            <span className={prices.gold.change >= 0 ? 'text-green-500' : 'text-red-500'}>
              {prices.gold.change >= 0 ? '▲' : '▼'} {prices.gold.changePercent}%
            </span>
          </span>
        )}
        {prices?.silver && (
          <span className="flex items-center gap-1">
            <span className="text-gray-500">Silver</span>
            <span className="font-medium">${prices.silver.price}</span>
            <span className={prices.silver.change >= 0 ? 'text-green-500' : 'text-red-500'}>
              {prices.silver.change >= 0 ? '▲' : '▼'} {prices.silver.changePercent}%
            </span>
          </span>
        )}
        {prices?.nifty && (
          <span className="flex items-center gap-1">
            <span className="text-gray-500">Nifty 50</span>
            <span className="font-medium">{prices.nifty.price}</span>
            <span className={prices.nifty.change >= 0 ? 'text-green-500' : 'text-red-500'}>
              {prices.nifty.change >= 0 ? '▲' : '▼'} {prices.nifty.changePercent}%
            </span>
          </span>
        )}
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-3">
        

        {token ? (
          <button
            onClick={handleLogout}
            className="text-sm px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
          >
            Logout
          </button>
        ) : (
          <>
            <Link
              to="/login"
              className="text-sm px-4 py-2 rounded-lg border border-yellow-500 text-yellow-600 hover:bg-yellow-50"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="text-sm px-4 py-2 rounded-lg bg-yellow-500 text-white hover:bg-yellow-600"
            >
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}