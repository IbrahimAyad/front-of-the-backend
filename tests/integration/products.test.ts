import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import axios, { AxiosInstance } from 'axios'

describe('Products Integration Tests', () => {
  let api: AxiosInstance
  let authToken: string
  let testProductId: string

  beforeAll(async () => {
    api = axios.create({
      baseURL: process.env.API_URL || 'http://localhost:3000',
      validateStatus: () => true,
    })

    // Login to get auth token
    const loginResponse = await api.post('/api/auth/login', {
      email: 'admin@example.com',
      password: 'admin123',
    })

    if (loginResponse.status === 200) {
      authToken = loginResponse.data.token || loginResponse.data.accessToken
    }
  })

  afterAll(async () => {
    // Clean up test products
    if (testProductId && authToken) {
      await api.delete(`/api/products/${testProductId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
    }
  })

  describe('Public Product Endpoints', () => {
    it('should list all products', async () => {
      const response = await api.get('/api/products')

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('products')
      expect(Array.isArray(response.data.products)).toBe(true)
      expect(response.data).toHaveProperty('total')
      expect(response.data).toHaveProperty('page')
      expect(response.data).toHaveProperty('limit')
    })

    it('should support pagination', async () => {
      const page1 = await api.get('/api/products?page=1&limit=5')
      const page2 = await api.get('/api/products?page=2&limit=5')

      expect(page1.status).toBe(200)
      expect(page2.status).toBe(200)
      expect(page1.data.products.length).toBeLessThanOrEqual(5)
      expect(page2.data.products.length).toBeLessThanOrEqual(5)

      // Ensure different products on different pages
      if (page1.data.products.length > 0 && page2.data.products.length > 0) {
        expect(page1.data.products[0].id).not.toBe(page2.data.products[0].id)
      }
    })

    it('should filter by category', async () => {
      const response = await api.get('/api/products?category=Suits')

      expect(response.status).toBe(200)
      expect(response.data.products.every((p: any) => p.category === 'Suits')).toBe(true)
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

    it('should get single product by ID', async () => {
      // First get a product ID
      const listResponse = await api.get('/api/products?limit=1')
      const productId = listResponse.data.products[0]?.id

      if (productId) {
        const response = await api.get(`/api/products/${productId}`)

        expect(response.status).toBe(200)
        expect(response.data).toHaveProperty('id', productId)
        expect(response.data).toHaveProperty('name')
        expect(response.data).toHaveProperty('price')
        expect(response.data).toHaveProperty('description')
      }
    })

    it('should return 404 for non-existent product', async () => {
      const response = await api.get('/api/products/non-existent-id')

      expect(response.status).toBe(404)
      expect(response.data).toHaveProperty('error')
    })
  })

  describe('Product Search', () => {
    it('should search products by query', async () => {
      const response = await api.get('/api/products/search?q=suit')

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('products')
      expect(Array.isArray(response.data.products)).toBe(true)
    })

    it('should handle empty search results', async () => {
      const response = await api.get('/api/products/search?q=xyznonexistent123')

      expect(response.status).toBe(200)
      expect(response.data.products).toEqual([])
    })

    it('should search with filters', async () => {
      const response = await api.get('/api/products/search?q=suit&category=Suits&maxPrice=500')

      expect(response.status).toBe(200)
      response.data.products.forEach((product: any) => {
        expect(product.category).toBe('Suits')
        expect(product.price).toBeLessThanOrEqual(500)
      })
    })
  })

  describe('Product Categories', () => {
    it('should get products by category', async () => {
      const response = await api.get('/api/products/category/Suits')

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('products')
      expect(response.data.products.every((p: any) => p.category === 'Suits')).toBe(true)
    })

    it('should support pagination in category endpoint', async () => {
      const response = await api.get('/api/products/category/Suits?page=1&limit=5')

      expect(response.status).toBe(200)
      expect(response.data.products.length).toBeLessThanOrEqual(5)
      expect(response.data).toHaveProperty('page', 1)
      expect(response.data).toHaveProperty('limit', 5)
    })
  })

  describe('Protected Product Operations', () => {
    it('should create a new product with admin token', async () => {
      if (!authToken) {
        console.warn('Skipping test: No auth token available')
        return
      }

      const newProduct = {
        name: 'Integration Test Product',
        description: 'Product created during integration testing',
        price: 299.99,
        category: 'Suits',
        stock: 50,
        sku: `TEST-${Date.now()}`,
      }

      const response = await api.post('/api/products', newProduct, {
        headers: { Authorization: `Bearer ${authToken}` },
      })

      expect(response.status).toBe(201)
      expect(response.data).toHaveProperty('id')
      expect(response.data).toHaveProperty('name', newProduct.name)
      expect(response.data).toHaveProperty('price', newProduct.price)

      testProductId = response.data.id
    })

    it('should not create product without auth', async () => {
      const response = await api.post('/api/products', {
        name: 'Unauthorized Product',
        price: 100,
      })

      expect(response.status).toBe(401)
    })

    it('should update product with admin token', async () => {
      if (!authToken || !testProductId) {
        console.warn('Skipping test: No auth token or test product')
        return
      }

      const updates = {
        price: 349.99,
        stock: 75,
      }

      const response = await api.put(`/api/products/${testProductId}`, updates, {
        headers: { Authorization: `Bearer ${authToken}` },
      })

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('price', updates.price)
      expect(response.data).toHaveProperty('stock', updates.stock)
    })

    it('should not update product without auth', async () => {
      if (!testProductId) return

      const response = await api.put(`/api/products/${testProductId}`, {
        price: 999.99,
      })

      expect(response.status).toBe(401)
    })

    it('should delete product with admin token', async () => {
      if (!authToken || !testProductId) {
        console.warn('Skipping test: No auth token or test product')
        return
      }

      const response = await api.delete(`/api/products/${testProductId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })

      expect(response.status).toBe(200)

      // Verify product is deleted
      const getResponse = await api.get(`/api/products/${testProductId}`)
      expect(getResponse.status).toBe(404)

      testProductId = '' // Clear the ID since it's deleted
    })
  })

  describe('Product Stats', () => {
    it('should get dashboard stats with auth', async () => {
      if (!authToken) {
        console.warn('Skipping test: No auth token available')
        return
      }

      const response = await api.get('/api/products/stats/dashboard', {
        headers: { Authorization: `Bearer ${authToken}` },
      })

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('totalProducts')
      expect(response.data).toHaveProperty('categories')
      expect(response.data).toHaveProperty('priceRange')
    })

    it('should not get stats without auth', async () => {
      const response = await api.get('/api/products/stats/dashboard')

      expect(response.status).toBe(401)
    })
  })

  describe('Product Images', () => {
    it('should handle products with images', async () => {
      const response = await api.get('/api/products?limit=10')
      
      const productsWithImages = response.data.products.filter((p: any) => p.images?.length > 0)
      
      if (productsWithImages.length > 0) {
        const product = productsWithImages[0]
        expect(product.images).toBeDefined()
        expect(Array.isArray(product.images)).toBe(true)
        
        product.images.forEach((image: any) => {
          expect(image).toHaveProperty('url')
          expect(image.url).toMatch(/^https?:\/\//)
        })
      }
    })
  })

  describe('Performance and Caching', () => {
    it('should cache repeated requests', async () => {
      const productId = '1' // Assuming product 1 exists

      // First request
      const start1 = Date.now()
      const response1 = await api.get(`/api/products/${productId}`)
      const time1 = Date.now() - start1

      // Second request (should be cached)
      const start2 = Date.now()
      const response2 = await api.get(`/api/products/${productId}`)
      const time2 = Date.now() - start2

      expect(response1.status).toBe(200)
      expect(response2.status).toBe(200)
      expect(response1.data).toEqual(response2.data)

      // Cached request should be faster (allowing some margin)
      if (time1 > 50) {
        expect(time2).toBeLessThan(time1 * 0.8)
      }
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid query parameters gracefully', async () => {
      const response = await api.get('/api/products?page=invalid&limit=abc')

      expect(response.status).toBe(400)
      expect(response.data).toHaveProperty('error')
    })

    it('should handle large limit values', async () => {
      const response = await api.get('/api/products?limit=10000')

      expect(response.status).toBe(200)
      // Should be capped at a reasonable limit
      expect(response.data.products.length).toBeLessThanOrEqual(100)
    })

    it('should validate product creation data', async () => {
      if (!authToken) return

      const invalidProducts = [
        { name: '', price: 100 }, // Empty name
        { name: 'Test', price: -10 }, // Negative price
        { name: 'Test' }, // Missing price
        { price: 100 }, // Missing name
      ]

      for (const invalidProduct of invalidProducts) {
        const response = await api.post('/api/products', invalidProduct, {
          headers: { Authorization: `Bearer ${authToken}` },
        })

        expect(response.status).toBe(400)
        expect(response.data).toHaveProperty('error')
      }
    })
  })
})