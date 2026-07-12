import axios from "axios"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
})

// Request Interceptor (attaching JWT auth tokens in Phase 2)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("transitops-token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response Interceptor for global error catching
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle global API errors here (e.g. redirecting to /unauthorized on 403)
    if (error.response && error.response.status === 403) {
      window.location.href = "/unauthorized"
    }
    return Promise.reject(error)
  }
)

export default api
