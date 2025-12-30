import { ref } from 'vue'
import Papa from 'papaparse'
import { getCategories, getProducts, createProduct, type Product } from '@/api/admin/products'
import { createMenu, getMenuByDate, type Category } from '@/api/admin/menus'

interface CsvRow {
  day?: string
  primo?: string
  secondo?: string
  contorno?: string
  dessert?: string
}

// Map Italian day names to day of week (0 = Sunday, 1 = Monday, etc.)
const DAY_NAME_MAP: Record<string, number> = {
  domenica: 0,
  lunedì: 1,
  martedì: 2,
  mercoledì: 3,
  giovedì: 4,
  venerdì: 5,
  sabato: 6,
}

// Map CSV column names to category names (case-insensitive)
const CATEGORY_MAP: Record<string, string> = {
  primo: 'Primo',
  secondo: 'Secondo',
  contorno: 'Contorno',
  dessert: 'Dessert',
}

export function useMenuCsvImport() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const progress = ref<string>('')

  const parseCsv = (csvText: string): CsvRow[] => {
    // Parse CSV with papaparse
    const parseResult = Papa.parse<string[]>(csvText, {
      header: false,
      skipEmptyLines: true,
      transform: (value: string) => value.trim(),
    })

    if (parseResult.errors.length > 0) {
      console.warn('CSV parsing warnings:', parseResult.errors)
    }

    const data = parseResult.data
    if (data.length === 0) {
      throw new Error('CSV file is empty')
    }

    // Get header row
    const headerRow = data[0]
    if (!headerRow || headerRow.length === 0) {
      throw new Error('CSV file has no header row')
    }

    const headers = headerRow.map((h: string) => h.toLowerCase().trim())
    // Find column indices
    // Day might be in first column or have its own header
    const dayIndex = headers.findIndex(
      (h: string) => h.includes('giorno') || h === 'day' || h === '',
    )
    // If no explicit day column, assume first column can contain day names
    const effectiveDayIndex = dayIndex >= 0 ? dayIndex : 0
    const primoIndex = headers.findIndex((h: string) => h === 'primo')
    const secondoIndex = headers.findIndex((h: string) => h === 'secondo')
    const contornoIndex = headers.findIndex((h: string) => h === 'contorno')
    const dessertIndex = headers.findIndex((h: string) => h === 'dessert')

    const rows: CsvRow[] = []
    let currentDay: string | undefined

    // Parse data rows (skip header row)
    for (let i = 1; i < data.length; i++) {
      const row = data[i]
      if (!row || row.length === 0) continue

      // Check if this row contains a day name (in first column or day column)
      const dayValue = row[effectiveDayIndex]?.trim() || ''
      currentDay = dayValue.toLowerCase()

      // Skip rows without a current day set or without data
      const hasData = [primoIndex, secondoIndex, contornoIndex, dessertIndex].some(
        (idx) => idx >= 0 && idx < row.length && row[idx] && row[idx].trim(),
      )

      if (!hasData || !currentDay) {
        continue
      }

      rows.push({
        day: currentDay,
        primo: primoIndex >= 0 && row[primoIndex] ? row[primoIndex].trim() : undefined,
        secondo: secondoIndex >= 0 && row[secondoIndex] ? row[secondoIndex].trim() : undefined,
        contorno: contornoIndex >= 0 && row[contornoIndex] ? row[contornoIndex].trim() : undefined,
        dessert: dessertIndex >= 0 && row[dessertIndex] ? row[dessertIndex].trim() : undefined,
      })
    }

    return rows
  }

  const groupByDay = (
    rows: CsvRow[],
  ): Map<number, Array<{ name: string; categoryName: string }>> => {
    const grouped = new Map<number, Array<{ name: string; categoryName: string }>>()

    for (const row of rows) {
      if (!row.day) continue

      const dayOfWeek = DAY_NAME_MAP[row.day.toLowerCase()]
      if (dayOfWeek === undefined) continue

      if (!grouped.has(dayOfWeek)) {
        grouped.set(dayOfWeek, [])
      }

      const items = grouped.get(dayOfWeek)!

      // Add items from each column with their category name
      if (row.primo && row.primo.trim()) {
        items.push({ name: row.primo.trim(), categoryName: 'Primo' })
      }
      if (row.secondo && row.secondo.trim()) {
        items.push({ name: row.secondo.trim(), categoryName: 'Secondo' })
      }
      if (row.contorno && row.contorno.trim()) {
        items.push({ name: row.contorno.trim(), categoryName: 'Contorno' })
      }
      if (row.dessert && row.dessert.trim()) {
        items.push({ name: row.dessert.trim(), categoryName: 'Dessert' })
      }
    }

    return grouped
  }

  const getCategoryIdByName = (categories: Category[], categoryName: string): string | null => {
    const category = categories.find((c) => c.name.toLowerCase() === categoryName.toLowerCase())
    return category?.documentId || null
  }

  const findOrCreateProduct = async (
    productName: string,
    categoryId: string,
    existingProducts: Product[],
  ): Promise<{ productId: string; isNew: boolean; product?: Product }> => {
    // Check if product already exists
    const existing = existingProducts.find(
      (p) =>
        p.name.toLowerCase() === productName.toLowerCase() && p.category.documentId === categoryId,
    )
    if (existing) {
      return { productId: existing.documentId, isNew: false }
    }

    // Create new product
    progress.value = `Creating product: ${productName}`
    const newProduct = await createProduct({
      name: productName,
      category: categoryId,
    })
    return { productId: newProduct.documentId, isNew: true, product: newProduct }
  }

  const getDatesForDayOfWeek = (dayOfWeek: number, year: number, month: number): string[] => {
    const dates: string[] = []
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)

    // Find first occurrence of the day in the month
    const firstDayOfWeek = firstDay.getDay()
    const daysToAdd = (dayOfWeek - firstDayOfWeek + 7) % 7
    const currentDate = new Date(firstDay)
    currentDate.setDate(firstDay.getDate() + daysToAdd)

    // Add all occurrences of this day in the month
    while (currentDate <= lastDay) {
      const yearStr = currentDate.getFullYear()
      const monthStr = String(currentDate.getMonth() + 1).padStart(2, '0')
      const dayStr = String(currentDate.getDate()).padStart(2, '0')
      dates.push(`${yearStr}-${monthStr}-${dayStr}`)
      currentDate.setDate(currentDate.getDate() + 7) // Next week
    }

    return dates
  }

  const importCsv = async (
    csvFile: File,
    year?: number,
    month?: number,
  ): Promise<{ productsCreated: number; menusCreated: number }> => {
    loading.value = true
    error.value = null
    progress.value = ''

    try {
      // Read CSV file
      progress.value = 'Reading CSV file...'
      const csvText = await csvFile.text()

      // Parse CSV
      progress.value = 'Parsing CSV...'
      const rows = parseCsv(csvText)

      if (rows.length === 0) {
        throw new Error('No valid menu data found in CSV')
      }

      // Group by day
      progress.value = 'Grouping menu data by day...'
      const menuDataByDay = groupByDay(rows)

      if (menuDataByDay.size === 0) {
        throw new Error('No valid day information found in CSV')
      }

      // Fetch categories
      progress.value = 'Fetching categories...'
      const categories = await getCategories()
      if (categories.length === 0) {
        throw new Error('No categories found. Please create categories first.')
      }

      // Create category name to ID map
      const categoryMap = new Map<string, string>()
      for (const [csvCol, categoryName] of Object.entries(CATEGORY_MAP)) {
        const categoryId = getCategoryIdByName(categories, categoryName)
        if (categoryId) {
          categoryMap.set(csvCol, categoryId)
        }
      }

      if (categoryMap.size === 0) {
        throw new Error(
          'No matching categories found. Please ensure categories "Primo", "Secondo", "Contorno" and "Dessert" exist.',
        )
      }

      // Fetch all existing products
      progress.value = 'Fetching existing products...'
      const allProducts: Product[] = []
      let start = 0
      let hasMore = true
      while (hasMore) {
        const response = await getProducts({ pagination: { start, limit: 100 } })
        allProducts.push(...response.data)
        hasMore = response.data.length === 100
        start += 100
      }

      // Use provided year and month, or default to current month
      const now = new Date()
      const targetYear = year ?? now.getFullYear()
      const targetMonth = month ?? now.getMonth()

      // Process each day
      let productsCreated = 0
      let menusCreated = 0

      for (const [dayOfWeek, items] of menuDataByDay.entries()) {
        // Get all dates for this day of week in target month
        const dates = getDatesForDayOfWeek(dayOfWeek, targetYear, targetMonth)

        progress.value = `Processing ${dates.length} dates for day ${dayOfWeek}...`

        // For each date, create menu
        for (const date of dates) {
          // Check if menu already exists
          try {
            const existingMenu = await getMenuByDate(new Date(date))
            if (existingMenu) {
              progress.value = `Menu already exists for ${date}, skipping...`
              continue
            }
          } catch {
            // Menu doesn't exist, continue
          }

          // Create products and collect IDs
          const productIds: string[] = []

          for (const item of items) {
            const categoryId = getCategoryIdByName(categories, item.categoryName)
            if (!categoryId) continue

            const result = await findOrCreateProduct(item.name, categoryId, allProducts)
            if (!productIds.includes(result.productId)) {
              productIds.push(result.productId)
              // If this is a new product, add it to the cache and increment counter
              if (result.isNew && result.product) {
                productsCreated++
                allProducts.push(result.product)
              }
            }
          }

          // Create menu
          if (productIds.length > 0) {
            progress.value = `Creating menu for ${date}...`
            await createMenu({
              day: date,
              items: productIds,
            })
            menusCreated++
          }
        }
      }

      progress.value = `Import completed! Created ${productsCreated} products and ${menusCreated} menus.`

      return { productsCreated, menusCreated }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to import CSV'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    progress,
    importCsv,
  }
}
