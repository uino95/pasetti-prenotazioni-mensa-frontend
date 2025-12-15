import apiClient, { type ApiResponse, type Pagination } from '../client'
import qs from 'qs'
import type { Category } from './menus'

export interface Product {
  documentId: string
  name: string
  category: Category
}

export interface CreateProductRequest {
  name: string
  category: string
}

export interface UpdateProductRequest {
  name?: string
  category?: string
}

export interface ProductFilters {
  search?: string
  pagination?: Pagination
}

export async function getProducts(filters?: ProductFilters): Promise<ApiResponse<Product[]>> {
  const queryParams: Record<string, unknown> = {
    populate: ['category'],
    pagination: {
      limit: filters?.pagination?.limit || 25,
      start: filters?.pagination?.start || 0,
    },
  }
  const searchQuery = filters?.search?.toLowerCase()

  if (searchQuery) {
    queryParams.filters = {
      $or: [{ name: { $containsi: searchQuery } }, { category: { $containsi: searchQuery } }],
    }
  }

  const query = qs.stringify(queryParams)
  const response = await apiClient.get<ApiResponse<Product[]>>(`/api/items?${query}`)
  return response.data
}

export async function getProduct(productId: string): Promise<Product> {
  const query = qs.stringify({
    populate: ['category'],
  })
  const response = await apiClient.get<ApiResponse<Product>>(`/api/items/${productId}?${query}`)
  return response.data.data
}

export async function createProduct(data: CreateProductRequest): Promise<Product> {
  const query = qs.stringify({
    populate: ['category'],
  })
  const response = await apiClient.post<ApiResponse<Product>>(`/api/items?${query}`, {
    data: {
      name: data.name,
      category: data.category,
    },
  })
  return response.data.data
}

export async function updateProduct(
  productId: string,
  data: UpdateProductRequest,
): Promise<Product> {
  const updateData: Record<string, unknown> = {}
  if (data.name !== undefined) updateData.name = data.name
  if (data.category !== undefined) updateData.category = data.category

  const query = qs.stringify({
    populate: ['category'],
  })
  const response = await apiClient.put<ApiResponse<Product>>(`/api/items/${productId}?${query}`, {
    data: updateData,
  })
  return response.data.data
}

export async function deleteProduct(productId: string): Promise<void> {
  await apiClient.delete(`/api/items/${productId}`)
}

export async function getCategories(): Promise<Category[]> {
  const response = await apiClient.get<ApiResponse<Category[]>>(`/api/categories`)
  return response.data.data.sort((a, b) => a.order - b.order)
}
