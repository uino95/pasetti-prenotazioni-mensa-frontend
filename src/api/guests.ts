import { createUser, type User, type UserWithOrderCount, getUsers } from './admin/users'
import qs from 'qs'
import apiClient from './client'

export interface CreateGuestRequest {
  name: string
}

/**
 * Fetches guests (users with isGuest === true) that have at least one order in the current day.
 * Uses Strapi v5 deep filtering: filtering on the relation returns only users with matching orders.
 */
export async function getAllGuestsWhoOrderedToday(): Promise<UserWithOrderCount[]> {
  const now = new Date()
  const startOfDay = new Date(now)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(now)
  endOfDay.setHours(23, 59, 59, 999)

  const query = qs.stringify(
    {
      filters: {
        isGuest: { $eq: true },
        orders: {
          createdAt: {
            $gte: startOfDay.toISOString(),
            $lte: endOfDay.toISOString(),
          },
        },
      },
      populate: {
        orders: {
          count: true,
          filters: {
            createdAt: {
              $gte: startOfDay.toISOString(),
              $lte: endOfDay.toISOString(),
            },
          },
        },
      },
    },
    { encodeValuesOnly: true },
  )
  const response = await apiClient.get<UserWithOrderCount[]>(`/api/users?${query}`)

  return response.data
}

/**
 * Fetches one page of guests (for modal search/list) with optional search.
 */
export async function getGuests(search?: string) {
  const filters = { isGuest: true as const, ...(search?.trim() ? { search: search.trim() } : {}) }
  return getUsers(filters)
}

/**
 * Creates a new guest user (user with isGuest: true) via createUser.
 */
export async function createGuest(data: CreateGuestRequest): Promise<User> {
  const username = data.name.trim()
  const email = `${username.toLowerCase().replace(/\s+/g, '.')}@guest.local`
  const password = `guest-${Date.now()}-${Math.random().toString(36).slice(2)}`
  return createUser({
    username,
    email,
    password,
    isGuest: true,
  })
}
