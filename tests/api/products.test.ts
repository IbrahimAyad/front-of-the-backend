import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import axios, { AxiosInstance } from 'axios'

describe('Products API Tests', () => {
  let api: AxiosInstance
  let adminToken: string
  let testProductId: string
  let testProducts: any[] = []

  beforeAll(async () => {
    api = axios.create({
      baseURL: process.env.API_URL || 'http://localhost:3000',
      validateStatus: () => true,
    })

    // Login as admin
    const loginResponse = await api.post('/api/auth/login', {
      email: 'admin@example.com',
      password: 'admin123',
    })

    if (loginResponse.status === 200) {
      adminToken = loginResponse.data.token || loginResponse.data.accessToken
    } else {
      throw new Error('Failed to login as admin')
    }
  })

  afterAll(async () => {
    // Clean up test products
    for (const product of testProducts) {
      await api.delete(`/api/products/${product.id}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
    }
  })

  describe('GET /api/products', () => {
    it('should list products without authentication', async () => {
      const response = await api.get('/api/products')

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('products')
      expect(response.data).toHaveProperty('total')
      expect(response.data).toHaveProperty('page', 1)
      expect(response.data).toHaveProperty('limit', 10)
      expect(Array.isArray(response.data.products)).toBe(true)
    })

    it('should support pagination', async () => {
      const page1 = await api.get('/api/products?page=1&limit=5')
      const page2 = await api.get('/api/products?page=2&limit=5')

      expect(page1.status).toBe(200)
      expect(page2.status).toBe(200)
      expect(page1.data.page).toBe(1)
      expect(page2.data.page).toBe(2)
      expect(page1.data.limit).toBe(5)
      expect(page1.data.products.length).toBeLessThanOrEqual(5)
    })

    it('should filter by category', async () => {
      const response = await api.get('/api/products?category=Suits')

      expect(response.status).toBe(200)
      const nonSuits = response.data.products.filter((p: any) => p.category !== 'Suits')
      expect(nonSuits.length).toBe(0)
    })

    it('should filter by price range', async () => {
      const minPrice = 100
      const maxPrice = 500
      const response = await api.get(`/api/products?minPrice=${minPrice}&maxPrice=${maxPrice}`)

      expect(response.status).toBe(200)
      response.data.products.forEach((product: any) => {
        expect(product.price).toBeGreaterThanOrEqual(minPrice)
        expect(product.price).toBeLessThanOrEqual(maxPrice)
      })
    })

    it('should sort products', async () => {
      const response = await api.get('/api/products?sort=price&order=desc')

      expect(response.status).toBe(200)
      const prices = response.data.products.map((p: any) => p.price)
      const sortedPrices = [...prices].sort((a, b) => b - a)
      expect(prices).toEqual(sortedPrices)
    })

    it('should search products', async () => {
      const response = await api.get('/api/products?search=wool')

      expect(response.status).toBe(200)
      response.data.products.forEach((product: any) => {
        const searchableText = `${product.name} ${product.description}`.toLowerCase()
        expect(searchableText).toContain('wool')
      })
    })
  })

  describe('GET /api/products/:id', () => {
    beforeEach(async () => {
      // Get a product ID for testing
      const response = await api.get('/api/products?limit=1')
      if (response.data.products.length > 0) {
        testProductId = response.data.products[0].id
      }
    })

    it('should get product by ID', async () => {
      const response = await api.get(`/api/products/${testProductId}`)

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('id', testProductId)
      expect(response.data).toHaveProperty('name')
      expect(response.data).toHaveProperty('price')
      expect(response.data).toHaveProperty('stock')
      expect(response.data).toHaveProperty('category')
    })

    it('should return 404 for non-existent product', async () => {
      const response = await api.get('/api/products/non-existent-id')

      expect(response.status).toBe(404)
      expect(response.data).toHaveProperty('error')
    })

    it('should include related data when requested', async () => {
      const response = await api.get(`/api/products/${testProductId}?include=images,variants`)

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('images')
      expect(response.data).toHaveProperty('variants')
    })
  })

  describe('POST /api/products', () => {
    it('should create product as admin', async () => {
      const newProduct = {
        name: 'Test Product ' + Date.now(),
        description: 'Test product for API testing',
        price: 299.99,
        category: 'Suits',
        stock: 100,
        sku: 'TEST-' + Date.now(),
        images: [
          { url: 'https://example.com/image1.jpg', alt: 'Front view' },
          { url: 'https://example.com/image2.jpg', alt: 'Back view' },
        ],
      }

      const response = await api.post('/api/products', newProduct, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response.status).toBe(201)
      expect(response.data).toHaveProperty('id')
      expect(response.data).toHaveProperty('name', newProduct.name)
      expect(response.data).toHaveProperty('price', newProduct.price)
      expect(response.data).toHaveProperty('sku', newProduct.sku)
      expect(response.data.images).toHaveLength(2)

      testProducts.push(response.data)
    })

    it('should validate required fields', async () => {
      const invalidProducts = [
        {}, // Empty object
        { name: 'No price' }, // Missing price
        { price: 100 }, // Missing name
        { name: 'Invalid price', price: -10 }, // Negative price
        { name: 'No category', price: 100 }, // Missing category
      ]

      for (const invalidProduct of invalidProducts) {
        const response = await api.post('/api/products', invalidProduct, {
          headers: { Authorization: `Bearer ${adminToken}` },
        })

        expect(response.status).toBe(400)
        expect(response.data).toHaveProperty('error')
      }
    })

    it('should prevent duplicate SKUs', async () => {
      const product1 = {
        name: 'Product 1',
        price: 100,
        category: 'Suits',
        sku: 'DUPLICATE-SKU',
        stock: 10,
      }

      const response1 = await api.post('/api/products', product1, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
      expect(response1.status).toBe(201)
      testProducts.push(response1.data)

      const product2 = { ...product1, name: 'Product 2' }
      const response2 = await api.post('/api/products', product2, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response2.status).toBe(409)
      expect(response2.data.error).toContain('SKU')
    })

    it('should require admin authentication', async () => {
      const response = await api.post('/api/products', {
        name: 'Unauthorized',
        price: 100,
        category: 'Suits',
      })

      expect(response.status).toBe(401)
    })
  })

  describe('PUT /api/products/:id', () => {
    let updateProductId: string

    beforeEach(async () => {
      // Create a product to update
      const response = await api.post(
        '/api/products',
        {
          name: 'Product to Update',
          price: 199.99,
          category: 'Ties',
          stock: 50,
          sku: 'UPDATE-' + Date.now(),
        },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      )
      updateProductId = response.data.id
      testProducts.push(response.data)
    })

    it('should update product fields', async () => {
      const updates = {
        name: 'Updated Product Name',
        price: 249.99,
        description: 'Updated description',
      }

      const response = await api.put(`/api/products/${updateProductId}`, updates, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('name', updates.name)
      expect(response.data).toHaveProperty('price', updates.price)
      expect(response.data).toHaveProperty('description', updates.description)
    })

    it('should validate update data', async () => {
      const response = await api.put(
        `/api/products/${updateProductId}`,
        { price: -50 },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      )

      expect(response.status).toBe(400)
      expect(response.data).toHaveProperty('error')
    })

    it('should return 404 for non-existent product', async () => {
      const response = await api.put(
        '/api/products/non-existent',
        { name: 'Updated' },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      )

      expect(response.status).toBe(404)
    })

    it('should require admin authentication', async () => {
      const response = await api.put(`/api/products/${updateProductId}`, {
        name: 'Unauthorized Update',
      })

      expect(response.status).toBe(401)
    })
  })

  describe('DELETE /api/products/:id', () => {
    let deleteProductId: string

    beforeEach(async () => {
      // Create a product to delete
      const response = await api.post(
        '/api/products',
        {
          name: 'Product to Delete',
          price: 99.99,
          category: 'Accessories',
          stock: 25,
          sku: 'DELETE-' + Date.now(),
        },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      )
      deleteProductId = response.data.id
    })

    it('should soft delete product', async () => {
      const response = await api.delete(`/api/products/${deleteProductId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('message')

      // Verify product is soft deleted (not in regular listing)
      const listResponse = await api.get('/api/products')
      const deletedProduct = listResponse.data.products.find(
        (p: any) => p.id === deleteProductId
      )
      expect(deletedProduct).toBeUndefined()
    })

    it('should return 404 for non-existent product', async () => {
      const response = await api.delete('/api/products/non-existent', {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response.status).toBe(404)
    })

    it('should require admin authentication', async () => {
      const response = await api.delete(`/api/products/${deleteProductId}`)

      expect(response.status).toBe(401)
    })
  })

  describe('Stock Operations', () => {
    let stockProductId: string

    beforeEach(async () => {
      // Create a product for stock operations
      const response = await api.post(
        '/api/products',
        {
          name: 'Stock Test Product',
          price: 149.99,
          category: 'Shirts',
          stock: 100,
          sku: 'STOCK-' + Date.now(),
        },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      )
      stockProductId = response.data.id
      testProducts.push(response.data)
    })

    it('should update stock levels', async () => {
      const response = await api.put(
        `/api/products/${stockProductId}/stock`,
        { quantity: -10, reason: 'Sale' },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      )

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('stock', 90)
    })

    it('should prevent negative stock', async () => {
      const response = await api.put(
        `/api/products/${stockProductId}/stock`,
        { quantity: -150, reason: 'Oversold' },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      )

      expect(response.status).toBe(400)
      expect(response.data.error).toContain('stock')
    })

    it('should track stock history', async () => {
      // Make several stock adjustments
      await api.put(
        `/api/products/${stockProductId}/stock`,
        { quantity: -5, reason: 'Sale' },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      )

      await api.put(
        `/api/products/${stockProductId}/stock`,
        { quantity: 20, reason: 'Restock' },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      )

      const response = await api.get(`/api/products/${stockProductId}/stock-history`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response.status).toBe(200)
      expect(Array.isArray(response.data)).toBe(true)
      expect(response.data.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('Bulk Operations', () => {
    it('should import products from CSV', async () => {
      const csvData = `name,price,category,stock,sku
Bulk Product 1,199.99,Suits,50,BULK-001
Bulk Product 2,299.99,Ties,30,BULK-002
Bulk Product 3,399.99,Shirts,20,BULK-003`

      const response = await api.post(
        '/api/products/import',
        { data: csvData, format: 'csv' },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      )

      expect([200, 201]).toContain(response.status)
      if (response.data.imported) {
        response.data.imported.forEach((p: any) => testProducts.push(p))
      }
    })

    it('should export products', async () => {
      const response = await api.get('/api/products/export?format=csv', {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response.status).toBe(200)
      expect(response.headers['content-type']).toContain('csv')
    })

    it('should bulk update products', async () => {
      const bulkUpdates = testProducts.slice(0, 3).map(p => ({
        id: p.id,
        updates: { price: p.price * 0.9 }, // 10% discount
      }))

      const response = await api.put('/api/products/bulk', bulkUpdates, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect([200, 207]).toContain(response.status) // 207 for multi-status
    })
  })

  describe('Search and Filter', () => {
    it('should search across multiple fields', async () => {
      const searchQueries = ['wool', 'navy', 'italian']

      for (const query of searchQueries) {
        const response = await api.get(`/api/products/search?q=${query}`)

        expect(response.status).toBe(200)
        expect(response.data).toHaveProperty('products')
        expect(response.data).toHaveProperty('total')
      }
    })

    it('should support advanced filters', async () => {
      const response = await api.get('/api/products', {
        params: {
          category: 'Suits',
          minPrice: 200,
          maxPrice: 800,
          inStock: true,
          sort: 'price',
          order: 'asc',
        },
      })

      expect(response.status).toBe(200)
      response.data.products.forEach((p: any) => {
        expect(p.category).toBe('Suits')
        expect(p.price).toBeGreaterThanOrEqual(200)
        expect(p.price).toBeLessThanOrEqual(800)
        expect(p.stock).toBeGreaterThan(0)
      })
    })

    it('should get products by multiple categories', async () => {
      const response = await api.get('/api/products?category=Suits,Ties')

      expect(response.status).toBe(200)
      response.data.products.forEach((p: any) => {
        expect(['Suits', 'Ties']).toContain(p.category)
      })
    })
  })

  describe('Analytics', () => {
    it('should get product statistics', async () => {
      const response = await api.get('/api/products/stats', {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('totalProducts')
      expect(response.data).toHaveProperty('totalValue')
      expect(response.data).toHaveProperty('categoryCounts')
      expect(response.data).toHaveProperty('lowStockProducts')
    })

    it('should get best sellers', async () => {
      const response = await api.get('/api/products/best-sellers', {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response.status).toBe(200)
      expect(Array.isArray(response.data)).toBe(true)
    })

    it('should get price distribution', async () => {
      const response = await api.get('/api/products/price-distribution', {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('ranges')
    })
  })
})