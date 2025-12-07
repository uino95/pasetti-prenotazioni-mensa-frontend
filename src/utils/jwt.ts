/**
 * JWT utility functions for decoding and checking token expiration
 */

interface JwtPayload {
  exp?: number
  iat?: number
  [key: string]: unknown
}

/**
 * Decodes a JWT token without verification
 * @param token - The JWT token to decode
 * @returns The decoded payload or null if invalid
 */
export function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }

    const payload = parts[1]
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(decoded) as JwtPayload
  } catch (error) {
    console.error('Failed to decode JWT:', error)
    return null
  }
}

/**
 * Checks if a JWT token is expired
 * @param token - The JWT token to check
 * @returns true if the token is expired or invalid, false otherwise
 */
export function isTokenExpired(token: string | null): boolean {
  if (!token) {
    return true
  }

  const payload = decodeJwt(token)
  if (!payload || !payload.exp) {
    return true
  }

  // exp is in seconds, Date.now() is in milliseconds
  const expirationTime = payload.exp * 1000
  const currentTime = Date.now()

  // Add a 60 second buffer to refresh before actual expiration
  return currentTime >= expirationTime - 60000
}

/**
 * Gets the expiration time of a JWT token
 * @param token - The JWT token
 * @returns The expiration timestamp in milliseconds, or null if invalid
 */
export function getTokenExpiration(token: string | null): number | null {
  if (!token) {
    return null
  }

  const payload = decodeJwt(token)
  if (!payload || !payload.exp) {
    return null
  }

  return payload.exp * 1000
}

