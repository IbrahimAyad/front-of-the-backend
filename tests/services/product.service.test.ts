import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ProductService } from '../../lib/services/product.service'
import { CacheService } from '../../lib/services/cache.service'
import { mockPrismaClient, resetPrismaMocks } from '../mocks/prisma'
import { testProducts } from '../fixtures/products'

// Mock dependencies
vi.mock('../../lib/prisma', () => ({
  prisma: mockPrismaClient,
}))

vi.mock('../../lib/services/cache.service')

describe('ProductService', () => {
  let productService: ProductService
  let mockCacheService: any

  beforeEach(() => {
    mockCacheService = {
      get: vi.fn(),
      set: vi.fn(),
      del: vi.fn(),
      clearPattern: vi.fn(),
    }
    vi.mocked(CacheService).mockImplementation(() => mockCacheService)
    
    productService = new ProductService()
    resetPrismaMocks()
    vi.clearAllMocks()
  })

  describe('getAllProducts', () => {
    it('should return cached products if available', async () => {
      const cachedProducts = [testProducts.product1, testProducts.product2]
      mockCacheService.get.mockResolvedValue(cachedProducts)

      const result = await productService.getAllProducts()

      expect(mockCacheService.get).toHaveBeenCalledWith('products:all:10:0')
      expect(mockPrismaClient.product.findMany).not.toHaveBeenCalled()
      expect(result).toEqual({
        products: cachedProducts,
        total: cachedProducts.length,
        page: 1,
        limit: 10,
      })
    })

    it('should fetch from database and cache if not cached', async () => {
      const dbProducts = [testProducts.product1, testProducts.product2]
      mockCacheService.get.mockResolvedValue(null)
      mockPrismaClient.product.findMany.mockResolvedValue(dbProducts)
      mockPrismaClient.product.count.mockResolvedValue(2)

      const result = await productService.getAllProducts()

      expect(mockCacheService.get).toHaveBeenCalledWith('products:all:10:0')
      expect(mockPrismaClient.product.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        take: 10,
        skip: 0,
        orderBy: { createdAt: 'desc' },
      })
      expect(mockCacheService.set).toHaveBeenCalledWith(
        'products:all:10:0',
        dbProducts,
        300
      )
      expect(result).toEqual({
        products: dbProducts,
        total: 2,
        page: 1,
        limit: 10,
      })
    })

    it('should handle pagination correctly', async () => {
      mockCacheService.get.mockResolvedValue(null)
      mockPrismaClient.product.findMany.mockResolvedValue([testProducts.product2])
      mockPrismaClient.product.count.mockResolvedValue(2)

      const result = await productService.getAllProducts(5, 2)

      expect(mockPrismaClient.product.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        take: 5,
        skip: 5,
        orderBy: { createdAt: 'desc' },
      })
      expect(result).toEqual({
        products: [testProducts.product2],
        total: 2,
        page: 2,
        limit: 5,
      })
    })
  })

  describe('getProductById', () => {
    it('should return cached product if available', async () => {
      mockCacheService.get.mockResolvedValue(testProducts.product1)

      const result = await productService.getProductById(testProducts.product1.id)

      expect(mockCacheService.get).toHaveBeenCalledWith(`product:${testProducts.product1.id}`)
      expect(mockPrismaClient.product.findUnique).not.toHaveBeenCalled()
      expect(result).toEqual(testProducts.product1)
    })

    it('should fetch from database and cache if not cached', async () => {
      mockCacheService.get.mockResolvedValue(null)
      mockPrismaClient.product.findUnique.mockResolvedValue(testProducts.product1)

      const result = await productService.getProductById(testProducts.product1.id)

      expect(mockCacheService.get).toHaveBeenCalledWith(`product:${testProducts.product1.id}`)
      expect(mockPrismaClient.product.findUnique).toHaveBeenCalledWith({
        where: { id: testProducts.product1.id, isActive: true },
      })
      expect(mockCacheService.set).toHaveBeenCalledWith(
        `product:${testProducts.product1.id}`,
        testProducts.product1,
        600
      )
      expect(result).toEqual(testProducts.product1)
    })

    it('should return null if product not found', async () => {
      mockCacheService.get.mockResolvedValue(null)
      mockPrismaClient.product.findUnique.mockResolvedValue(null)

      const result = await productService.getProductById('non-existent-id')

      expect(result).toBeNull()
      expect(mockCacheService.set).not.toHaveBeenCalled()
    })
  })

  describe('createProduct', () => {
    it('should create a new product and clear cache', async () => {
      const newProductData = {
        name: 'New Product',
        description: 'A brand new product',
        price: 39.99,
        stock: 75,
        category: 'Electronics',
        imageUrl: 'https://example.com/new-product.jpg',
      }

      const createdProduct = {
        ...newProductData,
        id: '4',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrismaClient.product.create.mockResolvedValue(createdProduct)

      const result = await productService.createProduct(newProductData)

      expect(mockPrismaClient.product.create).toHaveBeenCalledWith({
        data: {
          ...newProductData,
          isActive: true,
        },
      })
      expect(mockCacheService.clearPattern).toHaveBeenCalledWith('products:*')
      expect(result).toEqual(createdProduct)
    })
  })

  describe('updateProduct', () => {
    it('should update a product and clear related cache', async () => {
      const updateData = {
        name: 'Updated Product',
        price: 34.99,
      }

      const updatedProduct = {
        ...testProducts.product1,
        ...updateData,
        updatedAt: new Date(),
      }

      mockPrismaClient.product.update.mockResolvedValue(updatedProduct)

      const result = await productService.updateProduct(testProducts.product1.id, updateData)

      expect(mockPrismaClient.product.update).toHaveBeenCalledWith({
        where: { id: testProducts.product1.id },
        data: updateData,
      })
      expect(mockCacheService.del).toHaveBeenCalledWith(`product:${testProducts.product1.id}`)
      expect(mockCacheService.clearPattern).toHaveBeenCalledWith('products:*')
      expect(result).toEqual(updatedProduct)
    })
  })

  describe('deleteProduct', () => {
    it('should soft delete a product and clear cache', async () => {
      const deletedProduct = {
        ...testProducts.product1,
        isActive: false,
        updatedAt: new Date(),
      }

      mockPrismaClient.product.update.mockResolvedValue(deletedProduct)

      const result = await productService.deleteProduct(testProducts.product1.id)

      expect(mockPrismaClient.product.update).toHaveBeenCalledWith({
        where: { id: testProducts.product1.id },
        data: { isActive: false },
      })
      expect(mockCacheService.del).toHaveBeenCalledWith(`product:${testProducts.product1.id}`)
      expect(mockCacheService.clearPattern).toHaveBeenCalledWith('products:*')
      expect(result).toBe(true)
    })
  })

  describe('searchProducts', () => {
    it('should search products by query', async () => {
      const query = 'test'
      const searchResults = [testProducts.product1, testProducts.product2]
      
      mockCacheService.get.mockResolvedValue(null)
      mockPrismaClient.product.findMany.mockResolvedValue(searchResults)
      mockPrismaClient.product.count.mockResolvedValue(2)

      const result = await productService.searchProducts(query)

      expect(mockPrismaClient.product.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { category: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 10,
        skip: 0,
        orderBy: { createdAt: 'desc' },
      })
      expect(result).toEqual({
        products: searchResults,
        total: 2,
        page: 1,
        limit: 10,
      })
    })

    it('should return cached search results if available', async () => {
      const query = 'test'
      const cachedResults = [testProducts.product1]
      
      mockCacheService.get.mockResolvedValue(cachedResults)

      const result = await productService.searchProducts(query)

      expect(mockCacheService.get).toHaveBeenCalledWith(`products:search:${query}:10:0`)
      expect(mockPrismaClient.product.findMany).not.toHaveBeenCalled()
      expect(result).toEqual({
        products: cachedResults,
        total: cachedResults.length,
        page: 1,
        limit: 10,
      })
    })
  })

  describe('getProductsByCategory', () => {
    it('should get products by category', async () => {
      const category = 'Electronics'
      const categoryProducts = [testProducts.product1]
      
      mockCacheService.get.mockResolvedValue(null)
      mockPrismaClient.product.findMany.mockResolvedValue(categoryProducts)
      mockPrismaClient.product.count.mockResolvedValue(1)

      const result = await productService.getProductsByCategory(category)

      expect(mockPrismaClient.product.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          category,
        },
        take: 10,
        skip: 0,
        orderBy: { createdAt: 'desc' },
      })
      expect(mockCacheService.set).toHaveBeenCalledWith(
        `products:category:${category}:10:0`,
        categoryProducts,
        300
      )
      expect(result).toEqual({
        products: categoryProducts,
        total: 1,
        page: 1,
        limit: 10,
      })
    })
  })

  describe('updateStock', () => {
    it('should update product stock', async () => {
      const productId = testProducts.product1.id
      const quantity = -10
      const currentProduct = { ...testProducts.product1, stock: 100 }
      const updatedProduct = { ...currentProduct, stock: 90 }

      mockPrismaClient.product.findUnique.mockResolvedValue(currentProduct)
      mockPrismaClient.product.update.mockResolvedValue(updatedProduct)

      const result = await productService.updateStock(productId, quantity)

      expect(mockPrismaClient.product.findUnique).toHaveBeenCalledWith({
        where: { id: productId },
      })
      expect(mockPrismaClient.product.update).toHaveBeenCalledWith({
        where: { id: productId },
        data: { stock: 90 },
      })
      expect(mockCacheService.del).toHaveBeenCalledWith(`product:${productId}`)
      expect(mockCacheService.clearPattern).toHaveBeenCalledWith('products:*')
      expect(result).toEqual(updatedProduct)
    })

    it('should throw error if insufficient stock', async () => {
      const productId = testProducts.product1.id
      const quantity = -150
      const currentProduct = { ...testProducts.product1, stock: 100 }

      mockPrismaClient.product.findUnique.mockResolvedValue(currentProduct)

      await expect(
        productService.updateStock(productId, quantity)
      ).rejects.toThrow('Insufficient stock')

      expect(mockPrismaClient.product.update).not.toHaveBeenCalled()
    })

    it('should throw error if product not found', async () => {
      mockPrismaClient.product.findUnique.mockResolvedValue(null)

      await expect(
        productService.updateStock('non-existent-id', 10)
      ).rejects.toThrow('Product not found')
    })
  })
})