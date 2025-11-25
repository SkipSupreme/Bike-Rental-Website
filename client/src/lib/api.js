// API configuration
// In production, set VITE_API_URL to your backend URL (e.g., https://your-backend.railway.app)
// In development, it defaults to the local server via Vite proxy

const API_URL = import.meta.env.VITE_API_URL || ''

export async function api(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`

  const config = {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  }

  // Don't set Content-Type for FormData
  if (options.body instanceof FormData) {
    delete config.headers['Content-Type']
  }

  const response = await fetch(url, config)

  // Try to parse JSON, but handle non-JSON responses
  let data
  try {
    data = await response.json()
  } catch (e) {
    data = { error: 'Server error' }
  }

  if (!response.ok) {
    throw new Error(data.error || `HTTP error ${response.status}`)
  }

  return data
}

export default api
