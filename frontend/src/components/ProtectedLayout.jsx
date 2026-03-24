import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore, useHouseStore } from '../store/useStore'
import Sidebar from './Sidebar'
import Header from './Header'
import { useEffect } from 'react'
import api from '../api/axios'

export default function ProtectedLayout() {
  const { isAuthenticated } = useAuthStore()
  const { setHouses, selectedHouse } = useHouseStore()

  useEffect(() => {
    if (isAuthenticated) {
      // 집 목록 로드
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
      <Sidebar />
      <div className="main-content">
        <Header />
        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
