import { ref } from 'vue'
import { AxiosError } from 'axios'
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  type User,
  type CreateUserRequest,
  type UpdateUserRequest,
  type UserFilters,
  type UserWithOrderCount,
} from '@/api/admin/users'

export function useAdminUsers() {
  const users = ref<UserWithOrderCount[]>([])
  const currentUser = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchUsers = async (filters?: UserFilters) => {
    loading.value = true
    error.value = null
    try {
      users.value = await getUsers(filters)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch users'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchUser = async (userId: number) => {
    loading.value = true
    error.value = null
    try {
      currentUser.value = await getUser(userId)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch user'
      throw err
    } finally {
      loading.value = false
    }
  }

  const createNewUser = async (data: CreateUserRequest) => {
    loading.value = true
    error.value = null
    try {
      const newUser = await createUser(data)
      users.value.push({
        ...newUser,
        orders: {
          count: 0,
        },
      })
      return newUser
    } catch (err: unknown) {
      if (err instanceof AxiosError && err.response?.status === 400) {
        error.value = err.response?.data?.error?.message || 'Failed to create user'
      } else {
        error.value = err instanceof Error ? err.message : 'Failed to create user'
      }
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateExistingUser = async (userId: number, data: UpdateUserRequest) => {
    loading.value = true
    error.value = null
    try {
      const updatedUser = await updateUser(userId, data)
      const index = users.value.findIndex((u) => u.id === userId)
      if (index !== -1 && users.value[index]) {
        users.value[index] = {
          ...users.value[index],
          ...updatedUser,
        }
      }
      if (currentUser.value?.id === userId) {
        currentUser.value = updatedUser
      }
      return updatedUser
    } catch (err: unknown) {
      if (err instanceof AxiosError && err.response?.status === 400) {
        error.value = err.response?.data?.error?.message || 'Failed to update user'
      } else {
        error.value = err instanceof Error ? err.message : 'Failed to update user'
      }
      throw err
    } finally {
      loading.value = false
    }
  }

  const removeUser = async (userId: number) => {
    loading.value = true
    error.value = null
    try {
      await deleteUser(userId)
      users.value = users.value.filter((u) => u.id !== userId)
      if (currentUser.value?.id === userId) {
        currentUser.value = null
      }
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to delete user'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    users,
    currentUser,
    loading,
    error,
    fetchUsers,
    fetchUser,
    createNewUser,
    updateExistingUser,
    removeUser,
  }
}
