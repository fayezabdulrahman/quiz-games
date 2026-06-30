const explicitApiUrl = import.meta.env.VITE_API_URL?.trim()
const socketUrl = import.meta.env.VITE_SOCKET_URL?.trim()

const apiBaseUrl = (explicitApiUrl || socketUrl || '').replace(/\/$/, '')

export function apiUrl(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return apiBaseUrl ? `${apiBaseUrl}${normalizedPath}` : normalizedPath
}
