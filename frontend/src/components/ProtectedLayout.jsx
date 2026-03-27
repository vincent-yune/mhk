import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore, useHouseStore } from '../store/useStore'
import BottomNav from './BottomNav'
import Header from './Header'
import { useEffect } from 'react'
import api from '../api/axios'

export default function ProtectedLayout() {
  const { isAuthenticated } = useAuthStore()
  const { setHouses } = useHouseStore()

  useEffect(() => {
    if (isAuthenticated) {
      api.get('/houses').then(res => {
        setHouses(res.data.data)
      }).catch(() => {})
    }
  }, [isAuthenticated])

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="app-layout">
      {/* Top header */}
      <Header />

      {/* Scrollable page content */}
      <div className="main-content">
        <div className="page-content">
          <Outlet />
        </div>
      </div>

      {/* Bottom navigation */}
      <BottomNav />
    </div>
  )
}
