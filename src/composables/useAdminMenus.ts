import { ref } from 'vue'
import { AxiosError } from 'axios'
import {
  getMenus,
  getMenuByDate,
  createMenu,
  updateMenu,
  deleteMenu,
  addMenuItemToMenu,
  removeMenuItemFromMenu,
  type Menu,
  type CreateMenuRequest,
  type UpdateMenuRequest,
} from '@/api/admin/menus'
import { getProducts, type Product, type ProductFilters } from '@/api/admin/products'

export function useAdminMenus() {
  const menus = ref<Menu[]>([])
  const currentMenu = ref<Menu | null>(null)
  const availableProducts = ref<Product[]>([])
  const totalAvailableProducts = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchMenus = async (filters?: { day?: { from?: string; to?: string } }) => {
    loading.value = true
    error.value = null
    try {
      menus.value = await getMenus(filters)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch menus'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchMenuByDate = async (date: Date) => {
    loading.value = true
    error.value = null
    try {
      currentMenu.value = await getMenuByDate(date)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch menu'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchAvailableProducts = async (filters?: ProductFilters) => {
    try {
      const response = await getProducts(filters)
      if (!filters?.pagination?.start) {
        availableProducts.value = response.data
      } else {
        availableProducts.value = [...availableProducts.value, ...response.data]
      }
      totalAvailableProducts.value = response.meta.pagination.total
    } catch (err: unknown) {
      console.error('Failed to fetch products:', err)
    }
  }

  const createNewMenu = async (data: CreateMenuRequest) => {
    loading.value = true
    error.value = null
    try {
      const newMenu = await createMenu(data)
      currentMenu.value = newMenu
      return newMenu
    } catch (err: unknown) {
      if (err instanceof AxiosError && err.response?.status === 400) {
        error.value = err.response?.data?.error?.message || 'Failed to create menu'
      } else {
        error.value = err instanceof Error ? err.message : 'Failed to create menu'
      }
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateExistingMenu = async (menuId: string, data: UpdateMenuRequest) => {
    loading.value = true
    error.value = null
    try {
      const updatedMenu = await updateMenu(menuId, data)
      if (currentMenu.value?.documentId === menuId) {
        currentMenu.value = updatedMenu
      }
      return updatedMenu
    } catch (err: unknown) {
      if (err instanceof AxiosError && err.response?.status === 400) {
        error.value = err.response?.data?.error?.message || 'Failed to update menu'
      } else {
        error.value = err instanceof Error ? err.message : 'Failed to update menu'
      }
      throw err
    } finally {
      loading.value = false
    }
  }

  const removeMenu = async (menuId: string) => {
    loading.value = true
    error.value = null
    try {
      await deleteMenu(menuId)
      if (currentMenu.value?.documentId === menuId) {
        currentMenu.value = null
      }
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to delete menu'
      throw err
    } finally {
      loading.value = false
    }
  }

  const addProductToMenu = async (menuId: string, productId: string) => {
    loading.value = true
    error.value = null
    try {
      const updatedMenu = await addMenuItemToMenu(menuId, productId)
      if (currentMenu.value?.documentId === menuId) {
        currentMenu.value = updatedMenu
      }
      return updatedMenu
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to add product to menu'
      throw err
    } finally {
      loading.value = false
    }
  }

  const removeProductFromMenu = async (menuId: string, productId: string) => {
    loading.value = true
    error.value = null
    try {
      const updatedMenu = await removeMenuItemFromMenu(menuId, productId)
      if (currentMenu.value?.documentId === menuId) {
        currentMenu.value = updatedMenu
      }
      return updatedMenu
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to remove product from menu'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    menus,
    currentMenu,
    availableProducts,
    totalAvailableProducts,
    loading,
    error,
    fetchMenus,
    fetchMenuByDate,
    fetchAvailableProducts,
    createNewMenu,
    updateExistingMenu,
    removeMenu,
    addProductToMenu,
    removeProductFromMenu,
  }
}
