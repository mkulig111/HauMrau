import axios, { AxiosError } from 'axios'
import type {
  Pet, WeightLog, DietPlan, MealLog, PetEvent, Vaccination, HealthRecord,
  AuthTokens, CaloriesSuggestion, ActivityFactor
} from '../types'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api/v1',
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let isRefreshing = false
let refreshSubscribers: Array<(token: string) => void> = []

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean }
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshSubscribers.push((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`
            }
            resolve(api(originalRequest))
          })
        })
      }
      originalRequest._retry = true
      isRefreshing = true
      try {
        const response = await api.post<{ accessToken: string }>('/auth/refresh')
        const { accessToken } = response.data
        localStorage.setItem('accessToken', accessToken)
        refreshSubscribers.forEach((cb) => cb(accessToken))
        refreshSubscribers = []
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`
        }
        return api(originalRequest)
      } catch {
        localStorage.removeItem('accessToken')
        window.location.href = '/login'
        return Promise.reject(error)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  register: (data: { email: string; name: string; password: string }) =>
    api.post<AuthTokens>('/auth/register', data).then((r) => r.data),
  login: (data: { email: string; password: string }) =>
    api.post<AuthTokens>('/auth/login', data).then((r) => r.data),
  logout: () => api.post('/auth/logout'),
  refresh: () => api.post<{ accessToken: string }>('/auth/refresh').then((r) => r.data),
}

export const petsApi = {
  list: () => api.get<Pet[]>('/pets').then((r) => r.data),
  get: (id: string) => api.get<Pet>(`/pets/${id}`).then((r) => r.data),
  create: (data: Omit<Pet, 'id' | 'userId' | 'createdAt'>) =>
    api.post<Pet>('/pets', data).then((r) => r.data),
  update: (id: string, data: Partial<Omit<Pet, 'id' | 'userId' | 'createdAt'>>) =>
    api.patch<Pet>(`/pets/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/pets/${id}`),
  uploadPhoto: (id: string, file: File) => {
    const form = new FormData()
    form.append('photo', file)
    return api.post<Pet>(`/pets/${id}/photo`, form).then((r) => r.data)
  },
}

export const weightApi = {
  list: (petId: string, params?: { from?: string; to?: string; limit?: number }) =>
    api.get<WeightLog[]>(`/pets/${petId}/weight`, { params }).then((r) => r.data),
  add: (petId: string, data: { weightKg: number; note?: string; loggedAt?: string }) =>
    api.post<WeightLog>(`/pets/${petId}/weight`, data).then((r) => r.data),
  delete: (petId: string, entryId: string) =>
    api.delete(`/pets/${petId}/weight/${entryId}`),
}

export const dietApi = {
  getPlan: (petId: string) =>
    api.get<DietPlan | null>(`/pets/${petId}/diet/plan`).then((r) => r.data),
  setPlan: (petId: string, data: Omit<DietPlan, 'id' | 'petId' | 'activeFrom'>) =>
    api.post<DietPlan>(`/pets/${petId}/diet/plan`, data).then((r) => r.data),
  getMealLog: (petId: string, date?: string) =>
    api.get<MealLog[]>(`/pets/${petId}/diet/log`, { params: { date } }).then((r) => r.data),
  addMeal: (petId: string, data: Omit<MealLog, 'id' | 'petId' | 'loggedAt'>) =>
    api.post<MealLog>(`/pets/${petId}/diet/log`, data).then((r) => r.data),
  deleteMeal: (petId: string, entryId: string) =>
    api.delete(`/pets/${petId}/diet/log/${entryId}`),
  suggest: (petId: string, activityFactor: ActivityFactor) =>
    api.get<CaloriesSuggestion>(`/pets/${petId}/diet/suggest`, { params: { activityFactor } }).then((r) => r.data),
}

export const eventsApi = {
  list: (petId: string, params?: { upcoming?: boolean; limit?: number }) =>
    api.get<PetEvent[]>(`/pets/${petId}/events`, { params }).then((r) => r.data),
  create: (petId: string, data: Omit<PetEvent, 'id' | 'petId' | 'createdAt' | 'done'>) =>
    api.post<PetEvent>(`/pets/${petId}/events`, data).then((r) => r.data),
  update: (petId: string, eventId: string, data: Partial<PetEvent>) =>
    api.patch<PetEvent>(`/pets/${petId}/events/${eventId}`, data).then((r) => r.data),
  delete: (petId: string, eventId: string) =>
    api.delete(`/pets/${petId}/events/${eventId}`),
}

export const healthApi = {
  listRecords: (petId: string) =>
    api.get<HealthRecord[]>(`/pets/${petId}/health`).then((r) => r.data),
  addRecord: (petId: string, data: FormData) =>
    api.post<HealthRecord>(`/pets/${petId}/health`, data).then((r) => r.data),
  listVaccinations: (petId: string) =>
    api.get<Vaccination[]>(`/pets/${petId}/vaccinations`).then((r) => r.data),
  addVaccination: (petId: string, data: Omit<Vaccination, 'id' | 'petId'>) =>
    api.post<Vaccination>(`/pets/${petId}/vaccinations`, data).then((r) => r.data),
  updateVaccination: (petId: string, vacId: string, data: Partial<Vaccination>) =>
    api.patch<Vaccination>(`/pets/${petId}/vaccinations/${vacId}`, data).then((r) => r.data),
}

export default api
