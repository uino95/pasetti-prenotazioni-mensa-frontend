import { ref } from 'vue'
import { AxiosError } from 'axios'
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  type Product,
  type CreateProductRequest,
  type UpdateProductRequest,
  type ProductFilters,
  getCategories,
} from '@/api/admin/products'
import { type Category } from '@/api/admin/menus'

export function useAdminProducts() {
  const products = ref<Product[]>([])
  const categories = ref<Category[]>([])
  const currentProduct = ref<Product | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const totalProducts = ref(0)

  const fetchProducts = async (filters?: ProductFilters) => {
    loading.value = true
    error.value = null
    try {
      const response = await getProducts(filters)
      if (!filters?.pagination?.start) {
        products.value = response.data
      } else {
        products.value = [...products.value, ...response.data]
      }
      totalProducts.value = response.meta.pagination.total
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch products'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchProduct = async (productId: string) => {
    loading.value = true
    error.value = null
    try {
      currentProduct.value = await getProduct(productId)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch product'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchCategories = async () => {
    try {
      categories.value = await getCategories()
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch categories'
      throw err
    } finally {
      loading.value = false
    }
  }

  const createNewProduct = async (data: CreateProductRequest) => {
    loading.value = true
    error.value = null
    try {
      const newProduct = await createProduct(data)
      products.value.push(newProduct)
      totalProducts.value++
      return newProduct
    } catch (err: unknown) {
      if (err instanceof AxiosError && err.response?.status === 400) {
        error.value = err.response?.data?.error?.message || 'Failed to create product'
      } else {
        error.value = err instanceof Error ? err.message : 'Failed to create product'
      }
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateExistingProduct = async (productId: string, data: UpdateProductRequest) => {
    loading.value = true
    error.value = null
    try {
      const updatedProduct = await updateProduct(productId, data)
      const index = products.value.findIndex((p) => p.documentId === productId)
      if (index !== -1) {
        products.value[index] = updatedProduct
      }
      if (currentProduct.value?.documentId === productId) {
        currentProduct.value = updatedProduct
      }
      return updatedProduct
    } catch (err: unknown) {
      if (err instanceof AxiosError && err.response?.status === 400) {
        error.value = err.response?.data?.error?.message || 'Failed to update product'
      } else {
        error.value = err instanceof Error ? err.message : 'Failed to update product'
      }
      throw err
    } finally {
      loading.value = false
    }
  }

  const removeProduct = async (productId: string) => {
    loading.value = true
    error.value = null
    try {
      await deleteProduct(productId)
      products.value = products.value.filter((p) => p.documentId !== productId)
      totalProducts.value--
      if (currentProduct.value?.documentId === productId) {
        currentProduct.value = null
      }
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to delete product'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    products,
    categories,
    currentProduct,
    loading,
    error,
    totalProducts,
    fetchProducts,
    fetchProduct,
    fetchCategories,
    createNewProduct,
    updateExistingProduct,
    removeProduct,
  }
}
