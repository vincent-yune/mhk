import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import HousePage from './pages/HousePage'
import ItemPage from './pages/ItemPage'
import IotPage from './pages/IotPage'
import CommunityPage from './pages/CommunityPage'
import ProtectedLayout from './components/ProtectedLayout'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false }
  }
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="house" element={<HousePage />} />
            <Route path="items" element={<ItemPage />} />
            <Route path="iot" element={<IotPage />} />
            <Route path="community" element={<CommunityPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { borderRadius: '10px', fontFamily: 'Noto Sans KR, sans-serif', fontSize: '14px' }
        }}
      />
    </QueryClientProvider>
  )
}
