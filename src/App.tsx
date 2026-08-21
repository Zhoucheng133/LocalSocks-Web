import { Route, Routes } from 'react-router'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Register from './pages/Resgiter'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  )
}
