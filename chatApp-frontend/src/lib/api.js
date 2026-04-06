import axios from 'axios'

export const API_BASE_URL = 'http://localhost:5000/api'
export const SOCKET_BASE_URL = 'http://localhost:5000'

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

export function getErrorMessage(error, fallbackMessage = 'Request failed.') {
  return (
    error.response?.data?.message ??
    error.response?.data?.error ??
    error.message ??
    fallbackMessage
  )
}

export default api
