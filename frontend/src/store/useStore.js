import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (user, token) => {
        localStorage.setItem('token', token)
        set({ user, token, isAuthenticated: true })
      },

      logout: () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        set({ user: null, token: null, isAuthenticated: false })
      },

      updateUser: (user) => set({ user }),
    }),
    {
      name: 'myhouse-auth',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated })
    }
  )
)

export const useHouseStore = create((set, get) => ({
  selectedHouse: null,
  houses: [],
  // HousePage → ItemPage 구역 자동 필터 연동용
  pendingZoneFilter: null,   // { zoneId, zoneName } | null
  setHouses: (houses) => {
    const primary = houses.find(h => h.isPrimary) || houses[0]
    set({ houses, selectedHouse: get().selectedHouse || primary })
  },
  selectHouse: (house) => set({ selectedHouse: house }),
  setPendingZoneFilter: (zone) => set({ pendingZoneFilter: zone }),
  clearPendingZoneFilter: () => set({ pendingZoneFilter: null }),
}))
