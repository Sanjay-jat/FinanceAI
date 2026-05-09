import { Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Register from './pages/Register'
import Backtesting from './pages/Backtesting'
import History from './pages/History'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/backtesting" element={<Backtesting />} />
        <Route path="/history" element={<History />} />
      </Routes>
    </div>
  )
}

export default App