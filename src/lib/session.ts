export const SESSION_TOKEN_KEY = 'jsquizup-session-token'

export function getStoredSessionToken() {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(SESSION_TOKEN_KEY)
}

export function setStoredSessionToken(token: string) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(SESSION_TOKEN_KEY, token)
}
